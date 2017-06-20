//=============================================================================
// File: ConsistHelperInfo.gs
// Desc: 
//=============================================================================
include "Constructors.gs"
include "HTMLPropertyHandler.gs"
include "Soup.gs"
include "common.gs"


//=============================================================================
// Name: LoadHelperInfo
// Desc: Describes a load on a MapObject (e.g. Vehicle/Industry) in terms of
//       product type, queue name and queue size. This class is mainly used by
//       VehicleDescriptor to keep track of the loads a vehicle has.
//=============================================================================
class LoadHelperInfo isclass HTMLPropertyHandler
{
  public string   queueName;      // Name of product queue
  public KUID     productKUID;    // KUID of product being used
  public int      amount = 0;     // Amount of product in the load



  //=============================================================================
  // Name: InitFromQueue
  // Desc: Initialises this load descrition from the given product queue
  //=============================================================================
  public void InitFromQueue(ProductQueue queue)
  {
    queueName = queue.GetQueueName();
    amount = queue.GetQueueCount();

    productKUID = null;
    if (amount > 0)
    {
      Asset[] products = queue.GetProductList();

      int i;
      for (i = 0; i < products.size(); ++i)
      {
        if (products[i])
        {
          productKUID = products[i].GetKUID();
          break;
        }
      }
    }
  }


  //=============================================================================
  // Name: GetDescriptionHTML
  // Desc: Returns a HTML description for this config handler
  //=============================================================================
  public string GetDescriptionHTML(void)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string productName = coreStrings.GetString("interface-helper-blank-string");
    if (productKUID)
      productName = productKUID.GetName();

    if (queueName == "")
      queueName = coreStrings.GetString("interface-helper-blank-string");

    string htmlPage = HTMLWindow.StartTable("cellpadding=2 cellspacing=2 inherit-font") +
                        HTMLWindow.MakeRow(
                          HTMLWindow.MakeCell(coreStrings.GetString("load-helper-name-queue")) +
                          HTMLWindow.MakeCell(HTMLWindow.MakeLink(Link("queue"), queueName)) ) +
                        HTMLWindow.MakeRow(
                          HTMLWindow.MakeCell(coreStrings.GetString("load-helper-name-product")) +
                          HTMLWindow.MakeCell(HTMLWindow.MakeLink(Link("product"), productName))) +
                        HTMLWindow.MakeRow(
                          HTMLWindow.MakeCell(coreStrings.GetString("load-helper-name-amount")) +
                          HTMLWindow.MakeCell(HTMLWindow.MakeLink(Link("amount"), (string)amount)) ) +
                      HTMLWindow.EndTable();

    return htmlPage;
  }


  //=============================================================================
  // Name: GetPropertyName
  // Desc: Returns a human readable name for the given property
  //=============================================================================
  public string GetPropertyName(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "product") or (tokens[0] == "queue") or (tokens[0] == "amount"))
      return coreStrings.GetString("load-helper-name-" + tokens[0]);

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Returns the description for the given property
  //=============================================================================
  public string GetPropertyDescription(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "product") or (tokens[0] == "queue") or (tokens[0] == "amount"))
      return coreStrings.GetString("load-helper-desc-" + tokens[0]);

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Gets type for named property
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "product")
      return "asset-list,PROD";

    if (tokens[0] == "queue")
      return "string";

    if (tokens[0] == "amount")
      return "int,0,100000,1";

    return inherited(propertyID);
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of a property
  //=============================================================================
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if ((tokens[0] == "product") and (value.GetType() == PropertyValue.OBJECT_TYPE))
    {
      Asset selectedProduct = cast<Asset>(value.AsObject());
      if (selectedProduct)
        productKUID = selectedProduct.GetKUID();
      else
        productKUID = null;
    }
    else if ((tokens[0] == "queue") and (value.GetType() == PropertyValue.STRING_TYPE))
    {
      queueName = value.AsString();
    }
    else if ((tokens[0] == "amount")  and (value.GetType() == PropertyValue.INT_TYPE))
    {
      amount = value.AsInt();
    }

  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Gets the load data into soup database format Trainz uses
  //=============================================================================
  public Soup GetProperties()
  {
    Soup loadSoup = inherited();
    
    loadSoup.SetNamedTag("queue", queueName);
    loadSoup.SetNamedTag("product", productKUID);
    loadSoup.SetNamedTag("amount", amount);

    return loadSoup;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Initializes this load from a soup database
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    inherited(soup);

    queueName = soup.GetNamedTag("queue");
    productKUID = soup.GetNamedTagAsKUID("product");
    amount = soup.GetNamedTagAsInt("amount", 0);
  }

};



//! Describes a vehicle in a consist and provides functions to load/save with a Soup database.
//
// This class describes a vehicle in a consist in terms of its KUID, running number and direction.
// It also allows for multiple load definition. 
//
// Note that this class does not refer to a specific Vehicle instance, it just describes one for
// use in the ConsistHelperInfo class.
// 
// See Also:
//     ConsistHelperInfo, LoadHelperInfo, Soup, ConsistListHelper, Vehicle, VehicleHelperInfo
//
class VehicleDescriptor
{
  public KUID   vehicle;             //!< KUID of vehicle asset.
  public string runningNumber = "";  //!< Running number of vehicle.

  //! Direction of vehicle relative to train's forward direction.
  public bool   facing = true;
  public int    number = 1;          //!< Number of vehicles matching this description in the consist.  Default is always 1.

  //! Load/s this vehicle may be carrying/support
  public LoadHelperInfo[] load = new LoadHelperInfo[0];


  //
  // Initilizes this descriptor form a vehicle
  //
  public void InitFromVehicle(Vehicle newVehicle, bool newDirection)
  {
    // vehicle info
    vehicle       = newVehicle.GetAsset().GetKUID();
    runningNumber = newVehicle.GetRunningNumber();
    facing        = newDirection;

    // always use 1 as we don't group/bunch up vehicles like you do as a shortcut with the consist helper
    number        = 1;  

    // loads stuff
    load = new LoadHelperInfo[0]; // reset list to be empty

    // does the vehicle have any queues?
    ProductQueue[] vehicleLoad = newVehicle.GetQueues();
    if (vehicleLoad.size() > 0)
    {
      // for each queue the vehicle may posess, create a descriptor for it
      int i;
      for (i = 0; i < vehicleLoad.size(); i++)
      {
        ProductQueue queue = vehicleLoad[i];

        // init the queue load description
        load[i] = new LoadHelperInfo();
        load[i].InitFromQueue(queue);
      }
    }
  }


  //
  // Sets all queue(s) to be empty, but doesn't destroy them
  //
  void EmptyLoad(void)
  {
    int i;
    for (i = 0; i < load.size(); i++)
      load[i].amount = 0;
  }

  //
  // ?
  //
  bool IsEmpty()
  {
    int i;
    for (i = 0; i < load.size(); i++)
      if (load[i].amount > 0)
        return false;

    return true;
  }

  //
  // Loads up the first queue of the vehicle to its maximum capacity (-1 hack)
  //
  void LoadUp(void)
  {
    // simply load up first queue - use -1 to indicate this (emitter/consist creator will need to
    // consider this factor and determine maximum queue size later on)
    if (load.size() > 0)
      load[0].amount = -1;
  }


  //
  // Uses the load configuration option from a portal to adjust the load of this
  // vehicle definition.
  //
  public void AdjustLoadState(int state)
  {
    // If state is 0, so don't do anything as that means leave the vehicle alone

    // Train is loaded only - load vehicle with stuff
    if (state == 1)
    {
      LoadUp();
    }
    // Train is unloaded only - empty out vehicle's queues
    else if (state == 2)
    {
      EmptyLoad();
    }
    // Empty trains are loaded, other trains are unloaded.
    else if (state == 3)
    {
      // unload vehicle if loaded, load vehicle if unloaded
      if (IsEmpty())
        LoadUp();
      else
        EmptyLoad();
    }

  }


  public bool LoadVehicle(Vehicle vehicle)
  {
    if (!vehicle)
      return false;

    int i;
    for (i = 0; i < load.size(); i++)
    {
      ProductQueue loadQueue = vehicle.GetQueue(load[i].queueName);

      if (loadQueue)
      {
        ProductFilter filter = loadQueue.GetProductFilter();

        if (filter)
        {
          Asset[] allowableProducts = filter.GetProducts();
          Asset   theAsset;

          if (load[i].amount == -1)
            load[i].amount = loadQueue.GetQueueSize();

          // if no product, simply assign first avilable product for the queue
          if (!load[i].productKUID)
          {
            if (allowableProducts.size() > 0)
            {
              theAsset = allowableProducts[0];
              load[i].productKUID = theAsset.GetKUID();
            }
            else
            {
              return false;
            }
          }
          // set theAsset to KUID match from the array
          else
          {
            int p;
            for (p = 0; p < allowableProducts.size(); p++)
            {
              if (allowableProducts[p].GetKUID() == load[i].productKUID)
              {
                theAsset = allowableProducts[p];
                break;
              }
            }

            if (!theAsset)
            {
              Interface.Log("VehicleDescriptor.LoadVehicle> Failed to find a match for product type '" + load[i].productKUID.GetName() + "' for vehicle queue '" + load[i].queueName + "'");
              return false;
            }
          }

          // finally there...
          int loadResult = loadQueue.CreateProduct(theAsset, load[i].amount);
          Interface.Log("VehicleDescriptor.LoadVehicle> Loading queue " + load[i].queueName +
                        "' with " + loadResult + " products of type '" + load[i].productKUID.GetName());
        }
      }
    } // for

    return true;
  }



  //
  // Properties methods
  //

  //
  // Gets the vehicle data into soup database format Trainz uses.
  //
  public Soup GetProperties()
  {
    Soup vehicleSoup = Constructors.NewSoup();

    vehicleSoup.SetNamedTag("vehicle", vehicle);
    vehicleSoup.SetNamedTag("running-number", runningNumber);
    vehicleSoup.SetNamedTag("facing", facing);
    vehicleSoup.SetNamedTag("number", number);

    // vehicle load
    Soup loadSoup = Constructors.NewSoup();
    int i;
    for (i = 0; i < load.size(); i++)
      loadSoup.SetNamedSoup((string)i, load[i].GetProperties());

    vehicleSoup.SetNamedSoup("load", loadSoup);

    return vehicleSoup;
  }


  //
  // Initializes this vehicle from a soup database.
  //
  public void SetProperties(Soup soup)
  {
    vehicle       = soup.GetNamedTagAsKUID("vehicle");
    runningNumber = soup.GetNamedTag("running-number");
    facing        = soup.GetNamedTagAsBool("facing", true);
    number        = soup.GetNamedTagAsInt("number", 1); // use only 1 by default

    Soup loadSoup = soup.GetNamedSoup("load");
    if (loadSoup.CountTags() > 0)
    {
      int i;
      for (i = 0; i < loadSoup.CountTags(); i++)
      {
        load[i] = new LoadHelperInfo();
        load[i].SetProperties(loadSoup.GetNamedSoup((string)i));
      }
    }
  }

};



//! Property handler that allows a train consist to be constructed and maintained.
//
// Allows definition of a particular consist.  Contains a list of vehicles where each vehicle item
// allows for selection of the following:
//  - vehicle asset (KUID)
//  - vehicle amount (amount of vehicles of this type in a row)
//  - direction (forward/reverse - relative to train's forward direction)
//
// Note:
//     This class was mainly written for use in the portal assets and is not a core %Trainz API 
//     class.
//
// See Also:
//     ConsistListHelper, LoadHelperInfo, VehicleDescriptor, HTMLPropertyHandler, TrainHelperInfo
//
class ConsistHelperInfo isclass HTMLPropertyHandler
{
  //! Array of vehicles in this consist.
  public VehicleDescriptor[] vehicles = new VehicleDescriptor[0];

  // name of train (dervied from soup database name that encapuslates the consist)
//  public string trainName;

  // consists state flags

  //! Visibility in consist menu.  This is mostly a legacy issue and not really relevant in TRS2006.
  bool showInConsistMenu = true;

  //! Coupling mask of entire consist.
  bool couplingMask      = true;

  //! Decoupling mask of entire consist.
  bool decouplingMask    = true;

  //! Handbrake status.
  bool handbrake         = false;


  // special search flags (for train comparison)
  bool maskRequireExactOrder  = false;
  bool maskAllowExtraVehicles = false;

  bool m_showSearchInterface = true;
  bool m_showOrdersInterface = false;
  bool m_showDriverInterface = false;


  // driver character (if any, otherwise we would leave this stuff blank)
  string m_driverName = "";
  KUID   m_driverKUID;
  DriverCommands m_driverCommands;
  Soup m_driverCommandsSoup;


  //
  // Some handy consist manipulation methods
  //
  public bool AddVehicle(int index, VehicleDescriptor newVehicle);
//  public bool AppendVehicle(Vehicle newVehicle);
//  public bool AppendVehicle(Vehicle newVehicle, int regurgiateLoad);
  public bool AppendVehicle(Vehicle newVehicle, int regurgiateLoad, bool newDirection);
  public bool DeleteVehicle(int index);
  public bool VehicleExists(int index);


  //
  // Basic Accessors
  //

  public string GetDriverName()                  { return m_driverName; }
  public void   SetDriverName(string driverName) { m_driverName = driverName; }

  public KUID   GetDriverKUID()                  { return m_driverKUID; }
  public void   SetDriverKUID(KUID driverKUID)   { m_driverKUID = driverKUID; }

  public void SetShowSearchInterface(bool show)
  {
    m_showSearchInterface = show;
  }

  public void SetShowOrdersInterface(bool show)
  {
    m_showOrdersInterface = show;

    // can't show orders without drivers
    if (show)
      m_showDriverInterface = true;
  }

  public void SetShowDriverInterface(bool show)
  {
    m_showDriverInterface = show;
  }


  public obsolete void SetToSurveyorSavedConsist(string name)
  {
    Interface.WarnObsolete("ConsistHelperInfo.SetToSurveyorSavedConsist");
  }

  public bool SetFromConsistAsset(KUID consistKuid)
  {
    Asset consistAsset = TrainzScript.FindAsset(consistKuid);
    if (!consistAsset)
      return false;

    // Grab the consist data from the asset config
    Soup consistConfig = consistAsset.GetConfigSoup().GetNamedSoup("consist-list");

    // Convert the asset config into an appropriate format to pass to SetProperties
    Soup consistProperties = Constructors.NewSoup();

    int i;
    for (i = 0; i < consistConfig.CountTags(); ++i)
    {
      Soup vehicleConfig = consistConfig.GetNamedSoup(consistConfig.GetIndexedTagName(i));

      Soup vehicleProperies = Constructors.NewSoup();
      vehicleProperies.SetNamedTag("vehicle", vehicleConfig.GetNamedTagAsKUID("car-kuid"));
      vehicleProperies.SetNamedTag("running-number", vehicleConfig.GetNamedTagAsInt("car-num"));
      vehicleProperies.SetNamedTag("facing", vehicleConfig.GetNamedTagAsBool("car-dir"));

      consistProperties.SetNamedSoup((string)i, vehicleProperies);
    }

    // All done, make the SetProperties call
    SetProperties(consistProperties);

    return true;
  }


  //
  // Return the initial commands for this consist's driver.
  // Will return null if no commands are specified.
  //
  public DriverCommands GetDriverCommands(void)
  {
    if (!m_driverCommands)
      m_driverCommands = Constructors.NewDriverCommands();

    return m_driverCommands;
  }

  //
  // Sets this helper's DriverCommands to a copy of the specified DriverCommands object.
  //
  public void SetDriverCommands(DriverCommands driverCommands)
  {
    m_driverCommands = Constructors.NewDriverCommands();

    if (driverCommands)
      m_driverCommands.SetProperties( driverCommands.GetProperties() );
  }


  //
  // Inserts the given vehicle at specified location.
  // Vehicle already at that location will be shifted along to next array slot
  //
  public bool AddVehicle(int index, VehicleDescriptor newVehicle) 
  { 
    // check vehicle we are to insert after exists
    if (VehicleExists(index) and newVehicle)
    {
      // dw: is there a better way to do this?
      VehicleDescriptor[] tempArray = new VehicleDescriptor[0];
      tempArray[0] = newVehicle;
      
      vehicles[index, index] = tempArray;
      return true;
    }

    // TODO: otherwise append it to the end? (dw)
//    else { vehicles[vehicles.size()] = newVehicle }

    return false;
  }


  //
  // Appends given vehicle
  // Note: Extracts info from vehicle into descriptor to do this.
  //
  public bool AppendVehicle(Vehicle newVehicle, int regurgiateLoad, bool newDirection)
  {
    if (newVehicle)
    {
      VehicleDescriptor vehicleDesc = new VehicleDescriptor();
//      vehicleDesc.InitFromVehicle(newVehicle);
      vehicleDesc.InitFromVehicle(newVehicle, newDirection);
      vehicleDesc.AdjustLoadState(regurgiateLoad);

      // add to the end of the consist array defnition
      vehicles[vehicles.size()] = vehicleDesc;
      return true;
    }

    return false;
  }


  //
  // Deletes the specified vehicle
  //
  public bool DeleteVehicle(int index) 
  { 
    if (VehicleExists(index))
    {
      // delete the vehicle..
      vehicles[index, index+1] = null;
      return true;
    }

    return false;
  }


  //
  // Determines if the specified vehicle index exists
  //
  public bool VehicleExists(int index) 
  {
    return index < vehicles.size(); 
  }



  //
  // Properties methods
  //

  //
  // Gets HTML description
  //
	public string GetDescriptionHTML(void)
  {
    int consistSize = vehicles.size();

    StringTable strTable = Constructors.GetTrainzStrings();

    // vehicles rows
    string tableRows = HTMLWindow.MakeRow(
													HTMLWindow.MakeCell( HTMLWindow.MakeBold(strTable.GetString("consist-helper-title-vehicle")) )
                          + HTMLWindow.MakeCell( HTMLWindow.MakeBold(strTable.GetString("consist-helper-title-count")) )
                          + HTMLWindow.MakeCell( HTMLWindow.MakeBold(strTable.GetString("consist-helper-title-direction")) )
                          + HTMLWindow.MakeCell( "" )
                          + HTMLWindow.MakeCell( "" )
                       , "bgcolor=#00000059"
                       );

    int i;
    Asset core = Constructors.GetTrainzAsset();
		KUID kuidImgRemove = core.LookupKUIDTable("imgRemove");
		KUID kuidImgAdd = core.LookupKUIDTable("imgAdd");
		string kuidImgAddString = kuidImgAdd.GetHTMLString();
		string kuidImgRemoveString = kuidImgRemove.GetHTMLString();

    for (i = 0; i < consistSize; i++)
    {
      string vehicleKuidStr  = vehicles[i].vehicle.GetHTMLString();
      string vehicleName     = vehicles[i].vehicle.GetName();

      string vehicleNumCount = HTMLWindow.MakeLink(Link("vehicle/" + (string)i + "/count"), vehicles[i].number);
      string vehicleFacing   = HTMLWindow.MakeLink(Link("vehicle/" + (string)i + "/direction"), strTable.GetString("bool_str_facing_" + (string)vehicles[i].facing));
      string vehicleDelLink  = HTMLWindow.MakeLink(Link("vehicle/" + (string)i + "/delete"), HTMLWindow.MakeImage(kuidImgRemoveString, true));
      string vehicleAddLink  = HTMLWindow.MakeLink(Link("vehicle/" + (string)i + "/add"), HTMLWindow.MakeImage(kuidImgAddString, true));

      string bgColor = "";
      if (i & 1)
        bgColor = "bgcolor=#00000029";

			string vehicleImage;
			if (vehicles[i].facing)
				vehicleImage = HTMLWindow.MakeImage( vehicleKuidStr, true, 64, 32);
			else
				vehicleImage = HTMLWindow.MakeImage( vehicleKuidStr, true, 64, 32, "", "hflip");

      tableRows = tableRows + HTMLWindow.MakeRow(
                                HTMLWindow.MakeCell( "<a href='' tooltip='" + vehicleName + "'>" + vehicleImage )
                                + HTMLWindow.MakeCell( vehicleNumCount )
                                + HTMLWindow.MakeCell( vehicleFacing )
                                + HTMLWindow.MakeCell( vehicleDelLink )
                                + HTMLWindow.MakeCell( vehicleAddLink )
                              , bgColor);

    }

    consistSize = consistSize - 1;
    if (consistSize < 0)
      consistSize = 0;
    tableRows = tableRows + HTMLWindow.MakeRow(
                              HTMLWindow.MakeCell("")
                              + HTMLWindow.MakeCell("")
                              + HTMLWindow.MakeCell("")
                              + HTMLWindow.MakeCell("")
                              + HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + m_prefix + "vehicle/" + (string)(consistSize + 1) + "/add", HTMLWindow.MakeImage(kuidImgAddString, true)))
                            , "bgcolor=#00000059"
                            );
		
		string maskOrderStr = "";
		string maskExtrasStr = "";

		if (m_showSearchInterface)
		{
			// check boxes
			maskOrderStr = HTMLWindow.CheckBox(Link("order"), maskRequireExactOrder) + strTable.GetString("interface_helper_consist_order");
			maskExtrasStr = HTMLWindow.CheckBox(Link("extras"), maskAllowExtraVehicles) + strTable.GetString("interface_helper_consist_extras");
			
			/*
			maskOrderStr  = strTable.GetString3("interface_helper_consist_order", m_prefix, "tool tip", 
																								 strTable.GetString("checkbox_image_" + (string)maskRequireExactOrder));
			maskExtrasStr = strTable.GetString3("interface_helper_consist_extras", m_prefix, "tool tip", 
																								 strTable.GetString("checkbox_image_" + (string)maskAllowExtraVehicles));
			*/
			maskOrderStr = maskOrderStr + "<br>";
		}

		string drivers = "";
		string orders = "";
		
		if (m_showDriverInterface)
		{
			if (m_driverKUID)
			{
				drivers = "<br><p>Driver: " + 
					HREF("driver-name") + m_driverName + "</a> " +
					HREF("add-driver") + "<img kuid='" + m_driverKUID.GetHTMLString() + "' width=32 height=32></a> (" +
					HREF("remove-driver") + strTable.GetString("consist-helper-remove-driver") + "</a>)</p>";
				
				if (m_showOrdersInterface)
				{
					orders = "<trainz-object style='driver-order-bar' width=90% height=80 id='" + Prop("orders") + "'></trainz-object>";

					orders = HTMLWindow.StartIndent(10) + orders + HTMLWindow.EndIndent();
				}
			}
			else
			{
//				drivers = "<br><p>" + HREF("add-driver") + "Add driver to consist</a></p>";
				drivers = "<br><p>" + HREF("add-driver") + strTable.GetString("interface_helper_consist_driver") + "</a></p>";
			}
		}
		
		string surveyorConsists;
		
		if (consistSize == 0  and  !m_driverKUID)
			surveyorConsists = "<p>" + HREF("saved-consist") + strTable.GetString("interface_helper_consist_existing") + "</a></p>";


    // final page
    return "<font color=#FFFFFF><table cellpadding=2 cellspacing=2 bordercolor=#00000059 inherit-font>" + tableRows + "</table>" + 
           maskOrderStr + maskExtrasStr + drivers + orders + surveyorConsists + "</font>";// + "<br><br>";
  }


	public void RefreshBrowser(Browser browser)
	{
		if (m_showOrdersInterface)
		{
			if (!m_driverCommands)
				m_driverCommands = Constructors.NewDriverCommands();

			browser.SetElementObjectProperty(Prop("orders"), "driver-commands", cast<object> m_driverCommands);
		}
	}


  //
  // Get user-friendly name for given property.
  //
  public string GetPropertyName(string propertyID)
  {
    StringTable coreStrings = Constructors.GetTrainzStrings();

    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "vehicle")
    {
      // do we need to check tokens[1] for valid vehicle name?
      if (tokens[2] == "count")
        return coreStrings.GetString("consist-helper-name-count");

      if (tokens[2] == "add")
        return coreStrings.GetString("consist-helper-name-add");

      if (tokens[2] == "direction")
        return coreStrings.GetString("consist-helper-name-direction");

      if (tokens[2] == "delete")
        return coreStrings.GetString("consist-helper-name-delete");

    }

    if (tokens[0] == "order")
      return coreStrings.GetString("consist-helper-name-order");

    if (tokens[0] == "extras")
      return coreStrings.GetString("consist-helper-name-extras");

		if (tokens[0] == "saved-consist")
      return coreStrings.GetString("consist-helper-name-saved-consist");

		if (tokens[0] == "add-driver")
      return coreStrings.GetString("consist-helper-name-add-driver");

		if (tokens[0] == "driver-name")
      return coreStrings.GetString("consist-helper-name-driver-name");


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

    if (tokens[0] == "vehicle")
    {
      // do we need to check tokens[1] for valid vehicle name?
      if (tokens[2] == "count")
        return coreStrings.GetString("consist-helper-desc-count");

      if (tokens[2] == "add")
        return coreStrings.GetString("consist-helper-desc-add");

      if (tokens[2] == "direction")
        return coreStrings.GetString("consist-helper-desc-direction");

      if (tokens[2] == "delete")
        return coreStrings.GetString("consist-helper-desc-delete");
    }
    
    if (tokens[0] == "order")
      return coreStrings.GetString("consist-helper-desc-order");

    if (tokens[0] == "extras")
      return coreStrings.GetString("consist-helper-desc-extras");

		if (tokens[0] == "saved-consist")
      return coreStrings.GetString("consist-helper-desc-saved-consist");

		if (tokens[0] == "add-driver")
      return coreStrings.GetString("consist-helper-desc-add-driver");

		if (tokens[0] == "driver-name")
      return coreStrings.GetString("consist-helper-desc-driver-name");

    return inherited(propertyID);
  }

  
  //
  // Gets link type for named property.
  //
  public string GetPropertyType(string propertyID)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "vehicle")
    {
      // do we need to check tokens[1] for valid vehicle name?
      if (tokens[2] == "count")
        return "int,1,500,1";
        
      if (tokens[2] == "add")
        return "asset-list,TR;TV";

      if (tokens[2] == "direction")
        return "link";

      if (tokens[2] == "delete")
        return "link";
    }

    if (tokens[0] == "order")
      return "link";

    if (tokens[0] == "extras")
      return "link";

		if (tokens[0] == "add-driver")
			return "asset-list,DR";

		if (tokens[0] == "remove-driver")
			return "link";

		if (tokens[0] == "driver-name")
			return "string";

		if (tokens[0] == "saved-consist")
			return "asset-list,CN";

    return "null";
  }


  //
  // Gets value of named property as a string.
  //
  public string GetPropertyValue(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");

    if (tokens[0] == "vehicle")
    {
      int vehicleIndex = Str.ToInt(tokens[1]);
      if (vehicleIndex < vehicles.size())
      {
        if (tokens[2] == "count")
          return (string) vehicles[vehicleIndex].number;
        else if (tokens[2] == "direction")
          return strTable.GetString("bool_str_facing_" + (string)vehicles[vehicleIndex].facing);
      }
    }

    // needed?
    if (tokens[0] == "order")
      return (string)maskRequireExactOrder;

    if (tokens[0] == "extras")
      return (string)maskAllowExtraVehicles;

    // do nothing
    return "";
  }


  //
  // Sets value of named property.
  //
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string strippedPropStr = PropStripPrefix(propertyID, "");
    string[] tokens = Str.Tokens(strippedPropStr, "/");
    
    if (tokens[0] == "vehicle")
    {
      int vehicleIndex = Str.ToInt(tokens[1]);

      if ((tokens[2] == "add") and (value.GetType() == PropertyValue.OBJECT_TYPE))
      {
        Asset selectedVehicle = cast<Asset>(value.AsObject());
        if (selectedVehicle)
        {
          VehicleDescriptor newVehicle = new VehicleDescriptor();
          newVehicle.vehicle = selectedVehicle.GetKUID();

          VehicleDescriptor[] newRange = new VehicleDescriptor[1];
          newRange[0] = newVehicle;
          if (vehicles.size() == 0)
            vehicles = newRange;
          else
            vehicles[vehicleIndex, vehicleIndex] = newRange;
        }

      }
      else if (vehicleIndex < vehicles.size())
      {
        // adjust count value of vehicle
        if ((tokens[2] == "count") and (value.GetType() == PropertyValue.INT_TYPE))
          vehicles[vehicleIndex].number = value.AsInt();

        // invert direction of vehicle
        else if ((tokens[2] == "direction") and (value.GetType() == PropertyValue.NULL_TYPE))
          vehicles[vehicleIndex].facing = !vehicles[vehicleIndex].facing;

        // delete the vehicle
        else if ((tokens[2] == "delete") and (value.GetType() == PropertyValue.NULL_TYPE))
          DeleteVehicle(vehicleIndex);
      }
    }
    else if ((tokens[0] == "order") and (value.GetType() == PropertyValue.NULL_TYPE))
    {
      maskRequireExactOrder = !maskRequireExactOrder;
    }
    else if ((tokens[0] == "extras") and (value.GetType() == PropertyValue.NULL_TYPE))
    {
      maskAllowExtraVehicles = !maskAllowExtraVehicles;
    }
    else if (tokens[0] == "add-driver")
    {
      Asset selectedDriver = cast<Asset>(value.AsObject());
      if (selectedDriver)
      {
        m_driverKUID = selectedDriver.GetKUID();
        m_driverName = selectedDriver.GetLocalisedName();
      }
    }
    else if (tokens[0] == "remove-driver")
    {
      m_driverKUID = null;
      m_driverName = "";
      m_driverCommands = null;
    }
    else if (tokens[0] == "driver-name")
    {
      string newName = value.AsString();
      if (newName != "")
        m_driverName = newName;
    }
    else if (tokens[0] == "saved-consist")
    {
      Asset selectedConsist = cast<Asset>(value.AsObject());
      if (selectedConsist)
        SetFromConsistAsset(selectedConsist.GetKUID());
    }

  }


  //
  // Initializes this train consist from a soup database.
  //
  public void SetProperties(Soup soup)
  {
    // consist settings flags
    showInConsistMenu = soup.GetNamedTagAsBool("show-in-consist-menu");
    couplingMask      = soup.GetNamedTagAsBool("coupling-mask");
    decouplingMask    = soup.GetNamedTagAsBool("decoupling-mask");
    handbrake         = soup.GetNamedTagAsBool("handbrake");

    maskRequireExactOrder  = soup.GetNamedTagAsInt("mask-require-exact-order");
    maskAllowExtraVehicles = soup.GetNamedTagAsInt("mask-allow-extra-vehicles");

    // driver info
    m_driverKUID = soup.GetNamedTagAsKUID("driver-kuid");
    m_driverName = soup.GetNamedTag("driver-name");

		// driver commands
		Soup driverCommandsSoup = soup.GetNamedSoup("driverCommands");
		if (driverCommandsSoup.CountTags())
		{
			m_driverCommands = Constructors.NewDriverCommands();
			m_driverCommands.SetProperties( driverCommandsSoup );
		}

    // consist vehicles
    int i = 0;
    while (true)
    {
      Soup vehicleSoup = soup.GetNamedSoup((string)i);
      if (vehicleSoup.CountTags() > 0)
      {
        vehicles[i] = new VehicleDescriptor();
        vehicles[i].SetProperties(vehicleSoup);
      }
      else 
        break;

      i++;
    }

  }


  //
  // Gets the train consist data into soup database format Trainz uses.
  //
  public Soup GetProperties(void)
  {
    Soup trainSoup = Constructors.NewSoup();

    // consist settings flags
    trainSoup.SetNamedTag("show-in-consist-menu", showInConsistMenu);
    trainSoup.SetNamedTag("coupling-mask", couplingMask);
    trainSoup.SetNamedTag("decoupling-mask", decouplingMask);
    trainSoup.SetNamedTag("handbrake", handbrake);

    trainSoup.SetNamedTag("mask-require-exact-order", maskRequireExactOrder);
    trainSoup.SetNamedTag("mask-allow-extra-vehicles", maskAllowExtraVehicles);

    // driver info
		if (m_driverKUID)
			trainSoup.SetNamedTag("driver-kuid", m_driverKUID);

		if (m_driverName != "")
			trainSoup.SetNamedTag("driver-name", m_driverName);

		// driver commands
		if (m_driverCommands)
			trainSoup.SetNamedSoup("driverCommands", m_driverCommands.GetProperties());

    // consist vehicles
    int i;
    for (i = 0; i < vehicles.size(); i++)
      trainSoup.SetNamedSoup((string)i, vehicles[i].GetProperties());

    return trainSoup;
  }


};

