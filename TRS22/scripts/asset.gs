//=============================================================================
// Name: Asset.gs
// Desc: Defines the Asset class, which is used to represent an asset/content
//       piece within script. An Asset may or may not be locally installed
//       and/or available.
//       This file also defines the static AssetCategory class, which lists
//       various asset category strings to aid in searching. For information
//       about how to search for assets in scriupt, see TrainzAssetSearch.gs.
//=============================================================================
include "KUID.gs"
include "StringTable.gs"
include "Soup.gs"
include "KUIDList.gs"
include "Image.gs"
include "AsyncQueryHelper.gs"



//=============================================================================
// Name: Asset
// Desc: Represents a single asset/content piece within script. Each asset can
//       be identified in script by it's KUID (see KUID.gs) or by holding a
//       reference to the Asset itself. Where asset references must be saved
//       between runs they should always be so by their KUID (i.e. never their
//       name, as this is not unique and may change without notice).
//=============================================================================
final game class Asset isclass GSObject
{
  //=============================================================================
  // Name: GetKUID
  // Desc: Gets the KUID of this asset, which is used to identify the asset. See
  //       KUID.gs for more information.
  //=============================================================================
  public native KUID GetKUID(void);


  //=============================================================================
  // Name: GetLocalisedName
  // Desc: Gets the human-readable name of this asset.
  //=============================================================================
  public native string GetLocalisedName(void);


  //=============================================================================
  // Name: GetCreatorName
  // Desc: Returns the creator-name for this asset.
  //=============================================================================
  public native string GetCreatorName(void);


  //=============================================================================
  // Name: IsCreatedByAuran
  // Desc: Returns whether this asset was created by Auran.
  //=============================================================================
  public bool IsCreatedByAuran(void)
  {
    return GetCreatorName() == "Auran";
  }


  //=============================================================================
  // Name: IsCreatedByLocalUser
  // Desc: Returns true if the asset was created by the local player.
  //=============================================================================
  public native bool IsCreatedByLocalUser(void);


  //=============================================================================
  // Name: IsLocal
  // Desc: Returns true if the asset is locally installed
  //=============================================================================
  public native bool IsLocal(void);


  //=============================================================================
  // Name: IsBuiltIn
  // Desc: Returns true if the asset is inside a .ja file.
  //=============================================================================
  public native bool IsBuiltIn(void);


  //=============================================================================
  // Name: IsPayware
  // Desc: Returns true if the asset is payware dlc, regardless of whether the
  //       payware has been purchased or not.
  //=============================================================================
  public native bool IsPayware(void);


  //=============================================================================
  // Name: IsAuthorised
  // Desc: Returns true if the asset is authorised for use, regardless of whether
  //       the asset is payware or not.
  //=============================================================================
  public native bool IsAuthorised(void);


  //=============================================================================
  // Name: IsOnTheDownloadStation
  // Desc: Returns true if this asset is downloadable from the DLS
  //=============================================================================
  public native bool IsOnTheDownloadStation(void);


  //=============================================================================
  // Name: GetLocalisedDescription
  // Desc: Returns the description for this asset in the local language.
  //=============================================================================
  public native string GetLocalisedDescription(void);
  
  
  //=============================================================================
  // Name: GetLocalisedPaywarePrice
  // Desc: Returns the localised pricing string for the payware pack for which
  //       this asset is a featured asset. If this asset is featured in multiple
  //       packs, one of the packs is selected according to implementation-
  //       specific logic. Being authorised on this client installation does not
  //       cause this function to fail.
  // Retn: string - The localised pricing string, or the empty string if this
  //       asset is not purchasable on this Trainz installation. The pricing
  //       string is for display purposes only and is not machine-parseable. Do
  //       not attempt to perform math or sorting logic on the returned string.
  //=============================================================================
  public native string GetLocalisedPaywarePrice(void);


  //=============================================================================
  // Name: CacheConfigSoup
  // Desc: Caches the asset config file for this asset, making it safe to call
  //       any functions that need it (e.g. GetConfigSoupCached,
  //       GetStringTableCached, etc).
  //       Attempts to cache config data for non-local assets will fail, with
  //       AsyncQueryHelper.GetQueryErrorCode() returning ERROR_INVALID_STATE.
  // Retn: AsyncQueryHelper - A query helper through which the caller can be
  //       notified of completion/failure.
  // NOTE: It is not necessary to call this on the Asset parameter passed to
  //       TrainzGameObject.Init(Asset), as that parameter is guaranteed to
  //       already have the config file cached.
  // NOTE: Do not call this function unless you absolutely need this data, as it
  //       will negatively impact performance.
  //
  // For more information about asynchronous queries, see AsyncQueryHelper.gs
  //=============================================================================
  public native AsyncQueryHelper CacheConfigSoup(void);


  //=============================================================================
  // OBSOLETE. Use CacheConfigSoup() and GetConfigSoupCached().
  //=============================================================================
  public native Soup GetConfigSoup(void);


  //=============================================================================
  // Name: GetConfigSoupCached
  // Desc: Gets a script representation (Soup) of this asset's config file. This
  //       will contain all of the data within the config.txt file. See Soup.gs
  //       for more information about the Soup class.
  // Note: Requires the config to be pre-cached (see CacheConfigSoup). Throws an
  //       exception if that isn't complete.
  //=============================================================================
  public native Soup GetConfigSoupCached(void);


  //=============================================================================
  // OBSOLETE. Use CacheConfigSoup() and GetStringTableCached().
  //=============================================================================
  public /*obsolete*/ native StringTable GetStringTable(void);


  //=============================================================================
  // Name: GetStringTableCached
  // Desc: Gets the StringTable for this asset, as defined by the asset config
  //       file. See StringTable.gs for more information.
  // Note: Requires the config to be pre-cached (see CacheConfigSoup). Throws an
  //       exception if that isn't complete.
  //=============================================================================
  public native StringTable GetStringTableCached(void);


  //=============================================================================
  // Name: LookupKUIDTable
  // Desc: Searches this assets config file for a named KUID within it's
  //       kuid-table subcontainer. This is intended for use by this assets
  //       script in order to lookup other dependent assets (such as script
  //       libraries, texture assets, etc).
  // Note: Requires the config to be pre-cached (see CacheConfigSoup).
  //=============================================================================
  public native KUID LookupKUIDTable(string kuidTableAssetName);


  //=============================================================================
  // Name: FindAsset
  // Desc: Similar to LookupKUIDTable, but returns an Asset for the kuid-table
  //       entry, rather than just the KUID.
  // Note: Requires the config to be pre-cached (see CacheConfigSoup).
  //=============================================================================
  public native Asset FindAsset(string kuidTableAssetName);


  //=============================================================================
  // Desc: Obsolete, use GetLocalisedName() instead.
  //=============================================================================
  public obsolete string GetName(void) { return GetLocalisedName(); }


  //=============================================================================
  // Name: GetDependencyList
  // Desc: Returns a list of known dependencies for this asset. This includes
  //       any KUIDs listed in the asset kuid-table, parent assets, required
  //       meshes, bogeys, textures, etc.
  //=============================================================================
  public native KUIDList GetDependencyList(void);


  //=============================================================================
  // Name: SupportsTrainzBuildVersion
  // Desc: Determines whether this asset is built to support the specified 
  //       trainz-build version. This function is used rather than querying the
  //       version number and performing a custom comparison, to ensure future-
  //       proofing and to prevent easy-to-make mistakes with floating point
  //       precision.
  //       This function can be used to determine whether specific newer features
  //       need to be switched off for compatibility reasons.
  // Parm: trainzBuildVersion - A floating point version number (such as 2.9 for
  //       TS2009) which is compared to the 'trainz-build' tag in this asset's
  //       config file.
  // Retn: bool - True if the asset's 'trainz-build' tag is greater than or equal
  //       to the specified version number. If the result cannot be determined
  //       (for example, because the asset data is not locally available) then 
  //       False is returned.
  //=============================================================================
  public native bool SupportsTrainzBuildVersion(float trainzBuildVersion);


  //=============================================================================
  // Name: LoadImage
  // Desc: Loads an Image from the specified image file within this asset.
  // Parm: imagePath - The path of the image file relative to this asset.
  // Retn: Image - The loaded image, or the null value if the image file did
  //       not exist or could not be loaded.
  //=============================================================================
  public native Image LoadImage(string imagePath);


  //=============================================================================
  // Name: IsLocallyModified
  // Desc: Checks the local filesystem to see if this asset has been modified on
  //       the users machine. This may be use in situations where security is of
  //       concern (scripters concerned with security should also look at the
  //       SecurityToken class).
  // Retn: bool - true if the asset has been modifed on the local machine.
  //
  // NOTE: This function will check the file modification dates on each of this
  //       assets files. This is a performance intensive task and should not be
  //       done reguarly.
  //
  //=============================================================================
  public native bool IsLocallyModified();


  //=============================================================================
  // Name: GetInfoURL
  // Desc: Gets the 'info-url' for this asset, so a link can be set up to view
  //       further information about it online.
  // Note: Requires the config to be pre-cached (see CacheConfigSoup).
  //=============================================================================
  public native string GetInfoURL();


  //=============================================================================
  // Name: GetIsFavorite
  // Desc: Returns whether or not this asset is considered a 'favourite' asset
  //       by the user
  //=============================================================================
  public native bool GetIsFavorite();


  //=============================================================================
  // Name: SetIsFavorite
  // Desc: Sets this asset to be considered a 'favourite' asset by the user
  //=============================================================================
  public native void SetIsFavorite(bool isFavorite);


  //=============================================================================
  // Name: GetParent
  // Desc: Returns the 'parent' asset for this asset. An example of this would be
  //       the map a session uses.
  //=============================================================================
  public native Asset GetParent();


  //=============================================================================
  // Name: GetCategoryRegion
  // Desc: Returns the contents of the 'category-region' tag for this asset
  //=============================================================================
  public native string GetCategoryRegion();


  //=============================================================================
  // Name: GetCategoryRegion
  // Desc: Returns a human-readable version of the 'category-region' tag
  //=============================================================================
  public native string GetHumanReadableCategoryRegion();


  //=============================================================================
  // Name: GetCategoryEra
  // Desc: Returns the contents of the 'category-era' tag for this asset
  //=============================================================================
  public native string GetCategoryEra();


  //=============================================================================
  // Name: GetCategoryClass
  // Desc: Returns the contents of the 'category-class' tag for this asset
  //=============================================================================
  public native string GetCategoryClass();


  //=============================================================================
  // Name: GetDateInstalled
  // Desc: Returns a string representing the date this asset was installed. For
  //       non-local assets this will be the date they were last installed or, if
  //       the asset has never been installed, the DLS upload date.
  //=============================================================================
  public native string GetDateInstalled();


  //=============================================================================
  // Name: IsNewlyInstalled
  // Desc: Returns whether this asset is flagged as newly installed. This flag
  //       should be used for display purposes only, to highlight new content in
  //       menus, lists, etc.
  //=============================================================================
  public native bool IsNewlyInstalled();


  //=============================================================================
  // Name: GetIsFaulty
  // Desc: Returns true if this asset is faulty
  //=============================================================================
  public native bool GetIsFaulty();


  //=============================================================================
  // Name: GetIsMissingDependencies
  // Desc: Returns true if this asset is missing dependencies
  //=============================================================================
  public native bool GetIsMissingDependencies();


  //=============================================================================
  // Name: GetHasIncompletePrerequisites
  // Desc: Returns true if this asset is unavailable due to having incomplete
  //       prerequisites. This is currently only possible for session assets but
  //       may be extended at a later date to include other asset types.
  //       Attempts to load a session with incomplete prerequisites will fail.
  //=============================================================================
  public native bool GetHasIncompletePrerequisites();


  //=============================================================================
  // Name: GetSessionRuleData
  // Desc: Returns the rule-data container for a specific asset.
  // Parm: string ruleKUID - string form of KUID (e.g. "<KUID:447264:12345>").
  // Retn: Soup form of rule-data container written by the specified asset.
  // Note: KUID is passed as a string so the reader does not have to have a
  //       dependency on the writer.
  // Note: Requires the config to be pre-cached (see CacheConfigSoup).
  //=============================================================================
  public native Soup GetSessionRuleData(string ruleKUID);


  //=============================================================================
  // Name: IsMemberOfAssetGroup
  // Desc: Returns whether this asset is a member of the specified asset-group
  // Parm: groupKuid - The KUID of the group to test
  //=============================================================================
  public native bool IsMemberOfAssetGroup(KUID groupKuid);


  //=============================================================================
  // Name: HasMatchingAssetGroupsWithinParentGroup
  // Desc: Returns whether this asset and the asset passed are both members of an
  //       asset-group that is a member of the parent group passed. This is
  //       useful for determining compatibility between certain asset types. One
  //       such example is trains and tracks that belong to the same track-gauge.
  // Parm: otherAsset - The other asset to match against
  // Parm: parentGroupKuid - The KUID of the group to test
  // Parm: matchIfEmpty - If true and either asset is not a member of any group
  //       that's a member of the parent group then the function will return true
  //=============================================================================
  public native bool HasMatchingAssetGroupsWithinParentGroup(Asset otherAsset, KUID parentGroupKuid, bool matchIfEmpty);
  public bool HasMatchingAssetGroupsWithinParentGroup(Asset other, KUID parent) { return HasMatchingAssetGroupsWithinParentGroup(other, parent, false); }

};



//=============================================================================
// Name: AssetCategory
// Desc: Defines the standard searchable category codes for assets and objects. 
//       Category codes are used to define 'types' of objects and allow your
//       scripts to search for very specific or very broard types of objects
//       within a route. The codes themselves are derived from asset kind/type,
//       the "category-class" tag, and potentially other config file tags.
//
//       This list should be consulted for all named object and asset searches
//       and the defines referenced directly wherever possible. This ensures 
//       correct validation of your scripts should a type code be updated,
//       become obsolete, etc.
//
//       Cateogory codes may also be combined to narrow your search by using
//       the semicolon (;) character. For example you can search for grass/tree
//       splines by using "Flora;Spline". You can also broaden a search to
//       include multiple category lists using the vertical bar (|) character.
//       Each vertical bar acts as an OR operator on the lists. For example you
//       can search for flora or fauna splines using "Spline;Flora|Spline;Fauna"
//       (i.e. *NOT* "Spline;Flora|Fauna" which would match all flora splines,
//       and any fauna tagged object/spline/etc).
//
//       Content creators can also add custom category codes to their assets
//       via the category-class tag. Such codes are prefixed with the '#'
//       character (e.g. "#CITY"). These may be used freely to allow you to
//       tag and search for assets which may support a specific 3rd party
//       library, feature, etc.
//
//       Note that there may exist other category codes which are not listed
//       here, but use of those is considered unsupported and may break without
//       notice in any future version of Trainz.
//
//=============================================================================
final static class AssetCategory
{
  // Map Object, Track and Spline category codes
  public define string Bridge               = "BRG";
  public define string Building             = "BD";
  public define string Crossing             = "FIXD;CROS";
  public define string Fauna                = "FA";
  public define string FixedTrack           = "FIXD";
  public define string Flora                = "FL";
  public define string Industry             = "IND";
  public define string InterlockingTower    = "IT";
  public define string Junction             = "TO;?WX";
  public define string Mesh                 = "CMP;MESH";
  public define string People               = "PP";
  public define string Road                 = "RD";
  public define string Scenery              = "SY";
  public define string SceneryWithTrack     = "SWT";
  public define string Signal               = "TO;?WA";
  public define string Spline               = "SPLN";
  public define string Track                = "TK";
  public define string Trackmark            = "?WM";
  public define string TrackBridge          = "TK;BRG";
  public define string TrackTunnel          = "TK;TUN";
  public define string TrackObject          = "TO";
  public define string Trigger              = "?WT";
  public define string Tunnel               = "TUN";
  public define string Turntable            = "FIXD;TURN";
  public define string RoadVehicle          = "VE;LND";

  // Train category codes
  public define string Caboose              = "TR;TV;CAB";
  public define string Consist              = "CN";
  public define string Locomotive           = "TR;TV;LOCO";
  public define string MailTrainCar         = "TR;TV;MAIL";
  public define string MonorailVehicle      = "TR;TV;MNR";
  public define string PassengerTrainCar    = "TR;TV;PAX";
  public define string RollingStock         = "TR;TV;ROLL";
  public define string Tram                 = "TR;TV;TRM";  // incl. trolleys, streetcars and other light rail
  public define string TrainCar             = "TR;TV";
  public define string TrainCarDiesel       = "TR;TV;DIES";
  public define string TrainCarElectric     = "TR;TV;ELEC";
  public define string TrainCarSteam        = "TR;TV;STEM";
  public define string TrainCarTender       = "TR;TV;TEND";
  public define string TrainComponent       = "TR;CMP";
  public define string TrainEngine          = "TR;CMP;ESPC";


  // Route and Session category codes
  public define string Region               = "REGN";
  public define string Route                = "RT";
  public define string SaveGame             = "SG";
  public define string Session              = "SS";
  public define string SessionArcade        = "SS;ARCD";
  public define string SessionTutorial      = "SS;TUT";
  public define string TestTrackTest        = "TC";


  // Script type category codes
  public define string AchievementCategory  = "ACHC";
  public define string AchievementGroup     = "ACHG";
  public define string ControlSet           = "CS";
  public define string GameplayMenu         = "GMNU";
  public define string SessionRule          = "RU";
  public define string SessionRuleTemplate  = "RLTM";
  public define string Script               = "SQ";
  public define string ScriptLibrary        = "SLIB";
  public define string ScriptServlet        = "SVLT";


  // Miscellaneous category codes
  public define string Product              = "PROD";
  public define string ProductCategory      = "PRDC";
  public define string DriverCharacter      = "DR";
  public define string DriverCommand        = "SQ;GEN";
  public define string GroundBrush          = "BRSH";
  public define string GroundTexture        = "TX;ENV;GRND";
  public define string HTML                 = "HT";
  public define string Sound                = "SD";
  public define string Texture              = "TX";
  public define string TextureGroup         = "TX;TXGRP";


};


