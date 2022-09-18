//=============================================================================
// File: GameplayMenuBase.gs
// Desc: The TrainzScript base class for gameplay menu assets.
//=============================================================================
include "Library.gs"
include "Constructors.gs"


//=============================================================================
// Name: MPSListing
//=============================================================================
class MPSListing
{
  public KUID     kuid;
  public string   name;
};


//=============================================================================
// Name: GameplayMenuBase
// Desc: The TrainzScript base class for gameplay menu assets.
//=============================================================================
game class GameplayMenuBase isclass TrainzGameObject
{
  //=============================================================================
  // Name: LoadDriverQuickDrive
  // Desc: Loads the Driver module with the supplied map
  // Parm: kuid - the KUID of the map to QuickDrive.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadDriverQuickDrive(KUID kuid);


  //=============================================================================
  // Name: LoadDriverSession
  // Desc: Loads the Driver module with a session
  // Parm: kuid - the KUID of the session to Drive.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadDriverSession(KUID kuid);


  //=============================================================================
  // Name: SetDriverSessionTrain
  // Desc: Sets the desired train to use in the next loaded Driver session. This
  //       currently only affects QuickDrive sessions.
  // Parm: kuid - The KUID of a locomotive or consist the drive in the session
  //=============================================================================
  native void SetDriverSessionTrain(KUID kuid);


  //=============================================================================
  // Name: LoadSurveyorNew
  // Desc: Loads the Surveyor module with a new map.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadSurveyorNew();


  //=============================================================================
  // Name: LoadSurveyorMap
  // Desc: Loads the Surveyor module with a map.
  // Parm: kuid - the KUID of the map to load.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadSurveyorMap(KUID kuid);


  //=============================================================================
  // Name: LoadSurveyorMapNewSession
  // Desc: Loads the Surveyor module with a map, to start a new session.
  // Parm: kuid - the KUID of the session to load.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadSurveyorMapNewSession(KUID kuid);


  //=============================================================================
  // Name: LoadSurveyorSession
  // Desc: Loads the Surveyor module with a session.
  // Parm: kuid - the KUID of the session to load.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadSurveyorSession(KUID kuid);


  //=============================================================================
  // Name: LoadSurveyorSessionClone
  // Desc: Clones a session and it's dependent route and opens the result for
  //       editing in Surveyor.
  // Parm: kuid - the KUID of the session to load.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadSurveyorSessionClone(KUID sessionKuid);


  //=============================================================================
  // Name: LoadSurveyorMultiplayer
  // Desc: Loads an existing known MPS route/session in Surveyor. Will fail if
  //       the asset is not known, is not a valid MPS asset, or if the local
  //       player doesn't have access to the asset. No failure details are given.
  //=============================================================================
  native bool LoadSurveyorMultiplayer(KUID kuid);


  //=============================================================================
  // Name: LoadRailyard
  // Desc: Loads the Railyard module, optionally displaying the specified vehicle
  // Parm: KUID - the KUID of the vehicle to select in Railyard. May be null.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadRailyard(KUID kuid);


  //=============================================================================
  // Name: LoadMenu
  // Desc: Loads the specified menu asset
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadMenu(KUID menuAsset);


  //=============================================================================
  // Name: DeleteMap
  // Desc: Deletes a specific map, and all sessions that use it
  // Parm: theMap - the KUID of the route to delete
  // Retn: bool - True if successfully deleted.
  //=============================================================================    
  native bool DeleteMap(KUID theMap);


  //=============================================================================
  // Name: DeleteSession
  // Desc: Deletes a specific session
  // Parm: theSession - the session to delete
  // Retn: bool - True if successfully deleted.
  //=============================================================================    
  native bool DeleteSession(KUID theSession);


  //=============================================================================
  // Name: DeleteSurveyorMultiplayerRoute
  // Desc: Deletes an existing known MPS route, if the player has permission
  //=============================================================================
  native bool DeleteSurveyorMultiplayerRoute(KUID kuid);


  //=============================================================================
  // Name: AbandonSurveyorMultiplayer
  // Desc: Causes this player to abandon an MPS route
  //=============================================================================
  native bool AbandonSurveyorMultiplayerRoute(KUID kuid);


  //=============================================================================
  // Name: ListSurveyorMultiplayerRoutes
  // Desc: Returns the list of collaborative routes that the current player has
  //       access to. Note that there is no guarantee that these assets are
  //       locally installed, or that entries even exists for them in the Trainz
  //       Asset Database.
  //       This function must be called at least once to trigger a server query.
  //       Native code will post a "GameplayMenu","MPSListResult" message to
  //       script upon query completion, or when an update is registered.
  //=============================================================================
  native KUID[] ListSurveyorMultiplayerRoutes();


  //=============================================================================
  // Name: BeginAssetRestriction
  // Desc: Queries the asset restrictions for the given Session asset in 
  //       preparation for using the following functions or entering a
  //       Multiplayer-capable Session.
  // Parm: sessionKUID - The KUID of the Session Asset to query.
  //=============================================================================
  public native void BeginAssetRestriction(KUID sessionKUID);


  //=============================================================================
  // Name: EndAssetRestriction
  // Desc: Removes any asset restrictions applied by BeginAssetRestriction().
  //       Note that this affects the state of this GameplayMenu object and
  //       has no effect on any driver session that may currently be in progress.
  //=============================================================================
  public native void EndAssetRestriction(void);


  //=============================================================================
  // Name: IsAssetRestrictionBusy
  // Desc: Determined whether the Asset Restriction system is currently busy.
  //       Calls made to these functions while the system is busy will fail.
  // Retn: bool - True if the system is currently busy.
  //=============================================================================
  public native bool IsAssetRestrictionBusy(void);


  //=============================================================================
  // Name: DoesSessionContainUnofficialAssets
  // Desc: Called after BeginAssetRestriction() to determine whether the
  //       Session has any depedencies which are not built-in and not sourced 
  //       from the Download Station. A session containing unofficial assets 
  //       can not be used as a Multiplayer Session.
  //=============================================================================
  public native bool DoesSessionContainUnofficialAssets(void);


  //=============================================================================
  // Name: DoesSessionContainModifiedAssets
  // Desc: Called after BeginAssetRestriction() to determine whether the
  //       Session has any assets which have been locally modified and need to be 
  //       reverted.
  //=============================================================================
  public native bool DoesSessionContainModifiedAssets(void);


  //=============================================================================
  // Name: DoesSessionContainMissingAssets
  // Desc: Called after BeginAssetRestriction() to determine whether the
  //       Session has any assets which are missing and need to be downloaded.
  //=============================================================================
  public native bool DoesSessionContainMissingAssets(void);


  //=============================================================================
  // Name: ShowSessionUnofficialAssets
  // Desc: Called after BeginAssetRestriction() to display the list of unofficial
  //       assets used by the session. This will show the assets in a list style
  //       that matches the prompt dialogs used by RevertSessionModifiedAssets()
  //       and DownloadSessionMissingAssets().
  //=============================================================================
  public native void ShowSessionUnofficialAssets(void);


  //=============================================================================
  // Name: RevertSessionModifiedAssets
  // Desc: Called after BeginAssetRestriction() to revert any local modifications
  //       to assets. In some cases, this may cause all local copies of the asset
  //       to be deleted. This function will query the user prior to making any
  //       changes. The caller should use IsAssetRestrictionBusy() to wait for
  //       this operation to complete, then should use the above functions to
  //       ensure that the operation had the desired effects.
  //=============================================================================
  public native void RevertSessionModifiedAssets(void);


  //=============================================================================
  // Name: DownloadSessionMissingAssets
  // Desc: Called after BeginAssetRestriction() to download any missing assets
  //       from the Download Station. This function will query the user prior to
  //       making any changes. The caller should use IsAssetRestrictionBusy() to
  //       wait for this operation to complete, then should use the above 
  //       functions to ensure that the operation had the desired effects.
  //=============================================================================
  public native void DownloadSessionMissingAssets(void);
  
  
  //=============================================================================
  // Obsolete - Use Interface.ShowMessageBox()
  obsolete public native void ShowPrompt(string localisedPromptText, string okayScriptMessage, string cancelScriptMessage);

};


