//
// Constructors.gs
//
//  Copyright (C) 2003-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Soup.gs"
include "ProductFilter.gs"
include "Browser.gs"
include "Menu.gs"
include "DriverCommand.gs"
include "DriverCommands.gs"
include "KUIDList.gs"
include "Image.gs"
include "TrackPathDisplay.gs"



//! This static class allows us to create instances 'new' a game class from within a script.
//
// This class provides methods to create new Browser, DriverCommand, DriverCommands, KUIDList, Menu,
// ProductFilter and Soup objects.
//
// The reason for having this class is that a new game class being created from within the script is
// not normally allowed by the <l gscLang  GS> language.  However this may change in future versions
// of the script system.
//
// See Also:
//     Browser, DriverCommand, DriverCommands, KUIDList, Menu, ProductFilter, Soup
//



class ConstructorsBase isclass GameObject
{
  //! Constructs an empty and unlocked Soup object.
  //
  // Returns:
  //     Returns a new Soup object.
  //
  public native Soup NewSoup(void);


  //! Constructs an empty and unlocked KUIDList object.
  //
  // Returns:
  //     Returns a new KUIDList object.
  //
  public native KUIDList NewKUIDList(void);


  // ============================================================================
  // Name: NewImage
  // Desc: Constructs a new, zero-sized image.
  // Retn: Image - The new image.
  // ============================================================================
  public native Image NewImage();
};


static class Constructors isclass ConstructorsBase
{
  //! Constructs an empty and unlocked ProductFilter object.
  //
  // Returns:
  //     Returns a new ProductFilter object.
  //
  public native ProductFilter NewProductFilter(void);


  //! Constructs a new Browser object.
  //
  // Returns:
  //     Returns a new Browser object.
  //
  public native Browser NewBrowser(void);


  //! Constructs and return an empty Menu object.
  //
  // Note:
  //     The menu returned is for setup purposes only, this method does not create a visual
  //     representation of the menu.
  //
  // Returns:
  //     Returns a new empty Menu object.
  //
  public native Menu NewMenu(void);


  //! Constructs an empty DriverCommands list.
  //
  // Returns:
  //     Returns a new and empty DriverCommands list.
  //
  public native DriverCommands NewDriverCommands(void);


  //! Gets the global %Trainz StringTable.
  //
  // Note:
  //     This method is not really intended for use by script programmers.  It is mainly used by the
  //     built-in classes.
  //
  // Returns:
  //     Returns the global %Trainz StringTable.
  //
  public native StringTable GetTrainzStrings(void);


  //! Gets the global %Trainz Asset.
  //
  // Note:
  //     This method is not really intended for use by script programmers.  It is mainly used by the
  //     built-in classes.
  //
  // Returns:
  //     Returns the global %Trainz Asset.
  //
  public native Asset GetTrainzAsset(void);


  //! Constructs a driver command instance from the specified Asset.
  //
  // This method does not add a new command to the list of available driver commands (as seen in
  // World::GetDriverCommandList()) but simply creates a script instance for private use.
  //
  // Returns:
  //     Returns a new DriverCommand for private use.
  //
  public native DriverCommand NewDriverCommand(Asset commandAsset);

  
  //! Constructs a blank track path display.
  //
  // Returns:
  //     Returns a new TrackPathDisplay.
  //
  public native TrackPathDisplay NewTrackPathDisplay();
};



