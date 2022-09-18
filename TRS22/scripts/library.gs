//
// Library.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "Constructors.gs"
include "TrainzGameObject.gs"
include "OnlineAccess.gs"
include "PropertyObject.gs"


//! Parent and interface class for Library asset.
//
// A library is a self-contained code module asset that the script of any other asset can access and
// use the features of.  It is this class that provides the interface for a library asset.
//
// Library assets allow 3rd party content creators to create easily re-usable code libraries.  The
// benefit of using library assets is that you can have a re-usable code module that any script can
// access without having to duplicate a source file into the directory of each asset that needs it.
//
// The other use for Library in TRS2006 is that a Library class is the only way you can get an
// OnlineAccess object to access Planet Auran services from a %Trainz script.  See the GetOnlineAccess()
// method's description for further details.
//
// <bi Defining a Library %Asset><br>
// To define a library asset, not very much is needed.  The only essential tags are <n kind> (which
// is set to <m "library"> automatically when you create a new library asset in CCP) along with the
// <n script> and <n class> entries that tell %Trainz what the source code file and Library-derived
// class that define this library are.
//
// <bi Using a Library %Asset><br>
// Using a library asset is a little more complex thin simply including a <n .gs> file.  You cannot 
// include the library asset's <n .gs> file and just start using it.  Instead, you must somehow get
// a reference to an instance of the Library asset.
//
// For this to happen, the script code using the library needs to know that library asset's KUID.
// This is done by putting an entry for the KUID of the library asset in the <n kuid-table> section
// of the asset's configuration.
//
// To get a reference to a library asset so its functionality can be used, World::GetLibrary() is
// the method you use to get the library by KUID.  Once you have that, you can use LibraryCall() to
// make calls to the library.  For example:
//
//<code>
//  //# get handle to the utility library
//  KUID utilLibKUID = me.GetAsset().LookupKUIDTable("util-library");
//  Library  utilLib = World.GetLibrary(utilLibKUID);
//
//  //# do something with the yak library
//  if (utilLib)
//  {
//    Interface.Log("Successfully loaded library: 'util-library '!");
//
//    utilLib.LibraryCall("YakOn", null, null);
//
//    Sleep(20.0);
//
//    string paramStrArr = new string[1];
//    paramStrArr[0] = "Funny";
//
//    utilLib.LibraryCall("ChangeYakMode", paramStrArr, null);
//  }
//  else
//  {
//    Interface.Log("Error, failed to load library asset 'util-lib'!");
//  }
//</code>
//
// Once the reference to the library has been obtained and verified, it is now safe to start calling
// its LibraryCall() method to access library functionality.
//
// The Library object itself is created by %Trainz when you first use it.  Only one instance of it
// is created.  Any further calls to library from the asset script that first used it will be 
// processed by the same Library instance, as will calls from other assets using the same library.
// This means you can reliably expect different scripts to all deal with the one library.
//
// Support for a Library to save and load properties is provided with SetProperties() and 
// GetProperties() methods that work in the same way their PropertyObject equivalents do.  Just
// keep in mind there will only be one set of properties loaded/saved for a Library asset as only
// one instance of it exists.
//
// See Also:
//     World::GetLibrary()
//
game class Library isclass TrainzGameObject, PropertyObject
{
	
	
  //! Private method for library to get OnlineAccess object keyed to itself.
  //
  // This is method is the mechanism used to access Planet Auran via an OnlineAccess object from a script.
  // 
  // Script programmers should be careful not to allow other classes access to the OnlineAccess 
  // structure, either directly or indirectly, in order to prevent asset spoofing.
  //
  // It is only through this private method that you can obtain an OnlineAccess object, hence your
  // online access must be done with a Library asset.
  //
  // Returns:
  //     Returns an OnlineAccess object allowing access to Planet Auran services when online.
  //
  // See Also:
  //     OnlineAccess
  //
  native OnlineAccess GetOnlineAccess(void);

  

  // ============================================================================
  // Name: AddSystemMenuIcon
  // Desc: Add a system menu icon for this Library. Overwrites any existing
  //       system menu icon created by this Library. The Library will receive a
  //       message when the button is clicked with the major string "Interface"
  //       and the minor string "ClickSystemButton". To handle this message add
  //       a message handler as in the example below:
  //       AddHandler(me, "Interface", "ClickSystemButton", "OnSystemButton");
  // Parm: iconAsset - The icon to display.
  // Parm: localisedTooltip - The tooltip to display while the mouse is over our
  //       icon.
  // Parm: helpLink - The help link for the icon
  // Parm: showMenuBar - If true, or not provided, the menu bar will be shown for
  //       a short period if the player has it set to auto-hide
  // ============================================================================
  native void AddSystemMenuIcon(Asset iconAsset, string localisedTooltip, string helpLink, bool showMenuBar);
  void AddSystemMenuIcon(Asset iconAsset, string localisedTooltip, string helpLink) { AddSystemMenuIcon(iconAsset, localisedTooltip, helpLink, true); }
  
  
  
  // ============================================================================
  // Name: RemoveSystemMenuIcon
  // Desc: Removes any system menu icon created by this Library.
  // ============================================================================
  native void RemoveSystemMenuIcon(void);
  
  
  
  // ============================================================================
  // Name: BlinkSystemMenuIcon
  // Desc: Causes any system menu icon created by this Library to blink
  // Parm: seconds - the amount of time to blink for, or -1 for indefinite
  // ============================================================================
  native void BlinkSystemMenuIcon(int seconds);
  
  
  
  // ============================================================================
  // Name: ShowSystemMenuIconMenu
  // Desc: Displays a popup menu at the system menu icons location
  // Parm: menu - the menu to be displayed
  // ============================================================================
  native void ShowSystemMenuIconMenu(Menu menu);


  //=============================================================================
  // Name: HideSystemMenuIconMenu
  // Desc: Hide any displayed system icon menu
  //=============================================================================
  native void HideSystemMenuIconMenu();
  
  
  //=============================================================================
	//! Plays the specified sound event from the asset's SoundScript.
	//
	// SoundScripts are defined as sub-containers in the <n soundscript> container of the asset's 
	// configuration.  For details on creating assets with SoundScripts, see the 
	// <bi TRS2006 Content Creators Guide>.
	//
	// This method will start playing the sound.  Depending on the SoundScript configuration, the
	// sound will either be played just once or played continuously in a looping cycle such that
	// StopSoundScriptEvent() will need to be called to stop it.
	//
	// Param:  soundName  Name of the sound event to start playing.  The name is defined in the 
	//                    <n trigger> tag of the SoundScript sub-container.
	//
  //=============================================================================
	public native void PlaySoundScriptEvent(string soundName);


  //=============================================================================
	//! Stops the specified sound event from the asset's SoundScript.
	//
	// Param:  soundName  Name of the sound event to stop playing. See PlaySoundScriptEvent() for
	//                    details on sound event name details.
	//
  //=============================================================================
	public native void StopSoundScriptEvent(string soundName);
  
  
  
  //
  // INTERNAL IMPELEMTATION
  //

  native string LibraryCallNative(string function, string[] stringParam, GSObject[] objectParam);
  
	public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
  {
    // Pass any unhandled LibraryCall() functions through to native code.
    return LibraryCallNative(function, stringParam, objectParam);
  }
  
  // Added because a lot of scripts mistakenly attempt to call this (and now that the compiler's
  // fixed to detect this, it would generate script errors). Do not use this variant.
  public obsolete string LibraryCall(string function, string[] stringParam, GameObject[] objectParam)
  {
    GSObject[] realObjectParam = null;

    if (!objectParam)
      return LibraryCall(function, stringParam, realObjectParam);
    
    // Translate the parameters to the correct type.
    int count = objectParam.size();
    realObjectParam = new GSObject[count];
    int index;
    for (index = 0; index < count; index++)
      realObjectParam[index] = objectParam[index];

    return LibraryCall(function, stringParam, realObjectParam);
  }
	
};

