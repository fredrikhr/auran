include "kuid.gs"
include "Library.gs"


//=============================================================================
// Name: TrainzScriptBase
//=============================================================================
class TrainzScriptBase isclass GameObject
{

  //=============================================================================
  // Name: GetLibrary
  // Desc: Creates an instance of the specified library asset.
  // Parm: kuid - KUID of a script library asset to load and return.
  //=============================================================================
  public native Library GetLibrary(KUID kuid);


  //=============================================================================
  // Name: FindAsset
  // Desc: Returns an Asset instance for the best available version of the asset
  //       KUID passed, if possible. See also, Asset.gs
  //=============================================================================
  public native Asset FindAsset(KUID kuid);


  //=============================================================================
  // Name: GetAssetList
  // Desc: Returns a list of installed assets of the given kind. This function is
  //       obsolete should not be used. For alternatives see TrainzAssetSearch.gs
  //       and/or "asset-list" properties (PropertyObject.gs).
  //=============================================================================
  public obsolete native Asset[] GetAssetList(string kind);
  public obsolete native Asset[] GetAssetList(string kind, string customCategoryList);


  //=============================================================================
  // Name: SearchAssets
  // Desc: Returns a list of installed assets matching the given category filter.
  //       This function is obsolete should not be used. For alternatives see
  //       TrainzAssetSearch.gs and/or "asset-list" properties.
  //=============================================================================
  public obsolete native KUID[] SearchAssets(string categoryFilter, bool bSearchLocalAssetsOnly);


  //=============================================================================
  // Name: FindUpdatedAssets
  // Desc: Returns a list of installed out of date assets. This function is
  //       obsolete should not be used. For alternatives see TrainzAssetSearch.gs
  //       and/or "asset-list" properties (PropertyObject.gs).
  //=============================================================================
  public obsolete native Asset[] FindUpdatedAssets(string keywordFilter);
  public obsolete Asset[] FindUpdatedAssets() { return FindUpdatedAssets(""); }


  // ============================================================================
  // Name: SetGamePaused
  // Desc: Adjust the paused state of the current game. Each actor can request
  //       the game to be paused; the game remains paused while at least one
  //       actor has a pause request.
  // Parm: actor - The object or system on whose behalf the game is to be 
  //       paused/resumed.
  // Parm: bShouldPause - True if the game is to be paused, or false if the
  //       game is to be resumed.
  // ============================================================================
  public native void SetGamePaused(GameObject actor, bool bShouldPause);


  // ============================================================================
  // Name: IsGamePaused
  // Desc: Returns whether the game is currently paused.
  // Retn: bool - True if the game is paused.
  // ============================================================================
  public native bool IsGamePaused(void);


  // ============================================================================
  // Name: GetSeconds
  // Desc: Returns the number of real-time seconds that have passed since an
  //       arbitrary starting time. The starting time is constant for a given
  //       script machine instance. The return value will continue to increase
  //       regardless of any interruptions in gameplay such as a user pause.
  // Retn: float - The number of seconds that have passed.
  // ============================================================================
  public native float GetSeconds(void);


  //=============================================================================
  // Name: GetNormalizedSystemTime
  // Desc: Returns the current system time (not in-game time). This may be
  //       computationally expensive, avoid calling it often.
  // Retn: float - The current system time as a normalized value (0-1) where 0.0
  //       is midday, 0.5 is midnight and 1.0 is back to midday.
  //=============================================================================
  public native float GetNormalizedSystemTime(void);


  //=============================================================================
  // Name: GetSystemYear
  // Desc: Returns the player's system clock details, not the simulation clock. 
  //       This may be computationally expensive, avoid calling it often.
  // Retn: int - 
  //=============================================================================
  public native int GetSystemYear(void);
  
  
  //=============================================================================
  // Name: GetSystemMonth
  // Desc: Returns the player's system clock details, not the simulation clock. 
  //       This may be computationally expensive, avoid calling it often.
  // Retn: int - 
  //=============================================================================
  public native int GetSystemMonth(void);
  
  
  //=============================================================================
  // Name: GetSystemDate
  // Desc: Returns the player's system clock details, not the simulation clock. 
  //       This may be computationally expensive, avoid calling it often.
  // Retn: int - 
  //=============================================================================
  public native int GetSystemDate(void);
  
  
  //=============================================================================
  // Name: GetSystemHour
  // Desc: Returns the player's system clock details, not the simulation clock. 
  //       This may be computationally expensive, avoid calling it often.
  // Retn: int - 
  //=============================================================================
  public native int GetSystemHour(void);
  
  
  //=============================================================================
  // Name: GetSystemMinute
  // Desc: Returns the player's system clock details, not the simulation clock. 
  //       This may be computationally expensive, avoid calling it often.
  // Retn: int - 
  //=============================================================================
  public native int GetSystemMinute(void);
  
  
  //=============================================================================
  // Name: GetSystemSecond
  // Desc: Returns the player's system clock details, not the simulation clock. 
  //       This may be computationally expensive, avoid calling it often.
  // Retn: int - 
  //=============================================================================
  public native int GetSystemSecond(void);



  // ============================================================================
  // Name: OpenURL
  // Desc: Opens the provided URL in a manner dependant on the url protocol.
  // Parm: url - The URL to open.
  // Retn: bool - True if the URL was opened, or false if the URL was not able
  //       to be opened.
  // ============================================================================
  public native bool OpenURL(string URL);
  
  
  
  
  // ============================================================================
  // Name: PRODUCTRIGHT_*
  // Desc: Each "product right" describes a particular feature or concept which
  //       is permitted by the running Trainz installation. Each right indicates
  //       exactly what it says and no more. For example, one should not assume
  //       that PRODUCTRIGHT_TOUCH_INTERFACE implies a handheld device, or the
  //       lack of an embedded web browser. One should also not make assumptions
  //       about the presence of built-in content based on these flags.
  // ============================================================================
  public define int PRODUCTRIGHT_SURVEYOR = 0;
  public define int PRODUCTRIGHT_CONTENT_MANAGEMENT = 1;
  public define int PRODUCTRIGHT_BETA_VERSION = 2;
  public define int PRODUCTRIGHT_DRIVER = 3;
  public define int PRODUCTRIGHT_GAMEPLAY_MENU = 4;
  public define int PRODUCTRIGHT_SPEEDTREE = 5;
  public define int PRODUCTRIGHT_EDIT_LAYERS = 6;
  public define int PRODUCTRIGHT_ACHIEVEMENTS = 7;
  public define int PRODUCTRIGHT_TRAINZ_NATIVE_INTERFACE = 8;
  public define int PRODUCTRIGHT_MULTIPLAYER = 9;
  public define int PRODUCTRIGHT_COMPATIBILITY_MODE = 10;
  public define int PRODUCTRIGHT_ZOOM_TO_MINIMAP = 11;
  public define int PRODUCTRIGHT_TOUCH_INTERFACE = 12;
  public define int PRODUCTRIGHT_WEB_BROWSER = 13;
  public define int PRODUCTRIGHT_MAC_PLATFORM = 14;   // Obsolete. Will be removed.
  public define int PRODUCTRIGHT_VIDEO_PLAYBACK = 15;
  public define int PRODUCTRIGHT_ANDROID_PLATFORM = 16;
  public define int PRODUCTRIGHT_PURCHASE_CONTENT = 17;
  public define int PRODUCTRIGHT_TRAINZ_DRIVER = 18;
  public define int PRODUCTRIGHT_WINDOWS_PLATFORM = 19;   // Obsolete. Will be removed.
  public define int PRODUCTRIGHT_PURCHASE_CONTENT_IN_APP = 20;
  public define int PRODUCTRIGHT_DEBUG_MODE_ACTIVE = 21;
  public define int PRODUCTRIGHT_WORLD_OF_RAIL = 22;
  public define int PRODUCTRIGHT_RAILYARD = 23;
  public define int PRODUCTRIGHT_TS17UI = 24;
  
  
  // ============================================================================
  // Name: DoesInstallationProvideRight
  // Desc: Determines whether this Trainz installation provides the specified
  //       product right. This generally involves querying the installation
  //       CD KEYs to check whether the user has an appropriate CD KEY which
  //       grants the right in question.
  // Parm: right - The product right to query.
  // Retn: bool - True if the installation provides the specified right.
  // ============================================================================
  public native bool DoesInstallationProvideRight(int right);
  

  // ============================================================================
  // Name: DLS_ACCESS_????
  // Desc: Download Station Access Descriptor
  //       These values are returned from QueryDownloadStationAccess
  // ============================================================================
  public define int DLS_ACCESS_UNSET = 0;             // State has not yet been set, retry later
  public define int DLS_ACCESS_QUERYING = 1;          // DLS Access state is being queried, retry later
  public define int DLS_ACCESS_NO_LOGIN = 2;          // Player has no username/password entered
  public define int DLS_ACCESS_OFFLINE = 3;           // Game does not have internet access
  public define int DLS_ACCESS_INVALID_LOGIN = 4;     // Player's username/password is invalid
  public define int DLS_ACCESS_INVALID_CD_KEY = 5;    // Player doesn't have a cd-key registered
  public define int DLS_ACCESS_VALID = 6;             // Player has access and can download assets
  

  // ============================================================================
  // Name: QueryDownloadStationAccess
  // Desc: Determines whether this Trainz installation can download assets from
  //       the download station. This will check that the installation has a 
  //       valid username and password set, and that the username has a valid CD 
  //       key for this Trainz version registered with Planet Auran.
  // Retn: int - One of the DLS_ACCESS_???? defines listed above
  // ============================================================================
  public native int QueryDownloadStationAccess();


  // ============================================================================
  // Name: TrainzSystemCall
  // Desc: TRAINZ INTERNAL IMPLEMENTATION
  //       THIS IS NOT A PUBLIC API. DO NOT CALL THIS FUNCTION.
  //       The SystemCall interface provides a link between certain Trainz 
  //       functionality implemented in script code, and the corresponding native
  //       code. The functionality and interface is expected to change with each
  //       Trainz update (including minor updates.)
  // ============================================================================
  public native Soup TrainzSystemCall(SecurityToken token, string name, Soup param);


  // ============================================================================
  // Name: Log
  // Desc: Prints a line of text to the script log.
  // Parm: msg - The text to print.
  // ============================================================================
  public native void Log(string msg);



  // ============================================================================
  // Name: GetTrainzVersion
  // Desc: Gets the current version of Trainz. The value returned corresponds 
  //       to the version number you can see in the bottom-right side of the 
  //       main Trainz menu screen.
  // Retn: Returns the current Trainz version.
  // ============================================================================
  public native float GetTrainzVersion(void);


  // ============================================================================
  // Name: GetTrainzBuild
  // Desc: Gets the current build number of Trainz. The value returned 
  //       corresponds to the build number you can see in the bottom-right side 
  //       of the main Trainz menu screen.
  // Retn: Returns the current Trainz build number.
  // ============================================================================
  public native int GetTrainzBuild(void);



  // ============================================================================
  // Name: CloneKUID
  // Desc: Creates a new reference to the specified KUID, in the current 
  //       gamescript context. This is used when passing a KUID object from one
  //       context to another.
  // Parm: kuid - The KUID object from the original context.
  // Retn: KUID - An object in the current context representing the source KUID.
  // ============================================================================
  public native KUID CloneKUID(KUID kuid);
  
};


final static class TrainzScript isclass TrainzScriptBase
{
};


