//
// DriverCommands.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved
//

include "gs.gs"
include "DriverScheduleCommand.gs"


//! A schedule of driver commands for a driver character to run through.
//
// This class groups together a list of DriverScheduleCommand objects for a DriverCharacter to use.
// A DriverCharacter has a DriverCommands object as its schedule of 'things to do'.
//
// It is a DriverCommand object that creates and adds a DriverScheduleCommand to the DriverCommands
// object of the DriverCharacter that is going to run that command.
//
// See Also:
//     DriverCommand, DriverScheduleCommand, DriverCharacter, DriverCharacter::GetDriverCommands(),
//     Constructors::NewDriverCommands()
//
final game class DriverCommands isclass GameObject
{
  //! Adds the given driver schedule command to this schedule.
  //
  // Param:  cmd  Driver schedule command to add.
  //
  public native void AddDriverScheduleCommand(DriverScheduleCommand cmd);

  //! Gets a list of all of the driver schedule commands this schedule currently has.
  //
  // Note:
  //     Modifying the returned array will not affect the DriverCommands list, however modifying
  //     the individual schedule commands in it will!
  //
  // Returns:
  //     Returns an array containing the list of driver schedule commands this schedule has.
  //
  public native DriverScheduleCommand[] GetDriverScheduleCommands(void);

  //! Removes all the commands from this schedule and empties it out.
  public native void ClearDriverScheduleCommands(void);

  //! Determines if this schedule is to run its commands in a continuous repeat cycle.
  //
  // Returns:
  //     Returns true if this schedule of commands is set to operate in repeat cycle, false otherwise.
  //
  public native bool GetDriverScheduleRepeat(void);

  //! Enables/disables the repeat cycle mode of this schedule.
  //
  // Param:  repeat  If true, this schedule will be run by the driver continuously such that he/she
  //                 will simply continue running by going back to the first command once the final
  //                 command is done.  Otherwise use false for the driver to process the commands as
  //                 a linear list where each command disappears once finished and when the commands
  //                 list is empty, the driver will sit idle.
  //
  public native void SetDriverScheduleRepeat(bool repeat);

  //! Moves this schedule along to the next command in its list.
  //
  // If this DriverCommands schedule is set to <l SetDriverScheduleRepeat()  repeat>, this method
  // will move along to the next command with the previous one being moved to the end of the list.
  // Otherwise the previous command will disappear as we move on to the next one.
  //
  public native void ProceedToNextCommand(void);


  //! Gets a Soup representation of this schedule of commands.
  //
  // Note:
  //     Each DriverScheduleCommand will need to be able to save its configuration to Soup with an
  //     appropriate <l DriverScheduleCommand::GetProperties()  GetProperties>() implementation.
  //
  // Returns:
  //     Returns a Soup database of this schedule including all schedule commands as
  //     sub-Soups.
  //
  // See Also:
  //     DriverScheduleCommand::GetProperties()
  //
  public Soup GetProperties(void);

  //! Initialise this schedule as specified in the given Soup.
  //
  // Note:
  //     Each DriverScheduleCommand will need to be able to initialize itself from a Soup with an
  //     appropriate <l DriverScheduleCommand::SetProperties()  SetProperties>() implementation.
  //
  // Param:  soup  Soup database to initialize this schedule and its commands with.
  //
  // See Also:
  //     DriverScheduleCommand::SetProperties()
  //
  public void SetProperties(Soup soup);

  //! Appends the KUIDs of the commands in this schedule to the given list.
  //
  // Each DriverCommands object contains its own variety of driver commands and this method allows
  // you to get the KUIDs of the commands it currently uses.
  //
  // Param:  io_dependencies  KUIDList to add dependencies of this collection of schedule commands to.
  //
  public void AppendDependencies(KUIDList io_dependencies);



  //=============================================================================
  // Name: GetProperties
  //=============================================================================
  public Soup GetProperties(void)
  {
    Soup ret = Constructors.NewSoup();
    DriverScheduleCommand[] list = GetDriverScheduleCommands();

    int i;
    for (i = 0; i < list.size(); ++i)
    {
      DriverScheduleCommand entry = list[i];
      DriverCommand command = entry.GetDriverCommand();

      Soup retEntry = Constructors.NewSoup();

      retEntry.SetNamedTag("command", command.GetAsset().GetKUID());
      retEntry.SetNamedSoup("properties", entry.GetProperties());

      ret.SetNamedSoup((string)i, retEntry);
    }

    ret.SetNamedTag("DriverCommands.repeat", GetDriverScheduleRepeat());
    return ret;
  }


  //=============================================================================
  // Name: SetProperties
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    DriverCommand[] driverCommands = World.GetDriverCommandList();
    ClearDriverScheduleCommands();

    int i;
    for (i = 0; true; ++i)
    {
      Soup entry = soup.GetNamedSoup((string)i);
      if (!entry.CountTags())
        break;

      KUID commandKUID = entry.GetNamedTagAsKUID("command");
      Asset commandAsset = World.FindAsset(commandKUID);
      Soup propertiesSoup = entry.GetNamedSoup("properties");

      if (!commandAsset)
      {
        // Unknown/missing/faulty asset. Print a log message and skip past it.
        Interface.Log("DriverCommands.SetProperties> missing command asset " + commandKUID.GetLogString());
        continue;
      }

      bool bAddedCommand = false;

      DriverCommand command = World.FindDriverCommand(commandAsset);
      if (!command)
      {
        // Command not currently in the session, temporarily add it so we can create an instance
        Interface.Log("DriverCommands.SetProperties> Driver command " + commandKUID.GetLogString() + " not present, adding it now");
        command = World.AddDriverCommand(commandAsset);
        bAddedCommand = true;
      }

      if (!command)
      {
        // maybe the asset was not a DriverCommand?!
        Interface.Log("DriverCommands.SetProperties> bad command asset " + commandKUID.GetLogString());
        continue;
      }

      DriverScheduleCommand scheduleCommand = command.CreateScheduleCommand(null, propertiesSoup);

      // If we had to temporarily add this command be sure to remove it again
      if (bAddedCommand)
        World.RemoveDriverCommand(command);

      if (scheduleCommand)
      {
        AddDriverScheduleCommand(scheduleCommand);
      }
      else
      {
        Interface.Log("DriverCommands.SetProperties> driver command " + commandKUID.GetLogString() + " failed to create schedule command");
        continue;
      }
    }

    SetDriverScheduleRepeat(soup.GetNamedTagAsBool("DriverCommands.repeat"));
  }


	public void AppendDependencies(KUIDList io_dependencies)
	{
		DriverScheduleCommand[] list = GetDriverScheduleCommands();
		int i;

		for (i = 0; i < list.size(); i++)
		{
			DriverScheduleCommand entry = list[i];
			DriverCommand command = entry.GetDriverCommand();
			KUID commandKUID = command.GetAsset().GetKUID();

			io_dependencies.AddKUID(commandKUID);
		}
	}
};


