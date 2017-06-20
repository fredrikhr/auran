//
// DriverCommand.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "DriverCharacter.gs"
include "Menu.gs"
include "DriverScheduleCommand.gs"


//! Base class for a driver command asset.
//
// This is the parent class that all driver command assets are to inherit from.  The DriverCommand 
// class is responsible for providing the contents of the command for the right-click menu in Driver
// and creating a DriverScheduleCommand object so the driver character can run the command.
//
// The DriverCommand script should generally add a DriverScheduleCommand to the <l DriverCharacter  DriverCharacter>'s
// schedule if its menu item is chosen.  This action may be delayed by something such as bringing
// up a Browser window.  See Menu for details on the notification of chosen items.
//
// The DriverScheduleCommand is the doing part of a driver command asset.  An instance of a 
// DriverScheduleCommand object is created and given to a driver character to perform.  The 
// implementation of the DriverScheduleCommand methods will dictate what the command actually
// does, hence all driver command assets require a DriverScheduleCommand-derived class as well.
//
// All of the Auran provided <l astSrcDriveCmd  driver commands> contain an example implementation
// of this class as well as an accompanying DriverScheduleCommand-derived class.
//
// See Also:
//     CustomCommand, DriverCharacter, DriverScheduleCommand, GameObject,
//     World::AddDriverCommand(), World::FindDriverCommand(), World::GetDriverCommandList(),
//     World::RemoveDriverCommand()
//
game class DriverCommand isclass GameObject
{
  Asset m_asset;


  //! Initialization method.  Called by %Trainz when a new driver command is created.
  //
  // It is up to the programmer to do any initialization tasks required here as well ensuring this 
  // parent method is called when overridden.  This can be done by using the
  // <l gscLangKeyInherit  inherited> keyword.
  //
  // So that your DriverCommand can respond to Menu items being selected, it is recommended that you
  // add a handler for the menu message your command uses (as defined by your AddCommandMenuItem()
  // implementation).  An example, here is the Init() method from the <l astSrcDriveCmdLoad  Load> 
  // command:
  //
  //<code>
  //public void Init(Asset asset)
  //{
  //  inherited(asset);
  //  AddHandler(me, "LoadProduct", null, "Load");
  //}
  //</code>
  //
  // In this example, the method named <b Load>() is being set as the method in the class to be
  // called when any message with a major type of <m"LoadProduct"> is received.
  //
  // <b Load>() is a locally defined method and its implementation is shown here:
  //
  //<code>
  //void Load(Message msg)
  //{
  //  DriverCommands commands = GetDriverCommands(msg);
  //  DriverCharacter driver = cast<DriverCharacter>(msg.src);
  //
  //  //# schedule our command
  //  Soup soup = Constructors.NewSoup();
  //  LoadScheduleCommand cmd = cast<LoadScheduleCommand> CreateScheduleCommand(driver, soup);
  //  commands.AddDriverScheduleCommand(cmd);
  //}
  //</code>
  //
  // Note how <b Load>() constructs a new Soup and passes it on to CreateScheduleCommand() along 
  // with the driver character (which is extracted from the <l Message::src  message source>).  Once
  // CreateScheduleCommand() has created and initialized the schedule command object, <b Load>() 
  // adds it to the driver's command schedule.  This is the approach we use to create driver command
  // asset scripts in %Trainz.
  //
  // Remember that there are <l astSrcDriveCmd  further examples> included for all of our driver
  // commands.
  //
  // Param:  asset  Driver command asset being initialized.
  //
  // See Also:
  //     GameObject::AddHandler()
  //
  //=============================================================================
  // Name: Init
  // Desc: 
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


