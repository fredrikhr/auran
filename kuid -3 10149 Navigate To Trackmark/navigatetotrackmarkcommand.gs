//=============================================================================
// File: NavigateToTrackmarkCommand.gs
// Desc: 
//=============================================================================
include "DriverCommand.gs"
include "World.gs"
include "KUID.gs"
include "NavigateToTrackmarkScheduleCommand.gs"



//=============================================================================
// Name: NavigateToTrackmarkCommand
// Desc: 
//=============================================================================
class NavigateToTrackmarkCommand isclass DriverCommand
{
  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(Asset asset)
  {
    inherited(asset);

    AddHandler(me, "MenuItemSelected", null, "OnMenuItemSelected");
  }


  //=============================================================================
  // Name: AddCommandMenuItem
  // Desc: Builds a menu item (including submenus) for this driver command to be
  //       added into the command list.
  //=============================================================================
  public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
  {
    if (driver and !driver.GetTrain())
      return;

    // This is a simple menu displaying all route trackmarks, let native code build it
    Menu trackmarkMenu = Constructors.NewMenu();
    trackmarkMenu.InitialiseAsMapObjectSelector("?WM", me, "MenuItemSelected");

    StringTable strTable = GetAsset().GetStringTable();
    menu.AddSubmenu(strTable.GetString("driver_command_trackmark"), trackmarkMenu);
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
    NavigateToTrackmarkScheduleCommand cmd = new NavigateToTrackmarkScheduleCommand();
    cmd.Init(driver, me);
    cmd.SetParent(me);
    cmd.SetProperties(soup);
    return cast<DriverScheduleCommand>(cmd);
  }


  void OnMenuItemSelected(Message msg)
  {
    DriverCommands commandList = GetDriverCommands(msg);
    DriverCharacter driver = cast<DriverCharacter>(msg.src);

    Soup msgSoup = cast<Soup>(msg.paramSoup);

    Soup commandSoup = Constructors.NewSoup();
    commandSoup.SetNamedTag("trackmark-id", msgSoup.GetNamedTagAsGameObjectID("object-id"));
    commandSoup.SetNamedTag("trackmark-name", msgSoup.GetNamedTag("object-name"));

    DriverScheduleCommand cmd = CreateScheduleCommand(driver, commandSoup);
    commandList.AddDriverScheduleCommand(cmd);

    if (driver)
      PlayConfirmation();
  }
  
};


