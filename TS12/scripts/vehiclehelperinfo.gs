//
// VehicleHelperInfo.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Constructors.gs"
include "HTMLPropertyHandler.gs"
include "Soup.gs"
include "common.gs"



//! A simple vehicle filter property handler.
//
// This class is similar to SpecificVehiclesInfo except that it does filtering by looking for the presence
// of a given Vehicle instance in its items list, not an entire Train consist.  It is used by the
// VehicleHelperInfo group handler.
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\VehicleHelperInfo.gs> script file.
//
// See Also:
//     VHIDriversInfo, VHIVehicleTypesInfo, VehicleHelperInfo, SpecificVehiclesInfo
//
class VHISpecificVehiclesInfo isclass HTMLPropertyHandler
{
  string[] itemsList = new string[0];
  public string typeName = "";

  int GetImageWidth()
  {
    return 32;
  }


  //
  // Gets the vehicle for the given vehicle (localised name)
  //
  Vehicle GetVehicle(string vehicleName)
  {
    Vehicle[] worldVehicles = World.GetVehicleList();
    int i;

    for (i = 0; i < worldVehicles.size(); i++)
      if (worldVehicles[i].GetLocalisedName() == vehicleName)
        return worldVehicles[i];

    // didn't find anything, so return null
    return null;
  }


  //
  // Override in derived classes.
  //
  string[] GetTableInfo(string itemName)
  {
    string[] retString = new string[0];
    Vehicle vehicle = GetVehicle(itemName);

    if (vehicle)
    {
      retString[0] = vehicle.GetAsset().GetName();
      retString[1] = vehicle.GetAsset().GetKUID().GetHTMLString();
      retString[2] = vehicle.GetLocalisedName();
    }

    return retString;
  }


	public void SetTypeName(string a_typeName)
	{
		typeName = a_typeName;
	}


  //
  // Gets HTML page describing this object.
  //
  public string GetDescriptionHTML(void)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();
    string htmlPage, vehiclesHTML, addVehicleHTML;
    htmlPage = vehiclesHTML = addVehicleHTML = "";


    // title bit at top
    htmlPage = htmlPage + "<br>" + HTMLWindow.MakeBold(coreStrings.GetString("interface-helper-" + typeName)) + "<br>";

    // only put in table if there is anything to actually add
    int listSize = itemsList.size();
    //if (listSize > 0)
    {
      htmlPage = htmlPage + HTMLWindow.StartTable("cellpadding=2 cellspacing=2 bordercolor=#00000059") + HTMLWindow.StartRow("bgcolor=#00000059") +
                            HTMLWindow.StartCell("") + coreStrings.GetString("interface-helper-col1-" + typeName) + HTMLWindow.EndCell() +
                            HTMLWindow.StartCell("") + coreStrings.GetString("interface-helper-col2-" + typeName) + HTMLWindow.EndCell() +
                            HTMLWindow.StartCell("") + HTMLWindow.EndCell() + HTMLWindow.EndRow();

      int i;
      Asset core = Constructors.GetTrainzAsset();
			KUID kuidImgRemove = core.LookupKUIDTable("imgRemove");
			string kuidImgRemoveString = kuidImgRemove.GetHTMLString();
      for (i = 0; i < listSize; i++)
      {
        string[] tableColumn = GetTableInfo(itemsList[i]);

        if (tableColumn.size() == 3)
        {
          // 1st column - icon of vehicle type 
          string column1 = HTMLWindow.StartCell("") + 
                           HTMLWindow.StartLink("' tooltip='" + tableColumn[0]) + 
                           HTMLWindow.MakeImage(tableColumn[1], true, GetImageWidth(), 32) + 
                           HTMLWindow.EndLink() + HTMLWindow.EndCell();

          // 2nd column - localised name of vehicle instance
          string column2 = HTMLWindow.StartCell("") + tableColumn[2] + HTMLWindow.EndCell();

          // 3rd column - link to delete the vehicle from table
          string column3 = HTMLWindow.StartCell("") + HREF("delete/" + (string)i) +
                           HTMLWindow.MakeImage(kuidImgRemoveString, true, 32, 32) + 
                           HTMLWindow.EndLink() + HTMLWindow.EndCell();

          string bgColor = "";
          if (i & 1)
            bgColor = "bgcolor=#00000029";
          string tableRow = HTMLWindow.StartRow(bgColor) + column1 + column2 + column3 + HTMLWindow.EndRow();
          htmlPage = htmlPage + tableRow;
        }
      }

      // Allow for add
			KUID kuidImgAdd = core.LookupKUIDTable("imgAdd");
			string kuidImgAddString = kuidImgAdd.GetHTMLString();
      htmlPage = htmlPage + HTMLWindow.StartRow("bgcolor=#00000059") +
                            HTMLWindow.MakeCell("") +
                            HTMLWindow.MakeCell("") +
                            HTMLWindow.MakeCell(HREF("add") + HTMLWindow.MakeImage(kuidImgAddString, true) + HTMLWindow.EndLink()) + HTMLWindow.EndRow();

      htmlPage = htmlPage + HTMLWindow.EndTable(); // + "<br>";

    } // if listSize>0

    return htmlPage;
  }


  //
  // Gets a user-friendly name for the named property.
  //
  public string GetPropertyName(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "add") or (tokens[0] == "allow") or (tokens[0] == "delete"))
      return coreStrings.GetString("interface-helper-generic-name-" + tokens[0]);

    return "null";
  }

  //
  // Gets a user-friendly description for the named property.
  //
  public string GetPropertyDescription(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "add") or (tokens[0] == "allow") or (tokens[0] == "delete"))
      return coreStrings.GetString("interface-helper-generic-desc-" + tokens[0]);

    return "null";
  }


  //
  // Gets the type for the named property.
  //
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "allow")
      return "link";

    if (tokens[0] == "add")
      return "list,1";

    if (tokens[0] == "delete")
      return "link";

    return "null";
  }

  // needed anymore?
//  public string GetPropertyValue(string propertyID);

  //
  // ??
  //
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "add") and (value.GetType() == PropertyValue.INDEX_TYPE))
    {
      string newItem = value.AsString();
      itemsList[itemsList.size()] = newItem;
    }
    else if ((tokens[0] == "delete") and  (value.GetType() == PropertyValue.NULL_TYPE))
    {
      int vehicleIndex = Str.ToInt(tokens[1]);
      itemsList[vehicleIndex, vehicleIndex+1] = null;
    }

  }

  //
  // ??
  //
  public string[] GetPropertyElementList(string propertyID)
  {
    string[] retString = new string[0];
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add")
    {
      Vehicle[] worldVehicles = World.GetVehicleList();

      int i, out = 0;
      for (i = 0; i < worldVehicles.size(); i++)
        if (!TrainUtil.AlreadyThereStr(itemsList, worldVehicles[i].GetLocalisedName()) )
          retString[out++] = worldVehicles[i].GetLocalisedName();
    }

    return retString;
  }

  //
  // ??
  //
	public void SetProperties(Soup soup)
  {
    Soup itemsSoup = soup.GetNamedSoup(Prop("itemslist"));
    if (itemsSoup.CountTags() > 0)
    {
      int i;
      for (i = 0; i < itemsSoup.CountTags(); i++)
        itemsList[i] = itemsSoup.GetNamedTag((string)i);
    }

  }

  //
  // ?
  //
  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();

    // items list
    Soup itemsSoup = Constructors.NewSoup();
    int i;
    for (i = 0; i < itemsList.size(); i++)
      itemsSoup.SetNamedTag((string)i, itemsList[i]);

    soup.SetNamedSoup(Prop("itemslist"), itemsSoup);

    return soup;
  }


  //
  // Implementation of method (override in dervied classes)
  //
  public bool DoesMatch(Vehicle vehicle)
  {
    // if list is empty, we assume a wildcard filter that allows all vehicle instances
    if (itemsList.size() == 0)
    {
//      Interface.Log("VHISpecificVehiclesInfo.DoesMatch> items list empty, assumming wild card pass for '" + typeName + "' filter");
      return true;
    }
    
    return TrainUtil.AlreadyThereStr(itemsList, vehicle.GetLocalisedName());
  }
};



//! A simple vehicle type filter property handler.
//
// This class is similar to VehicleTypesInfo except that it does filtering by looking for the presence
// of a given vehicle's type in its items list, not an entire Train consist.  It is used by the
// VehicleHelperInfo group handler.
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\VehicleHelperInfo.gs> script file.
//
// See Also:
//     VHIDriversInfo, VHISpecificVehiclesInfo, VehicleHelperInfo, VehicleTypesInfo
//
class VHIVehicleTypesInfo isclass VHISpecificVehiclesInfo
{
  int GetImageWidth()
  {
    return 64;
  }

  // ovveridden methods so this class will work with vehicle types, not instances
  string[] GetTableInfo(string itemName)
  {
    string[] retString = new string[0];
    Asset[] vehicles = World.GetAssetList("traincar");

    int i;
    for (i = 0; i < vehicles.size(); i++)
      if (vehicles[i].GetName() == itemName)
      {
        retString[0] = vehicles[i].GetName();
        retString[1] = vehicles[i].GetKUID().GetHTMLString();
        retString[2] = vehicles[i].GetName();
        break;
      }

    return retString;
  }

  //
  // ??
  //
  public string[] GetPropertyElementList(string propertyID)
  {
    string[] retString = new string[0];
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add")
    {
      Asset[] vehicles = World.GetAssetList("traincar");

      int i, out = 0;
      for (i = 0; i < vehicles.size(); i++)
        if (!TrainUtil.AlreadyThereStr(itemsList, vehicles[i].GetName()))
          retString[out++] = vehicles[i].GetName();
    }

    return retString;
  }


  
  public bool DoesMatch(Vehicle vehicle)
  {
    // if list is empty, we assume a wildcard filter that allows all vehicle types
    if (itemsList.size() == 0)
    {
//      Interface.Log("VHIVehicleTypesInfo.DoesMatch> items list empty, assumming wildcard pass for '" + typeName + "' filter");
      return true;
    }
    
    return TrainUtil.AlreadyThereStr(itemsList, vehicle.GetAsset().GetName());
  }
};



//! A simple driver filter property handler.
//
// This class is similar to DriversInfo except that it does filtering by looking for the presence
// of a driver from the given Vehicle's train.  It is used by the VehicleHelperInfo group handler.
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\VehicleHelperInfo.gs> script file.
//
// See Also:
//     VHISpecificVehiclesInfo, VehicleTypesInfo, VehicleHelperInfo, DriversInfo
//
class VHIDriversInfo isclass VHISpecificVehiclesInfo
{
  // ovveridden methods so this class will work with vehicle types, not instances
  string[] GetTableInfo(string itemName)
  {
    string[] retString = new string[0];
    Asset[] drivers = World.GetAssetList("drivercharacter");

    int i;
    for (i = 0; i < drivers.size(); i++)
      if (drivers[i].GetName() == itemName)
      {
        retString[0] = drivers[i].GetName();
        retString[1] = drivers[i].GetKUID().GetHTMLString();
        retString[2] = drivers[i].GetName();
        break;
      }

    return retString;
  }

  //
  // ??
  //
  public string[] GetPropertyElementList(string propertyID)
  {
    string[] retString = new string[0];
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "add")
    {
      Asset[] drivers = World.GetAssetList("drivercharacter");

      int i, out = 0;
      for (i = 0; i < drivers.size(); i++)
        if (!TrainUtil.AlreadyThereStr(itemsList, drivers[i].GetName()))
          retString[out++] = drivers[i].GetName();
    }

    return retString;
  }


  public bool DoesMatch(Vehicle vehicle)
  {
    if (!vehicle)
      return false;
    
    // if list is empty, we assume a wildcard filter that allows all driver characters
    if (itemsList.size() == 0)
    {
//      Interface.Log("VHIDriversInfo.DoesMatch> items list empty, assumming wildcard pass for '" + typeName + "' filter");
      return true;
    }
    

    // check if this train's driver (if any) is in list of allowed drivers
    DriverCharacter driver = vehicle.GetMyTrain().GetActiveDriver();

    if (driver  and  driver.GetLocation() == vehicle)
      if (TrainUtil.AlreadyThereStr(itemsList, driver.GetAsset().GetName()))
      {
        // if we reach here, we know that this vehicle is in the list
        return true;
      }

    // reach here, must be no matches
    return false;
  }

};



//! Handler class that allows attributes of a vehicle to be built for filtering purposes.
//
// This class describes various attributes of a vehicle including possible names, types and drivers (from the
// host train).  It includes the functionality to check a given Vehicle instance against this criteria.
//
// VehicleHelperInfo is very similar to TrainHelperInfo except that it provides filter checks for a Vehicle,
// not an entire Train consist.  
//
// The <l astSrcRuleVehicPhys  Vehicle Physics> rule provides a usage example.
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\VehicleHelperInfo.gs> script file.
//
// See Also:
//     VHIDriversInfo, VHISpecificVehiclesInfo, VHIVehicleTypesInfo, TrainHelperInfo, ConsistHelperInfo
//
class VehicleHelperInfo isclass HTMLPropertyGroup
{
  // if true, trains will be filtered according to options, otherwise false and all trains will be allowed
  bool filterTrains = false;
  bool userControlTrains = true;

  VHISpecificVehiclesInfo specVehiclesInfo;
  VHIVehicleTypesInfo     vehicleTypesInfo;
  VHIDriversInfo          driversInfo;



  public bool DoesMatch(Vehicle train);


  //
  // Initialization method that should always be called if using a train helper.
  //
  public void Init(void)
  {
    specVehiclesInfo = new VHISpecificVehiclesInfo();
    vehicleTypesInfo = new VHIVehicleTypesInfo();
    driversInfo      = new VHIDriversInfo();
		
		specVehiclesInfo.SetTypeName("specvehicle");
    AddHandler(specVehiclesInfo, "specvehicle/");

		vehicleTypesInfo.SetTypeName("vehicletype");
    AddHandler(vehicleTypesInfo, "vehicletype/");
		
		driversInfo.SetTypeName("driver");
    AddHandler(driversInfo, "driver/");
  }


  //
  // Properties Methods
  //

  //
  // Gets a HTML page describing this object.
  //
  public string GetDescriptionHTML(void)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    string htmlPage = "";
		
    string titleStr   = strTable.GetString("interface-helper-train-filter");
    //string enableURL  = strTable.GetString("bool_str_yesno_" + (string)filterTrains);
    //string enableHTML = HTMLWindow.MakeBold(titleStr) + HREF("filtertrains") +
    //                    enableURL + HTMLWindow.EndLink();

		htmlPage = htmlPage + "<font color=#FFFFFF><p>" +
      HTMLWindow.RadioButton(Link("filtertrains-off"), !filterTrains) + strTable.GetString("interface-helper-train-filter-off") + "</p></font>";

		htmlPage = htmlPage + "<font color=#FFFFFF><p>" +
      HTMLWindow.RadioButton(Link("filtertrains-on"), filterTrains) + strTable.GetString("interface-helper-train-filter-on") + "</p></font>";

    //htmlPage = htmlPage + enableHTML + "<br>";

    // if filtering enabled, return stuff from HTML item info helpers
    if (filterTrains)
		{
      htmlPage = htmlPage +
				"<br>" +

				HTMLWindow.MakeTable(
					HTMLWindow.MakeRow(
						HTMLWindow.MakeCell("", "width=50") +
					
						HTMLWindow.MakeCell(
							HTMLWindow.MakeTable(
								HTMLWindow.MakeRow(
									HTMLWindow.MakeCell(
										inherited()
									)
								),
							"cellpadding=20 border=1 bgcolor=#FFAD0059 bordercolor=#00000059"
							)
						)
					)
				);
		}

    return htmlPage; // + "<br><br>";
  }


  //
  // Gets the type of the named property.
  //
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "filtertrains-on"  or  tokens[0] == "filtertrains-off")
      return "link";

    if (tokens[0] == "usercontroltrains")
      return "link";

    return inherited(propertyID);
  }


  //
  // Sets the value of the named property
  //
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "filtertrains-on")
      filterTrains = true;

    else if (tokens[0] == "filtertrains-off")
      filterTrains = false;

    else
      inherited(propertyID, value);
  }


  //
  // Get user-friendly name for given property.
  //
  public string GetPropertyName(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "filtertrains-on") or (tokens[0] == "filtertrains-off") or (tokens[0] == "filtertrains-on"))
      return coreStrings.GetString("train-helper-name-" + tokens[0]);

    return inherited(propertyID);
  }

  //
  // Get readable description to use as tooltip for named property.
  //
  public string GetPropertyDescription(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "filtertrains-on") or (tokens[0] == "filtertrains-off") or ("train-helper-desc-filtertrains-off"))
      return coreStrings.GetString("train-helper-desc-" + tokens[0]);

    return inherited(propertyID);
  }


  //
  // Initializes this train filter from a soup database.
  //
  public void SetProperties(Soup soup)
  {
    // use default of true to have filtered enabled
    filterTrains      = soup.GetNamedTagAsBool(Prop("filtertrains"), false);  
    userControlTrains = soup.GetNamedTagAsBool(Prop("usercontroltrains"), true);  

    inherited(soup);
  }

  //
  // Gets the train filter data into soup database.
  //
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    soup.SetNamedTag(Prop("filtertrains"), filterTrains);
    soup.SetNamedTag(Prop("usercontroltrains"), userControlTrains);

    return soup;
  }


  //
  // Implementations 
  //

  //
  // Determines if the given train matches this filter selection
  //
  public bool DoesMatch(Vehicle vehicle)
  {
    // failure if train is not valid
    if (!vehicle)
    {
      Interface.Log("# VehicleHelperInfo.DoesMatch> invalid train, filter match failed");
      return false;
    }

    // filtering is disabled, so allow train to pass filter regardless
    if (!filterTrains)
    {
//      Interface.Log("VehicleHelperInfo.DoesMatch> vehicle filtering not enabled, allowing all vehicle");
      return true;
    }

    // is user control mode filtered?, if so and train doesn't allow user control, filter fails
/*    if (userControlTrains)
      if (!train.GetAllowsUserControl())
      {
        Interface.Log("VehicleHelperInfo.DoesMatch> failed for user control");
        return false;
      }*/

    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      VHISpecificVehiclesInfo info = cast<VHISpecificVehiclesInfo> handlers[i];
      if (info and !info.DoesMatch(vehicle))
      {
        Interface.Log("# VehicleHelperInfo.DoesMatch> failed on '" + info.typeName + "' check");
        return false;
      }
    }

    // gotten this far, so train must have filtered through sucessfully
    return true;
  }

};

