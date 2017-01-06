//
// Interface.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "world.gs"


//! Interface provides %Trainz scripts with simple user-interface control.
//
// See Also:
//     Browser, BrowserInterface, InterfaceAlert, InterfaceObjective
//
final static class Interface
{
  //! \name   RGB Color Constants
  //  \anchor rgbCol
  //@{
  //! Pre-defined 24-bit RGB (red, green and blue) color values.
  //
  // See Also:
  //     Interface::SetAlert(), InterfaceAlert::colour
  //

  public define int Colour_Red    = 0xFF0000;  //!< Color definition for red as a RGB value.
  public define int Colour_Green  = 0x00FF00;  //!< Color definition for green as a RGB value.
  public define int Colour_Blue   = 0x0000FF;  //!< Color definition for blue as a RGB value.
  public define int Colour_Yellow = 0xFFFF20;  //!< Color definition for yellow as a RGB value.
  public define int Colour_Cyan   = 0xB0C0FF;  //!< Color definition for cyan as a RGB value.
  public define int Colour_White  = 0xFFFFFF;  //!< Color definition for white as a RGB value.
  public define int Colour_Black  = 0x000000;  //!< Color definition for black as a RGB value.

  //@}


  //! \name   Button Element Indexes
  //  \anchor elementIndexes
  //@{
  //! Indexes to the 7 buttons of the Driver %Menu.
  //
  // These values refer to the 7 buttons on the Driver %Menu as described in sections 9.14 and 
  // 12.5.2 of the <b TRS2006 Expanded Manual>.
  //
  // See Also:
  //     Interface::HighlightButtonBarElement()
  //

	// Element indexes 
	public define int ButtonBar_Element_Close					= 0;  //!< Close/Exit button.
	public define int ButtonBar_Element_Pause					= 1;  //!< Pause button.
	public define int ButtonBar_Element_Save					= 2;  //!< Save button.
	public define int ButtonBar_Element_Performance		= 3;  //!< Performance Settings button.
	public define int ButtonBar_Element_MetricImp			= 4;  //!< Imperial/Metric button.
	public define int ButtonBar_Element_Find					= 5;  //!< Find button.
	public define int ButtonBar_Element_Help					= 6;  //!< On Screen Help button.

  //@}


  // Possible return results for GetDeviceFormFactor
  //
  public define int FormFactor_Desktop              = 0;
  public define int FormFactor_Tablet               = 1;
  public define int FormFactor_Phone                = 2;



  //! Prints a line of text to the <n \\%Trainz\JetLog.txt> log file.
  //
  // Param:  msg  String to print to the log file.
  //
  // See Also:
  //     Router::Info()
  //
  public native void Log(string msg);



  //! Prints a line of text to the Driver in-game message display. 
  //
  // This is typically used for non-vital event notifications.
  //
  // Param:  msg  String to print on the in-game message display.
  //
  public native void Print(string msg);


  //! Shows or hides the Driver Main %Menu Bar )top left corner).
  //
  // The menu may already be visible if the user has recently moved the cursor to the top left
  // region of the screen.
  //
  // Note:
  //     Showing and hiding is not immediate, there may be a delay before it slides on/off.
  //
  // Param:  state  If true, the button menu is shown, false to hide.  
  //
  public native void ShowDriverButtonMenu(bool state);



  //! Turns highlighting for a button on the Driver %Menu either on or off.
  //
  // This method allows a button on the Driver %Menu found in the top left corner of the screen to
  // be highlighted as if the mouse cursor was hovering above that button as well as being restored
  // back to normal state.  Note that the Driver %Menu is not always visible, but you can explicitly
  // show it with ShowDriverButtonMenu();
  //
  // Param:  buttonIndex  Index of button to perform state change on as defined in the
  //                      \ref elementIndexes "Button Element Indexes" constants.
  // Param:  state        If true, the button specified in <i buttonIndex> is highlighted, false to
  //                      set the button to a regular un-highlighted state.
  //
  public native void HighlightButtonBarElement(int buttonIndex, bool state);


  //! Enable/disable the display of activity-specific time-remaining/score string in the activity bar.
  //
  // Param:  msg  %Message to display with time/score in activity bar.
  //
  public native void SetScore(string msg);



  //! Adjusts the score by the given delta amount.
  //
  // Param:  delta  Amount to adjust score by.  Negative value will cause score to be reduced.
  //
  public void AdjustScore(int delta);



  //=============================================================================
  // Name: GetOnScreenHelp
  // Retn: bool - true for enabled, false for disabled.
  // Desc: Checks if the 'on screen help' overlay (junction and turntable arrows)
  //       is enabled.
  //=============================================================================
  public native bool GetOnScreenHelp(void);


  //! Enable/disable on-screen help.
  // 
  // This method performs the same function as the <b Show On-screen Help> menu item in Driver which
  // is used to bring up elevated names on map objects such as junctions.
  //
  // Param:  show  If true, on-screen help is enabled, false to disable.
  //
  public native void ShowOnScreenHelp(bool show);


  //! Enable/disable the display of vehicle product filter icons
  //
  // Param:  show  If true icons will be displayed, if false they won't
  //
  public native void ShowVehicleProductFilters(bool show);



  //! Control the scale of on-screen help icons.
  // 
  // This allows the modification of the scale of junction icons, etc.
  // 
  // Param:  scale  Scaling value between 0.5f (50%) and 1.0f (100%) for the icon sizes.
  //
  public native void SetHelperIconScale(float scale);



  //! Specify results of a scenario.
  //
  // This method will change the activities menu to the results screen and fill out the results box
  // with the given string.  The results will be visible when the user closes the activity module.
  //
  // Param:  msg  String to display in results box.
  //
  public native void SetResults(string msg);



  //! Gets the current score.
  //
  // Returns:
  //     Returns the current score.
  //
  public int GetScore();



  //! Adds a result to the result log.
  //
  // Param:  msg  Message for result log.
  //
  public void LogResult(string msg);



  //! Clears the result log.
  public void ResetResults();



  //! Gets the pixel width of the display area %Trainz is running in.
  //
  // Returns:
  //     Returns the pixel width of the display area (x-axis).
  //
  public native int GetDisplayWidth(void);


  //! Gets the pixel height of the display window %Trainz is running in.
  //
  // Returns:
  //     Returns the pixel height of the display area (y-axis).
  //
  public native int GetDisplayHeight(void);


  //! Gets the approximate pixel density for the display
  //
  //  This is intended for mobile devices (phones/tablets) and will probably
  //  not function on desktop platforms. If the function fails for any reason
  //  it will return -1.
  //
  // Returns:
  //     Approximate pixel density in ppi (pixels per inch) if known, -1 if not
  //
  public native int GetApproximateDisplayPPI(void);


  //! Gets the type of device Trainz is running on
  //
  // Returns:
  //     One of the FormFactor_* defines above
  //
  public native int GetDeviceFormFactor();


  //! Shows the game options screen
  // 
  // Param: kuid - OPTIONAL - The settings panel to open to. If not
  //        present the default panel will be displayed
  //
  public native void ShowGameOptionsPanel(KUID kuid);
  public void ShowGameOptionsPanel() { ShowGameOptionsPanel(null); }


  //! Sets the tooltip that should follow the mouse around.
  //
  // This method specifies that <i tooltip> should assume tooltip-like behavior (i.e. follow the
  // mouse around etc.).  Any existing tooltip will be replaced.
  //
  // Param:  tooltip  Tooltip to follow the mouse.  If this Browser is released, it will be removed
  //                  automatically.  If null, the current tooltip will be removed.
  //
  public native void SetTooltip(Browser tooltip);


  //! Shows a help popup message to the player
  //
  //  Used to show html or plain text messages to the player in response to
  //  particular events. Only one help popup can be displayed at once but sequential
  //  call will queue the messages. This allows multi-page message support for
  //  the same help popup if it's required.
  //  You can also optionally set the minimum size of the displayed dialog. The popup
  //  height will be automatically altered to a maximum 2/3 the screen size. Popup
  //  width also supports automatic resizing, but for text only.
  //
  // Param:  message  The help message to show to the player (html or plain text supported)
  // Param:  asset    The asset showing the message
  // Param:  msgId    The case-insensitive identifier string for this message. This is used 
  //                  by the 'Don't show again' checkbox, if checked by the player any future
  //                  call to this function with the same msgId will not show a message.
  // Param:  minWidth The minimum width of the displayed dialog (OPTIONAL)
  // Param:  minHeight The minimum height of the displayed dialog (OPTIONAL)
  //
  public native void ShowHelpPopup(string message, Asset asset, string msgId, float minWidth, float minHeight);
  public void ShowHelpPopup(string message, Asset asset, string msgId) { ShowHelpPopup(message, asset, msgId, 420.f, 70.f); }


  //! Spawns a floating message in Driver
  //
  //  Driver floating messages will spawn in the screen center and then float up
  //  off the screen over a short period. They are used to show short gameplay 
  //  messages to players such as score increases, goal reached feedback, etc.
  //  They should not be used to show instructions.
  //
  // Param:  message  The message to show to the player
  //
  public native void AddFloatingDriverMessage(string message);


  //! Gets the current metric/imperial mode of the interface.
  //
  // Returns:
  //     Returns true if in metric mode, false if in imperial mode.
  //
  // See Also:
  //     \ref measureConv "Measurement Conversion Multipliers"
  //
  public native bool GetMetricMode(void);



  //! Sets the metric/imperial mode of the interface.
  //
  // Note:
  //     When this method is called and the metric/imperial mode is changed, a message of type
  //     (<m"Interface-Event">, <m"Set-Metric-Mode">) is broadcasted.
  //
  // Param:  useMetric  Set to true for metric, false for imperial.
  //
  // See Also:
  //     \ref measureConv "Measurement Conversion Multipliers"
  //
  public native void SetMetricMode(bool useMetric);
  
  

  //! Generates a runtime warning that a given function or usage is obsolete.
  // 
  // The warning goes to the <n JetLog.txt> file and is not visible to the casual user within
  // %Trainz.  Only one warning is generated for any given warning string.
  //
  // Param:  warning  Message to log.  This will only appear the first time this method is called
  //                  for that message.
  //
  public native void WarnObsolete(string warning);



  //! Causes an exception to occur in the execution of game script code.
  //
  // This method allows an exception to be explicitly invoked in the execution of game script code.
  // It is not something you should do unless there is a <bi major failure> as it will disrupt the
  // user.
  //
  // Param:  message  %Message to be displayed (and logged) when the exception occurs.
  //
  public native void Exception(string message);
  
  

  //! Logs the current call stack.
  //
  // Generates a log of the current call stack and places it in the <b \Trainz\JetLog.txt> file.
  //
  // Param:  msg  String containing a message to be included with the call stack log.
  //
  public native void LogCallStack(string msg);



  //! Shows/hides the map mode view window.
  //
  // The user can show/hide the map view window by pressing <b 'M'> or <b 'Ctrl + M'> on the 
  // keyboard.
  //
  // Param:  visible  Use true to show the map mode view window, false to hide.
  //
  public native void SetMapView(bool visible);
  
  

  //! Determines if the map view window is displayed.
  //
  // The user can show/hide the map view window by pressing <b 'M'> or <b 'Ctrl + M'> on the 
  // keyboard.
  //
  // Returns:
  //     Returns true if the map mode view window is displayed, false otherwise.
  //
  public native bool GetMapView(void);
  


  //! Sets the decouple mode of the Driver interface.
  //
  // The decouple mode can be enabled/disabled when the user clicks on the decouple icon located on
  // the Driver button bar or presses <b 'Ctrl + D'>.  When the interface is in decouple mode, the
  // decouple icon will be highlighted.
  //
  // Param:  enabled  Use true to enable decouple mode, false to disable.
  //
  public native void SetDecoupleMode(bool enabled);
  
  

  //! Gets the decouple mode of the Driver interface.
  //
  // The decouple mode can be enabled/disabled when the user clicks on the decouple icon located on
  // the Driver button bar or presses <b 'Ctrl + D'>.  When the interface is in decouple mode, the
  // decouple icon will be highlighted.
  //
  // Returns:
  //     Returns true if the Driver interface is in decouple mode, false otherwise.
  //
  public native bool GetDecoupleMode(void);
  


  //! Shows/hides the waybill window in Driver.
  //
  // Param:  visible  Use true to show the waybill window, false to hide.
  //
  public void SetWaybillWindowVisible(bool visible);



  //! Determines if the waybill window is displayed.
  //
  // Returns:
  //     Returns true if the waybill window is displayed, false otherwise.
  //
  public bool GetWaybillWindowVisible(void);



  //! Shows/hides the message window in Driver.
  //
  // Param:  visible  Use true to show the message window, false to hide.
  //
  public native void SetMessageWindowVisible(bool visible);



  //! Determines if the message window in Driver is visible.
  //
  // Returns:
  //     Returns true if the message window in Driver (located at the top-center of the screen) is
  //     visible, false otherwise.
  //
  public native bool GetMessageWindowVisible(void);



  //! Determines if there are any unseen messages in the Driver message window.
  //
  // There are unseen messages if the message window is invisible yet has received new messages.
  // This is indicated visually to the user by the highlighted microphone icon on the Driver button
  // bar.
  //
  // Returns:
  //     Returns true if there are any unseen messages, false otherwise.
  //
  public native bool HasUnseenMessages(void);



  //! Determines if the Driver interface is visible.
  //
  // The entire interface in Driver can be toggled between invisible and visible by pressing the
  // <b 'F5'> key.
  //
  // Returns:
  //     Returns true if the entire Driver interface is visible, false when invisible.
  //
  public native bool GetInterfaceVisible(void);




  //! Determines if the Driver order bar is visible.
  //
  // The Driver order bar can be toggled between invisible and visible by pressing the
  // <b 'F6'> key.
  //
  // Returns:
  //     Returns true if the Driver order bar is visible, false otherwise.
  //
  public native bool GetDriverOrderBarVisible(void);



  //! Shows/hides the driver order bar in Driver.
  //
  // The Driver order bar can be toggled between invisible and visible by pressing the
  // <b 'F6'> key.
  //
  // Param:  visible  Use true to show the Driver order bar, false to hide.
  //
  public native void SetDriverOrderBarVisible(bool visible);



  //! Sets the specified property of the named element in the interface.
  //
  // This method is used to modify element properties of browser windows in the %Trainz interface
  // such as the Minimap.
  //
  // Param:  elementID   Element to set the property of.
  // Param:  propertyID  Property in the element to set.
  // Param:  value       Value to set the property to.
  //
  // See Also:
  //     GetElementProperty()
  //
  public native void SetElementProperty(string elementID, string propertyID, string value);



  //! Gets the value of specified property from the named element in the interface.
  //
  // Param:  elementID   Element to get a property value from.
  // Param:  propertyID  Property in the element to get the value of.
  //
  // Returns:
  //     Returns the value of the specified property value if it exists, null otherwise.
  //
  // See Also:
  //     SetElementProperty(), Browser::SetElementProperty()
  //
  public native string GetElementProperty(string elementID, string propertyID);
  
  
  
  //! Gets a real-time timestamp in integer seconds.
  //
  // Returns:
  //     Return the current time represented as seconds elapsed since midnight (00:00:00), January 1,
  //     1970, coordinated universal time (UTC).  Note that the return value is a string as 
  //     <l gsc  GS> does not support any extended integer types.
  //
  // See Also:
  //     World::GetSeconds()
  //
  public native string GetTimeStamp(void);
  
  
  // ============================================================================
  // Name: GetClickTrackSearch
  // Desc: Returns the location of the most recent click on a track. This is
  //       only updated in specific instances as documented elsewhere. Calling
  //       this function at arbitrary times will return old data.
  // Retn: GSTrackSearch - A tracksearch at the location of the recent click.
  //       Direction is effectively random.
  // ============================================================================
  public native GSTrackSearch GetClickTrackSearch(void);
  
  
  // ============================================================================
  // Name: SetAchievementAwarded
  // Desc: Called by the Achievements system when an achievement is awarded.
  // Parm: achievementName - The fully-qualified name of the achievement.
  // Parm: achivementSystemSecurityToken - The security token proving that this
  //       call is begin made on behalf of the Achievement System.
  // Retn: bool - True if the native systems have handled displaying the
  //       achievement, or false if the scripts should take care of it.
  // ============================================================================
  public native bool SetAchievementAwarded(string achievementName, SecurityToken achivementSystemSecurityToken);
  
  
  // ============================================================================
  // Name: SetAchievementVariable
  // Desc: Called by the Achievements system when a variable is modified.
  // Parm: achievementVariableName - The fully-qualified name of the achievement
  //       variable.
  // Parm: newValue - A float specifying the new value of the achievement
  //       variable. The units and meaning are specific to the variable in
  //       question.
  // Parm: achivementSystemSecurityToken - The security token proving that this
  //       call is begin made on behalf of the Achievement System.
  // ============================================================================
  public native void SetAchievementVariable(string achievementVariableName, float newValue, SecurityToken achivementSystemSecurityToken);

  
  // ============================================================================
  // Name: SetAchievementProgress
  // Desc: Called by the Achievements system when an achievement's progress may
  //       have changed.
  // Parm: achievementName - The fully-qualified name of the achievement.
  // Parm: currentSumValue - The current overall progress of this achievement,
  //       derived by summing all relevant variables.
  // Parm: maxSumValue - The maximum overall progress of this achievement,
  //       derived by summing the threshold criteria.
  // ============================================================================
  public native void SetAchievementProgress(string achievementVariableName, float currentSumValue, float maxSumValue, SecurityToken achivementSystemSecurityToken);


  //
  // IMPLEMENTATION
  //

  string results = "";
  int score = 0;

  public int GetScore()
  {
    return score;
  }

  public void LogResult(string msg)
  {
    results = results + msg + "\n";
  }

  public void ResetResults()
  {
    results = "";
  } 

  public void SetResults()
  {
    SetResults(results);
  }

  public void AdjustScore(int delta)
  {
    score = score + delta;
    if(delta) SetScore((string) score);
  }

  public void Load(string data)
  {
    score = Str.UnpackInt(data);
    Str.TrimLeft(data, null);
    results = data;
    SetResults();
  }

  public string Save()
  {
    return score + " " + results;
  }
  
  
  Library m_waybillManager;
  
  public void SetWaybillWindowVisible(bool visible)
  {
    if (!m_waybillManager)
    {
      Asset trainzAsset = Constructors.GetTrainzAsset();
      KUID waybillManagerID = trainzAsset.LookupKUIDTable("waybill-manager");
      m_waybillManager = World.GetLibrary(waybillManagerID);
    }
    
    if (visible)
      m_waybillManager.LibraryCall("show-waybills-window", null, null);
    else
      m_waybillManager.LibraryCall("hide-waybills-window", null, null);
  }
  
  public bool GetWaybillWindowVisible(void)
  {
    if (!m_waybillManager)
    {
      Asset trainzAsset = Constructors.GetTrainzAsset();
      KUID waybillManagerID = trainzAsset.LookupKUIDTable("waybill-manager");
      m_waybillManager = World.GetLibrary(waybillManagerID);
    }
    
    return (m_waybillManager.LibraryCall("get-waybills-window-visible", null, null) == "true");
  }
};


//! An interface alert.
//
// See Also:
//     Interface, Interface::SetAlert(), InterfaceObjective
//
class InterfaceAlert
{
	public string alert;  //!< Alert message string.
	public string icon;   //!< Name of icon file.
	public string log;    //!< %Message to place in log file.
	public string wav;    //!< Name of audio file played when alert is activated.

	//! Duration of the alert in seconds.  Default of 10.0 but can be changed.
	public float time = 10.0f;

	//! Color of text as a 24-bit RGB (red, green and blue) value.  Is black by default but can be changed.
	//
	// See Also:
	//     \ref rgbCol "RGB Color Constants"
	//
	public int colour = Interface.Colour_Black;

	public int score;  //!< Alert score value.

	//! Executes this alert.
	//
	// Param:  alertEx  Text to concatenate to the <l InterfaceAlert::alert  alert> message string.
	//
	public void Alert(string alertEx)
	{
		if(wav and wav.size()) World.PlaySound(wav, 1000, 1, 1000, null, null);
		if(log and log.size()) Interface.LogResult(log + alertEx);
		Interface.AdjustScore(score);
	}
};


//! An interface objective.
//
// See Also:
//     Interface, Interface::SetObjective(), InterfaceAlert
//
class InterfaceObjective
{
	public string objective;  //!< Objective message string.
	public string icon;       //!< Name of icon file.
	public string log;        //!< %Message to place in log file.
	public string wav;        //!< Name of audio file played when objective is activated.
	public int score;         //!< Objective score value.

	//! Executes this objective.
	//
	// Param:  objectiveEx  Text to concatenate to the <l InterfaceObjective::objective  objective>
	//                      message string.
	//
	// See Also:
	//     Interface::AdjustScore(), Interface::SetObjectionIcon() 
	//
	public void Objective(string objectiveEx)
	{
		if(wav and wav.size()) World.PlaySound(wav, 1000, 1, 1000, null, null);
		if(log and log.size()) Interface.LogResult(log + objectiveEx);
		Interface.AdjustScore(score);
	}
};

