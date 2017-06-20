//
// asset.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "KUID.gs"
include "StringTable.gs"
include "Soup.gs"
include "KUIDList.gs"
include "Image.gs"


//! An asset interface class. 
//
// Assets have a KUID, name, <l PropertyObject  configuration data> and <l StringTable  string table>.
// Various interface methods are provided to allow access to basic asset information.
//
// See Also:
//     KUID, KUIDList, TrainzGameObject::GetAsset(), ProductFilter, ProductQueue, StringTable
//
final game class Asset isclass GSObject
{
  //! Gets the KUID of this asset.
  //
  // Returns:
  //     Returns the KUID of this asset.
  //
  public native KUID GetKUID(void);


  //! Gets the human-readable name of this asset.
  //
  // Returns:
  //     Returns the name of this asset that is user-friendly and readable.
  //
  public native string GetLocalisedName(void);


  // ============================================================================
  // Name: GetCreatorName
  // Desc: Returns the creator-name for this asset.
  // ============================================================================
  public native string GetCreatorName(void);


  // ============================================================================
  // Name: IsCreatedByAuran
  // Desc: Returns true if the asset was created by Auran.
  // ============================================================================
  public bool IsCreatedByAuran(void)
  {
    return GetCreatorName() == "Auran";
  }


  // ============================================================================
  // Name: IsCreatedByLocalUser
  // Desc: Returns true if the asset was created by the local player.
  // ============================================================================
  public native bool IsCreatedByLocalUser(void);


  // ============================================================================
  // Name: IsLocal
  // Desc: Returns true if the asset is locally installed
  // ============================================================================
  public native bool IsLocal(void);


  // ============================================================================
  // Name: IsBuiltIn
  // Desc: Returns true if the asset is inside a .ja file.
  // ============================================================================
  public native bool IsBuiltIn(void);


  // ============================================================================
  // Name: IsPayware
  // Desc: Returns true if the asset is payware dlc, regardless of whether the
  //       payware has been purchased or not.
  // ============================================================================
  public native bool IsPayware(void);


  // ============================================================================
  // Name: IsAuthorised
  // Desc: Returns true if the asset is authorised for use, regardless of whether
  //       the asset is payware or not.
  // ============================================================================
  public native bool IsAuthorised(void);


  //=============================================================================
  // Name: IsOnTheDownloadStation
  // Desc: Returns true if this asset is downloadable from the DLS
  //=============================================================================
  public native bool IsOnTheDownloadStation(void);


  // ============================================================================
  // Name: GetLocalisedDescription
  // Desc: Returns the description for this asset in the local language.
  // ============================================================================
  public native string GetLocalisedDescription(void);
  
  
  // ============================================================================
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
  // ============================================================================
  public native string GetLocalisedPaywarePrice(void);


  // ============================================================================
  //! Gets the KUID of the named item in this asset's <b kuid-table>.
  //
  // In the configuration of an asset, there might be a <b kuid-table> container section that defines
  // convenient names to correspond to the KUIDs of other assets.  
  //
  // For example, tag in an asset's <b kuid-table> could be defined as having the name "coal" and a 
  // KUID of <n &lt;%KUID:44179:60013&gt;>, which is the KUID for the coal product type.  This means
  // you can now use <n "coal"> for the <i kuidTableAssetName> parameter in this method and it will
  // return the associated KUID.
  //
  // Note that this method will only succeed if the asset this object refers to has a matching
  // entry in its <b kuid-table> and won't work on other assets that don't have that entry.
  //
  // Param:  kuidTableAssetName  Name of the item in the <b kuid-table> of this Asset to get the 
  //                             KUID of.
  //
  // Returns:
  //     Returns the named KUID from this asset's <b kuid-table> if successful, null otherwise.
  //
  public native KUID LookupKUIDTable(string kuidTableAssetName);

  //! Gets the string table of this asset.
  //
  // An asset can have a StringTable in its configuration that consists of a collection of named
  // string elements.  The returned StringTable object provides methods to easily access these 
  // strings.
  //
  // Returns:
  //     Returns the StringTable of this asset.
  //
  public native StringTable GetStringTable(void);

  //! Gets the soup configuration database of this asset.
  //
  // Returns:
  //     Returns the Soup object that defines the configuration data for this asset.
  //
  public native Soup GetConfigSoup(void);

  //! Finds an asset by its name in the <b kuid-table> container section of this asset's configuration.
  //
  // Note:
  //     This method performs the equivalent of <l World::FindAsset>(<l Asset::LookupKUIDTable>(name)).
  //
  // Param:  kuidTableAssetName  Name of the asset to get a handle to as defined in the 
  //                             <b kuid-table> of this asset.
  //
  // Returns:
  //     Returns the asset of named by <i kuidTableAssetName> if possible, null otherwise.
  //
  public native Asset FindAsset(string kuidTableAssetName);


  //! Obsolete, use GetLocalisedName() instead.
  public string GetName(void)
  {
    return GetLocalisedName();
  }

  //! Get a list of the known dependencies for this asset.
  //
  // This method partially relies on the information in the asset's <b kuid-table> (located in the
  // it configuration via CCP)).  If this information is not correct, then the list returned by this
  // function won't be correct.
  //
  // Returns:
  //     Returns a list containing the KUIDs from the <b kuid-table> section of this asset's 
  //     configuration.
  //
  public native KUIDList GetDependencyList(void);



  // ============================================================================
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
  // ============================================================================
  public native bool SupportsTrainzBuildVersion(float trainzBuildVersion);


  // ============================================================================
  // Name: LoadImage
  // Desc: Loads an Image from the specified image file within this asset.
  // Parm: imagePath - The path of the image file relative to this asset.
  // Retn: Image - The loaded image, or the null value if the image file did
  //       not exist or could not be loaded.
  // ============================================================================
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


  // ============================================================================
  // Name: GetInfoURL
  // Desc: Gets the 'info-url' for this asset, so a link can be set up to view
  //       further information about it online.
  // ============================================================================
  public native string GetInfoURL();


  // ============================================================================
  // Name: GetIsFavorite
  // Desc: Returns whether or not this asset is considered a 'favourite' asset
  //       by the user
  // ============================================================================
  public native bool GetIsFavorite();


  // ============================================================================
  // Name: SetIsFavorite
  // Desc: Sets this asset to be considered a 'favourite' asset by the user
  // ============================================================================
  public native void SetIsFavorite(bool isFavorite);


  // ============================================================================
  // Name: GetParent
  // Desc: Returns the 'parent' asset for this asset. An example of this would be
  //       the map a session uses.
  // ============================================================================
  public native Asset GetParent();


  // ============================================================================
  // Name: GetCategoryRegion
  // Desc: Returns the contents of the 'category-region' tag for this asset
  // ============================================================================
  public native string GetCategoryRegion();


  // ============================================================================
  // Name: GetCategoryRegion
  // Desc: Returns a human-readable version of the 'category-region' tag
  // ============================================================================
  public native string GetHumanReadableCategoryRegion();


  // ============================================================================
  // Name: GetCategoryEra
  // Desc: Returns the contents of the 'category-era' tag for this asset
  // ============================================================================
  public native string GetCategoryEra();


  // ============================================================================
  // Name: GetCategoryClass
  // Desc: Returns the contents of the 'category-class' tag for this asset
  // ============================================================================
  public native string GetCategoryClass();


  // ============================================================================
  // Name: GetDateInstalled
  // Desc: Returns a string representing the date this asset was installed. For
  //       non-local assets this will be the date they were last installed or, if
  //       the asset has never been installed, the DLS upload date.
  // ============================================================================
  public native string GetDateInstalled();


  // ============================================================================
  // Name: IsNewlyInstalled
  // Desc: Returns whether this asset is flagged as newly installed. This flag
  //       should be used for display purposes only, to highlight new content in
  //       menus, lists, etc.
  // ============================================================================
  public native bool IsNewlyInstalled();


  // ============================================================================
  // Name: GetIsFaulty
  // Desc: Returns true if this asset is faulty
  // ============================================================================
  public native bool GetIsFaulty();


  // ============================================================================
  // Name: GetIsMissingDependencies
  // Desc: Returns true if this asset is missing dependencies
  // ============================================================================
  public native bool GetIsMissingDependencies();


  // ============================================================================
  // Name: GetHasIncompletePrerequisites
  // Desc: Returns true if this asset is unavailable due to having incomplete
  //       prerequisites. This is currently only possible for session assets but
  //       may be extended at a later date to include other asset types.
  //       Attempts to load a session with incomplete prerequisites will fail.
  // ============================================================================
  public native bool GetHasIncompletePrerequisites();


  // ============================================================================
  // Name: GetSessionRuleData
  // Desc: Returns the rule-data container for a specific asset.
  // Parm: string ruleKUID - string form of KUID (e.g. "<KUID:447264:12345>").
  // Retn: Soup form of rule-data container written by the specified asset.
  // NOTE: KUID is passed as a string so the reader does not have to have a
  //       dependency on the writer.
  // ============================================================================
  public native Soup GetSessionRuleData(string ruleKUID);


  // ============================================================================
  // Name: IsMemberOfAssetGroup
  // Desc: Returns whether this asset is a member of the specified asset-group
  // Parm: groupKuid - The KUID of the group to test
  // ============================================================================
  public native bool IsMemberOfAssetGroup(KUID groupKuid);


  // ============================================================================
  // Name: HasMatchingAssetGroupsWithinParentGroup
  // Desc: Returns whether this asset and the asset passed are both members of an
  //       asset-group that is a member of the parent group passed. This is
  //       useful for determining compatibility between certain asset types. One
  //       such example is trains and tracks that belong to the same track-gauge.
  // Parm: otherAsset - The other asset to match against
  // Parm: parentGroupKuid - The KUID of the group to test
  // Parm: matchIfEmpty - If true and either asset is not a member of any group
  //       that's a member of the parent group then the function will return true
  // ============================================================================
  public native bool HasMatchingAssetGroupsWithinParentGroup(Asset otherAsset, KUID parentGroupKuid, bool matchIfEmpty);
  public bool HasMatchingAssetGroupsWithinParentGroup(Asset other, KUID parent) { return HasMatchingAssetGroupsWithinParentGroup(other, parent, false); }
};


