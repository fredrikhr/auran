//=============================================================================
// Name: Interface.gs
// Desc: 
//=============================================================================
include "world.gs"



//=============================================================================
// Name: Interface
// Desc: 
//=============================================================================
final static class Interface  isclass GameObject, ScriptLogBase
{
  //=============================================================================
  // Name: Colour_*
  // Desc: Pre-defined 24-bit RGB (red, green and blue) color values.
  //=============================================================================
  public define int Colour_Red    = 0xFF0000;
  public define int Colour_Green  = 0x00FF00;
  public define int Colour_Blue   = 0x0000FF;
  public define int Colour_Yellow = 0xFFFF20;
  public define int Colour_Cyan   = 0xB0C0FF;
  public define int Colour_White  = 0xFFFFFF;
  public define int Colour_Black  = 0x000000;



  //=============================================================================
  // Name: ButtonBar_Element_*
  // Desc: These values refer to standard buttons (usually) visible on the Trainz
  //       HUD display. The exact location and style will vary between versions,
  //       and some buttons may not always be visible.
  //=============================================================================
  public define int ButtonBar_Element_Close         = 0;  // Close/Exit button
  public define int ButtonBar_Element_Pause         = 1;  // Pause button
  public define int ButtonBar_Element_Save          = 2;  // Save button
  public define int ButtonBar_Element_Performance   = 3;  // Performance settings button
  public define int ButtonBar_Element_MetricImp     = 4;  // Imperial/Metric toggle
  public define int ButtonBar_Element_Find          = 5;  // Find object button
  public define int ButtonBar_Element_Help          = 6;  // Help button


  //=============================================================================
  // Name: FormFactor_*
  // Desc: Possible return results for GetDeviceFormFactor.
  //=============================================================================
  public define int FormFactor_Desktop              = 0;
  public define int FormFactor_Tablet               = 1;
  public define int FormFactor_Phone                = 2;


  //=============================================================================
  // Name: Print
  // Desc: Prints a line of text to the Driver message window. This is typically
  //       used for non-vital event notifications.
  // Parm: msg - Text to print on the in-game message display.
  //=============================================================================
  public native void Print(string msg);


  //=============================================================================
  // Name: WarnObsolete
  // Desc: Generates a runtime warning that a given function or usage is
  //       obsolete. This warning typically goes to the Trainz log and is not
  //       visible to the player within the normal UI. Only one log will be
  //       generated for any given warning string.
  // Parm: warning - The warning message to log.
  //=============================================================================
  public native void WarnObsolete(string warning);


  //=============================================================================
  // Name: ShowDriverButtonMenu
  // Desc: Shows or hides the Driver 'button menu' UI element (if present).
  //=============================================================================
  public native void ShowDriverButtonMenu(bool state);


  //=============================================================================
  // Name: HighlightButtonBarElement
  // Desc: Toggle highlighting for a button on the Driver button menu. This is
  //       intended for use in tutorials, or to draw attention to required player
  //       action. Note that the buttons this function activates may not be
  //       available/visible in every version of Trainz.
  // Parm: buttonIndex - One of the ButtonBar_Element_* defines (above) that
  //       refers to the button to highlight or stop highlighting.
  // Parm: state - If true, the specified button is highlighted, if false the
  //       button will be returned to it's regular un-highlighted state.
  //=============================================================================
  public native void HighlightButtonBarElement(int buttonIndex, bool state);


  //=============================================================================
  // Name: GetOnScreenHelp
  // Desc: Returns whether the on screen help display is enabled
  //=============================================================================
  public native bool GetOnScreenHelp(void);


  //=============================================================================
  // Name: ShowOnScreenHelp
  // Desc: Enable/disable on-screen help display. Specifically this controls the
  //       visibility of junction/turntable/etc names/arrows
  //=============================================================================
  public native void ShowOnScreenHelp(bool show);


  //=============================================================================
  // Name: GetOnScreenVehicleHelp
  // Desc: Returns whether the vehicle name display is enabled
  //=============================================================================
  public native bool GetOnScreenVehicleHelp();


  //=============================================================================
  // Name: ShowOnScreenVehicleHelp
  // Desc: Enable/disable on-screen vehicle name display
  //=============================================================================
  public native void ShowOnScreenVehicleHelp(bool show);


  //=============================================================================
  // Name: SetProductOverlaysVisible
  // Desc: Sets the display mode for the product overlays.
  // Parm: displayMode - The new display mode, as follows:
  //        0 - Always off
  //        1 - Always on
  //        2 - Displayed for any recently changed product queues
  //        3 - As above, but only for trains
  //        4 - As above, but only for the player targeted train
  // Parm: bUserConfigured - Whether this new setting was selected by the player.
  //=============================================================================
  public native void SetProductOverlayDisplayMode(int displayMode, bool bUserConfigured);
  public void SetProductOverlayDisplayMode(int displayMode) { SetProductOverlayDisplayMode(displayMode, false); }


  //=============================================================================
  // Name: GetProductOverlayDisplayMode
  // Desc: Returns the user configured display mode for the product overlays
  // Retn: int - The configured display mode, as per SetProductOverlayDisplayMode
  //=============================================================================
  public native int GetProductOverlayDisplayMode();


  //=============================================================================
  public obsolete bool AreProductOverlaysVisible() { return GetProductOverlayDisplayMode() == 1; }
  public obsolete void SetProductOverlaysVisible(bool visible)
  {
    if (visible)
      SetProductOverlayDisplayMode(1);
    else
      SetProductOverlayDisplayMode(2);
  }


  //=============================================================================
  // Name: ShowVehicleProductFilters
  // Desc: Enable/disable the display of vehicle product filter icons.
  //=============================================================================
  public native void ShowVehicleProductFilters(bool show);


  //=============================================================================
  // Name: SetHelperIconScale
  // Desc: Control the scale of on-screen help icons (junction overlays, etc).
  //       This is useful for routes/sessions where there are a lot of junctions
  //       on screen in a very tight area (eg. within yards etc).
  // Parm: scale - The scaling value, between 0.5 (50%) and 1.0 (100%) of the
  //       default overlay scale.
  //=============================================================================
  public native void SetHelperIconScale(float scale);


  //=============================================================================
  // Name: SetScore
  // Desc: Enable/disable the display of activity-specific time-remaining/score
  //       string in the activity bar.
  // Parm: msg - A message to display with time/score in activity bar.
  //=============================================================================
  public native void SetScore(string msg);


  //=============================================================================
  // Name: AdjustScore
  // Desc: Adjusts the score by the given delta amount.
  // Parm: delta - Amount to adjust the score by.
  //=============================================================================
  public void AdjustScore(int delta);


  //=============================================================================
  // Name: GetScore
  // Desc: Gets the current score.
  //=============================================================================
  public int GetScore();


  //=============================================================================
  // Name: LogResult
  // Desc: Adds a result to the result log.
  // Parm: msg - The text to add to the results log.
  //=============================================================================
  public void LogResult(string msg);


  //=============================================================================
  // Name: ResetResults
  // Desc: Clears the result log.
  //=============================================================================
  public void ResetResults();


  //=============================================================================
  // Name: SetResults
  // Desc: Specify results of a scenario.
  //=============================================================================
  public native void SetResults(string msg);


  //=============================================================================
  // Name: GetDisplayWidth
  // Desc: Gets the pixel width of the display area Trainz is running in.
  //=============================================================================
  public native int GetDisplayWidth(void);


  //=============================================================================
  // Name: GetDisplayHeight
  // Desc: Gets the pixel height of the display area Trainz is running in.
  //=============================================================================
  public native int GetDisplayHeight(void);


  //=============================================================================
  // Name: GetMenuBarHeight
  // Desc: Gets the pixel height of the menubar, regardless of whether it's
  //       currently visible, animating, etc.
  //=============================================================================
  public native int GetMenuBarHeight(void);


  //=============================================================================
  // Name: GetApproximateDisplayPPI
  // Desc: Gets the approximate pixel density for the display. This is intended
  //       for mobile devices (phones/tablets) and will probably not function on
  //       desktop platforms.
  // Retn: int - Approximate pixel density in pixels per inch, -1 if unknown.
  //=============================================================================
  public native int GetApproximateDisplayPPI(void);


  //=============================================================================
  // Name: GetDeviceFormFactor
  // Desc: Gets the type of device Trainz is currently running on.
  //=============================================================================
  public native int GetDeviceFormFactor();


  //=============================================================================
  // Name: ShowGameOptionsPanel
  // Desc: Shows the game settings dialog/screen.
  // Parm: kuid - OPTIONAL - A settings panel to open to. If not set the default
  //       panel will be displayed.
  //=============================================================================
  public native void ShowGameOptionsPanel(KUID kuid);
  public void ShowGameOptionsPanel() { ShowGameOptionsPanel(null); }


  //=============================================================================
  // Name: ShowPALoginDetails
  // Desc: Shows the planet auran login details dialog.
  //=============================================================================
  public native void ShowPALoginDetails();


  //=============================================================================
  // Name: SetTooltip
  // Desc: Sets the tooltip that should follow the mouse around. Any existing
  //       tooltip will be replaced.
  // Parm: tooltip - A browser to display as the tooltip. If this browser is
  //       released it will stop displaying automatically. If null, any current
  //       tooltip will be removed.
  //=============================================================================
  public native void SetTooltip(Browser tooltip);


  //=============================================================================
  // Name: ShowHelpPopup
  // Desc: Shows a help popup message to the player. This is used to show html or
  //       plain text messages to the player in response to particular events.
  //       Only one help popup can be displayed at once but sequential calls will
  //       queue the messages. This allows multi-page message support for the
  //       same help popup if it's required. You can also optionally set the
  //       minimum size of the displayed dialog. The popup height will be
  //       automatically altered to a maximum 2/3 the screen size. Popup width
  //       also supports automatic resizing, but for text only.
  //
  // Parm: message - The message to show to the player (html or plain text).
  // Parm: asset - The asset showing the message.
  // Parm: msgId - A case-insensitive identifier string for this message. This
  //       is used by the 'Don't show again' checkbox, if checked by the player
  //       any future call to this with the same msgId will not show anything.
  // Parm: minWidth - (OPTIONAL )- The minimum width of the displayed dialog.
  // Parm: minHeight - (OPTIONAL) - The minimum height of the displayed dialog.
  //=============================================================================
  public native void ShowHelpPopup(string message, Asset asset, string msgId, float minWidth, float minHeight);
  public void ShowHelpPopup(string message, Asset asset, string msgId) { ShowHelpPopup(message, asset, msgId, 420.f, 70.f); }


  //=============================================================================
  // Name: ShowMessageBox
  // Desc: Shows a modal message box prompt to the player. When closed this
  //       dialog will post a message back to script with the 'major' param of
  //       "Interface.MessageBox", and the 'minor' param passed to this function.
  // Parm: caller - The GameObject showing this message (responses will be posted
  //       to this object). You may pass null here for error dialogs, but such
  //       uses obviously don't support message callback.
  // Parm: message - The localised message to show in the message box prompt.
  // Parm: bIsError - Whether this is an error message. Error dialogs show with a
  //       different icon and have only one option, compared to two on otherwise.
  // Parm: confirmMsg - The minor component of the message to post on confirm.
  // Parm: cancelMsg - The minor component of the message to post on cancel.
  // Parm: dontShowAgainToken - (OPTIONAL) - If present, this will add a "Don't
  //       show again" checkbox to the dialog, which if checked and the message
  //       is confirmed, will prevent further calls to this function (with the
  //       same ID) from showing any message, and instead cause them to instantly
  //       post the confirmation message back to script.
  //=============================================================================
  public native void ShowMessageBox(TrainzGameObject caller, string message, bool bIsError, string confirmMsg, string cancelMsg, string dontShowAgainToken);
  public void ShowMessageBox(TrainzGameObject caller, string message, bool bIsError, string confirmMsg, string cancelMsg)
  {
    ShowMessageBox(caller, message, bIsError, confirmMsg, cancelMsg, "");
  }


  //=============================================================================
  // Name: ShowDriverInstructionsPopup
  // Desc: Shows a platform appropriate instructions message to the player. Only
  //       one such message can be visible at a time, and each call to this will
  //       replace/dismiss any message currently visible.
  // Parm: image - OPTIONAL - A KUID to use for an image to display with the
  //       message, or null. The image will be displayed with square proportions.
  //       Support exists for animation using appropriate texture group assets.
  // Parm: localisedText - The plain text to display in the message. The message
  //       popup guarantees a minimum height to allow 4 lines of text, but will
  //       otherwise automatically increase in height and/or add scrollbars as
  //       necessary. The width may vary based on platform and player settings.
  // Retn: AsyncQueryHelper - An asynchronous result object which will be
  //       notified when the player has dismissed the displayed message, or null
  //       if no message was displayed.
  // Note: Available in Driver only. Has no effect when called elsewhere.
  // Note: The message popup is semi-modal, and blocks interaction with the game
  //       world when displayed. Gameplay is also paused while the message is
  //       displayed.
  //=============================================================================
  public native AsyncQueryHelper ShowDriverInstructionsPopup(KUID image, string localisedText);


  //=============================================================================
  // Name: AddFloatingDriverMessage
  // Desc: Spawns a floating message in Driver. Driver floating messages will
  //       show in the screen center and then rapidly float up off the screen
  //       They are used to show short gameplay messages to players such as score
  //       increases, goal reached feedback, etc.
  //       This should should not be used to show instructions, as the text is
  //       likely to animate too fast to be readable.
  // Parm: message - The message to show to the player.
  //=============================================================================
  public native void AddFloatingDriverMessage(string message);


  //=============================================================================
  // Name: GetMetricMode
  // Desc: Returns whether the UI is currently displaying metric units (metres,
  //       kilometres, etc) rather than imperial (miles, feet, etc).
  //       Ideally, any script that displays measurement data to the player
  //       should call this and convert their displays to the appropriate units.
  // Retn: bool - true if in metric mode, false if imperial.
  //=============================================================================
  public native bool GetMetricMode(void);


  //=============================================================================
  // Name: SetMetricMode
  // Desc: Sets the interface to to metric/imperial mode.
  // Parm: useMetric - true to switch to metric units, false for imperial.
  //=============================================================================
  public native void SetMetricMode(bool useMetric);


  //=============================================================================
  // Name: SetMapView
  // Desc: Sets whether the UI is currently in map/satellite view.
  // Parm: visible - true to set the player to map view, false to return them to
  //       a 'normal' zoom range.
  //=============================================================================
  public native void SetMapView(bool visible);


  //=============================================================================
  // Name: GetMapView
  // Desc: Returns whether the UI is currently in map/satellite view.
  // Retm: bool - true if the player is in map view mode, false otherwise.
  //=============================================================================
  public native bool GetMapView(void);


  //=============================================================================
  // Name: SetDecoupleMode
  // Desc: Sets the decouple mode active/inactive in the Driver interface.
  // Parm: decoupleActive - true to activate decouple mode, false to deactivate.
  //=============================================================================
  public native void SetDecoupleMode(bool decoupleActive);


  //=============================================================================
  // Name: GetDecoupleMode
  // Desc: Gets whether the player is in decouple mode in the Driver interface.
  //=============================================================================
  public native bool GetDecoupleMode(void);


  //=============================================================================
  // Name: SetWaybillWindowVisible
  // Desc: Shows/hides the waybill window in Driver
  //=============================================================================
  public void SetWaybillWindowVisible(bool visible);


  //=============================================================================
  // Name: GetWaybillWindowVisible
  // Desc: Returns whether the waybill window is displayed.
  //=============================================================================
  public bool GetWaybillWindowVisible(void);


  //=============================================================================
  // Name: SetMessageWindowVisible
  // Desc: Shows/hides the message window in Driver.
  //=============================================================================
  public native void SetMessageWindowVisible(bool visible);


  //=============================================================================
  // Name: GetMessageWindowVisible
  // Desc: Returns whether the Driver message window is currently visible.
  //=============================================================================
  public native bool GetMessageWindowVisible(void);


  //=============================================================================
  // Name: HasUnseenMessages
  // Desc: Returns if there are any unseen messages in the Driver message window.
  //=============================================================================
  public native bool HasUnseenMessages(void);


  //=============================================================================
  // Name: GetInterfaceVisible
  // Desc: Returns whether the interface is currently visible, or has been
  //       hidden by the player.
  //=============================================================================
  public native bool GetInterfaceVisible(void);


  //=============================================================================
  // Name: GetDriverOrderBarVisible
  // Desc: Returns whether the driver order bar is currently visible.
  //=============================================================================
  public native bool GetDriverOrderBarVisible(void);


  //=============================================================================
  // Name: SetDriverOrderBarVisible
  // Desc: Shows/hides the driver order bar in Driver.
  //=============================================================================
  public native void SetDriverOrderBarVisible(bool visible);


  //=============================================================================
  // Name: SetElementProperty
  // Desc: Alters a property of a named element in the interface. This is used to
  //       modify element properties of windows/HUDs in the Trainz interface.
  //
  // TODO: Provide a list of supported elements and properties
  //
  // Parm: elementID - Element to set the property of.
  // Parm: propertyID - Property in the element to set.
  // Parm: value - Value to set the property to.
  //=============================================================================
  public native void SetElementProperty(string elementID, string propertyID, string value);


  //=============================================================================
  // Name: GetElementProperty
  // Desc: Gets the value of a property from a named element in the interface.
  // Parm: elementID - Element to get the property of.
  // Parm: propertyID - Property in the element to get.
  // Retn: string - The current value of the property specified.
  //=============================================================================
  public native string GetElementProperty(string elementID, string propertyID);


  //=============================================================================
  // Name: GetTimeStamp
  // Desc: Returns the current real-world time, represented as seconds elapsed
  //       since midnight (00:00:00), January 1, 1970, coordinated universal time
  //       (UTC). Note that the return value is a string as this value no longer
  //       fits in a signed 32 bit integer, and gsc does not support any extended
  //       integer types.
  //=============================================================================
  public native string GetTimeStamp(void);


  //=============================================================================
  // Name: GetClickTrackSearch
  // Desc: Returns the location of the most recent click on a track. This is
  //       only updated in specific instances as documented elsewhere. Calling
  //       this function at arbitrary times will return old data.
  // Retn: GSTrackSearch - A tracksearch at the location of the recent click.
  //       Direction is effectively random.
  //=============================================================================
  public native GSTrackSearch GetClickTrackSearch(void);


  //=============================================================================
  // Name: SetAchievementAwarded
  // Desc: Called by the Achievements system when an achievement is awarded.
  // Parm: achievementName - The fully-qualified name of the achievement.
  // Parm: achivementSystemSecurityToken - The security token proving that this
  //       call is begin made on behalf of the Achievement System.
  // Retn: bool - True if the native systems have handled displaying the
  //       achievement, or false if the scripts should take care of it.
  //=============================================================================
  public native bool SetAchievementAwarded(string achievementName, SecurityToken achivementSystemSecurityToken);


  //=============================================================================
  // Name: SetAchievementVariable
  // Desc: Called by the Achievements system when a variable is modified.
  // Parm: achievementVariableName - The fully-qualified name of the achievement
  //       variable.
  // Parm: newValue - The new value of the achievement variable. The units and
  //       meaning are specific to the variable in question.
  // Parm: achivementSystemSecurityToken - The security token proving that this
  //       call is begin made on behalf of the Achievement System.
  //=============================================================================
  public native void SetAchievementVariable(string achievementVariableName, float newValue, SecurityToken achivementSystemSecurityToken);


  //=============================================================================
  // Name: SetAchievementProgress
  // Desc: Called by the Achievements system when an achievement's progress may
  //       have changed.
  // Parm: achievementName - The fully-qualified name of the achievement.
  // Parm: currentSumValue - The current overall progress of this achievement,
  //       derived by summing all relevant variables.
  // Parm: maxSumValue - The maximum overall progress of this achievement,
  //       derived by summing the threshold criteria.
  //=============================================================================
  public native void SetAchievementProgress(string achievementVariableName, float currentSumValue, float maxSumValue, SecurityToken achivementSystemSecurityToken);


  //=============================================================================
  // Name: SetCutSceneMode
  // Desc: Adjust the 'cut scene' state of the current game. Each actor can
  //       request the game to enter cut scene mode; the game remains in cut
  //       scene mode while at least one actor has a request.
  // Parm: actor - The object or system on whose behalf the game mode is to be
  //       changed.
  // Parm: bShouldShowCutScene - True if the game is to show a cut scene, or
  //       false if the game is to return to normal mode.
  // Note: The user may opt to leave cut-scene mode at any time. When this
  //       occurs, or when the game detects an abuse of the cut scene mechanism,
  //       the cut scene ends even if script requests remain outstanding.
  // Note: A "CutSceneMode", "CutSceneEnter" message is posted to the Interface
  //       script singleton when cut scene mode starts (which may not be
  //       immediate). The caller should not perform any cut scene display logic
  //       until this message has been received.
  // Note: A "CutSceneMode", "CutSceneExit" message is posted to the Interface
  //       script singleton when the cut scene mode exits. This message can occur
  //       at any point after SetCutSceneMode() has been called.
  // Note: If a user has recently skipped a cut scene, attempting to re-enter a
  //       cut scene may fail, and no "CutSceneEnter" is sent in this scenario.
  //       A repeat of the "CutSceneExit" message is sent to ensure that scripts
  //       understand that no cut scene will play.
  // Note: It is not an error to call SetCutSceneMode() twice in a row with the
  //       same parameters, however the second call achieves nothing.
  // Note: This native function is present in TANE for compatibility reasons but
  //       has no effect.
  //=============================================================================
  public native void SetCutSceneMode(GameObject actor, bool bShouldShowCutScene);


  //=============================================================================
  // Name: SetSubtitleText
  // Desc: Shows the specified text as a subtitle. Only one subtitle is visible
  //       at a time; setting a new subtitle hides any existing subtitle.
  // Parm: subtitleText - The localised text to display. Pass a null or empty
  //       string to remove the current subtitle.
  // Note: Subtitles are intended as a semi-obtrustive notification mechanism for
  //       use by session rules. At the current time, they should not be used by
  //       other asset types as Trainz does not currently offer any form of
  //       queuing or conflict resolution.
  // Note: Subtitles are always visible to the user. They show even during
  //       cut-scenes, and there is no option to disable them.
  // Note: This native function is present in TANE for compatibility reasons but
  //       has no effect.
  // Note: As of writing, subtitles are only visible within Driver, however that
  //       may change in the future.
  //=============================================================================
  public native void SetSubtitleText(string subtitleText);



  //=============================================================================
  //
  // IMPLEMENTATION
  //

  string results = "";
  int score = 0;

  //=============================================================================
  public int GetScore()
  {
    return score;
  }

  //=============================================================================
  public void LogResult(string msg)
  {
    results = results + msg + "\n";
  }

  //=============================================================================
  public void ResetResults()
  {
    results = "";
  }

  //=============================================================================
  public void SetResults()
  {
    SetResults(results);
  }

  //=============================================================================
  public void AdjustScore(int delta)
  {
    score = score + delta;
    if (delta) SetScore((string) score);
  }

  //=============================================================================
  public void Load(string data)
  {
    score = Str.UnpackInt(data);
    Str.TrimLeft(data, null);
    results = data;
    SetResults();
  }

  //=============================================================================
  public string Save()
  {
    return score + " " + results;
  }


  //=============================================================================
  Library m_waybillManager;

  //=============================================================================
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

  //=============================================================================
  public bool GetWaybillWindowVisible(void)
  {
    if (!m_waybillManager)
      return false;

    return m_waybillManager.LibraryCall("get-waybills-window-visible", null, null) == "true";
  }


  //=============================================================================
  Library m_commodityPicker;

  //=============================================================================
  public void ShowCommodityPicker(bool visible)
  {
    if (!m_commodityPicker)
    {
      KUID kuid = Constructors.GetTrainzAsset().LookupKUIDTable("commodity-picker");
      m_commodityPicker = World.GetLibrary(kuid);
    }

    if (visible)
      m_commodityPicker.LibraryCall("show-window", null, null);
    else
      m_commodityPicker.LibraryCall("hide-window", null, null);
  }

  //=============================================================================
  public bool IsCommodityPickerVisible(void)
  {
    if (!m_commodityPicker)
      return false;

    return m_commodityPicker.LibraryCall("is-window-visible", null, null) == "true";
  }


  // for MFTS only.
  public native void ShowSurveyorUI(void);

};



//=============================================================================
// Deprecated, do not use
obsolete class InterfaceAlert
{
  public string alert;                            // Alert message string
  public string icon;                             // Name of icon file
  public string log;                              // Message to place in log file
  public string wav;                              // Filename of the audio file to play
  public float  time = 10.0f;                     // Duration of the alert in seconds
  public int    colour = Interface.Colour_White;  // Colour of alert message text
  public int    score;                            // Score delta for alert


  //=============================================================================
  // Name: Alert
  // Desc: Executes this alert
  //=============================================================================
  public void Alert(string alertEx)
  {
    //if (wav != "")
    //  World.Play2DSound(wav);
    if (log and log.size())
      Interface.LogResult(log + alertEx);

    Interface.AdjustScore(score);
  }

};


//=============================================================================
// Deprecated, do not use
obsolete class InterfaceObjective
{
  public string objective;    // Objective message string
  public string icon;         // Name of icon file
  public string log;          // Message to place in log file
  public string wav;          // Filename of the audio file to play
  public int    score;        // Score delta for the objective


  //=============================================================================
  // Name: Objective
  // Desc: Completes this objective
  //=============================================================================
  public void Objective(string objectiveEx)
  {
    //if (wavAsset and wav != "")
    //  World.Play2DSound(wavAsset, wav);
    if (log and log.size())
      Interface.LogResult(log + objectiveEx);

    Interface.AdjustScore(score);
  }

};

