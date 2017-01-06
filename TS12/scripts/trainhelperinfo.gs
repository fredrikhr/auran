//
// TrainHelperInfo.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Constructors.gs"
include "HTMLPropertyHandler.gs"
include "Soup.gs"
include "common.gs"



//! Property handler that defines a list of specific vehicle items to filter.
//
// This handler is used as a sub-handler in TrainHelperInfo to define a filter based on specific vehicle
// instances.  Internally, the specific vehicle instances are referred to by their game object name.
// 
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\TrainHelperInfo.gs> script file.
//
// See Also:
//     DriversInfo, VehicleTypesInfo, TrainHelperInfo, VehicleDescriptor, VHISpecificVehiclesInfo
//
class SpecificVehiclesInfo isclass HTMLPropertyHandler
{
  string[] itemsList = new string[0];
  public string typeName = "";


  public void DebugLog()
  {
    Interface.Log("##--> DebugLog of SpecificVehiclesInfo ---------------");
    int i;
    for (i = 0; i < itemsList.size(); i++)
      Interface.Log("   - vehicle " + (string)i + ": '" + itemsList[i] + "'"); 
  }

  int GetImageWidth() { return 64; }


  //
  // Gets the vehicle for the given vehicle (localised name)
  //
  Vehicle GetVehicle(string vehicleName)
  {
    Vehicle[] worldVehicles = World.GetVehicleList();
    int i;

    for (i = 0; i < worldVehicles.size(); i++)
      if (worldVehicles[i].GetName() == vehicleName)
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
      retString[2] = vehicle.GetName();
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

    int listSize = itemsList.size();

    htmlPage = htmlPage + HTMLWindow.StartTable("cellpadding=2 cellspacing=2 bordercolor=#00000059 width=90%") + HTMLWindow.StartRow("bgcolor=#00000059") +
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
        string column1 = HTMLWindow.StartCell("width=20%") + 
                         HTMLWindow.StartLink("' tooltip='" + tableColumn[0]) + 
                         HTMLWindow.MakeImage(tableColumn[1], true, GetImageWidth(), 32) + 
                         HTMLWindow.EndLink() + HTMLWindow.EndCell();

        // 2nd column - localised name of vehicle instance
        string column2 = HTMLWindow.StartCell("width=60%") + BrowserInterface.Quote(tableColumn[2]) + HTMLWindow.EndCell();

        // 3rd column - link to delete the vehicle from table
        string column3 = HTMLWindow.StartCell("width=20%") + HREF("delete/" + (string)i) +
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
                          HTMLWindow.MakeCell("", "width=20%") +
                          HTMLWindow.MakeCell("", "width=60%") +
                          HTMLWindow.MakeCell(HREF("add") + HTMLWindow.MakeImage(kuidImgAddString, true, 32, 32) + HTMLWindow.EndLink(), "width=20%") + HTMLWindow.EndRow();

    htmlPage = htmlPage + HTMLWindow.EndTable(); // + "<br>";

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
        if (!TrainUtil.AlreadyThereStr(itemsList, worldVehicles[i].GetName()) )
          retString[out++] = worldVehicles[i].GetName();
    }

    return retString;
  }

  public void SetProperties(Soup soup)
  {
    Soup itemsSoup = soup.GetNamedSoup(Prop("itemslist"));
    if (itemsSoup.CountTags() > 0)
    {
      int i, out = 0;
      for (i = 0; i < itemsSoup.CountTags(); i++)
      {
        string vehicleName = itemsSoup.GetNamedTag((string)i);
        if (GetVehicle(vehicleName))
          itemsList[out++] = vehicleName;
        else
          Interface.Log("SpecificVehiclesInfo.SetProperties> Not adding vehicle '" + vehicleName + "' as it does not exist");
      }
    }

  }

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


  //! Determines if the given Train contains one or more of the specific vehicles this handler has.
  //
  // This method is used by TrainHelperInfo::DoesMatch() for the specific vehicles part of the train filter.
  // It is public and can also be called by any script code and used alone if desired.
  //
  // Param:  train  Train to compare the vehicles of against this handler's definition.
  //
  // Returns:
  //     Returns true if <i train> contains at least one of the vehicles that this handler specifies.
  //     Vehicles in <i train> that are not in this handler's list will not cause failure.  If <i train> 
  //     does not contain one single vehicle that this handler specifies, false is returned.
  //
  // See Also:
  //     TrainHelperInfo::DoesMatch(), VehicleTypesInfo::DoesMatch(), DriversInfo::DoesMatch()
  //
  public bool DoesMatch(Train train)
  {
    // if list is empty, we assume a wildcard filter that allows all vehicle instances
    if (itemsList.size() == 0)
    {
      //Interface.Log("##--> SpecificVehiclesInfo.DoesMatch> items list empty, assumming wild card pass for '" + typeName + "' filter");
      return true;
    }

    // check if all of the vehicles in this item's list are in train, true if so
    if (train)
    {
      Vehicle[] vehicles = train.GetVehicles();

      // how we use these flags in the future depends on if we are to AND or OR when comparing vehicles
      // against the items list
      bool atLeastOnce = false;  // is there at least one vehicle in the consist that is also in items list?
      bool failedOnce  = false;  // is there at least one vehicle in consist that is not in items list?

      // cycle through each vehicle in train consist
      int i;
      for (i = 0; i < vehicles.size(); i++)
      {
        // check if current vehicle exists in the list of this helper
        if (TrainUtil.AlreadyThereStr(itemsList, vehicles[i].GetName()))
          // if we reach here, we know that this vehicles is in the list
          atLeastOnce = true;
        else
          failedOnce = true;
      }

      // every vehicle in the consist is present in the list, so an AND logic compariosn would be satisfied
      if (!failedOnce)
        return true;
      else if (atLeastOnce)
        return true;

    } // if train

    // reach here, must be no matches
    return false;
  }

  //! Determines if the given Train contains all of the specific vehicles this handler has.
  //
  // This method is a stricter version of DoesMatch() that requires the given train to have all of the 
  // vehicles in it that this handler has.  It is not used by TrainHelperInfo::DoesMatch() and is mainly
  // provided as a convenience for use in child classes derived from TrainHelperInfo that may have stricter
  // requirements.
  //
  // Param:  train  Train to compare the vehicles of against this handler's list.
  //
  // Returns:
  //     Returns true if <i train> contains all of the vehicles that this handler specifies.  Vehicles in 
  //     <i train> that are not in this handler's list will not cause failure.  If <i train> does not 
  //     contain all of the vehicles that this handler specifies, false is returned.
  //
  // See Also:
  //     VehicleTypesInfo::DoesMatchAnd(), DriversInfo::DoesMatchAnd()
  //
  public bool DoesMatchAnd(Train train)
  {
    Vehicle[] vehicles = train.GetVehicles();
    string[] vehicleNames = new string[0];
    int i;

    // initialize vehicle names list
    for (i = 0; i < vehicles.size(); i++)
    {
      vehicleNames[i] = vehicles[i].GetName();
      //Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAnd> Adding vehicle '" + vehicleNames[i] + "' to check list");
    }

    // is every vehicle in the items list present in this train? 
    // (ie all are required to pass, not just one or more)
    for (i = 0; i < itemsList.size(); i++)
      if (!TrainUtil.AlreadyThereStr(vehicleNames, itemsList[i]))
      {
        //Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAnd> Filter failed on '" + itemsList[i] + "' not being in train!");
        return false;
      }
      
    Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAnd> Consist match found!");
    return true;
  }

  //! Determines if the given Train exclusively contains all of the specific vehicles this handler has.
  //
  // This method is a stricter version of DoesMatchAnd() that requires the given train to have all of the 
  // vehicles in it that this handler has to the exclusion of all other vehicles.  It is not used by 
  // TrainHelperInfo::DoesMatch() and is mainly provided as a convenience for use in child classes derived
  // from TrainHelperInfo that may have stricter requirements.
  //
  // Param:  train  Train to compare the vehicles of against this handler's list.
  //
  // Returns:
  //     Returns true if <i train> contains all of the vehicles that this handler specifies and no other
  //     vehicles.  This means that for this method to pass <i train> as being valid, it's vehicles must be
  //     the same as this handler's, although the ordering of vehicles does not have to match.  If <i train>
  //     has a vehicle that this handler's list doesn't, false will be returned.
  //
  // See Also:
  //     VehicleTypesInfo::DoesMatchAndExlcude(), DriversInfo::DoesMatchAndExlcude()
  //
  public bool DoesMatchAndExlcude(Train train)
  {
    Vehicle[] vehicles = train.GetVehicles();

    // if list size in this handler and amount of train vehicles mismatch, than we quit with failure right away
    if (vehicles.size() != itemsList.size())
    {
      //Interface.Log("##--> DoesMatchAndExclude> vehicles (" + vehicles.size() + ") and items list (" + itemsList.size() + ") don't match in size...");
      return false;
    }

    // initialize vehicle names list
    string[] vehicleNames = new string[0];
    int i;
    for (i = 0; i < vehicles.size(); i++)
    {
      vehicleNames[i] = vehicles[i].GetName();

      //Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAndExclude> Adding vehicle '" + vehicleNames[i] + "' to check list");
    }

    // is every vehicle in the items list present in this train? 
    // (ie all are required to pass, not just one or more)
    for (i = 0; i < itemsList.size(); i++)
      if (!TrainUtil.AlreadyThereStr(vehicleNames, itemsList[i]))
      {
        //Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAndExlcude> FAILURE, vehicle '" + itemsList[i] + "' is NOT in our consist!");
        return false;
      }

    // if a vehicle in the consists is NOT in the items list, then this means a false is required
    for (i = 0; i < vehicleNames.size(); i++)
      if (!TrainUtil.AlreadyThereStr(itemsList, vehicleNames[i]))
      {
        //Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAndExlcude> FAILURE, vehicle '" + vehicleNames[i] + "' is NOT in this handler's list!");
        return false;
      }

    //Interface.Log("##--> SpecificVehiclesInfo.DoesMatchAndExlcude> SUCCESS: matching consist found!");
    return true;
  }

};



//! Property handler that defines a list of specific vehicle asset types to filter.
//
// This child class variation of SpecificVehiclesInfo filters vehicles based on the type they are (i.e. the
// Asset they are an instance of).
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\TrainHelperInfo.gs> script file.
//
// See Also:
//     SpecificVehiclesInfo, DriversInfo, TrainHelperInfo, VHIVehicleTypesInfo
//
class VehicleTypesInfo isclass SpecificVehiclesInfo
{
  int GetImageWidth() { return 64; }

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


  //! Determines if the given Train contains one or more of the vehicle types this handler has.
  //
  // This method is used by TrainHelperInfo::DoesMatch() for the vehicle types part of the train filter.
  // It is public and can also be called by any script code and used alone if desired.
  //
  // Param:  train  Train to compare the vehicle types of against this handler's list.
  //
  // Returns:
  //     Returns true if <i train> contains at least one of the vehicle types that this handler specifies.
  //     Vehicle types in <i train> that are not in this handler's list will not cause failure.  If <i train>
  //     does not contain one single vehicle type that this handler specifies, false is returned.
  //
  // See Also:
  //     TrainHelperInfo::DoesMatch(), SpecificVehiclesInfo::DoesMatch(), DriversInfo::DoesMatch()
  //
  public bool DoesMatch(Train train)
  {
    // if list is empty, we assume a wildcard filter that allows all vehicle types
    if (itemsList.size() == 0)
    {
      //Interface.Log("##--> VehicleTypesInfo.DoesMatch> items list empty, assumming wild card pass for '" + typeName + "' filter");
      return true;
    }

    if (train)
    {
      // check if all of the vehicle types in this item's list are in the train, true if so
      Vehicle[] vehicles = train.GetVehicles();

      // how we use these flags in the future depends on if we are to AND or OR when comparing vehicles
      // against the items list
      bool atLeastOnce = false;  // is there at least one vehicle in the consist that is also in items list?
      bool failedOnce  = false;  // is there at least one vehicle in consist that is not in items list?

      // cycle through each vehicle in train consist
      int i;
      for (i = 0; i < vehicles.size(); i++)
      {
        // check if current vehicle exists in the list of this helper
        if (TrainUtil.AlreadyThereStr(itemsList, vehicles[i].GetAsset().GetName()))
        {
          // if we reach here, we know that this vehicles is in the list
          //Interface.Log("##--> VehicleTypesInfo.DoesMatch> Vehicle '" + vehicles[i].GetLocalisedName() + "' of type '" + vehicles[i].GetAsset().GetName() + "' is in items list, '" + typeName + "' filter passed");
          atLeastOnce = true;
        }
        else
        {
          //Interface.Log("##--> VehicleTypesInfo.DoesMatch> Vehicle '" + vehicles[i].GetLocalisedName() + "' of type '" + vehicles[i].GetAsset().GetName() + "' is not in items list, '" + typeName + "' filter failed!");
          failedOnce = true;
        }
      }

      //  every vheicle in the consist is present in the list, so an AND logic compariosn would be satisfied
      if (!failedOnce)
        return true;
      else if (atLeastOnce)
        return true;

    } // if train

    // reach here, must be no matches
    return false;
  }


  //! Determines if the given Train contains all of the vehicle types this handler has.
  //
  // This method is a stricter version of DoesMatch() that requires the given train to have all of the
  // vehicle types that this handler has.  It is not used by TrainHelperInfo::DoesMatch() and is mainly
  // provided as a convenience for use in child classes derived from TrainHelperInfo that may have stricter
  // requirements.
  //
  // Param:  train  Train to compare the vehicle types of against this handler's list.
  //
  // Returns:
  //     Returns true if <i train> contains all of the vehicle types that this handler specifies.  Vehicle 
  //     types in <i train> that are not in this handler's list will not cause failure.  If <i train> does 
  //     not contain all of the vehicle types that this handler specifies, false is returned.
  //
  // See Also:
  //     SpecificVehiclesInfo::DoesMatchAnd(), DriversInfo::DoesMatchAnd()
  //
  public bool DoesMatchAnd(Train train)
  {
    Vehicle[] vehicles = train.GetVehicles();
    string[] vehicleNames = new string[0];
    int i;

    // initialize vehicle names list
    for (i = 0; i < vehicles.size(); i++)
      vehicleNames[i] = vehicles[i].GetAsset().GetName();

    // is every vehicle in the items list present in this train? 
    // (ie all are required to pass, not just one or more)
    for (i = 0; i < itemsList.size(); i++)
      if (!TrainUtil.AlreadyThereStr(vehicleNames, itemsList[i]))
        return false;

    return true;
  }


  //! Determines if the given Train exclusively contains all of the vehicle types this handler has.
  //
  // This method is a stricter version of DoesMatchAnd() that requires the given train to have all of the 
  // vehicle types in it that this handler has to the exclusion of all other vehicle types.  It is not used
  // by TrainHelperInfo::DoesMatch() and is mainly provided as a convenience for use in child classes derived
  // from TrainHelperInfo that may have stricter requirements.
  //
  // Param:  train  Train to compare the vehicle types of against this handler's list.
  //
  // Returns:
  //     Returns true if <i train> contains all of the vehicle types that this handler specifies and no other
  //     vehicle types.  If <i train> has a vehicle type that this handler's list doesn't, false will be 
  //     returned.
  //
  // See Also:
  //     SpecificVehiclesInfo::DoesMatchAndExlcude(), DriversInfo::DoesMatchAndExlcude()
  //
  public bool DoesMatchAndExlcude(Train train)
  {
    Vehicle[] vehicles = train.GetVehicles();
    string[] vehicleNames = new string[0];
    int i;

    // do we have any vehicle types that ARE not in this list present in the train?
    if (itemsList.size() <= 0)
      return true;

    // initialize vehicle names list
    for (i = 0; i < vehicles.size(); i++)
      vehicleNames[i] = vehicles[i].GetAsset().GetName();

    // is every vehicle in the items list present in this train? (ie all are required to pass, not just one or more)
    for (i = 0; i < itemsList.size(); i++)
      if (!TrainUtil.AlreadyThereStr(vehicleNames, itemsList[i]))
        return false;

    for (i = 0; i < vehicles.size(); i++)
      if (!TrainUtil.AlreadyThereStr(itemsList, vehicleNames[i]))
      {
        //Interface.Log("##--> VehiclTypeInfos.DoesMatchAndExlcude> Filter failed, vehicle type '" + vehicleNames[i] + "' is in the train, but NOT this handler!");
        return false;
      }

    return true;
  }

};


//! Property handler that defines a list of specific driver character asset types to filter.
//
// This child class variation of SpecificVehiclesInfo filters drivers based on the type they are (i.e. the
// Asset they are an instance of).  As DriverCharacter objects are not available from within Surveyor for
// a property handler to be configured with, we have to filter drivers based on the asset that they are an
// instance of.
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be seen in the <b \Trainz\scripts\TrainHelperInfo.gs> script file.
//
// See Also:
//     SpecificVehiclesInfo, VehicleTypesInfo, TrainHelperInfo, VHIDriversInfo, DriverCharacter
//
class DriversInfo isclass SpecificVehiclesInfo
{
  int GetImageWidth() { return 32; }


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
  // A list of driver character assets provided for the "add" property
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

  //
  // Overridden to avoid the base assuming the items are vehicles
  //
  public void SetProperties(Soup soup)
  {
    Soup itemsSoup = soup.GetNamedSoup(Prop("itemslist"));
    int i, out = 0;
    for (i = 0; i < itemsSoup.CountTags(); i++)
      itemsList[out++] = itemsSoup.GetNamedTag((string)i);
  }

  //! Determines if the active driver of the given train has the same name as one of the driver types this handler has.
  //
  // This method is used by TrainHelperInfo::DoesMatch() for the driver character part of the train filter.
  // It is public and can also be called by any script code and used alone if desired.
  //  
  // Param:  train  Train to find the <l Train::GetActiveDriver() active driver> of in this handler's list.
  //
  // Returns:
  //      Returns true if the name of the <l Train::GetActiveDriver() active driver> in <i train> matches one
  //      of the driver asset types in this handler's list.  If the a match can't be found or <i train> 
  //      doesn't have a driver, false is returned.
  //
  // See Also:
  //     TrainHelperInfo::DoesMatch(), SpecificVehiclesInfo::DoesMatch(), VehicleTypesInfo::DoesMatch()
  //
  public bool DoesMatch(Train train)
  {
    // if list is empty, we assume a wildcard filter that allows all driver characters
    if (itemsList.size() == 0)
    {
      //Interface.Log("##--> DriversInfo.DoesMatch> items list empty, assumming wild card pass for '" + typeName + "' filter");
      return true;
    }
    

    if (train)
    {
      // check if this train's driver (if any) is in list of allowed drivers
      DriverCharacter driver = train.GetActiveDriver();

      if (driver)
      {
        if (TrainUtil.AlreadyThereStr(itemsList, driver.GetAsset().GetName()))
        {
          // if we reach here, we know that this vehicle is in the list
          Interface.Log("##--> DriversInfo.DoesMatch> Driver '" + driver.GetAsset().GetName() + "' is in items list, '" + typeName + "' filter passed");
          return true;
        }
      }
    }

    // reach here, must be no matches
    return false;
  }

  //! This method is not relevant to DriversInfo.
  //
  // This method was meant to be used for vehicles and isn't really needed or suitable for use with a driver
  // character.  The DriversInfo implementation of this method simply passes <i train> on to DoesMatch() and
  // returns the results.
  //
  // Returns:
  //     Returns the results of <l DoesMatch()  DoesMatch>(<i train>).
  //
  // See Also:
  //     VehicleTypesInfo::DoesMatchAnd(), SpecificVehiclesInfo::DoesMatchAnd()
  //
  public bool DoesMatchAnd(Train train)
  {
    // only allow one driver so return that (i.e. not AND across all drivers on one train!)
    return DoesMatch(train);
  }

  //! This method is not relevant to DriversInfo.
  //
  // This method was meant to be used for vehicles and isn't really needed or suitable for use with a 
  // driver character.  The DriversInfo implementation of this method always returns true.
  //
  // Returns:
  //     Always returns true.
  //
  // See Also:
  //     VehicleTypesInfo::DoesMatchAndExlcude(), SpecificVehiclesInfo::DoesMatchAndExlcude()
  //
  public bool DoesMatchAndExlcude(Train train)
  {
    return true;
  }

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
  // if true, trains will be filtered according to options, otherwise false and all trains will be allowed
  bool filterTrains = false;
  bool userControlTrains = true;

  SpecificVehiclesInfo specVehiclesInfo;
  VehicleTypesInfo     vehicleTypesInfo;
  DriversInfo          driversInfo;


  public void DebugLog(void)
  {
    specVehiclesInfo.DebugLog();
  }

  //! Determines if the given train matches the filter requirements of this handler.
  //
  // Param:  train  Train to compare against this handler's definition.
  //
  // Returns:
  //     Returns true if <i train> matches the criteria as defined by this handler, false otherwise.
  //
  public bool DoesMatch(Train train);

  //! Indicates if this handler's filtering is switched on or off.
  //
  // The train handler includes a mechanism in the properties interface to switch filtering off such that
  // DoesMatch() will always return true.
  // 
  // Returns:
  //     Returns true if this handler's train filtering is enabled, false otherwise.
  //
  public bool DoesFilterTrains(void) { return filterTrains; }


  //! Initialization method.
  // 
  // This method should always be called after creating a TrainHelperInfo object and before it is used for
  // anything else.  Doing so ensures the sub-handlers used for the vehicle instances, vehicle types and
  // drivers are initialized.
  //
  public void Init(void)
  {
    specVehiclesInfo = new SpecificVehiclesInfo();
    vehicleTypesInfo = new VehicleTypesInfo();
    driversInfo      = new DriversInfo();

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

    return htmlPage;
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
  public bool DoesMatch(Train train)
  {
    // failure if train is not valid
    if (!train)
    {
      Interface.Log("# TrainHelperInfo.DoesMatch> invalid train, filter match failed");
      return false;
    }

    // filtering is disabled, so allow train to pass filter regardless
    if (!filterTrains)
    {
      //Interface.Log("# TrainHelperInfo.DoesMatch> train filtering not enabled, allowing all trains");
      return true;
    }

    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      SpecificVehiclesInfo info = cast<SpecificVehiclesInfo> handlers[i];
      if (info and !info.DoesMatch(train))
      {
        //Interface.Log("# TrainHelperInfo.DoesMatch> failed on '" + info.typeName + "' check");
        return false;
      }
    }

    // gotten this far, so train must have filtered through sucessfully
    Interface.Log("# TrainHelperInfo.DoesMatch> Filter check successful!");
    return true;
  }


  // not implemented yet
  public bool DoesMatchVehicles(Train train) { return train != null; }

  // not implemented yet
  public bool DoesMatchVehicleTypes(Train train) { return train != null; }

  // not implemented yet
  public bool DoesMatchDriver(DriverCharacter driver) { return driver != null; }

};

