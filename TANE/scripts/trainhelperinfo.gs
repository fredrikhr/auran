//=============================================================================
// File: TrainHelperInfo.gs
// Desc: Defines a number of HTML property handlers for defining and matching
//       trains in a number of different ways.
//       This file includes several classes, as follows (in order):
//
//     * TrainHelperInfoListBase - The base class for all of the list handlers
//       defined here. It performs all of the shared HTML formatting.
//     * SpecificVehiclesInfo - Manages a list of traincars in the world.
//     * AssetTypeInfo - The base class used for the list handlers defined
//       here which use an asset list. This provides the shared asset searching
//       and displaying functionality, to avoid code duplication.
//     * VehicleTypesInfo - Manages a list of traincar assets.
//     * DriversInfo - Manages a list of driver character assets.
//     * TrainHelperInfo - Manages an instance of each of the above.
//       See the comments on each class header for further information.
//
//=============================================================================
include "Constructors.gs"
include "Soup.gs"
include "Common.gs"
include "HTMLPropertyHandler.gs"
include "TrainzAssetSearch.gs"



//=============================================================================
// Name: TrainHelperInfoListBase
// Desc: Base class for the various property handlers defined in this file.
//       This class performs the shared HTML functionality to make it easier
//       to update the visuals if needed, but it is not usable on it's own. To
//       make use of this class you must inherit from it, and then fill in the
//       missing list functions, and handling of the remove link.
//=============================================================================
class TrainHelperInfoListBase isclass HTMLPropertyHandler
{
  public string   typeName = "";                      // Core string-table suffix for HTML heading
  Browser         m_browser;                          // The browser being used to display this handler.

  public void SetTypeName(string a_typeName) { typeName = a_typeName; }
  int GetImageWidth() { return 64; }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Defines the function prototype for the common vehicle matching function
  //       implemented on each child handler within this file. This must be
  //       overridden by child classes to have the object match anything.
  //=============================================================================
  public bool DoesMatch(Vehicle vehicle) { return false; }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Defines the function prototype for the common train matching function
  //       implemented on each child handler within this file. This must be
  //       overridden by child classes to have the object match anything.
  //=============================================================================
  public bool DoesMatch(Train train) { return false; }


  //=============================================================================
  // Name: GetListItemCount
  // Desc: Returns the number of items currently in the list.
  //=============================================================================
  int GetListItemCount() { return 0; }


  //=============================================================================
  // Name: GetColumnData
  // Desc: Returns the column data for the row index passed. This must must be
  //       overridden to include an icon kuid, an optional asset name for the
  //       icon tooltip and a localised name. This is not intended for generic
  //       use and customisation of the data is not supported.
  //=============================================================================
  string[] GetColumnData(int rowIndex) { return new string[3]; }


  //=============================================================================
  // Name: GetDescriptionHTML
  // Desc: Returns the HTML description of this property handlers current config.
  //=============================================================================
  public string GetDescriptionHTML(void)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();
    int tableHeight = ((GetListItemCount() + 1) * 40) + 32;

    string htmlPage;

    // Print page title
    htmlPage = htmlPage + "<br>" + HTMLWindow.MakeBold(coreStrings.GetString("interface-helper-" + typeName)) + "<br>";

    htmlPage = htmlPage + "<table cellpadding=0 cellspacing=0 width=90%><tr><td>";
    htmlPage = htmlPage + "<trainz-object style=browser id='" + GetPrefix() + "list' width=100% height=" + tableHeight + "></trainz-object>";
    htmlPage = htmlPage + "</td></tr></table>";

    return htmlPage;
  }


  //=============================================================================
  // Name: GetInternalListHTML
  // Desc: Returns the HTML for the internal item list.
  //=============================================================================
  public string GetInternalListHTML(void)
  {
    Asset coreAsset = Constructors.GetTrainzAsset();
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string kuidImgRemoveString = coreAsset.LookupKUIDTable("imgRemove").GetHTMLString();
    string kuidImgAddString = coreAsset.LookupKUIDTable("imgAdd").GetHTMLString();

    int itemCount = GetListItemCount();
    int imgW = GetImageWidth();

    string htmlPage = "<html><body>";

    // Print column headings
    htmlPage = htmlPage + HTMLWindow.StartTable("cellpadding=2 cellspacing=2 bordercolor=#00000059 width=100%") + HTMLWindow.StartRow("bgcolor=#00000059") +
                          HTMLWindow.StartCell("") + coreStrings.GetString("interface-helper-col1-" + typeName) + HTMLWindow.EndCell() +
                          HTMLWindow.StartCell("") + coreStrings.GetString("interface-helper-col2-" + typeName) + HTMLWindow.EndCell() +
                          HTMLWindow.StartCell("") + HTMLWindow.EndCell() + HTMLWindow.EndRow();

    // Print column data
    int i;
    for (i = 0; i < itemCount; ++i)
    {
      string[] columData = GetColumnData(i);

      // Each entry has 3 columns: an icon, localised name, and a remove link.
      string column1, column2, column3;

      if (columData[0] != "")
        column1 = "<td width=20%><img kuid='" + columData[0] + "' width=" + imgW + " height=32 tooltip='" + columData[1] + "'></td>";
      else
        column1 = "<td width=20%>&nbsp;</td>";
      column2 = "<td width=60%>" + BrowserInterface.Quote(columData[2]) + "</td>";
      column3 = "<td width=20%>" + HREF("delete/" + (string)i) + HTMLWindow.MakeImage(kuidImgRemoveString, true, 32, 32) + "</a></td>";

      string bgColor = "";
      if (i & 1)
        bgColor = "bgcolor=#00000029";

      htmlPage = htmlPage + HTMLWindow.StartRow(bgColor) + column1 + column2 + column3 + HTMLWindow.EndRow();
    }

    // Create row for adding new vehicles
    htmlPage = htmlPage + HTMLWindow.StartRow("bgcolor=#00000059") +
                          HTMLWindow.MakeCell("", "width=20%") +
                          HTMLWindow.MakeCell("", "width=60%") +
                          HTMLWindow.MakeCell(HREF("add") + HTMLWindow.MakeImage(kuidImgAddString, true, 32, 32) + HTMLWindow.EndLink(), "width=20%") + HTMLWindow.EndRow();


    htmlPage = htmlPage + HTMLWindow.EndTable() + "</body></html>";

    return htmlPage;
  }


  //=============================================================================
  // Name: RefreshBrowser
  // Desc: Call made from PropertyObject to refresh the HTML in this handler.
  //       Overridden so we can copy the browser ref and trigger manual refreshes
  //       later on as object searches complete.
  //=============================================================================
  public void RefreshBrowser(Browser browser)
  {
    inherited(browser);

    m_browser = browser;

    if (m_browser)
      m_browser.SetElementProperty(GetPrefix() + "list", "html", GetInternalListHTML());
  }


  //=============================================================================
  // Name: GetPropertyName
  // Desc: Returns a localised display name for the property passed.
  //=============================================================================
  public string GetPropertyName(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "add") or (tokens[0] == "allow") or (tokens[0] == "delete"))
      return coreStrings.GetString("interface-helper-generic-name-" + tokens[0]);

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Returns a localised description of the property passed.
  //=============================================================================
  public string GetPropertyDescription(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "add") or (tokens[0] == "allow") or (tokens[0] == "delete"))
      return coreStrings.GetString("interface-helper-generic-desc-" + tokens[0]);

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the type for the named property.
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "allow")
      return "link";

    // It's up to child classes to define the list type for the 'add' property
    if (tokens[0] == "add")
      Interface.Exception("TrainHelperInfoListBase.GetPropertyType> Missing list property type");

    if (tokens[0] == "delete")
      return "link";

    return inherited(propertyID);
  }

};




//=============================================================================
// Name: SpecificVehiclesInfo
// Desc: A HTML property handler implementation that allows a list of vehicles
//       to be configured, rather than just a single item. This can then be
//       used as a filter by session rules etc, to match actions against trains
//       in a number of different ways (see the DoesMatch* function comments).
//=============================================================================
class SpecificVehiclesInfo isclass TrainHelperInfoListBase
{
  GameObjectID[]  m_vehicleIDs = new GameObjectID[0]; // The IDs of each configured vehicle
  string[]        m_vehicleNames = new string[0];     // The localised names of each configured vehicle
  KUID[]          m_vehicleKuids = new KUID[0];       // The KUID of each configured vehicle (may be null)

  AsyncObjectSearchResult[] m_objectSearches;         // Active object searches. These are just used to
                                                      // to look up vehicle KUIDs for the list display.

  string[]        itemsList = new string[0];          // Obsolete - Do not use

  int GetListItemCount() { return m_vehicleIDs.size(); }

  // Forward declatations for various matching functions. See the comments on
  // each function implementation for an explanation of what they do.
  public bool DoesMatch(Vehicle vehicle);
  public bool DoesMatch(Train train);
  public bool DoesMatchAnd(Train train);
  public bool DoesMatchAndExclude(Train train);
  public bool DoesMatchOrdered(Train train);

  void FindDisplayDataForVehicle(GameObjectID id);

  public void DebugLog();

  obsolete Vehicle GetVehicle(string vehicleName) { return cast<Vehicle>(Router.GetGameObject(vehicleName)); }


  //=============================================================================
  // Name: GetColumnData
  // Desc: Returns the column data for the row index passed. See base class for
  //       more information.
  //=============================================================================
  string[] GetColumnData(int rowIndex)
  {
    string[] data = new string[3];

    if (m_vehicleKuids[rowIndex])
    {
      Asset vehAsset = World.FindAsset(m_vehicleKuids[rowIndex]);
      if (vehAsset)
      {
        data[0] = m_vehicleKuids[rowIndex].GetHTMLString();
        data[1] = vehAsset.GetLocalisedName();
      }
    }

    data[2] = m_vehicleNames[rowIndex];

    return data;
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the type for the named property.
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add")
      return "map-object,TV";

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of a property.
  //=============================================================================
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add" and value.GetType() == PropertyValue.OBJECT_TYPE)
    {
      GameObjectID id = cast<GameObjectID>(value.AsObject());
      if (id)
      {
        // Don't allow duplicates
        int i;
        for (i = 0; i < m_vehicleIDs.size(); ++i)
          if (m_vehicleIDs[i].DoesMatch(id))
            return;

        int index = m_vehicleIDs.size();

        m_vehicleIDs[index] = id;
        m_vehicleNames[index] = value.AsString();
        m_vehicleKuids[index] = null;

        FindDisplayDataForVehicle(m_vehicleIDs[index]);
      }

      return;
    }

    if (tokens[0] == "delete" and value.GetType() == PropertyValue.NULL_TYPE)
    {
      int index = Str.ToInt(tokens[1]);
      m_vehicleIDs[index, index + 1] = null;
      m_vehicleNames[index, index + 1] = null;
      m_vehicleKuids[index, index + 1] = null;
      return;
    }

    inherited(propertyID, value);
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Saves the properties of this item to a soup and returns it.
  //=============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();

    Soup vehicleSoup = Constructors.NewSoup();
    int i;
    for (i = 0; i < m_vehicleIDs.size(); ++i)
    {
      vehicleSoup.SetNamedTag("vehicle-" + i, m_vehicleIDs[i]);
      vehicleSoup.SetNamedTag("name-" + i, m_vehicleNames[i]);
      if (m_vehicleKuids[i])
        vehicleSoup.SetNamedTag("asset-" + i, m_vehicleKuids[i]);
    }

    soup.SetNamedSoup(Prop("vehicle-list"), vehicleSoup);

    return soup;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Loads this items state from a Soup previously created by GetProperties
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    if (soup.GetIndexForNamedTag(Prop("itemslist")) != -1)
    {
      // Legacy support, load from old style data
      Soup itemsSoup = soup.GetNamedSoup(Prop("itemslist"));

      int i;
      for (i = 0; i < itemsSoup.CountTags(); ++i)
      {
        string vehicleName = itemsSoup.GetNamedTag((string)i);

        Vehicle vehicle = GetVehicle(vehicleName);
        if (!vehicle)
        {
          Interface.Log("SpecificVehiclesInfo.SetProperties> Not adding vehicle '" + vehicleName + "' as it does not exist");
          continue;
        }

        int index = m_vehicleIDs.size();

        m_vehicleIDs[index] = vehicle.GetGameObjectID();
        m_vehicleNames[index] = vehicle.GetLocalisedName();
        m_vehicleKuids[index] = vehicle.GetAsset().GetKUID();
      }
    }
    else
    {
      Soup vehicleSoup = soup.GetNamedSoup(Prop("vehicle-list"));
      while (true)
      {
        int index = m_vehicleIDs.size();

        GameObjectID id = vehicleSoup.GetNamedTagAsGameObjectID("vehicle-" + index);
        if (!id)
          break;

        m_vehicleIDs[index] = id;
        m_vehicleNames[index] = vehicleSoup.GetNamedTag("name-" + index);
        m_vehicleKuids[index] = vehicleSoup.GetNamedTagAsKUID("asset-" + index);

        // Trigger a display data lookup on load, as vehicle names may change
        FindDisplayDataForVehicle(m_vehicleIDs[index]);
      }
    }

  }

  
  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the vehicle passed is configured within this handler.
  //=============================================================================
  public bool DoesMatch(Vehicle vehicle)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (itemsList.size() == 0)
      return true;

    GameObjectID vehicleID = vehicle.GetGameObjectID();

    int j;
    for (j = 0; j < m_vehicleIDs.size(); ++j)
    {
      if (vehicleID.DoesMatch(m_vehicleIDs[j]))
        return true;
    }
    
    // Failed to find the vehicle in the configure list, return false
    return false;
  }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true if 'train' contains at least one of the
  //       vehicles that this handler specifies, or if this handler is
  //       empty/unconfigured.
  //=============================================================================
  public bool DoesMatch(Train train)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (m_vehicleIDs.size() == 0)
      return true;

    if (!train)
      return false;

    Vehicle[] vehicles = train.GetVehicles();

    int i;
    for (i = 0; i < vehicles.size(); ++i)
    {
      GameObjectID vehicleID = vehicles[i].GetGameObjectID();

      int j;
      for (j = 0; j < m_vehicleIDs.size(); ++j)
      {
        if (vehicleID.DoesMatch(m_vehicleIDs[j]))
          return true;
      }
    }

    // No vehicles from the train were found in this handler
    return false;
  }


  //=============================================================================
  // Name: DoesMatchAnd
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true only if every vehicle specified by this
  //       handler exists in the train passed. Excess vehicles in the train will
  //       not affect the result.
  //=============================================================================
  public bool DoesMatchAnd(Train train)
  {
    if (!train)
      return false;

    Vehicle[] vehicles = train.GetVehicles();

    int i;
    for (i = 0; i < m_vehicleIDs.size(); ++i)
    {
      bool bFoundVehicleInTrain = false;

      int j;
      for (j = 0; j < vehicles.size() and !bFoundVehicleInTrain; ++j)
      {
        GameObjectID vehicleID = vehicles[j].GetGameObjectID();
        if (m_vehicleIDs[i].DoesMatch(vehicleID))
          bFoundVehicleInTrain = true;
      }

      // If this vehicle does not exist in the train, return false
      if (!bFoundVehicleInTrain)
        return false;
    }

    // Found every vehicle (or no vehicles specified), return true
    return true;
  }


  //=============================================================================
  // Name: DoesMatchAndExclude
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true only if this handler and the train have
  //       the exact same set of vehicles. Any vehicle that exists in one list
  //       and not the other will prevent a match. Ordering is not relevant.
  //=============================================================================
  public bool DoesMatchAndExclude(Train train)
  {
    if (!train)
      return false;

    // We require an exact match, so can early out if there's a size difference
    if (train.GetVehicles().size() != m_vehicleIDs.size())
      return false;

    // Avoid code duplication by using the other function to test for vehicles not in this handler
    if (!DoesMatchAnd(train))
      return false;

    // Every vehicle in the train exists in the handler, and the size of each list
    // matches (i.e. we have no extra trains in the handler), so there's no need
    // to check back the other way. Return a match.
    return true;
  }


  // This function had a typo in it's name for years
  public obsolete bool DoesMatchAndExlcude(Train train) { return DoesMatchAndExclude(train); }


  //=============================================================================
  // Name: DoesMatchOrdered
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true only if this handler and the train have
  //       the exact same set of vehicles, and those vehicles are in the exact
  //       same order (or exactly reversed order).
  // NOTE: As with the other variants this function will always return true if
  //       the handler is empty/unconfigured.
  //=============================================================================
  public bool DoesMatchOrdered(Train train)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (m_vehicleIDs.size() == 0)
      return true;

    Vehicle[] vehicles = train.GetVehicles();

    // We require an exact match, so can early out if there's a size difference
    if (train.GetVehicles().size() != m_vehicleIDs.size())
      return false;

    bool bHasForwardMatch = true;
    bool bHasReverseMatch = true;

    int i;
    for (i = 0; i < vehicles.size(); ++i)
    {
      GameObjectID vehicleID = vehicles[i].GetGameObjectID();

      if (!m_vehicleIDs[i].DoesMatch(vehicleID))
        bHasForwardMatch = false;

      if (!m_vehicleIDs[m_vehicleIDs.size() - i - 1].DoesMatch(vehicleID))
        bHasReverseMatch = false;
    }

    return bHasForwardMatch or bHasReverseMatch;
  }


  //=============================================================================
  // Name: FindDisplayDataForVehicle
  // Desc: Attempts to find a vehicle using it's GameObjectID, then cache the
  //       list display data for it.
  //=============================================================================
  void FindDisplayDataForVehicle(GameObjectID id)
  {
    if (!m_objectSearches)
    {
      AddHandler(me, "ObjectSearch", "AsyncLoadComplete", "OnAsyncSearchResult");
      m_objectSearches = new AsyncObjectSearchResult[0];

      // We'll also need soon later, and here's a good a place as any to add it
      AddHandler(me, "SpecificVehiclesInfo", "PropertyBrowserRefresh", "OnPropertyBrowserRefresh");
    }

    AsyncObjectSearchResult newSearch = World.GetGameObjectByID(id);
    Sniff(newSearch, "ObjectSearch", "AsyncResult", true);

    m_objectSearches[m_objectSearches.size()] = newSearch;
  }


  //=============================================================================
  // Name: UpdateDisplayDataForVehicle
  // Desc: Helper function to set the internal name and KUID for a vehicle. This
  //       is for display purposes only, the handler can run without this data.
  //=============================================================================
  void UpdateDisplayDataForVehicle(Vehicle vehicle)
  {
    if (!vehicle)
      return;

    int i;
    for (i = 0; i < m_vehicleIDs.size(); ++i)
    {
      if (m_vehicleIDs[i].DoesMatch(vehicle.GetGameObjectID()))
      {
        // Update the name while we're here, as it may have changed since being
        // added, or we could even be in a different locale.
        m_vehicleNames[i] = vehicle.GetLocalisedName();
        m_vehicleKuids[i] = vehicle.GetAsset().GetKUID();

        if (m_objectSearches.size() > 0)
          PostMessage(me, "SpecificVehiclesInfo", "PropertyBrowserRefresh", 2.0);
        else
          RefreshBrowser(m_browser);
        return;
      }
    }

    Interface.Log("SpecificVehiclesInfo.OnAsyncSearchResult> Unknown vehicle " + vehicle.GetLocalisedName());

  }


  //=============================================================================
  // Name: OnPropertyBrowserRefresh
  // Desc: Message handler to refresh the browser following an object search.
  //=============================================================================
  void OnPropertyBrowserRefresh(Message msg)
  {
    RefreshBrowser(m_browser);
  }


  //=============================================================================
  // Name: OnAsyncSearchResult
  // Desc: Callback from the result of a vehicle search.
  //=============================================================================
  void OnAsyncSearchResult(Message msg)
  {
    int i;
    for (i = 0; i < m_objectSearches.size(); ++i)
    {
      if (m_objectSearches[i] == msg.src)
      {
        NamedObjectInfo[] results = m_objectSearches[i].GetResults();
        m_objectSearches[i, i + 1] = null;

        if (results.size() > 0)
        {
          if (results[0].objectRef)
            UpdateDisplayDataForVehicle(cast<Vehicle>(results[0].objectRef));
          else
            Interface.Log("SpecificVehiclesInfo.OnAsyncSearchResult> No object ref for first result");
        }

        return;
      }
    }
  }


  //=============================================================================
  // Name: DebugLog
  // Desc: Logs debug information about this property handler
  //=============================================================================
  public void DebugLog()
  {
    Interface.Log("##--> DebugLog of SpecificVehiclesInfo ---------------");
    int i;
    for (i = 0; i < itemsList.size(); ++i)
      Interface.Log("   - vehicle " + (string)i + ": '" + itemsList[i] + "'"); 
  }

};



//=============================================================================
// Name: AssetTypeInfo
// Desc: A HTML property handler implementation that allows a list of assets to
//       be configured, based on what's locally installed. This is useful for
//       situations where session rules etc may want to create an asset filter.
//=============================================================================
class AssetTypeInfo isclass TrainHelperInfoListBase
{
  public string         typeName = "";                // Core string-table suffix for HTML heading
  Browser               m_browser;                    // The browser being used to display this handler
  AsyncTrainzAssetSearchObject m_assetSearch;         // The object used to search for a
                                                      // list of installed traincar assets
  bool                  m_bIsSearchComplete = false;  // Whether the asset search is complete

  KUID[]                m_kuidList = new KUID[0];     // The list of currently configured assets

  string[]              itemsList = new string[0];    // Obsolete - Do not use

  int GetListItemCount() { return m_kuidList.size(); }


  //=============================================================================
  // Name: IsAssetInList
  // Desc: Returns whether the KUID passed is configured in this objects list.
  // Parm: kuid - The kuid to search for
  // Parm: bMatchAnyVersion (OPTIONAL) - Whether to match any version of the kuid
  //=============================================================================
  bool IsAssetInList(KUID kuid, bool bMatchAnyVersion)
  {
    if (bMatchAnyVersion)
      kuid = kuid.GetBaseKUID();

    int i;
    for (i = 0; i < m_kuidList.size(); ++i)
    {
      if (bMatchAnyVersion)
      {
        if (m_kuidList[i].GetBaseKUID() == kuid)
          return true;
      }
      else
      {
        if (m_kuidList[i] == kuid)
          return true;
      }
    }

    return false;
  }

  bool IsAssetInList(KUID kuid) { return IsAssetInList(kuid, true); }


  //=============================================================================
  // Name: GetCategory
  // Desc: Return the category of assets to allow in this filter. Note that this
  //       returns an empty string by default, which will match against every
  //       installed asset and is not likely to be very useful.
  //=============================================================================
  string GetCategory() { return ""; }


  //=============================================================================
  // Name: BeginAssetSearch
  // Desc: Starts the search which locates installed assets of the desired type.
  //       This will use the GetCategory() function to locate installed, valid
  //       and non-obsolete assets of the appropriate type. However, it can be
  //       overridden by a child class to allow filtering on any asset search.
  //=============================================================================
  AsyncTrainzAssetSearchObject BeginAssetSearch()
  {
    // Create the search definition
    int[] filterTypes = new int[3];
    string[] filterValues = new string[3];

    filterTypes[0] = TrainzAssetSearch.FILTER_LOCATION;   filterValues[0] = "local";
    filterTypes[1] = TrainzAssetSearch.FILTER_VALID;      filterValues[1] = "true";
    filterTypes[2] = TrainzAssetSearch.FILTER_CATEGORY;   filterValues[2] = GetCategory();

    // Create and begin the search
    AsyncTrainzAssetSearchObject search = TrainzAssetSearch.NewAsyncSearchObject();
    TrainzAssetSearch.AsyncSearchAssetsSorted(filterTypes, filterValues, TrainzAssetSearch.SORT_NAME, true, search);

    return search;
  }


  //=============================================================================
  // Name: UpdateInteralListFromLegacyFormat
  // Desc: Attempts to build m_assetList from a legacy itemsList (asset names)
  //       and a local asset search. This may result in lost data.
  //=============================================================================
  public void UpdateInteralListFromLegacyFormat()
  {
    Asset[] assets = m_assetSearch.GetResults();

    m_kuidList = new KUID[0];

    // Loop over the items in the temporary itemsList array.
    int i;
    for (i = 0; i < itemsList.size(); i++)
    {
      int j;
      for (j = 0; j < assets.size(); ++j)
      {
        if (assets[j].GetName() == itemsList[i])
        {
          // Found a match, hopefully it's the right asset.
          m_kuidList[m_kuidList.size()] = assets[j].GetKUID();
          break;
        }
      }
    }

    int errorCount = itemsList.size() - m_kuidList.size();
    if (errorCount)
      Interface.Exception("AssetTypeInfo.UpdateInteralListFromLegacyFormat> ERROR: " + errorCount + " items lost when loading from legacy format");
    else
      Interface.WarnObsolete("AssetTypeInfo.UpdateInteralListFromLegacyFormat> Loaded from legacy format");

    // Keep itemsList around, just in case some overriding class expects it, but
    // note that it won't be written in any future resave.
  }


  //=============================================================================
  // Name: OnAsyncSearchResult
  // Desc: Callback from the result of an asset search.
  //=============================================================================
  void OnAsyncSearchResult(Message msg)
  {
    // Flag the search as complete
    m_bIsSearchComplete = true;

    // If we have a stored item list from an earlier SetProperties call, attempt
    // to match it against the search results, then trigger a html refresh.
    if (itemsList.size() > 0)
    {
      UpdateInteralListFromLegacyFormat();
      RefreshBrowser(m_browser);
    }
  }


  //=============================================================================
  // Name: GetColumnData
  // Desc: Returns the column data for the row index passed. See base class for
  //       more information.
  //=============================================================================
  string[] GetColumnData(int rowIndex)
  {
    string[] data = new string[3];

    data[0] = m_kuidList[rowIndex].GetHTMLString();
    data[1] = m_kuidList[rowIndex].GetLogString();

    // TODO: Cache the asset list internally
    Asset asset = World.FindAsset(m_kuidList[rowIndex]);
    if (asset)
      data[2] = asset.GetLocalisedName();
    else
      data[2] = m_kuidList[rowIndex].GetHTMLString();

    return data;
  }


  //=============================================================================
  // Name: GetInternalListHTML
  // Desc: Gets the HTML for the list sub-browser. Overridden to allow us to
  //       display a warning message when parsing legacy data.
  //=============================================================================
  public string GetInternalListHTML(void)
  {
    // Unfortunately we have no Init function to work with, so this will have to
    // do as the place to trigger our asset search. (This at least comes with the
    // benefit of only doing the search when the UI needs it.)
    if (!m_assetSearch)
    {
      m_assetSearch = BeginAssetSearch();

      AddHandler(me, "TrainzAssetSearch", "AsyncResult", "OnAsyncSearchResult");
      Sniff(m_assetSearch, "TrainzAssetSearch", "AsyncResult", true);
    }

    if (!m_bIsSearchComplete and itemsList.size() > 0)
    {
      // Show a warning message if we're still initialising.
      StringTable coreStrings = Constructors.GetTrainzStrings();
      return "<html><body>" + coreStrings.GetString("interface-helper-loading-legacy") + "</body></html>";
    }

    return inherited();
  }
  

  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the type for the named property.
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add")
    {
      // We show a warning dialog if the link is clicked before the search finishes
      if (!m_bIsSearchComplete)
        return "link";

      return "list";
    }

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyElementList
  // Desc: Returns a list of possible options for a list type property
  //=============================================================================
  public string[] GetPropertyElementList(string propertyID)
  {
    string[] returnList = new string[0];

    // Extract the local property name
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add" and m_bIsSearchComplete)
    {
      Asset[] assets = m_assetSearch.GetResults();

      int i;
      for (i = 0; i < assets.size(); ++i)
      {
        // Exclude anything we've already added internally
        if (IsAssetInList(assets[i].GetKUID()))
          continue;

        returnList[returnList.size()] = assets[i].GetLocalisedName();
      }
    }

    return returnList;
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of a list property type.
  //=============================================================================
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add")
    {
      if (m_bIsSearchComplete)
      {
        Asset[] assets = m_assetSearch.GetResults();

        int targetIndex = value.GetIndex();
        if (targetIndex < 0 or targetIndex >= assets.size())
          return;

        int i, listIndex = 0;
        for (i = 0; i < assets.size(); ++i)
        {
          // Skip anything we've already added
          if (IsAssetInList(assets[i].GetKUID()))
            continue;

          if (listIndex == targetIndex)
          {
            // Add it to the end of the list
            m_kuidList[m_kuidList.size()] = assets[i].GetKUID();
            break;
          }

          ++listIndex;
        }

      }
      else
      {
        StringTable coreStrings = Constructors.GetTrainzStrings();
        Interface.ShowMessageBox(null, coreStrings.GetString("interface-helper-loading-assets"), true, "", "");
      }

      return;
    }

    if (tokens[0] == "delete")
    {
      int index = Str.ToInt(tokens[1]);
      m_kuidList[index, index + 1] = null;
      return;
    }

    inherited(propertyID, value);
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Saves the properties of this item to a soup and returns it.
  //=============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    Soup assetSoup = Constructors.NewSoup();
    int i;
    for (i = 0; i < m_kuidList.size(); ++i)
      assetSoup.SetNamedTag((string)i, m_kuidList[i]);

    soup.SetNamedSoup(Prop("asset-list"), assetSoup);

    return soup;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Loads this items state from a Soup created by GetProperties.
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    inherited(soup);

    if (soup.GetIndexForNamedTag(Prop("itemslist")) != -1)
    {
      // The legacy format stored a list of unlocalised asset names. This is
      // obviously fraught with problems, but we can at least attempt to search
      // for those assets when the internal search is complete.
      Soup itemsSoup = soup.GetNamedSoup(Prop("itemslist"));

      int i;
      for (i = 0; i < itemsSoup.CountTags(); i++)
        itemsList[itemsList.size()] = itemsSoup.GetNamedTag((string)i);

      if (m_bIsSearchComplete)
      {
        // Search is already complete, check for matches and build m_assetList
        UpdateInteralListFromLegacyFormat();
      }
    }
    else
    {
      Soup assetSoup = soup.GetNamedSoup(Prop("asset-list"));

      m_kuidList = new KUID[0];

      int i;
      for (i = 0; i < assetSoup.CountTags(); i++)
      {
        KUID kuid = assetSoup.GetNamedTagAsKUID((string)i);
        if (kuid)
          m_kuidList[m_kuidList.size()] = kuid;
      }
    }
  }


};



//=============================================================================
// Name: VehicleTypesInfo
// Desc: A HTML property handler implementation that allows a list of traincar
//       assets to be configured. This is useful for situations where a script
//       is only concerned with what types of vehicles are in a train, rather
//       than the specific vehicle instances.
//
// Note: This handler used to inherit from SpecificVehiclesInfo as they had
//       very similar operation, but with the move to asynchronous searches
//       this is no longer the case. They now instead share from a common base
//       class which provides only the HTML formatting.
//=============================================================================
class VehicleTypesInfo isclass AssetTypeInfo
{

  // Filter this list builder to traincar assets only
  string GetCategory() { return "TV"; }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the asset of the vehicle passed is configured within
  //       this handler.
  //=============================================================================
  public bool DoesMatch(Vehicle vehicle)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (itemsList.size() == 0)
      return true;

    return IsAssetInList(vehicle.GetAsset().GetKUID());
  }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true if 'train' contains a traincar of at
  //       least of the asset types defined in this filter, or if this handler is
  //       empty/unconfigured.
  //=============================================================================
  public bool DoesMatch(Train train)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (m_kuidList.size() == 0)
      return true;

    if (!train)
      return false;

    Vehicle[] vehicles = train.GetVehicles();

    int i;
    for (i = 0; i < vehicles.size(); ++i)
    {
      Asset vehicleAsset = vehicles[i].GetAsset();

      if (IsAssetInList(vehicleAsset.GetKUID()))
        return true;
    }

    // No vehicles from the train were found in this handler
    return false;
  }


  //=============================================================================
  // Name: DoesMatchAnd
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true only if every vehicle asset in 'train'
  //       exists in this handlers filter. Excess assets in this handler will
  //       not affect the result.
  //       Note that unlike DoesMatch, this variant will not match the train if
  //       there are no assets configured inthe handler.
  //=============================================================================
  public bool DoesMatchAnd(Train train)
  {
    if (!train)
      return false;

    Vehicle[] vehicles = train.GetVehicles();

    int i;
    for (i = 0; i < vehicles.size(); ++i)
    {
      Asset vehicleAsset = vehicles[i].GetAsset();

      if (!IsAssetInList(vehicleAsset.GetKUID()))
        return false;
    }

    // Found every vehicle, return true
    return true;
  }


  //=============================================================================
  // Name: DoesMatchAndExclude
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true only if this handler and the train use
  //       the exact same set of assets. Any asset that exists in one list
  //       and not the other will prevent a match. Ordering is not relevant.
  //=============================================================================
  public bool DoesMatchAndExclude(Train train)
  {
    // Check that the train assets are in the handler first, return if not
    if (!DoesMatchAnd(train))
      return false;

    // We now need to check back the other way. Note that the train will almost
    // certainly have multiple instances of the same traincar asset, so we can't
    // just check the array sizes match.
    Vehicle[] trainVehicles = train.GetVehicles();

    int i;
    for (i = 0; i < m_kuidList.size(); ++i)
    {
      // We'll always match base kuid here
      KUID baseKuid = m_kuidList[i].GetBaseKUID();

      bool bFoundKuidInTrain = false;

      int j;
      for (j = 0; j < trainVehicles.size() and !bFoundKuidInTrain; ++j)
        if (trainVehicles[j].GetAsset().GetKUID().GetBaseKUID() == baseKuid)
          bFoundKuidInTrain = true;

      if (!bFoundKuidInTrain)
        return false;
    }

    // Found every vehicle in both directions, return true
    return true;
  }


  // This function had a typo in it's name for years
  public obsolete bool DoesMatchAndExlcude(Train train) { return DoesMatchAndExclude(train); }


  //=============================================================================
  // Name: DoesMatchOrdered
  // Desc: Returns whether the train passed matches this filter.
  //       This variant will return true only if this handler and the train have
  //       the exact same set of vehicles, and those vehicles are in the exact
  //       same order (or exactly reversed order).
  // NOTE: As with DoesMatch (but not DoesMatchAnd or DoesMatchAndExclude) this
  //       variant will always return true if the handler is empty/unconfigured.
  // NOTE: This is provided as a legacy function, but as this handler does not
  //       allow multiple instances of the same asset it is of extremely limited
  //       usefulness. If your aim is to test for a particular consist definition
  //       then you should probably be using a SpecificVehiclesInfo instead.
  //=============================================================================
  public bool DoesMatchOrdered(Train train)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (m_kuidList.size() == 0)
      return true;

    Vehicle[] vehicles = train.GetVehicles();

    // We require an exact match, so can early out if there's a size difference
    if (vehicles.size() != m_kuidList.size())
      return false;

    bool bHasForwardMatch = true;
    bool bHasReverseMatch = true;

    int i;
    for (i = 0; i < vehicles.size(); ++i)
    {
      KUID vehicleKuid = vehicles[i].GetAsset().GetKUID().GetBaseKUID();

      if (vehicleKuid != m_kuidList[i].GetBaseKUID())
        bHasForwardMatch = false;

      if (vehicleKuid != m_kuidList[m_kuidList.size() - i - 1].GetBaseKUID())
        bHasReverseMatch = false;
    }

    return bHasForwardMatch or bHasReverseMatch;
  }
  

};



//=============================================================================
// Name: DriversInfo
// Desc: A HTML property handler implementation that allows a list of driver
//       assets to be configured. This is useful for situations where a script
//       is only concerned with what types of vehicles are in a train, rather
//       than the specific vehicle instances.
//
// Note: This handler used to inherit from SpecificVehiclesInfo as they had
//       very similar operation, but with the move to asynchronous searches
//       this is no longer the case. They now instead share from a common base
//       class which provides only the HTML formatting.
//=============================================================================
class DriversInfo isclass AssetTypeInfo
{

  // Driver portraits are 32x32 square, rather than the 64x32 icon of the base class
  int GetImageWidth() { return 32; }

  // Filter this list builder to DriverCharacter assets only
  string GetCategory() { return "DR"; }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the driver of the vehicle passed exists in this
  //       and is the current active driver of the train. If no driver assets are
  //       configured in the handler it will return true regardless of all other
  //       factors.
  //=============================================================================
  public bool DoesMatch(Vehicle vehicle)
  {
    if (!vehicle)
      return false;

    // If the list is empty, we assume a wildcard filter that matches everything
    if (m_kuidList.size() == 0)
      return true;

    DriverCharacter driver = vehicle.GetMyTrain().GetActiveDriver();
    if (!driver or driver.GetLocation() != vehicle)
      return false;

    return IsAssetInList(driver.GetAsset().GetKUID());
  }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the *active* driver of a train is of an asset type
  //       configured in this handler, or if this handler is empty/unconfigured.
  //=============================================================================
  public bool DoesMatch(Train train)
  {
    // If the list is empty, we assume a wildcard filter that matches everything
    if (m_kuidList.size() == 0)
      return true;

    if (!train)
      return false;

    DriverCharacter driver = train.GetActiveDriver();
    if (!driver)
      return false;

    return IsAssetInList(driver.GetAsset().GetKUID());
  }


  // Legacy functions, provided with their original functionality to avoid
  // potential breakages in old scripts. Do not use these.
  public obsolete bool DoesMatchAnd(Train train) { return DoesMatch(train); }
  public obsolete bool DoesMatchAndExlcude(Train train) { return true; }
  public obsolete bool DoesMatchOrdered(Train train) { return true; }

};



//! Handler class that allows a description of a train to be built for filtering purposes.
//
// This property handler allows a description of a consist to be built that can filer trains on the basis of
// one or more of the following:
//  - train with a specific vehicle
//  - train with a specific vehicle
//  - train with a specific driver
//  - any train
//
// All the text and art this handler displays in a properties window is built into the game and this handler
// uses what it needs automatically.  
//
// To use this handler for your own assets, not only do you need to create the object with <l gscLangKeyNew  new>
// but you must also call its Init() method before you either <l PropertyObject::SetPropertyHandler() assign it>
// to a PropertyObject or <l HTMLPropertyGroup::AddHandler()  add it> to group property handler.
//
// Once created, the TrainHelperInfo handler manes the train definitions and automatically loads/saves as 
// needed.  The DoesMatch() method is provided to compare an existing Train against this handler's own train
// definitions and this is how you use this handler as a filtering mechanism.
//
// This handler is used in the <l astSrcIndPortal  Portal> scenery object as well as in the following rules:
//  - <l astSrcRuleConstChk            Consist Check>
//  - <l astSrcRuleTriggerCheck        Trigger Check>
//  - <l astSrcRuleVehicPhys           Vehicle Physics>
//  - <l astSrcRuleEnaDisDrivCmds      Enable/Disable Driver Commands>
//  - <l astSrcRuleWaitDriverOnOff     Wait for Driver On/Off Train>
//  - <l astSrcRuleWaitTrainStopStart  Wait on Train Stop/Start>
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\TrainHelperInfo.gs> script file.
//
// See Also:
//     SpecificVehiclesInfo, VehicleTypesInfo, DriversInfo, ConsistHelperInfo, ConsistListHelper, 
//     VehicleHelperInfo
//
class TrainHelperInfo isclass HTMLPropertyGroup
{
  bool                  filterTrains = false;     // Whether this handler is currently enabled
  bool                  userControlTrains = true; // Obsolete - Do not use

  SpecificVehiclesInfo  specVehiclesInfo;
  VehicleTypesInfo      vehicleTypesInfo;
  DriversInfo           driversInfo;


  //=============================================================================
  // Name: DoesFilterTrains
  // Desc: Returns whether this handler is currently enabled.
  //=============================================================================
  public bool DoesFilterTrains(void) { return filterTrains; }


  //=============================================================================
  // Name: Init
  // Desc: Initialise the child handlers of this object.
  //=============================================================================
  public void Init(void)
  {
    specVehiclesInfo = new SpecificVehiclesInfo();
    specVehiclesInfo.SetTypeName("specvehicle");
    AddHandler(specVehiclesInfo, "specvehicle/");

    vehicleTypesInfo = new VehicleTypesInfo();
    vehicleTypesInfo.SetTypeName("vehicletype");
    AddHandler(vehicleTypesInfo, "vehicletype/");

    driversInfo = new DriversInfo();
    driversInfo.SetTypeName("driver");
    AddHandler(driversInfo, "driver/");
  }


  //=============================================================================
  // Name: GetDescriptionHTML
  // Desc: Returns the HTML description of this property handlers current config.
  //=============================================================================
  public string GetDescriptionHTML(void)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    string htmlPage = "";

    string titleStr = strTable.GetString("interface-helper-train-filter");

    htmlPage = htmlPage + "<font color=#FFFFFF><p>" +
               HTMLWindow.RadioButton(Link("filtertrains-off"), !filterTrains) +
               strTable.GetString("interface-helper-train-filter-off") + "</p></font>";

    htmlPage = htmlPage + "<font color=#FFFFFF><p>" +
               HTMLWindow.RadioButton(Link("filtertrains-on"), filterTrains) +
               strTable.GetString("interface-helper-train-filter-on") + "</p></font>";


    if (filterTrains)
    {
      // Generate the HTML for the child filters
      string filter = "<br><table><tr><td width=50></td><td>" + 
                        "<table cellpadding=20 border=1 bgcolor=#FFAD0059 bordercolor=#00000059><tr><td>" +
                          inherited() +
                        "</td><tr></table>" + 
                      "</td></tr></table>";

      htmlPage = htmlPage + filter;
    }

    return htmlPage;
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Returns a human-readable name for a property.
  //=============================================================================
  public string GetPropertyName(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "filtertrains-on" or tokens[0] == "filtertrains-off" or "train-helper-desc-filtertrains-off")
      return coreStrings.GetString("train-helper-name-" + tokens[0]);

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Returns a human-readable description for a property.
  //=============================================================================
  public string GetPropertyDescription(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "filtertrains-on" or tokens[0] == "filtertrains-off" or "train-helper-desc-filtertrains-off")
      return coreStrings.GetString("train-helper-desc-" + tokens[0]);

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the type ID for a particular property.
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "filtertrains-on" or tokens[0] == "filtertrains-off")
      return "link";

    if (tokens[0] == "usercontroltrains")
      return "link";

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of the property passed.
  //=============================================================================
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "filtertrains-on")
    {
      filterTrains = true;
      return;
    }

    if (tokens[0] == "filtertrains-off")
    {
      filterTrains = false;
      return;
    }

    inherited(propertyID, value);
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Returns a soup containing data about the current configuration of this
  //       handler (and all child handlers).
  //=============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    soup.SetNamedTag(Prop("filtertrains"), filterTrains);
    soup.SetNamedTag(Prop("usercontroltrains"), userControlTrains);

    return soup;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Loads this items state from a Soup created by GetProperties.
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    // use default of true to have filtered enabled
    filterTrains = soup.GetNamedTagAsBool(Prop("filtertrains"), false);
    userControlTrains = soup.GetNamedTagAsBool(Prop("usercontroltrains"), true);

    inherited(soup);
  }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether the given vehicle matches the configuration of this
  //       handler as per the child handler DoesMatch(vehicle) functions. Note
  //       that this supports the addition of extra handlers beyond the 3
  //       defaults, but they must inherit from TrainHelperInfoListBase.
  //=============================================================================
  public bool DoesMatch(Vehicle vehicle)
  {
    if (!vehicle)
      return false;

    // Return true if the filter is disabled
    if (!filterTrains)
      return true;

    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      TrainHelperInfoListBase info = cast<TrainHelperInfoListBase> handlers[i];
      if (info and !info.DoesMatch(vehicle))
      {
        Interface.Log("# TrainHelperInfo.DoesMatch> failed on '" + info.typeName + "' check");
        return false;
      }
    }

    // All filters matched or were of an unsupported type, return true
    return true;
  }


  //=============================================================================
  // Name: DoesMatch
  // Desc: Determines if the given train matches this filter selection. This will
  //       match as per the DoesMatch logic on each child handler. Note that this
  //       supports the addition of extra handlers beyond the 3 defaults, but
  //       they must inherit from TrainHelperInfoListBase.
  //=============================================================================
  public bool DoesMatch(Train train)
  {
    if (!train)
      return false;

    // Return true if the filter is disabled
    if (!filterTrains)
      return true;

    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      TrainHelperInfoListBase handler = cast<TrainHelperInfoListBase>(handlers[i]);
      if (handler and !handler.DoesMatch(train))
      {
        //Interface.Log("# TrainHelperInfo.DoesMatch> failed on '" + info.typeName + "' check");
        return false;
      }
    }

    // All filters matched or were of an unsupported type, return true
    Interface.Log("# TrainHelperInfo.DoesMatch> Filter check successful!");
    return true;
  }


  //=============================================================================
  // Name: DebugLog
  //=============================================================================
  public void DebugLog(void)
  {
    specVehiclesInfo.DebugLog();
  }

};

