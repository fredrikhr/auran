//
// DriverScheduleCommand.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "DriverCommand.gs"


//! A schedule command that a driver can follow.
//
// This class handles the actual driving of the train for its parent DriverCommand in a 
// DriverCharacter's schedule.  A DriverCommand object is responsible for creating a 
// DriverScheduleCommand and placing it on the driver's list.
//
// All of the Auran provided <l astSrcDriveCmd  driver commands> contain example 
// implementations of this class.
//
// See Also:
//     CustomCommand, DriverCommand, DriverCommands, DriverCharacter, Schedule, World,
//     DriverCommand::CreateScheduleCommand(), DriverCharacter::AddDriverScheduleCommand(),
//     DriverCharacter::AddDriverScheduleCommand()
//
class DriverScheduleCommand
{
	//! Called by a DriverCommand object to construct this DriverScheduleCommand.
	//
	// You can override this method to perform your own initialization, but you must call this
	// parent Init() method as well, otherwise essential initialization won't occur.  Use the
	// <l gscLangKeyInherit  inherited> keyword to explicitly call it from your own overridden
	// implementation.
	//
	// Param:  driver  Driver character this driver schedule command is to run on.
	// Param:  parent  Parent DriverCommand that is creating this driver schedule command.
	//
	// See Also:
	//     DriverCommand::CreateScheduleCommand()
	//
	public void Init(DriverCharacter driver, DriverCommand parent);


	//! Begin executing this driver command on the given driver character.
	//
	// This method is called once the parent command is reached in the driver's schedule.  After it
	// returns, this object is removed from the start of the driver's schedule.
	// 
	// It is up to the script programmer to implement this method for their own custom commands as 
	// the default DriverScheduleCommand implementation does nothing except return false.
	//
	// If this method does return false, EndExecute() won't be called.
	//
	// Note:
	//     This method is called by the game so it <bi MUST NOT> block (i.e. don't 
	//     <l gscLangKeyWait  wait>  on messages).  However, you may call threaded functions.
	//
	// Param:  driver  Driver character that this command is to be executed on.
	//
	// Returns:
	//     Returns true if the command has started to execute, false to indicate that the command
	//     has failed to start.
	//
	public bool BeginExecute(DriverCharacter driver);

	//! Update execution of this driver command on the given driver character.
	//
	// Note:
	//     This method is called by the game so it <bi MUST NOT> block (i.e. don't 
	//     <l gscLangKeyWait  wait>  on messages).  However, you may call threaded functions.
	//
	// Param:  driver  Driver character that this command is to be executed on.
	//
	// Returns:
	//     Returns true if the command is in progress, or false to indicate that the command is
	//     complete (or has failed).
	//
	public bool UpdateExecute(DriverCharacter driver);

	//! Notify this driver command that the train schedule failed on the given driver character.
	//
	// Note:
	//     This method is called by the game so it <bi MUST NOT> block (i.e. don't 
	//     <l gscLangKeyWait  wait>  on messages).  However, you may call threaded functions.
	//
	// Param:  driver  Driver character that this command is to be executed on.
	//
	// Returns:
	//     Returns true if the command has continued, or false to indicate that the command is
	//     complete (or has failed).
	//
	public bool FailExecute(DriverCharacter driver);


	//! Stops executing this driver schedule command on the given driver character.
	//
	// This method will be called exactly once after each call to BeginExecute() that results in true.
	// It won't be called if after a call to BeginExecute() that has returned false.  EndExecute()
	// will always be called <bi BEFORE> the next call to BeginExecute() on a given driver.
	//
	// Generally BeginExecute() will set up a train schedule for the driver.  EndExecute() is called
	// by %Trainz when this driver command schedule stops.  If no schedule is setup, EndExecute() will
	// be called immediately after BeginExecute().
	//
	// The default DriverScheduleCommand implementation of this method always returns true, so an
	// overridden version is not essential.  But generally it would be advisable to do so.
	//
	// Note:
	//     This function is called by the game so it <bi MUST NOT> block (i.e. don't 
	//     <l gscLangKeyWait  wait>  on messages).  However, you may call threaded functions.
	//
	// Param:  driver  Driver character that this command has ended on.
	//
	// Returns:
	//     Returns false to indicate that the command was not successfully completed.
	//
	public bool EndExecute(DriverCharacter driver);


	//! Called by %Trainz to determine the display icon for this command.
	//
	// The default DriverScheduleCommand implementation always returns null, so the script programmer
	// must override this method if they want an icon on the driver's list for this command.
	//
	// Returns:
	//     Can return any MapObject-derived object and that object's icon will be used for this driver
	//     schedule command, null otherwise.
	//
	public object GetIcon(void);

	//! Gets the toltip text for this driver schedule command.
	//
	// This method is called by %Trainz to provide tooltip text when the user has the cursor hovering
	// above the icon of this driver schedule command on the driver character's command list that 
	// appears across the bottom of the Driver interface.
	//
	// Returns:
	//     Returns a tooltip for this particular driver schedule rule instance.  The default implementation
	//     in DriverScheduleCommand always returns an empty string (<m"">).
	//
	public string GetTooltip(void);


	//! Gets the parent DriverCommand this driver schedule command is attached to.
	//
	// Returns:
	//     Returns the parent driver command.
	//
	public DriverCommand GetDriverCommand(void);


	//! Gets the DriverCharacter that this driver schedule command is attached to.
	//
	// Returns:
	//     Returns the DriverCharacter that this driver schedule command is attached to.
	//
	public DriverCharacter GetDriverCharacter(void);


	//! Assigns this driver schedule command to the specified driver.
	//
	// Param:  driver  Driver character to assign this schedule command to.
	//
	public void SetDriverCharacter(DriverCharacter driver);


	//! Gets the properties (if any) of this driver schedule command.
	//
	// The default DriverScheduleCommand implementation of this method always returns an empty Soup
	// database.  The script programmer must provide their own overridden version if they want command
	// properties to be saved.
	//
	// This method is mainly used by the host <l DriverCommands::GetProperties()  DriverCommands> object
	// to save the state of each schedule command it has.
	//
	// Note:
	//     Feel free to override, but <bi ALWAYS> call through to the base method.  Use the
	//     <l gscLangKeyInherit  inherited> keyword to explicitly invoke the overridden method from
	//     the parent class.
	//
	// Returns:
	//     Returns an empty Soup database.
	//
	// See Also:
	//     DriverCommands::GetProperties()
	//
	public Soup GetProperties(void);

	//! Uses the given Soup database to initializes the properties (if any) of this command.
	//
	// The default DriverScheduleCommand implementation of this method does nothing.  The script
	// programmer must provide their own overridden version if they want their command to be able
	// to initialize itself from a properties database.
	//
	// This method is used by the host <l DriverCommands::GetProperties()  DriverCommands> object
	// to initialize this schedule command from saved Soup data.  It is also used to initialize a
	// newly created DriverScheduleCommand object from within a 
	// <l DriverCommand::CreateScheduleCommand()  DriverCommand>.
	//
	// Note:
	//     Feel free to override, but <bi ALWAYS> call through to the base method.  Use the
	//     <l gscLangKeyInherit  inherited> keyword to explicitly invoke the overridden method from
	//     the parent class.
	//
	// Param:  soup  Database to initialize this driver schedule command with.
	//
	// See Also:
	//     DriverCommands::SetProperties(), DriverCommand::CreateScheduleCommand()
	//
	public void SetProperties(Soup soup);



	//
	// IMPLEMENTATION
	//

	DriverCharacter m_driverCharacter;
	DriverCommand m_driverCommand;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		// MAY BE OVERRIDDEN TO PROVIDE ADDITIONAL INITIALISATION (MUST INHERIT THIS FUNCTION)

		m_driverCharacter = driver;	// may be null for TRS2004:SP2 style commands
		m_driverCommand = parent;
	}


	public bool BeginExecute(DriverCharacter driver)
	{
		// MUST BE OVERRIDDEN TO EXECUTE THIS COMMAND
		return false;
	}
	
	public bool UpdateExecute(DriverCharacter driver)
	{
		// MAY BE OVERRIDDEN TO PROVIDE EXTENDED FUNCTIONALITY
		return false;	
	}
	
	public bool FailExecute(DriverCharacter driver)
	{
		// MAY BE OVERRIDDEN TO PROVIDE EXTENDED FUNCTIONALITY
		return false;	
	}

	public bool EndExecute(DriverCharacter driver)
	{
		// MAY BE OVERRIDDEN
		return true;
	}

	public object GetIcon(void)
	{
		// MUST BE OVERRIDDEN TO RETURN ICON
		return null;
	}

	public string GetTooltip(void)
	{
		// MAY BE OVERRIDDEN TO RETURN TOOLTIP
		return "";
	}
	
	public DriverCommand GetDriverCommand(void)
	{
		return m_driverCommand;
	}

	public DriverCharacter GetDriverCharacter(void)
	{
		return m_driverCharacter;
	}

	public void SetDriverCharacter(DriverCharacter driver)
	{
		m_driverCharacter = driver;
	}

	//! Gets the asset of the parent DriverCommand this driver schedule command is attached to.
	//
	// Returns:
	//     Returns the asset of the parent DriverCommand.
	//
	// See Also:
	//     DriverCommand::GetAsset()
	//
	public Asset GetAsset(void)
	{
		return m_driverCommand.GetAsset();
	}


	public Soup GetProperties(void)
	{
		// MAY BE OVERRIDDEN TO PROVIDE SAVE SUPPORT (MUST INHERIT THIS FUNCTION)

		return Constructors.NewSoup();
	}

	public void SetProperties(Soup soup)
	{
		// MAY BE OVERRIDDEN TO PROVIDE SAVE SUPPORT (MUST INHERIT THIS FUNCTION)
	}

};
