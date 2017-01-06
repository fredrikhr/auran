//
// Menu.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "kuid.gs"

//! A menu.
//
// A menu is a list of items that can selected by the user with the mouse cursor.  Menus can be
// constructed in hierarchies so a menu item could open up a sub-menu of its own.  Sub-menus can
// also have sub-menus of their own as well.  Menu items can have messages sent when clicked on.
//
// This class is mostly used for constructing sub-menus of driver command actions.  See 
// DriverCommand::AddCommandMenuItem() for details.
//
// See Also:
//     Constructors::NewMenu(), DriverCommand::AddCommandMenuItem(), Industry::AppendDriverDestinations()
//
final game class Menu isclass GSObject
{

	//! Adds a menu item to the end of this menu.
	//
	// The <i dstObject> parameter must be specified and will be sent a message of type 
	// (<i major>, <i minor>) in the event that this item is chosen.
	//
	// Param:  name       Name for the object on the menu.
	// Param:  dstObject  Object to add to the end of this menu.  This parameter <bi MUST> be specified.
	// Param:  major      <l Message::major  Major type> of the message to send to <i dstObject> if
	//                    selected on this menu.
	// Param:  minor      <l Message::minor  Minor type> of the message.
  // Param:  icon       An asset whose icon is to be displayed against this menu item.
	//
	public native void AddItem(string name, GameObject dstObject, string major, string minor);
	public native void AddItem(string name, GameObject dstObject, string major, string minor, KUID icon);

	//! Adds a submenu item to the end of this menu.
	//
	// Param:  name     Name of the new submenu.
	// Param:  submenu  The sub-menu to add.  If null or an empty menu, nothing will be added to
	//                  this menu.
	//
	public native void AddSubmenu(string name, Menu submenu);

	//! Adds a non-interactive menu seperator
	//
	// The seperator will appear as a simple line and cannot be selected
	//
	public native void AddSeperator();

	//! Gets the amount of items in this menu (including submenus).
	//
	// Returns:
	//     Return the total number of items in this menu (including submenus).
	//
	public native int CountItems(void);

	//! Subdivides the menu items into several separate sub-menus.
	//
	// This method splits items on the menu into groups based on alphabetical order and places them
	// into submenus.  Subdividing the menu allows larger menus that normally wouldn't fit on the 
	// screen to be accommodated.
	//
	// If the menu fits on the screen as it currently is, then this method won't subdivide the menu
	// as there is no need to.  Whether a menu fits on the screen is dependent on the current 
	// resolution as well as the amount of menu items.
	//
	// Param:  forceSorting   If true, this method will sort the items even if subdivision is not
	//                        performed.
	//
	public native void SubdivideItems(bool forceSorting);


	//! Legacy support method, use SubdivideItems(bool) instead.
	public void SubdivideItems(void)
	{
	  SubdivideItems(true);
	}

};

