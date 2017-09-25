include "DriverCommand.gs"
include "World.gs"
include "KUID.gs"
include "NotifyCommand.gs"


//=============================================================================
// Name: NotifyCustomCommand
// Desc: 
//=============================================================================
class NotifyCustomCommand isclass CustomCommand
{
  public Asset  asset;
  public string driverName;

  public bool Execute(Train train, int px, int py, int pz)
  {
    StringTable strTable = asset.GetStringTable();
    Interface.Print(driverName + strTable.GetString("handle_command_interface_msg"));
    return true;
  }
};


//=============================================================================
// Name: NotifyScheduleCommand
// Desc: 
//=============================================================================
class NotifyScheduleCommand isclass DriverScheduleCommand
{
  NotifyCommand parent;

  public void SetParent(NotifyCommand newParent)
  {
    parent = newParent;
  }

  public bool BeginExecute(DriverCharacter driver)
  {
    Train train = driver.GetTrain();
    if (!train)
      return false;

    NotifyCustomCommand command = new NotifyCustomCommand();
    command.asset = parent.GetAsset();
    command.driverName = driver.GetLocalisedName();
    
    driver.DriverCustomCommand(command);
    driver.DriverIssueSchedule();
    return true;
  }


  public object GetIcon(void)
  {
    return cast<object>parent;
  }

};

