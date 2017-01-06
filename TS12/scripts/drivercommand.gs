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
	public void Init(Asset asset);

	//! Gets the asset of this driver command.
	//
	// Returns:
	//     Returns the asset of this driver command.
	//
	public Asset GetAsset(void);


	//! Adds this command as a menu item for a driver character.
	//
	// It is up to the script programmer to decide if they even want to their command to appear on
	// a driver character's menu.  If desired, more than one menu item can be added to <i menu> as
	// well as sub-menus to these menu items.  However, creating deep menu hierarchies is generally 
	// discouraged.
	//
	// As an example, consider this implementation from the <l astSrcDriveCmdLoad  Load> command:
	//
	//<code>
	//public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
	//{
	//  StringTable strTable = GetAsset().GetStringTable();
	//
	//  if (!driver or driver.GetTrain())
	//    menu.AddItem(strTable.GetString("driver_command_load"), me, "LoadProduct", "Load");
	//}
	//</code>
	//
	// Note how a message of type (<m"LoadProduct">, <m "Load">) is sent to this DriverCommand when
	// the menu item is clicked.  It will be up to this DriverCommand object to listen out for such 
	// messages.  The best way is to <l GameObject::AddHandler() add a handler method> in Init() for
	// the type of Menu message being used.
	//
	// Param:  driver  Driver to add to this command menu item to.
	// Param:  menu    Driver's menu to add item(s) for this command to.
	//
	// See Also:
	//     Menu::AddItem(), Menu::AddSubmenu()
	//
	public void AddCommandMenuItem(DriverCharacter driver, Menu menu);


	//! Creates and initializes an appropriate DriverScheduleCommand object for this command.
	//
	// This method is called by %Trainz to create a DriverScheduleCommand object for this command
	// to use on the given driver character's schedule.  It should create the appropriate 
	// DriverScheduleCommand object and call its <l DriverScheduleCommand::Init() Init>()
	// and <l DriverScheduleCommand::SetProperties()  SetProperties>() methods.
	//
	// The code sample below comes from the <l astSrcDriveCmdLoad  Load> command.
	//
	//<code>
	//DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
	//{
	//  RunaroundScheduleCommand cmd = new RunaroundScheduleCommand();
	//  cmd.Init(driver, me);
	//  cmd.SetProperties(soup);
	//  cmd.SetParent(me);
	//  return cast<DriverScheduleCommand>cmd;
	//}
	//</code>
	//
	// In the case of the <l astSrcDriveCmdLoad  Load> command, one of its own internal methods calls
	// CreateScheduleCommand().  See the Init() method description for further details on what happens
	// to get things running.
	//
	// Param:  driver  Driver character we are creating a DriverScheduleCommand object for.
	// Param:  soup    Soup database to initialize the returned object with.  %Trainz will 
	//
	// Note:
	//     This method <bi MUST NOT> add the new DriverScheduleCommand object to the driver character's
	//     schedule.
	//
	// Returns:
	//     Returns a DriverScheduleCommand object that will be used by a driver character to run this
	//     command.  This returned object is a unique instance that will be used by <i driver>.
	//
	// See Also:
	//     DriverScheduleCommand::Init(), DriverScheduleCommand::SetProperties()
	//
	public DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup);



	//
	// HELPER FUNCTIONS
	//

	//! Gets the driver commands schedule for the driver character that sent the given message.
	//
	// This method is a helper method that can be called to get the DriverCommands object based on
	// the given message.  It is expected that <i commandMessage> originates from a DriverCharacter
	// via a Menu selection.  See the <b Load>() example method in the description of Init() for a
	// demonstration of this method.
	//
	// Param:  commandMessage  Message that originates from a driver character menu click.  The
	//                         <l Message::src  message source> should be a DriverCharacter object.
	//
	// Returns:
	//     Returns the <l DriverCommands  driver commands schedule> of the DriverCharacter that was
	//     the <l Message::src  source> of <i compoundMessage>.
	//
	// See Also:
	//     DriverCharacter::GetDriverCommands()
	//
	public DriverCommands GetDriverCommands(Message commandMessage)
	{
		DriverCharacter driver = cast<DriverCharacter> commandMessage.src;
		if (driver)
			return driver.GetDriverCommands();

		DriverCommands commands = cast<DriverCommands> commandMessage.src;
		return commands;
	}


	//
	// PRIVATE VARIABLES
	//

	Asset m_asset;


	//
	// IMPLEMENTATION
	//
	
	public void Init(Asset asset)
	{
		m_asset = asset;
	}

	public Asset GetAsset(void)
	{
		return m_asset;
	}

	public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
	{
		// MUST BE OVERRIDDEN
		Exception("DriverCommand.AddCommandMenuItem> not overridden");
	}

	public DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
	{
		// MUST BE OVERRIDDEN
		Exception("DriverCommand.CreateScheduleCommand> not overridden");
		return null;
	}
};



