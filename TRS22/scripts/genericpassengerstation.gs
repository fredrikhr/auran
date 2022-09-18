//
// GenericPassengerStation.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//


include "BaseIndustry.gs"
include "PassengerStationInfo.gs"


//! Defines the track and side of the vehicle where passengers can get on and off a train.
//
// This class is used as the return value of the <l GenericPassengerStation::GetTrackAndSide()  GetTrackAndSide>()
// method in GenericPassengerStation which you must implement if using that class for your station.
//
// See Also:
//     GenericPassengerStation::GetTrackAndSide()
//
class TrackLoadInfo
{
	public string trackName;        //!< Name of the track in the station.
	public bool trainLeftSide;      //!< Indicates if the platform is on the left (true) or right (false) side of the train.
	public int platformIndex = -1;  //!< Index value for the platform.  This follows the general convention of 0 being the index to platform 1 etc.
};


//! A generic passenger station class that can be used to build functional stations easily.
//
// This industry class provides the framework needed to easily make a generic passenger station with one or
// more platforms.  Passenger loading/unloading and the properties interface are all handled automatically
// by this class such that not too much work needs to be done by the creator of a station asset to get their
// station to work in the %Trainz World.
//
// For a station to work with this generic class, it must have two <l GetProcessNameList()  industry processes>
// and two <l GetQueues()  product queues> for each platform.  A platform in a station has an index value
// associated with it such that the first platform has an index of 0 and the second one has an index of 1 etc.
//
// For each platform, the following processes are required (where x is the platform index):
//  - <n "passenger_spawn_x">
//  - <n "passenger_delete_x">
//
// As well as the two processes, the following two queues are required to for a platform as well:
//  - <n "passengers_off_x">
//  - <n "passengers_on_x">
//
// The <n "passengers_off_x"> queue is where disembarked passengers are placed on platform x and deleted by
// the <n "passenger_delete_x"> process.  The <n "passenger_spawn"> process creates new passengers for
// the <n "passengers_on_x"> queue to board a train.
//
// For your station to make use of this class to automatically handle its loading and disembarking of 
// passengers, the following four methods need to be implemented in your own station:
//  - Init(void)
//  - GetTrackAndSide()
//  - TriggerSupportsMassStoppedLoad()
//  - AppendDriverDestinations()
//
// For the Init() method, you must tell the script how many platforms the station has with InitPassengerStation()
// and then call StationMain() to start station's thread.  An example Init() method is provided below:
//
//<code>
//public void Init(void)
//{
//  inherited();
//
//  InitPassengerStation(2);
//
//  StationMain();
//}
//</code>
//
// Note how the parent method is called through to with the <l gscLangKeyInherit  inherited> keyword.  You 
// should <bi ALWAYS> do this to ensure initialization tasks in overridden methods are performed.
//
// The GetTrackAndSide() method will be used by the generic passenger station script to determine which side
// of a Vehicle that the doors will open on.  How to go about implementing that method is examined in its
// <l GetTrackAndSide()  description>.
//
// TriggerSupportsMassStoppedLoad() is a BaseIndustry method used to determine if an industry (which a station
// technically is from the script point of view) supports mass stopped loading for a Vehicle on the named 
// scenery trigger.  For passenger stations, mass stopped loading is used to transfer passengers between 
// stopped vehicles and the platform, hence this method must return true if the given vehicle is on scenery 
// triggers near the platform.
//
//<code>
//bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName)
//{
//  bool vehicleToTrain = vehicle.GetFacingRelativeToTrain();
//
//  if (triggerName == "trigger_track_0_a" or triggerName == "trigger_track_0_e")
//  {
//    int direction = vehicle.GetRelationToTrack(me, "track_0");
//    if (!vehicleToTrain)
//      direction = -direction;
//
//    if (direction == Vehicle.DIRECTION_BACKWARD and triggerName == "trigger_track_0_e")
//      return true;
//
//    if (direction == Vehicle.DIRECTION_FORWARD and triggerName == "trigger_track_0_a")
//      return true;
//  }
//
//  if (triggerName == "trigger_track_0_a" or triggerName == "trigger_track_0_b" or triggerName == "trigger_track_0_c" or triggerName == "trigger_track_0_d" or triggerName == "trigger_track_0_e")
//  {
//    if (vehicle.GetMyTrain().IsStopped())
//      return true;
//  }
//
//  return false;
//}
//</code>
//
// Note how in the above code if the vehicle is in either the first (<m"trigger_track_0_a">) or last 
// (<m"trigger_track_0_e">) scenery trigger and is facing a particular direction, true is returned without
// verifying that the train has stopped.  This is because that vehicle is about to enter the inner scenery
// triggers.  If the vehicle is in a train that has stopped in any of the scenery triggers along the 
// platform, true is returned.  Any other situation results in false.
//
// AppendDriverDestinations() is an Industry method used to determine different destination tracks for a
// train in that industry for use by the <l astSrcDriveCmdDriveTo  Drive To> driver command.  For a station
// based on this class, a destinations for each platform is required.  Here is an example implementation
// for a station with two platforms:
//
//<code>
//public void AppendDriverDestinations(string[] destNames, string[] destTracks)
//{
//  destNames[destNames.size()]   = "Platform 1";
//  destTracks[destTracks.size()] = "track_0";
//
//  destNames[destNames.size()]   = "Platform 2";
//  destTracks[destTracks.size()] = "track_1";
//}
//</code>
//
// Note that the code above has been kept simple for demonstration purpose.  You should ideally use string
// table entries from your asset's <l Asset::GetStringTable()  string table> for things like the platform
// names as this makes localisation of assets much easier.
//
// This class is used to provide passenger functionality for the following stations:
//  - <l astSrcIndAirport         Airport>
//  - <l astSrcIndBrickStatLarge  Brick Station Large>
//  - <l astSrcIndBrickStatMed    Brick Station Medium>
//  - <l astSrcIndBrickStatMed2   Brick Station Medium2>
//  - <l astSrcIndBrickStatSmall  Brick Station Small>
//  - <l astSrcIndSeaPort         Seaport>
//  - <l astSrcIndSmallStat       Small Station>
//
// The full script source code is included for all of the above stations and provide plenty of implementation
// examples.
//
// See Also:
//     PassengerStationInfo, TrackLoadInfo, GenericIndustry
//
class GenericPassengerStation isclass BaseIndustry
{

	//! \name   Passenger Station Actions
	//  \anchor passengerStationActions
	//@{
	//! Passenger Station Actions
	//
	// These constants define the different types of loading/unloading actions that can occur in a 
	// GenericPassengerStation.
	// 
	// See Also:
	//     GenericPassengerStation::PerformProductLoadAndUnload()
	//

	define int ACTION_NOTHING = 0;    //!< No passenger action.
	define int ACTION_LOADING = 1;    //!< Passengers are boarding (being loaded to) the train.
	define int ACTION_UNLOADING = 2;  //!< Passengers are disembarking (unloading from) the train.
	
	//@}


	public PassengerStationInfo[] psi;  //!< Property handlers, one for each platform.
	public int m_platformCount = 0;     //!< Amount of platforms this station has.

	IndustryTrainController itcPassengerStation = new IndustryTrainController();


	//! Update the station process parameters from the platform handler 'time-of-day graph' settings.
	public void UpdateStationParameters(void);


/*
	
	EXAMPLE CODE
	DO NOT REMOVE

  public void Init(void)
  {
    inherited();

    InitPassengerStation(2);

    StationMain();
  }
*/


	//! Determines which side of the given vehicle passengers will board and disembark from.
	//
	// This method is used by the station script to determine which track, platform and side <i vehicle>
	// passengers will board and disembark from.
	//
	// This is one of the four methods that <bi MUST> be implemented for and the reason a custom implementation
	// is that each station's platform(s), track and scenery trigger is going to be very specific to the
	// station.
	//
	// When implementing this method, the programmer needs to set the <l TrackLoadInfo::trackName  trackName>,
	// <l TrackLoadInfo::trainLeftSide  trainLeftSide> and <l TrackLoadInfo::platformIndex  platformIndex>
	// members of the <i retInfo> parameter.  How these values are filled needs to be determined based on the
	// <i vehicle> and <i triggerName>.
	//
	// An example implementation for a station with two platforms is provided below:
	//
	//<code>
	//void GetTrackAndSide(Vehicle vehicle, string triggerName, TrackLoadInfo retInfo)
	//{
	//  if (triggerName == "trigger_track_one_a" or triggerName == "trigger_track_one_b" or triggerName == "trigger_track_one_c")
	//  {
	//    retInfo.trackName = "track_one";
	//    retInfo.trainLeftSide = (vehicle.GetRelationToTrack(me, retInfo.trackName) != Vehicle.DIRECTION_BACKWARD) == vehicle.GetDirectionRelativeToTrain();
	//    retInfo.platformIndex = 0;
	//  }
	//  else if (triggerName == "trigger_track_two_a" or triggerName == "trigger_track_two_b" or triggerName == "trigger_track_two_c")
	//  {
	//    retInfo.trackName = "track_two";
	//    retInfo.trainLeftSide = (vehicle.GetRelationToTrack(me, retInfo.trackName) == Vehicle.DIRECTION_BACKWARD) == vehicle.GetDirectionRelativeToTrain();
	//    retInfo.platformIndex = 1;
	//  }
	//}
	//</code>
	//
	// Note how the  vehicle's direction relative to the track is checked, hence the programmer needs to 
	// understand the direction of their station's track pieces.
	//
	// If an implementation is not provided for this method, a script exception will be thrown.
	//
	// Param:  vehicle      Vehicle to find the side of.
	// Param:  triggerName  Name of scenery trigger where loading/unloading is to take place.
	// Param:  retInfo      Return parameter that this method must setup with details of the 
	//                      <l TrackLoadInfo::trackName  track name>, 
	//                      <l TrackLoadInfo::trainLeftSide  vehicle side> and 
	//                      <l TrackLoadInfo::platformIndex  platform index number>.
	//
	void GetTrackAndSide(Vehicle vehicle, string triggerName, TrackLoadInfo retInfo)
	{
		// TO BE OVERRIDDEN
		Interface.Exception("GenericPassengerStation.GetTrackAndSide> not overridden");
	}


  //! Transfers passengers between a train and a platform on this station.
  //
  // This method is called by PerformMassStoppedLoad() to transfer passengers between <i queue> and <i train>.
  // As it is fully implemented in GenericPassengerStation, it is not something you need to worry about for 
  // your own station.  However those who are curious can find the full implementation of this method in the
  // <b \Trainz\scripts\GenericPassengerStation.gs> script file.
  //
  // Param:  queue   Passenger product queue for the platform that the passengers are going to be transferred
  //                 to/from.
  // Param:  train   Train that the passengers will get on/off from.
  // Param:  action  Defines whether this method is to board (\ref passengerStationActions "ACTION_LOADING")
  //                 or disembark (\ref passengerStationActions "ACTION_UNLOADING") passengers.  Note that
  //                 there are separate queues for boarding and leaving passengers so this method would be 
  //                 called more than once.
  // Param:  info    Defines the side of the train, track and platform that this boarding/disembarking is to
  //                 happen on.
  // Retn: bool - True if the load/unload completed, or false if it was interrupted.
  //
	bool PerformProductLoadAndUnload(ProductQueue queue, Train train, int action, TrackLoadInfo info)
	{
    int i, j, k;

    // Load each of the vehicles up evenly.
    Vehicle[] vehicles = train.GetVehicles();

    // Loop through this list that is returned, and create another list of the vehicle that
    // will accept our product (i.e. the passengers)
    Vehicle[] compatVehicles = new Vehicle[0];

		int passengersOnTrainCount = 0;
    ProductFilter passengerFilter = queue.GetProductFilter();

    // get a list of products this industry can load or unload
    //Asset[] products = passengerFilter.GetProducts();

    //
    for (i = 0; i < vehicles.size(); i++)
    {
      ProductFilter vehicleFilter = Constructors.NewProductFilter();

		  ProductQueue[] vehicleQueues = vehicles[i].GetQueues();
		  for (k = 0; k < vehicleQueues.size(); k++)
		  {
			  ProductQueue vehicleQueue = vehicleQueues[k];
			  ProductFilter filter = vehicleQueue.GetProductFilter();

        vehicleFilter.AppendFilter(filter);

				passengersOnTrainCount = passengersOnTrainCount + vehicleQueue.CountProductMatching(passengerFilter);
      }
			
			ProductFilter sect = passengerFilter.IntersectFilter(vehicleFilter);
			if (!sect.IsEmpty())
        compatVehicles[compatVehicles.size()] = vehicles[i];

/*
      for (j = 0; j < products.size(); j++)
      {
        if (vehicleFilter.DoesAcceptProduct(products[j]))
        {
          compatVehicles[compatVehicles.size()] = vehicles[i];
          break;
        }
      }
*/
    }

		if (!compatVehicles.size())
			return true;


    int totalAmount = 0;
    if (action == ACTION_LOADING)
		{
      totalAmount = queue.GetQueueCount();
			// should really limit to the amount of space on the train,
			// however that would be time-consuming and wouldnt achieve much
		}
    if (action == ACTION_UNLOADING)
		{
      totalAmount = queue.GetQueueSpace();

			PassengerStationInfo platform = psi[info.platformIndex];

			int maxAmount = platform.GetNumberOfPassengersToDisembark(passengersOnTrainCount);

			if (totalAmount > maxAmount)
				totalAmount = maxAmount;

		}

		if (totalAmount <= 0)
			return true;


    int perVehicleAmount = totalAmount / compatVehicles.size();
    int remainder = totalAmount % compatVehicles.size();
    bool bWasInterrupted = false;

		if (action == ACTION_LOADING)
			Interface.Log("GenericPassengerStation> loading " + totalAmount + " among " + compatVehicles.size() + " vehicles from platform " + info.platformIndex);
		else if (action == ACTION_UNLOADING)
			Interface.Log("GenericPassengerStation> unloading " + totalAmount + " among " + compatVehicles.size() + " vehicles from platform " + info.platformIndex);

    for (i = 0; i < compatVehicles.size(); i++)
    {
			int thisVehicleAmount = totalAmount;

      if (thisVehicleAmount >= perVehicleAmount)
			{
				thisVehicleAmount = perVehicleAmount;

				if (remainder > 0)
				{
					thisVehicleAmount = thisVehicleAmount + 1;
					remainder = remainder - 1;
				}
			}

      if (action == ACTION_LOADING)
		  {
			  LoadingReport report = CreateLoadingReport(queue, thisVehicleAmount);
			  if (!compatVehicles[i].LoadProduct(report))
          bWasInterrupted = true;
				totalAmount = totalAmount - report.amount;
		  }

		  else if (action == ACTION_UNLOADING)
		  {
        LoadingReport report = CreateUnloadingReport(queue, thisVehicleAmount);
			  if (!compatVehicles[i].UnloadProduct(report))
          bWasInterrupted = true;
				totalAmount = totalAmount - report.amount;
		  }

			PostMessage(compatVehicles[i], "Vehicle", "LoadComplete", 0.0f);

      if (totalAmount <= 0  or  bWasInterrupted)
        break;
    }
    
    return !bWasInterrupted;
	}
  
  //
  void SetVehicleDoorsOpen(TrackLoadInfo info, Vehicle focusVehicle)
  {
    // Interface.Log("SetVehicleDoorsOpen");
    
    //TrainzScript.Log("PerformMassStoppedLoad> Opening doors -- trainLeftSide = " + info.trainLeftSide);
    focusVehicle.PlaySoundScriptEvent("door_open");
    
    if (info.trainLeftSide == focusVehicle.GetDirectionRelativeToTrain())
      focusVehicle.SetDoorAnimationState("left-passenger-door", true);
    else
      focusVehicle.SetDoorAnimationState("right-passenger-door", true);
  }
  
  //
  void SetTrainDoorsClosed(TrackLoadInfo info, Vehicle focusVehicle, Vehicle[] vehicles)
  {
    // Interface.LogCallStack("SetTrainDoorsClosed");
    
    focusVehicle.PlaySoundScriptEvent("door_close");
    
    int i;
    for (i = 0; i < vehicles.size(); i++)
    {
      Vehicle iVehicle = vehicles[i];

      if (itcPassengerStation.IsAlreadyAdded(iVehicle))
      {
        if (info.trainLeftSide == iVehicle.GetDirectionRelativeToTrain())
          iVehicle.SetDoorAnimationState("left-passenger-door", false);
        else
          iVehicle.SetDoorAnimationState("right-passenger-door", false);
      }
    }
  }
  
  //
  void RemoveTrainFromIndustryControl(Vehicle[] vehicles)
  {
    int i;
    for (i = 0; i < vehicles.size(); i++)
    {
      Vehicle iVehicle = vehicles[i];

      if (itcPassengerStation.IsAlreadyAdded(iVehicle))
      {
        itcPassengerStation.RemoveVehicle(iVehicle);
      }
    }
  }
  

  //! Performs the transfer of passengers between this station and the given vehicle.
  //
  // This method is overridden from <l BaseIndustry::PerformMassStoppedLoad()  BaseIndustry> to provide
  // automatic handling of passenger transfer for all platforms of this station.  As it is fully implemented
  // in GenericPassengerStation, it is not something you need to worry about for your own station.  However 
  // those who are curious can find the full implementation of this method in the
  // <b \Trainz\scripts\GenericPassengerStation.gs> script file.
  //
  // Support for animated passenger carriage doors is required, however the vehicle must have its animations
  // named <m "left-passenger-door"> and <m "right-passenger-door">.
  //
  // Param:  vehicle      Vehicle that is to be loaded/unloaded.
  // Param:  triggerName  Name of the trigger where loading/unloading is to take place.  The GetTrackAndSide()
  //                      implementation will need to determine which platform corresponds to this trigger and
  //                      the side of <i vehicle> to open the doors on.
  //
  bool PerformMassStoppedLoad(Vehicle vehicle, string triggerName)
  {
    // We should be inside itc.StartMonitoringTrain() at this point, so no need to Sniff() here.
    // Sniff(vehicle.GetMyTrain(), "Train", "Cleanup", true);
    
    if (itcPassengerStation.IsAlreadyAdded(vehicle))
      return false;

    TrackLoadInfo info = new TrackLoadInfo();
    GetTrackAndSide(vehicle, triggerName, info);
    if (!info.trackName)
      return false;

    
    Train train = vehicle.GetMyTrain();
    Vehicle[] vehicles = train.GetVehicles();
    SetVehicleDoorsOpen(info, vehicle);
    
    if (!train.InterruptableLoadingSleep(.5))
    {
      SetTrainDoorsClosed(info, vehicle, vehicles);
      return false;
    }
    bool isFirstVehicleInThisTrain = itcPassengerStation.AddVehicle(vehicle, false);
    
    // Interface.Log("PerformMassStoppedLoad> vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName + " isFirstVehicleInThisTrain=" + isFirstVehicleInThisTrain);

    if (isFirstVehicleInThisTrain)
    {
      if (!train.InterruptableLoadingSleep(3)  or  !itcPassengerStation.IsControllingTrain(train))
      {
        SetTrainDoorsClosed(info, vehicle, vehicles);
        RemoveTrainFromIndustryControl(vehicles);
        return false;
      }

      int doLoad = ACTION_NOTHING;
      if (itc.IsTrainCommand(train, Industry.LOAD_COMMAND))
        doLoad = ACTION_LOADING;
      else if (itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND))
        doLoad = ACTION_UNLOADING;

      
      bool bWasInterrupted = false;
      
      // Unload first, even if loading, as we want old passengers to get off.
      if (doLoad == ACTION_UNLOADING  or  doLoad == ACTION_LOADING)
      {
        ProductQueue unloadQueue = GetQueue("passengers_off_" + info.platformIndex);
        if (!PerformProductLoadAndUnload(unloadQueue, train, ACTION_UNLOADING, info))
          bWasInterrupted = true;
      }

      if (doLoad == ACTION_LOADING  and  !bWasInterrupted)
      {
        ProductQueue loadQueue = GetQueue("passengers_on_" + info.platformIndex);
        if (!PerformProductLoadAndUnload(loadQueue, train, ACTION_LOADING, info))
          bWasInterrupted = true;
      }


      //
      if (bWasInterrupted  or  !train.InterruptableLoadingSleep(4)  or  !itcPassengerStation.IsControllingTrain(train))
      {
        SetTrainDoorsClosed(info, vehicle, vehicles);
        RemoveTrainFromIndustryControl(vehicles);
        return false;
      }

      // Close the doors of all the vehicles.
      SetTrainDoorsClosed(info, vehicle, vehicles);
      
      //
      train.InterruptableLoadingSleep(3);
      
      // Make really sure that the doors are closed, in case somebody opened them again while we were sleeping.
      SetTrainDoorsClosed(info, vehicle, vehicles);
      
      // Relax our control over the train; now it's somebody else's problem if the doors are opened.
      RemoveTrainFromIndustryControl(vehicles);
      
      return true;
    }

    return false;
  }


	//! Enable or disable the passenger spawning processes for each platform of this station.
	//
	// This private method allows the passenger spawning processes for each platform of the station to be 
	// switched on or off.
	//
	// Param:  enable  Use true to enable passenger spawning, false to disable.
	//
	void EnablePassengerSpawn(bool enable)
	{
		int i;

		for (i = 0; i < m_platformCount; i++)
      SetProcessEnabled("passenger_spawn_" + i, enable);
	}


	//! Passenger station initialization method.
	//
	// This method creates the <l GenericPassengerStation::psi  property handlers> and data members needed to
	// manage a station with <i platformCount> amount of platforms.  For the generic passenger station to work,
	// you <bi MUST CALL> this method from your Init() implementation as described in the main description of 
	// this class.
	//
	// Param:  platformCount  Amount of platforms this station is to have.
	//
	void InitPassengerStation(int platformCount)
	{
		int i;
		

		m_trainLoadingSpeed = 5.f;

		
		useGenericViewDetails = true;
		m_platformCount = platformCount;


		psi = new PassengerStationInfo[platformCount];

		for (i = 0; i < platformCount; i++)
		{
			psi[i] = new PassengerStationInfo();
			psi[i].SetPassengerMaximumCount( GetQueue("passengers_on_" + i).GetQueueSize() );
			psi[i].SetTrafficScale( GetQueue("passengers_on_" + i).GetQueuePerHour() );
			psi[i].SetInitialPassengerCount( GetQueue("passengers_on_" + i).GetQueueCount() );
			psi[i].SetPlatformName("Platform " + (i + 1));
			psi[i].SetPlatformQueue(GetQueue("passengers_on_" + i));
		}


		for (i = 0; i < platformCount; i++)
		{
			AddAssetToIndustryProductInfo("passenger", "passengers_off_" + i, "passenger_delete_" + i, true, false, false);
			// CHANGED 25/03/04 to not show standard view details passenger queues...(5th param from true to false)
			AddAssetToIndustryProductInfo("passenger", "passengers_on_" + i, "passenger_spawn_" + i, false, false, false);
		}
		

		HTMLPropertyGroup group = new HTMLPropertyGroup();

			// inherit the property handler from BaseIndustry
		group.AddHandler(GetPropertyHandler(), "GenericIndustry");
		
		for (i = 0; i < platformCount; i++)
			group.AddHandler(psi[i], "Station.Platform." + i + "/");
		
		SetPropertyHandler(group);
	}


	// Update the station process parameters from the PSI "time-of-day graph" settings.
	public void UpdateStationParameters(void)
	{
		//
		// Update the station process parameters from the PSI "time-of-day graph" settings.
		//
		
		int i;
		for (i = 0; i < m_platformCount; i++)
		{
			float perHour = psi[i].GetNumberOfNewPassengersPerHour();

      if (perHour <= 0.0f)
      {
        SetProcessEnabled("passenger_spawn_" + i, false);
      }
      else
      {
        SetProcessEnabled("passenger_spawn_" + i, true);
      
				int duration = 3600.0f / perHour;
				if (duration < 1)
					duration = 1;
				
				SetProcessDuration("passenger_spawn_" + i, duration);
			}
		}
	}

  //! Main passenger station thread.
  //
  // This thread is responsible for updating the various station parameters as the session progresses.
  //
  // For the generic passenger station to work, you <bi MUST CALL> this method from your Init() implementation
  // as described in the main description of this class.
  //
  public thread void StationMain(void)
  {
    PostMessage(me, "StationMain.Timer", "Tick", 10.0f);

    Message msg;
    wait()
    {
      on "Train", "Cleanup", msg:
      {
        Interface.Log("GenericPassengerStation.StationMain> (Train,Cleanup) received, removing train from itc");

        Train train = cast<Train>(msg.src);
        itcPassengerStation.RemoveTrain(train);
        Sniff(train, "Train", "Cleanup", false);
        continue;
      }


      on "Scriptlet-Enabled", "1":
      {
        if (!scriptletEnabled)
        {
          scriptletEnabled = true;
          EnablePassengerSpawn(true);
        }
        continue;
      }


      // ? Power station is providing electricity, if not already running. start the 
      on "Scriptlet-Enabled", "0":
      {
        if (scriptletEnabled)
        {
          scriptletEnabled = false;
          EnablePassengerSpawn(false);
        }
        continue;
      }


			on "StationMain.Timer", "Tick", msg:
				if (msg.src == me)
				{
					// ocassional update of the station parameters
					UpdateStationParameters();
					PostMessage(me, "StationMain.Timer", "Tick", 10.0f);
				}
				continue;

    }
  }



	public void SetProperties(Soup soup)
	{
		inherited(soup);

		
		//
		// Reset the passenger queues based on the PSI settings
		//
		if (World.GetCurrentModule() == World.SURVEYOR_MODULE)
		{
			int count, i;
			ProductQueue queue;
			Asset passengerAsset = GetAsset().FindAsset("passenger");
			if (!passengerAsset)
				Exception("GenericPassengerStation.SetProperties> 'passenger' product missing from my kuid-table");
			
			for (i = 0; i < m_platformCount; i++)
			{
				count = psi[i].GetInitialPassengerCount();
				queue = GetQueue("passengers_on_" + i);

				industryProductInfoCollection.SetProductQueueInitialAmount(me, passengerAsset, queue, count);
			}
		}

		
		/*
		CODE REMOVED:
			THIS IS SUPPOSED TO BE READ FROM THE CONFIG FILE BY THE IPIC WHEN IT FIRST INITS.
			IF IT DOESNT, THAT'S A BUG IN THE IPIC CODE AND MUST BE FIXED THERE.

		//
		// Ensure that the IPIC knows about our passenger deletion processes.
		//
		for (i = 0; i < m_platformCount; i++)
		{
			IndustryProductInfoProcess ipip = industryProductInfoCollection.AddProcessToProduct(passengerAsset, "passenger_delete_" + i);
			IPICQueue ipicQueue = industryProductInfoCollection.FindIPICQueue(GetQueue("passengers_off_" + i));

			ipip.SetProcessDuration(1);
			ipip.SetInputQueue(ipicQueue);
			ipip.SetInputAmount(1);
			ipip.SetProcessEnabled(true);
		}
		*/

  }

  string GetViewDetailsHTMLCode()
  {
    string htmlString = HTMLWindow.GetCompleteIndustryViewDetailsHTMLCode(me, scriptletEnabled);

    // Add passenger stuff to the end.
    int i;
    for (i = 0; i < psi.size(); i++)
    {
      string retString = psi[i].GetViewDetailsHTMLCode();
      htmlString = htmlString + retString + "<BR>";
    }

		return htmlString;
  }
  
  
  // These methods here are for use of the 'manage station stop' rule. 
  
  // ============================================================================
  // Name: MeasureStopAccuracy()
  // Parm: trackName - name of the track to measure
  // Desc: Measures the accuracy of positioning of the train in this platform.
  // ============================================================================
  public float MeasureStopAccuracy(string trackName)
  {
		// TO BE OVERRIDDEN
		Interface.Exception("GenericPassengerStation.MeasureStopAccuracy> not overridden");
		
		return -1.0f;
  }
  
  // ============================================================================
  // Name: IsOvershoot()
  // Parm: trackName - name of the track to measure
  // Desc: Determines if this train is short or long of it's stop position
  //        - i.e. if the driver needs to pull forward or set back.
  // ============================================================================
  public bool IsOvershoot(string trackName)
  {
    // TO BE OVERRIDDEN
		Interface.Exception("GenericPassengerStation.IsOvershoot> not overridden");

    return false;
  }
  
  // ============================================================================
  // Name: IsStopPositionValid()
  // Parm: trackName - name of the track to measure
  // Desc: Determines if this train is in a valid stopping position
  // ============================================================================
  public bool IsStopPositionValid(string trackName)
  {
		// TO BE OVERRIDDEN
		Interface.Exception("GenericPassengerStation.IsStopPositionValid> not overridden");
		
		return true;
  }
};

