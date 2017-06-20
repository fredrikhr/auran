//=============================================================================
// File: GameplayMenuMobile.gs
// Desc: Defines GameplayMenuMobile, used by menus on the Trainz mobile UI
//=============================================================================
include "GameplayMenuBase.gs"


//=============================================================================
// Name: GameplayMenuMobile
// Desc: Represents a set of menu options in the Trainz mobile menu
//=============================================================================
game class GameplayMenuMobile isclass GameplayMenuBase
{
  //=============================================================================
  // Name: InitWithParentObject
  // Desc: Initialises the menu object with the object passed. The parameter may
  //       be an Asset, Soup, or something else. What the menu does with the
  //       parent object (if anything) is up to the script implementor.
  //=============================================================================
  void InitWithParentObject(GSObject obj) { }


  //=============================================================================
  // Name: SaveState/LoadState
  // Desc: Save/load a menu objects state (active item will be saved by native)
  //=============================================================================
  Soup SaveState() { return null; }
  void LoadState(Soup data) { }


  //=============================================================================
  // Name: GetChildList
  // Desc: Called by native to get the menus child options.Each Soup takes on the
  //       following format:
  //        {
  //          id          Unique ID string for the child menu item
  //          name        Localised display name for the menu item
  //          img         A KUID for a texture asset, or a local image path
  //          icon        As 'img' but for a small status icon (e.g. complete)
  //          icon-lrg    As 'img' but for a large status icon (e.g. locked)
  //          desc        A short description for the item, portrait mode only
  //          can-delete  OPTIONAL - if true this item will be deletable
  //          color       OPTIONAL - 6 comma seperated values representing the
  //                      gradient colour for this menu items heading
  //                      (e.g. "177,228,54,39,130,12")
  //        }
  // Retn: Soup[] - The array describing the child menu items, can be empty
  //=============================================================================
  Soup[] GetChildList(void) { return new Soup[0]; }


  //=============================================================================
  // Name: NotifyOfChildListChange
  // Desc: Notify native that this menus child list has changed and should be
  //       refreshed. This need not be called from GetChildList(), rather is
  //       intended to be called when the internal list is updated by some other
  //       system (for example, DLCStore).
  //=============================================================================
  native void NotifyOfChildListChange();


  //=============================================================================
  // Name: OpenChildObject
  // Desc: Called by native to tell this menu to attempt to open a child object.
  // Parm: childId - The child object ID as specified in GetChildList().
  //=============================================================================
  void OpenChildObject(string childId) { }


  //=============================================================================
  // Name: GetChildObjectDescriptionHTML
  // Desc: Called by native to get the descriptive HTML for a child object.
  // Parm: childId - The child object ID as specified in GetChildList().
  //=============================================================================
  string GetChildObjectDescriptionHTML(string childId) { return ""; }


  //=============================================================================
  // Name: DeleteChildObject
  // Desc: Called by native when a player deletes a child menu item
  // Parm: childId - The child object ID as specified in GetChildList().
  //=============================================================================
  void DeleteChildObject(string childId) { }


  //=============================================================================
  // Name: OpenChildGameplayMenu
  // Desc: Called by script to tell the native code to open a child submenu.
  // Parm: menu - the gameplay menu asset to open
  // Parm: initParam - the object to initialise with, see InitWithParentObject()
  //=============================================================================
  native void OpenChildGameplayMenu(KUID menuKuid, GSObject initParam);


  //=============================================================================
  // Name: SetPortraitModeDisabled
  // Desc: Allows access to disable portrait mode (and reenable it). Provided so
  //       that menu scripts can disable portrait mode if they need to display
  //       custom browser dialogs (however this should generally be avoided).
  //       Portrait mode will be reenabled when this menu is closed.
  // Parm: disable - true to disable, false to reenable
  //=============================================================================
  native void SetPortraitModeDisabled(bool disable);
  void SetPortraitModeDisabled() { SetPortraitModeDisabled(true); }

};

