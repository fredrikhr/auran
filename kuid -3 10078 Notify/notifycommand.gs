include "DriverCommand.gs"
include "World.gs"
include "KUID.gs"
include "NotifyScheduleCommand.gs"


//=============================================================================
// Name: NotifyCommand
// Desc: 
//=============================================================================
class NotifyCommand isclass DriverCommand
{
  public void Init(Asset asset)
  {
    inherited(asset);
    AddHandler(me, "NotifyItem", null, "Notify");
  }

  public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
  {
    Menu itemMenu = Constructors.NewMenu();
    StringTable strTable = GetAsset().GetStringTable();

    menu.AddItem(strTable.GetString("driver_command_notify"), me, "NotifyItem", "Notify");
  }

  void PlayConfirmation(void)
  {
    KUID kuid = GetAsset().LookupKUIDTable("command-sounds");
    Library libCommandSounds = World.GetLibrary(kuid);
    if (libCommandSounds)
    {
      libCommandSounds.LibraryCall("PlayConfirmation", null, null);
    }
  }


  DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
  {
    NotifyScheduleCommand cmd = new NotifyScheduleCommand();
    cmd.Init(driver, me);
    cmd.SetParent(me);
    cmd.SetProperties(soup);
    return cast<DriverScheduleCommand>cmd;
  }

  void Notify(Message msg)
  {
    DriverCommands commands = GetDriverCommands(msg);
    DriverCharacter driver = cast<DriverCharacter>(msg.src);
    string vehicleName = msg.minor;

    // schedule our command
    Soup soup = Constructors.NewSoup();
    soup.SetNamedTag("vehicleName", vehicleName);
    NotifyScheduleCommand cmd = cast<NotifyScheduleCommand>CreateScheduleCommand(driver, soup);
    commands.AddDriverScheduleCommand(cmd);

    if (driver)
      PlayConfirmation();
  }

};


