//=============================================================================
// File: GameplayMenuBase.gs
// Desc: The TrainzScript base class for gameplay menu assets.
//=============================================================================
include "Library.gs"
include "Constructors.gs"




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
  // Name: LoadDriverSavedSession
  // Desc: INTERNAL USE ONLY. DO NOT USE! This function will not be maintained in
  //       future versions of Trainz.
  //=============================================================================
  native bool LoadDriverSavedSession(string theSavedSession);


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
  // Name: LoadRailyard
  // Desc: Loads the Railyard module, optionally displaying the specified 
  //       vehicle.
  // Parm: KUID - the KUID of the vehicle to select in Railyard. May be null.
  // Retn: bool - True on success. False if something failed.
  //=============================================================================
  native bool LoadRailyard(KUID kuid);


  //=============================================================================
  // Name: GetSavedSessionInfo
  // Desc: INTERNAL USE ONLY. DO NOT USE! This function will not be maintained in
  //       future versions of Trainz.
  //=============================================================================
  native Soup GetSavedSessionInfo();


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
  // Name: DeleteSavedSession
  // Desc: INTERNAL USE ONLY. DO NOT USE! This function will not be maintained in
  //       future versions of Trainz.
  //=============================================================================
  native bool DeleteSavedSession(string theSavedSession);




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

};


