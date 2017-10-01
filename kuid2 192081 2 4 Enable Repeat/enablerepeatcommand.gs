include "DriverCommand.gs"
include "World.gs"
include "Browser.gs"
include "KUID.gs"
include "Industry.gs"
include "EnableRepeatScheduleCommand.gs"

//
// EnableRepeatCommand
//
//
class EnableRepeatCommand isclass DriverCommand
{
  // Object initializer - adds handler methods.
  public void Init(Asset asset)
  {
    inherited(asset);
    AddHandler(me, "EnableRep", null, "EnableRep");
  }

  // Adds entry to the given menu
  public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
  {
      if (driver and !driver.GetTrain())
           return;
      menu.AddItem("Enable Repeat", me, "EnableRep", "enable");
  }

  // Called by either EnableRep() to play one of 4 random driver acknowledgments.
  void PlayConfirmation(void);

  // Handler method
  void EnableRep(Message msg)
  {
    DriverCommands commands=GetDriverCommands(msg);
    DriverCharacter driver = cast<DriverCharacter>(msg.src);
    
      // schedule our command
    Soup soup = Constructors.NewSoup();
    EnableRepeatScheduleCommand cmd = cast<EnableRepeatScheduleCommand>CreateScheduleCommand(driver, soup);
    commands.AddDriverScheduleCommand(cmd);

    PlayConfirmation();
  }
  //
  // Play one of 4 random driver acknowledgments.
  //
  void PlayConfirmation(void)
  {
/*    string wav;
    int num = Math.Rand(0, 5);
    if (num <= 1)
      wav = "headed_there.wav";
    if (num == 2)
      wav = "im_on_my_way.wav";
    if (num == 3)
      wav = "ok_see_map.wav";
    if (num >= 4)
      wav = "on_my_way.wav";

    World.Play2DSound(GetAsset(), wav); */
  }

//CreateScheduleCommand - creates a New EnableRepeatScheduleCommand and initialises it
   DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
   {
      EnableRepeatScheduleCommand cmd = new EnableRepeatScheduleCommand();
      cmd.Init(driver, me);
      cmd.SetParent(me);
      cmd.SetProperties(soup);
      return cast<DriverScheduleCommand>cmd;
   }
};
