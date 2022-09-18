//=============================================================================
// Name: DriverCommand.gs
// Desc: Defines the DriverCommand class, which represents a command that can
//       be issued to a specific driver.
//=============================================================================
include "DriverCharacter.gs"
include "Menu.gs"
include "DriverScheduleCommand.gs"



//=============================================================================
// Name: DriverCommand
// Desc: The base class for a single "driver command" asset. This is the script
//       representation of the asset itself, not a specific command instance on
//       an order bar or similar. Essentially, this object works as a 'factory'
//       which produces DriverScheduleCommand instances.
//       Content creators should override two main functions in this class.
//       AddCommandMenuItem(), which is used to add menu items to the driver
//       order menu, and CreateScheduleCommand(), which creates the schedule
//       command that will be run on the train and driver.
//=============================================================================
game class DriverCommand isclass GameObject
{
  Asset m_asset;


  //=============================================================================
  // Name: Init
  // Desc: Intialises the base class. This is a mandatory function so overriding
  //       functions must call inherited().
  //=============================================================================
  public mandatory void Init(Asset asset)
  {
    m_asset = asset;
  }


  //=============================================================================
  // Name: GetAsset
  // Desc: Gets the asset of this driver command
  //=============================================================================
  public Asset GetAsset(void)
  {
    return m_asset;
  }


  //=============================================================================
  // Name: AddCommandMenuItem
  // Desc: Adds this command as a menu item for a driver character. This is
  //       called by native code when the player clicks on a command add/insert
  //       button on the driver command bar.
  //       If desired this function may add multiple items under a sub-menu. This
  //       is useful for allowing the player to specify command parameters such
  //       as a destination, a load amount, or a time value.
  // Parm: driver - The Driver Character that this menu is being shown for (may
  //       be null in some scenarios, such as Surveyor config).
  // Parm: menu - The parent menu to which this function must add an item.
  // Note: See menu.gs for more information on menus and how to respond to menu
  //       commands.
  //=============================================================================
  public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
  {
    Exception("DriverCommand.AddCommandMenuItem> Not overridden");
  }


  //=============================================================================
  // Name: CreateScheduleCommand
  // Desc: Creates a DriverScheduleCommand object for this command. This method
  //       is called by Trainz to create a DriverScheduleCommand object for this
  //       command. It should create the command, call its Init and SetProperties
  //       functions, and then return it.
  // Parm: driver - Driver character to create the schedule command for.
  // Parm: properties - Properties to initialise the schedule command with.
  // Note: This method MUST NOT add the new command to the drivers schedule.
  //=============================================================================
  public DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup properties)
  {
    Exception("DriverCommand.CreateScheduleCommand> Not overridden");
    return null;
  }


  //=============================================================================
  // Name: GetDriverCommands
  // Desc: A helper function to get a DriverCommands reference from a Message
  //       sent by either a DriverCharacter or DriverCommands object.
  //=============================================================================
  public DriverCommands GetDriverCommands(Message commandMessage)
  {
    DriverCharacter driver = cast<DriverCharacter>(commandMessage.src);
    if (driver)
      return driver.GetDriverCommands();

    DriverCommands commands = cast<DriverCommands>(commandMessage.src);
    return commands;
  }

};


