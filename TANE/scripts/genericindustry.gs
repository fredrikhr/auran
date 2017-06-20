//
// GenericIndustry.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Industry.gs"
include "Vehicle.gs"
include "IndustryTrainController.gs"
include "Common.gs"


//! Describes the input/output of an industry process on a queue for a certain product type.
//
// This class allows the input/output of an industry process to be specified.  It only covers the
// input/output of a certain product type on a single product queue for that particular process.
// As an industry process is able to handle multiple input and output queues as well as different
// product types on a single queue, it could take quite a few IndustryProductInfo instances to
// fully describe the input/output capabilities of a process.
//
// See Also:
//     IndustryProcessInfo, GenericIndustry::AddAssetToIndustryProductInfo(), 
//     GenericIndustry::industryProductList, Industry::GetProcessNameList(), 
//     Industry::GetProcessInput(), Industry::GetProcessOutput(), MapObject::GetQueue()
//
class IndustryProductInfo
{
  public Asset asset;             //!< Type of product this object is describing the input/output of.
  public ProductQueue queue;      //!< Queue that the process uses for input/output of the product.
  public bool isInput;            //!< Specifies if <i queue> is an input queue (true) or output queue (false) for the process.
  public string processName;      //!< Name of the industry process.
  public bool showInViewDetails;  //!< Specifies if this input/output info is to be displayed in a browser window.

  //! Initialization method.
  //
  // Note:
  //     This method is called to initialize this object with default values.  Currently this
  //     implementation is empty, but this may change in the future, so always explicitly call
  //     this Init() method if overridden in a child class.
  //
  public void Init(void)
  {
    // MAKE SURE YOU CALL THIS FUNCTION
    // FUTURE VERSIONS OF TRAINZ MAY ADD MEMBERS WHICH REQUIRE INITIALISATION
  }
};


//! Describes the amount of different products and industry process consumes and produces.
//
// This class allows the amount of different product types an industry can both consume and produce.
// Mainly used by GenericIndustry::GetDescriptionHTML().
//
// See Also:
//     IndustryProductInfo, GenericIndustry::GetDescriptionHTML(), Industry::GetProcessInput(),
//     Industry::GetProcessOutput(), Industry::GetProcessNameList()
//
class IndustryProcessInfo
{
  public string processName;  //!< Name of the industry process this object is counting the input and output of.
  public int assets_produce;  //!< Amount of different types of products the process produces.
  public int assets_consume;  //!< Amount of different types of products the process consumes.

  //! Initialization method.
  //
  // Note:
  //     This method is called to initialize this object with default values.  Currently this
  //     implementation is empty, but this may change in the future, so always explicitly call
  //     this Init() method if overridden in a child class.
  //
  public void Init(void)
  {
    // MAKE SURE YOU CALL THIS FUNCTION
    // FUTURE VERSIONS OF TRAINZ MAY ADD MEMBERS WHICH REQUIRE INITIALISATION
  }
};


//! A generic industry class.
//
// This class provides the generic industry functionality that script programmers can re-use and 
// extend so they can have their industries up and running quickly.  This class can't run a custom
// user-created industry on its own - it needs various methods implemented.  However, what this
// class does provide is a framework that does handle the more complex parts of an industry like 
// trigger message programming.
//
// Note:
//     Although this class still works and is supported, almost all of the <l astSrcInd  Auran provided industries>
//     now use the newer BaseIndustry class.
//
// See Also:
//     IndustryProcessInfo, IndustryProductInfo, IndustryTrainController, BaseIndustry, ProductQueue
//
class GenericIndustry isclass Industry
{
	IndustryTrainController itc;  //!< Lists vehicles/trains that are currently under loading/unloading commands.
	Browser info;                 //!< Browser for displaying ViewDetails() request

	//! Array describing all of the products this industry can input and output.  See IndustryProductInfo for details.
	public IndustryProductInfo[] industryProductList;
  
	// For generic Pipe animations (i.e. the GATX oil car)
	string pipeName;        //!< Name of the pipe animation to use when loading/unloading liquid products.
	bool usePipeAnimation;  //!< Indicates if this industry does use the pipe animation.  If so, extra time is allowed for loading/unloading.


	//! Display details about this industry in a Browser window.
	//
	// This method is called by GenericIndustryMain() when a (<m"%MapObject">, <m"View-Details">)
	// message is received.  The default implementation provide in this class is empty and does
	// nothing and it is intended that the script programmer implements this method to display 
	// industry information in the <l GenericIndustry::info  info> browser if desired.
	//
	// GenericIndustryMain() also waits for messages of type (<m"%Browser-Closed">, <m"">) so it can
	// reset <l GenericIndustry::info  info> to null when the user closes the browser window.  So that
	// the main thread can keep processing messages while the user is reading the browser window, 
	// ViewDetails() runs on a thread of its own.
	//
	// Note:
	//     The HTMLWindow class provides several handy utility methods that can be used to construct
	//     HTML code that describes an industry.
	//
	// See Also:
	//     Browser, HTMLWindow
	//
	thread void ViewDetails(void) {}

	//! Called by PerformStopped() to load/unload a vehicle when it has stopped.
	//
	// This method has an empty implementation and must be implemented by the script programmer if they
	// want their industry to load/unload a stopped vehicle.  No user implementation is needed if the
	// industry concerned doesn't support the loading/unloading of stopped vehicles.
	//
	// Param:  vehicle      Vehicle to load when stopped on <i triggerName>.
	// Param:  triggerName  Name of the trigger where loading is to take place.
	//
	void PerformStoppedLoad(Vehicle vehicle, string triggerName) {}

	//! Called by PerformStopped() to load/unload a vehicle while it is moving.
	//
	// This method has an empty implementation and must be implemented by the script programmer if they
	// want their industry to load/unload a moving vehicle.  No user implementation is needed if the 
	// industry concerned doesn't support the loading/unloading of moving vehicles.
	//
	// Param:  vehicle      Vehicle to load while moving over <i triggerName>.
	// Param:  triggerName  Name of the trigger where loading is to take place.
	//
	void PerformMovingLoad(Vehicle vehicle, string triggerName) {}

	//! Determines if the given vehicle can be loaded/unloaded at the specified trigger while stopped.
	//
	// This method is called by GenericIndustryMain() to determine if <i triggerName> allows
	// <i vehicle> to be loaded/unloaded on it while stopped.  As the GenericIndustry implementation
	// always returns false, the script programmer needs to write their own overridden version if they
	// want any loading/unloading while stopped to happen on a trigger in their industry.
	//
	// Note:
	//     If no loading/unloading while stopped is supported on any of your industry triggers, then
	//     you don't need to implement this method as the default return value of false is sufficient.
	//
	// Param:  vehicle      Vehicle that has recently entered/stopped on the trigger.
	// Param:  triggerName  Name of the trigger to check for support of loading/unloading with a 
	//                      stopped vehicle.
	//
	// Returns:
	//     Returns true if <i triggerName> supports loading from <i vehicle> while stopped, false otherwise.
	//
	bool TriggerSupportsStoppedLoad(Vehicle vehicle, string triggerName) { return false; }

	//! Determines if the given vehicle can be loaded/unloaded at the specified trigger while moving.
	//
	// This method is called by GenericIndustryMain() to determine if <i triggerName> allows 
	// <i vehicle> to be loaded/unloaded on it while moving.  As the GenericIndustry implementation
	// always returns false, the script programmer needs to write their own overridden version if
	// they want any loading/unloading while moving to happen on a trigger in their industry.
	//
	// Note:
	//     If no loading/unloading while moving is supported on any of your industry triggers, then
	//     you don't need to implement this method as the default return value of false is sufficient.
	//
	// Param:  vehicle      Vehicle that has recently entered/stopped on the trigger.
	// Param:  triggerName  Name of the trigger to check for support of loading/unloading with a
	//                      moving vehicle.
	//
	// Returns:
	//     Returns true if <i triggerName> supports loading from <i vehicle> while moving, false otherwise.
	//
	bool TriggerSupportsMovingLoad(Vehicle vehicle, string triggerName) { return false; }


	//! Perform a load/unload operation on a moving vehicle.
	//
	// This method is called by GenericIndustryMain() to load/unload a moving vehicle that has entered an
	// industry trigger.  It will call PerformMovingLoad() to handle the actual transfer of products
	// (which must be user-implemented if they want their industry to load/unload moving vehicles).
	// If the train that <i vehicle> is in is under a script control, a message of type 
	// (<m"HandleTrain">, <m"Release">) is sent to the train one the loading/unloading has been 
	// completed.
	//
	// Param:  vehicle      Vehicle that has entered the trigger.
	// Param:  triggerName  Name of the industry trigger that <i vehicle> entered.
	//
	thread void PerformInnerEnterMoving(Vehicle vehicle, string triggerName)
	{
		//Interface.Log("GenericIndustry.PerformInnerEnterMoving");

		bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

    // Ensure we only lock and unlock on the same train.
    Train myTrain = vehicle.GetMyTrain();
    myTrain.IncTrainBusy();
		
		PerformMovingLoad(vehicle, triggerName);
		
    myTrain.DecTrainBusy();

    if (isUnderScriptControl)
			if (itc.RemoveVehicle(vehicle))
				PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);

		//Interface.Log("GenericIndustry.PerformInnerEnterMoving - done");
	}


	//! Stops a moving train so a vehicle can be loaded/unloaded.
	//
	// This method is called by GenericIndustryMain() when a vehicle has entered a trigger but the
	// trigger doesn't support loading/unloading while moving yet it supports loading/unloading while
	// stopped and the vehicle is not under user control.  It stops the train <i vehicle> is attached
	// to and as a result, GenericIndustryMain() will detect the vehicle stopping on the trigger and 
	// react appropriately.
	//
	// Param:  vehicle  Vehicle to stop the train of if needed.
	//
	void PerformInnerEnterStop(Vehicle vehicle)
	{
		//Interface.Log("GenericIndustry.PerformInnerEnterStop");
						// allow unloading anyway... someone might want it
		// Don't do any unloading or loading unless we have power/enabled!
		//if (scriptletEnabled)
		{
			//
			// INPUT trigger - stop the train and fall through to PerformStopped()
			//

			// Tell the train to stop
			Train train = vehicle.GetMyTrain();
			train.SetAutopilotMode(Train.CONTROL_SCRIPT);
			train.SetDCCThrottle(0.0);

			// When its stopped, we shall load.
			// Don't release the train just yet until then..
		}
		/*else
		{
			// 
			// can't load anyway, might as well release the vehicle now..
			//
			if (itc.RemoveVehicle(vehicle))
			PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
		}*/
	}


	//! Perform a load/unload operation on a moving vehicle.
	//
	// This method is called by GenericIndustryMain() to load/unload a vehicle that has stopped on an
	// industry trigger.  It will call stop the train if necessary and call PerformStoppedLoad() to
	// handle the actual transfer of products (which must be user-implemented if they want their 
	// industry to load/unload stopped vehicles).  If the train that <i vehicle> is from happens to be
	// under script control, a message of type (<m"HandleTrain">, <m"Release">) is sent to the train
	// once the loading/unloading has been completed.
	//
	// Param:  vehicle      Vehicle that has entered the trigger.
	// Param:  triggerName  Name of the industry trigger <i vehicle> has just entered.
	//
	thread void PerformStopped(Vehicle vehicle, string triggerName)
	{
		if (itc.IsLockedVehicle(vehicle))
		{
			// this vehicle is already involved in some other loading.
			// probably caused by having two overlapping triggers both calling PerformStopped.
			//Interface.Log("GenericIndustry.PerformStopped> vehicle already locked");
			return;
		}


		//Interface.Log("GenericIndustry.PerformStopped");

		bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

		// Ensure we only lock and unlock on the same train.
		Train myTrain = vehicle.GetMyTrain();
		myTrain.IncTrainBusy();


		// Ensure the user can't take control of the train while it is loading
		if (!isUnderScriptControl)
			itc.AddVehicle(vehicle, true);

		// Stop the train
		itc.AddVehicleLock(vehicle);
		itc.SetVehicleSpeed(vehicle, 0.0f);


		PerformStoppedLoad(vehicle, triggerName);

		myTrain.DecTrainBusy();

		itc.RemoveVehicleLock(vehicle);

		// Has the end of the train passed thru?
		// if not, then, give control back to the AI, so it moves forward for the next train.
		if (itc.RemoveVehicle(vehicle))
			PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
		else if (isUnderScriptControl and !itc.IsTrainLocked(vehicle.GetMyTrain()))
			itc.SetVehicleSpeed(vehicle, 3.0f);

		//Interface.Log("GenericIndustry.PerformStopped- done");
	}


	//! Starts moving a stopped train in this industry that isn't user controlled.
	//
	// This method is called by GenericIndustryMain() to start moving a train not under user control
	// that has a vehicle stopped outside an industry trigger.  It will set the train to keep driving
	// so that the vehicle will eventually encounter a trigger.
	//
	// Param:  vehicle  Vehicle that is stopped yet not on a trigger.
	//
	void PerformStoppedNoTrigger(Vehicle vehicle)
	{
		//Interface.Log("GenericIndustry.PerformStoppedNoTrigger");
		
		if (itc.IsControllingVehicle(vehicle))
			if (!itc.IsTrainLocked(vehicle.GetMyTrain()))
				itc.SetVehicleSpeed(vehicle, 3.0f);
	}
	

	//! Generic main industry operating thread.
	//
	// This thread is started by the Init() method when the industry game object is created to manage
	// the industry.  It can be thought of as the conductor that makes the industry run.  Once 
	// started, it cycles through a <l gscLangKeyWait  wait> statement indefinitely waiting for 
	// messages to process and act on.
	//
	// Messages processed by this thread are:
	//  - (<m"Object">, <m"Stopped">)
	//  - (<m"Object">, <m"Leave">)
	//  - (<m"Object">, <m"InnerEnter">)
	//  - (<m"%MapObject">, <m"View-Details">)
	//  - (<m"%Browser-Closed">, <m"">)
	//
	// Depending on what message is received, this method will call methods within this class to
	// handle the required task.
	//
	thread void GenericIndustryMain(void)
	{
		Message msg;
		Train train;
		Vehicle vehicle;
		string triggerName;
		bool shouldIgnoreVehicle;

		wait()
		{
			// vehicle has stopped moving in an industry trigger
			on "Object", "Stopped", msg:
				vehicle = cast<Vehicle>(msg.src);
				train = vehicle.GetMyTrain();
				triggerName = FindTriggerContainingNode(vehicle.GetGameObjectID(), true);

				/*Interface.Log("GenericIndustryMain> handling 'Object', 'Stopped' (vehicle='"
						+ vehicle.GetLocalisedName() + "' train='"
						+ train.GetName() + "' trigger='"
						+ triggerName + "'");*/
				
				shouldIgnoreVehicle = train.IsScheduleRunning() and itc.ShouldIgnoreVehicle(vehicle);

				if (triggerName and !shouldIgnoreVehicle)
				{
					// ceeb030909 don't load from triggers which are on the wrong track
					if (train.GetLastVisitedTrack())
					{
						//Interface.Log("* train has last-visited-track");
						if (itc.IsControllingVehicle(vehicle))
						{
							//Interface.Log("* train is in ITC");
							Track track = GetTriggerTrack(triggerName);
							if (track)
							{
								//Interface.Log("* trigger has assigned track");
								if (track != train.GetLastVisitedTrack())
								{
									Track track = train.GetLastVisitedTrack();
									//Interface.Log("* train is not at correct track for this trigger (track: " + track.GetName() + " - trigger: " + triggerName);
									continue;
								}
							}
						}
					}
					else
						;//Interface.Log("* train doesnt have last-visited-track");
					//

					if (itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())
						if (TriggerSupportsStoppedLoad(vehicle, triggerName))
							PerformStopped(vehicle, triggerName);
						else
							;//Interface.Log("GenericIndustryMain> !TriggerSupportsStoppedLoad");
					else
						;//Interface.Log("GenericIndustryMain> !(controlling vehicle || allows user control)");
				}
				else
					// uhoh.. well.. umm.. move along, nothing to see here...
					PerformStoppedNoTrigger(vehicle);

				continue;

			// vehicle has left an industry trigger from the outer radius (is always 150 meters,
			// trigger's actual radius defines inner region)
			on "Object", "Leave", msg:
				vehicle = cast<Vehicle>(msg.src);
				train = vehicle.GetMyTrain();
				if (!IsTrainInTriggers(train, false))
					// send a release now, just in case. ideally it'll have already been released
					PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
				continue;

			// vehicle has entered a trigger's inner region in this industry
			on "Object", "InnerEnter", msg:
				vehicle = cast<Vehicle>(msg.src);
				train = vehicle.GetMyTrain();
				triggerName = FindTriggerContainingNode(vehicle.GetGameObjectID(), true);
				
				shouldIgnoreVehicle = train.IsScheduleRunning() and itc.ShouldIgnoreVehicle(vehicle);
				
				if (triggerName and !shouldIgnoreVehicle)
				{
					// ceeb030909 don't load from triggers which are on the wrong track
					if (train.GetLastVisitedTrack())
						if (itc.IsControllingVehicle(vehicle))
						{
							Track track = GetTriggerTrack(triggerName);
							if (track)
								if (track != train.GetLastVisitedTrack())
									continue;
						}
					//

					if (TriggerSupportsMovingLoad(vehicle, triggerName))
					{
						if (itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())
							PerformInnerEnterMoving(vehicle, triggerName);
					}
					else if (TriggerSupportsStoppedLoad(vehicle, triggerName))
					{
						if (vehicle.GetMyTrain().IsStopped())
							// this message must have resulted on someone InnerReEnter'ing a stopped vehicle
							// .. so just treat it like another stop message ..
							vehicle.PostMessage(me, "Object", "Stopped", 0.0);

						else if (itc.IsControllingVehicle(vehicle))
							// otherwise it's still moving.. ask it politely if it wants to stop?
							PerformInnerEnterStop(vehicle);
					}
				}

				continue;

			// User has right-clicked on this industry and selected View Details menu option.
			// Start the ViewDetails() thread to display a browser with industry info.
			on "MapObject", "View-Details":
			{
				ViewDetails();
				continue;
			}

      // Kill browser created by ViewDetails() as it has been closed.
      on "Browser-Closed", "", msg:
      {
        if (msg.src == info)
        {
          Sniff(info, "Browser", "", false);
          Sniff(info, "Browser-URL", "", false);

          info = null;
        }
        continue;
      }
    }
  }


	//! Called by HandleTrain() to drive a train not under user control through the industry to be loaded.
	//
	// This method ensures the train is driven through the industry when not under user control so it
	// can be loaded.  Actual loading is handled by GenericIndustryMain() as it detects vehicles on
	// triggers.
	//
	// Param:  train  Train to control and drive through the industry to unload.
	//
	// Returns:
	//     Always returns true.
	//
	bool HandleTrainLoadCommand(Train train)
	{
		itc.AddTrain(train);
		itc.SetTrainSpeed(train, 3.0f);
		itc.SetTrainCommand(train, Industry.LOAD_COMMAND);

		// re-send any enter messages in case we missed them while executing a previous command
		// (not mentioning any names, Mr. Drive To.)
		InnerReEnterTrain(train);

		Message msg;
		wait()
		{
			on "HandleTrain", "Release", msg:
				if (msg.dst == train and msg.src == me)
					break;
				continue;

			on "Schedule", "Abort", msg:
				if (msg.dst == train)
					// release any unlocked vehicles so we abort as soon as possible
					if (itc.RemoveAllUnlockedVehicles(train))
						break;
			continue;
		}

		// clean up the ITC (in case the train left the industry behind while still in loading mode)
		itc.RemoveAllUnlockedVehicles(train);
		itc.ClearTrainCommand(train);

		return true;
	}


	//! Called by HandleTrain() to drive a train not under user control through the industry to be unloaded.
	//
	// This method ensures the train is driven through the industry when not under user control so it
	// can be unloaded.  Actual loading is handled by GenericIndustryMain() as it detects vehicles on
	// triggers.
	//
	// Param:  train  Train to control and drive through the industry to unload.
	//
	// Returns:
	//     Always returns true.
	//
	bool HandleTrainUnloadCommand(Train train)
	{
		// Handle the unloading of diesel

		// Move the train forwards slowly, if the train enters a trigger, stop it, and start filling it.
		itc.AddTrain(train);
		itc.SetTrainSpeed(train, 3.0f);
		itc.SetTrainCommand(train, Industry.UNLOAD_COMMAND);

		// re-send any enter messages in case we missed them while executing a previous command
		// (not mentioning any names, Mr. Drive To.)
		InnerReEnterTrain(train);

		Message msg;
		wait()
		{
			on "HandleTrain", "Release", msg:
				if (msg.dst == train and msg.src == me)
					break;
				continue;

			on "Schedule", "Abort", msg:
				if (msg.dst == train)
					// release any unlocked vehicles so we abort as soon as possible
					if (itc.RemoveAllUnlockedVehicles(train))
						break;
				continue;
		}

		// clean up the ITC (in case the train left the industry behind while still in loading mode)
		itc.RemoveAllUnlockedVehicles(train);
		itc.ClearTrainCommand(train);

		return true;
	}


	//! Called by the <l astSrcDriveCmdLoad  Load> and <b astSrcDriveCmdLoad  Unload> driver commands to initiate loading/unloading of a train.
	//
	// This is an implementation of Industry::HandleTrain() that allows for both generic loading and
	// unloading operations to be performed.  It will call and return the results of either 
	// HandleTrainLoadCommand() or HandleTrainUnloadCommand(), depending on what <i loadCommand> is
	// set to.
	//
	// Param:  train        Train to control and perform the command on.  Must be in an industry 
	//                      trigger.
	// Param:  loadCommand  String indicating what type of driver command that is calling this method.
	//                      See \ref loadUnloadCmds "Load and Unload Driver Command Strings" for
	//                      details.
	//
	// Returns:
	//     Returns true if the train is in a trigger and the command was performed successfully, false
	//     otherwise.
	//
	// See Also:
	//     Industry::HandleTrain(), Buildable::IsTrainInTriggers(),
	//     \ref loadUnloadCmds "Load and Unload Driver Command Strings"
	//
	public bool HandleTrain(Train train, string loadCommand)
	{	
		// Don't process this command unless the train is at the correct location (in the triggers)
		// This prevents the train from being in the already-past-the-triggers scenario, which would
		//  cause it to drive on forever waiting for a trigger.
		if (!IsTrainInTriggers(train, false))
		{
			// oops, we're not even within the "outer" range of our triggers,
			//  don't bother to try and load, it probably wont work.
			//Interface.Log("HandleTrain(" + loadCommand + ")> not in triggers; ignoring command");
			Interface.Print("Too far from industry.");
		}
		else if (loadCommand == Industry.LOAD_COMMAND)
			return HandleTrainLoadCommand(train);

		else if (loadCommand == Industry.UNLOAD_COMMAND)
			return HandleTrainUnloadCommand(train);


		return false;
	}


	//! Initialization method that launches the main industry thread.
	//
	// If provided, %Trainz calls the Init() method when it creates the game object.  Usually the
	// programmer would define an Init() method themselves to handle the initialization of data
	// members and possibly even start a thread to manage the object.
	//
	// The implementation in this class initializes the <l GenericIndustry::itc  itc> object and then
	// starts the GenericIndustryMain() thread is started.  This thread will handle the messaging 
	// required to 'run' an industry.
	//
	public void Init(void)
	{
		itc = new IndustryTrainController();
		industryProductList = new IndustryProductInfo[0];

		pipeName = "pipe";
		usePipeAnimation = false;

		GenericIndustryMain();
	}


  //! Sets the initial count of the given queue such that it contains a set amount of a particular product.
  //
  // Note:
  //     <l ProductQueue::DestroyAllProducts  DestroyAllProducts>() is called on <i queue> so any
  //     current contents will be destroyed.
  //
  // Param:  queue     Queue in this industry to set the initial count of.
  // Param:  asset     Type of asset <i queue> is to contain.
  // Param:  newValue  Amount of products of type <i asset> that <i queue> is to have as its initial
  //                   default.
  //
  // See Also:
  //     ProductQueue::DestroyAllProducts(), ProductQueue::CreateProduct(), MapObject::GetQueues()
  //
  public void SetQueueInitialCount(ProductQueue queue, Asset asset, int newValue)
  {
    // destroy the queue, and recreate it
    queue.DestroyAllProducts();

    // Create the product, with the newValue
    queue.CreateProduct(asset, newValue);
  }


  //! Allows a product to be added as being valid input/output for the named process.
  //
  // Param:  assetName          Name of product asset to add to the process.
  // Param:  queueName          Name of queue in this industry that the process is to use for the
  //                            input/output of the product.
  // Param:  processName        Name of the industry process that is to produce/consume the product.
  // Param:  isInput            Specifies if <i queueName> is an input queue (true) or output queue
  //                            (false) when used by the process.
  // Param:  showInViewDetails  Specifies if details of this product capability should be displayed
  //                            in the browser window when the user requests details of the industry.
  //
  // See Also:
  //     IndustryProductInfo, Asset::FindAsset(), Industry::GetQueue()
  //
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails)
  {
    IndustryProductInfo ipInfo = new IndustryProductInfo();
    industryProductList[industryProductList.size()] = ipInfo;
    ipInfo.Init();

    ipInfo.asset = GetAsset().FindAsset(assetName);
    ipInfo.queue = GetQueue(queueName);
    ipInfo.isInput = isInput;
    ipInfo.processName = processName;
    ipInfo.showInViewDetails = showInViewDetails;

    if (!ipInfo.asset)
      Exception("Asset could not be found (looking for: " + assetName + ")");
    if (!ipInfo.queue)
      Exception("Queue could not be found (looking for: " + queueName + ")");
  }

  //! Allows a product to be added as being valid input/output for the named process.
  //
  // Param:  assetName    Name of product asset to add to the process.
  // Param:  queueName    Name of queue in this industry that the process is to use for the
  //                      input/output of the product.
  // Param:  processName  Name of the industry process that is to produce/consume the product.
  // Param:  isInput      Specifies if <i queueName> is an input queue (true) or output queue
  //                      (false) when used by the process.
  //
  // See Also:
  //     IndustryProductInfo, Asset::FindAsset(), Industry::GetQueue()
  //
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput)
  {
    AddAssetToIndustryProductInfo(assetName, queueName, processName, isInput, true);
  }



  //
  // PropertyObject methods
  //

  //! Gets a description of this industry as a HTML page to be displayed to the user in the Surveyor Rule Editor.
  //
  // This method overrides PropertyObject::GetDescriptionHTML() so that all the processes along with
  // the products they consume and produce are listed such that the initial value and 
  // consumption/production rate can be edited for every single process through property links.
  //
  // Returns:
  //     Returns a HTML description of this industry listing all the processes and their respective
  //     consumption and production rates and initial defaults.
  //
  public string GetDescriptionHTML(void)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    string retString;

    retString = "<font color=#FFFFFF>";
    retString = retString + "<p><b><font size=3 color=#FFFFFF>" + GetLocalisedName() + "</font></b></p>";

    // Determine all the processes we have, from the user data.
    IndustryProcessInfo[] processes;
    processes = new IndustryProcessInfo[0];

    int i;
    int l;
    for (i = 0; i < industryProductList.size(); i++)
    {
      bool exists = false;
      IndustryProcessInfo ipInfo = new IndustryProcessInfo();
      ipInfo.Init();

      // Ensure it doesn't already exist
      for (l = 0; l < processes.size(); l++)
      {
        if (processes[l].processName == industryProductList[i].processName)
        {
          // set to the old info
          ipInfo = processes[l];
          exists = true;
          break;
        }
      }

      if (!exists)
      {
        processes[processes.size()] = ipInfo;
        ipInfo.processName = industryProductList[i].processName;
        ipInfo.assets_consume = 0;
        ipInfo.assets_produce = 0;
      }


      if (industryProductList[i].isInput)
        ipInfo.assets_consume++;
      else
        ipInfo.assets_produce++;

    }

    // We now have a list of unique names
    for (i = 0; i < processes.size(); i++)
    {
      // Do we have anything to consume?
      if (processes[i].assets_consume > 0)
      {
        retString = retString + strTable.GetString1("interface-genericindustry-html0", (string)(int)GetProcessDuration(processes[i].processName));
        retString = retString + "<table>";
        retString = retString + "<tr><td width=10></td><td width=64></td><td></td><td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html0") + "</b></font></td>";
        retString = retString + "<td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html1") + "</b></font></td></tr>";
        for (l = 0; l < industryProductList.size(); l++)
        {
          if (industryProductList[l].isInput and industryProductList[l].processName == processes[i].processName)
            retString = retString + HTMLWindow.GetInputOutputPropertyHTMLCode(me, industryProductList[l].processName, industryProductList[l].queue, industryProductList[l].asset, (string)l, industryProductList[l].isInput);
        }
        retString = retString + "</table><BR>";
      }
    }

    for (i = 0; i < processes.size(); i++)
    {
      // Do we have anything to produce?
      if (processes[i].assets_produce > 0)
      {
        retString = retString + strTable.GetString1("interface-genericindustry-html1", (string)(int)GetProcessDuration(processes[i].processName));
        retString = retString + "<table>";
        retString = retString + "<tr><td width=10></td><td width=64></td><td></td><td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html0") + "</b></font></td>";
        retString = retString + "<td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html1") + "</b></font></td></tr>";
        for (l = 0; l < industryProductList.size(); l++)
        {
          if (!industryProductList[l].isInput and industryProductList[l].processName == processes[i].processName)
            retString = retString + HTMLWindow.GetInputOutputPropertyHTMLCode(me, industryProductList[l].processName, industryProductList[l].queue, industryProductList[l].asset, (string)l, industryProductList[l].isInput);
        }
        retString = retString + "</table><BR>";
      }
    }

    retString = retString + "</font>";

    return retString;
  
  }


  //! Gets a readable name of a product asset as specified in the given property name.
  //
  // Param:  propertyID  Name of the property to get a readable name for.  Must be prefixed with
  //                     <m"input-amount/">, <m"output-amount/">, or <m"initial-count/"> followed by
  //                     the index of the asset in <l GenericIndustry::industryProductList  industryProductList>
  //                     to get the name of.
  //
  // Returns:
  //     Returns the string <m"Amount of &lt;name&gt;"> where <n &lt;name&gt;> is the 
  //     <l Asset::GetLocalisedName  localised name> of the product asset requested if a valid
  //     asset for it can be found, an empty string otherwise.
  //
  // See Also:
  //     Asset::GetLocalisedName()
  //
  public string GetPropertyName(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    if (propertyID[0, 13] == "input-amount/")
      propertyID[0, 13] = null;
    if (propertyID[0, 14] == "output-amount/")
      propertyID[0, 14] = null;
    if (propertyID[0, 14] == "initial-count/")
      propertyID[0, 14] = null;

    int productIndex = Str.ToInt(propertyID);

    Asset productAsset = industryProductList[productIndex].asset;
    if (productAsset)
    {
      string productName = productAsset.GetLocalisedName();

      string ret = strTable.GetString1("interface-genericindustry-name0", productName);
      return ret;
    }

    return "";

  }


  //! Gets a readable description of a product asset as specified in the given property name.
  //
  // Param:  propertyID  Name of the property to get a readable description for.  Must be prefixed
  //                     with <m"input-amount/">, <m"output-amount/">, or <m"initial-count/"> 
  //                     followed by the index of the product in 
  //                     <l GenericIndustry::industryProductList  industryProductList> to get the
  //                     description of.
  //
  // Returns:
  //     If <m"initial-count/"> is requested, the string <m"Initial Amount of &lt;name&gt;"> is
  //     returned, where <n &lt;name&gt;> is the <l Asset::GetLocalisedName  localised name> of the
  //     product asset requested.  <br><br>
  //     When <m"input-amount/"> or <m"output-amount/">, one of two possible strings is returned,
  //     either <m"Amount of &lt;name&gt; to consume"> or <m"Amount of &lt;name&gt; to produce">,
  //     depending on the <l IndustryProductInfo::isInput  isInput> flag for the indexed product. <br><br>
  //     An empty string will be returned otherwise.
  //
  // See Also:
  //     Asset::GetLocalisedName()
  //
  public string GetPropertyDescription(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    bool isInitialCount = false;
    if (propertyID[0, 13] == "input-amount/")
      propertyID[0, 13] = null;
    if (propertyID[0, 14] == "output-amount/")
      propertyID[0, 14] = null;
    if (propertyID[0, 14] == "initial-count/")
    {
      propertyID[0, 14] = null;
      isInitialCount = true;
    }

    int productIndex = Str.ToInt(propertyID);
    

    Asset productAsset = industryProductList[productIndex].asset;
    if (productAsset)
    {
      string productName = productAsset.GetLocalisedName();

      string ret;
      if (isInitialCount)
				ret = strTable.GetString1("interface-industryinfo-name0", productName);
      else
      {
        if (industryProductList[productIndex].isInput)
					ret = strTable.GetString1("interface-industryinfo-name1", productName);
        else
					ret = strTable.GetString1("interface-industryinfo-name2", productName);
      }

      return ret;
    }

    return "";
  }


  //! Gets the type of the named property.
  //
  // Param:  propertyID  Name of the property to get the type for.  Must be prefixed with
  //                     <m"input-amount/">, <m"output-amount/"> or <m"initial-count/"> followed by
  //                     a valid index value for the 
  //                     <l GenericIndustry::industryProductList  industryProductList> array.
  //
  // Returns:
  //     If <i propertyID> refers to a valid property for this industry (i.e. correct prefix name
  //     and array index), <m "int,0,&lt;queue size&gt;,10"> is returned.  This indicates that the
  //     indicating that the property value is an integer in the range of 0 to its 
  //     <l IndustryProductInfo::queue  queue's> maximum size and edited in increments of 10.  An 
  //     empty string will be returned otherwise.
  //
  // See Also:
  //     ProductQueue::GetQueueSize()
  //
  public string GetPropertyType(string propertyID)
  {
    if (propertyID[0, 13] == "input-amount/")
      propertyID[0, 13] = null;
    if (propertyID[0, 14] == "output-amount/")
      propertyID[0, 14] = null;
    if (propertyID[0, 14] == "initial-count/")
      propertyID[0, 14] = null;

    int productIndex = Str.ToInt(propertyID);

    ProductQueue queue = industryProductList[productIndex].queue;
    if (queue)
    {
      string ret = "int,0," + (string)queue.GetQueueSize() + ",10";
      return ret;
    }

    return "";
  }


  //! Sets the value of the named property to the given int.
  //
  // The are three types of properties in a GenericIndustry object:
  //  - output amount
  //  - input amount
  //  - initial count
  //
  // The properties are used to refer to a quantity of products for an industry process' 
  // input/output requirements of a certain product.  All of these properties are integer values and
  // a set of these properties is used for each member of the <l GenericIndustry::industryProductList  industryProductList>.
  // This means these properties are present for each product that this industry supports.
  //
  // The properties string will be prefixed with <m"input-amount/">, <m"output-amount/"> or 
  // <m"initial-count/"> and after the slash, a number that corresponds an index in the 
  // <l GenericIndustry::industryProductList  industryProductList> array is required.  For example,
  // <m"initial-count/2"> refers to the initial count of the product in the 3rd position of
  // <l GenericIndustry::industryProductList  industryProductList>.
  //
  // If <i propetyID> is <m"initial-count/&lt;x&gt;">, the initial count of the <l IndustryProductInfo::queue queue>
  // in position <n x> of <l GenericIndustry::industryProductList  industryProductList> will have
  // its initial count set to <i value> through SetQueueInitialCount().
  //
  // When <i propertyID> is <m"input-amount/&lt;x&gt;">, the input amount per cycle for the product
  // transfer described by <l GenericIndustry::industryProductList  industryProductList> is set to
  // <i value> by calling Industry::SetProcessInput().  The same applies for
  // <m"input-amount/&lt;x&gt;"> except the output amount per cycle will be set to <i value> by 
  // calling Industry::SetProcessOutput() instead.
  //
  // Param:  propertyID  Name of the property to set the value of.  See method description just
  //                     above for details on GenericIndustry properties and what they are used for.
  //
  // Param:  value       Value to set the property named by <i propertyID> to.  GetPropertyType()
  //                     will provide a valid range of properties.
  //
  // See Also:
  //     Industry::SetProcessInput(), Industry::SetProcessOutput()
  //
  public void SetPropertyValue(string propertyID, int value)
  {
    bool isInitialCount = false;
    if (propertyID[0, 13] == "input-amount/")
      propertyID[0, 13] = null;
    if (propertyID[0, 14] == "output-amount/")
      propertyID[0, 14] = null;
    if (propertyID[0, 14] == "initial-count/")
    {
      propertyID[0, 14] = null;
      isInitialCount = true;
    }

    int productIndex = Str.ToInt(propertyID);

    bool isInput = industryProductList[productIndex].isInput;
    string processName = industryProductList[productIndex].processName;
    ProductQueue queue = industryProductList[productIndex].queue;
    Asset asset = industryProductList[productIndex].asset;

    if (isInitialCount)
      SetQueueInitialCount(queue, asset, value);
    else
    {
      if (isInput)
        SetProcessInput(processName, queue, asset, value);
      else
        SetProcessOutput(processName, queue, asset, value);
    }

  }


  //
  // Industry Methods
  //

  //! Adds any products that this industry is currently capable of consuming/producing to the end of the given list.
  //
  // This methods appends all of the products from <l GenericIndustry::industryProductList  industryProductList>
  // into <i productList> that are not already in the <i productList>.
  //
  // Param:  productList  List of products to append the products of this industry to.
  //
  public void AppendProductList(Asset[] productList)
  {
    bool found;
    int l;
    int i;
    
    // 
    // Find products that we are outputting.
    for (i = 0; i < industryProductList.size(); i++)
    {
      if (!industryProductList[i].isInput)
      {
        Asset asset = industryProductList[i].asset;
        // Append this product to the productList, if it doesn't already exist
        found = false;
        for (l = 0; l < productList.size(); l++)
        {
          if (productList[l] == asset)
          {
            found = true;
            break;
          }
        }

        if (!found)
          productList[productList.size()] = asset;
      
      }
    }
  }


  //! Plays the pipe retraction animation.
  //
  // Param:  vehicle  Vehicle to end the animation on.
  //
  thread void ThreadEndPipeAnimation(Vehicle vehicle)
  {
    MeshObject pipeMesh;
    
    pipeMesh = vehicle.GetFXAttachment("pipe-attachment-left");
    if (pipeMesh)
      pipeMesh.SetMeshAnimationState("default", false);
    
    pipeMesh = vehicle.GetFXAttachment("pipe-attachment-right");
    if (pipeMesh)
      pipeMesh.SetMeshAnimationState("default", false);

      // wait for animations to complete before deleting attached meshes
    Sleep(3.5);
    
    vehicle.SetFXAttachment("pipe-attachment-left", null);
    vehicle.SetFXAttachment("pipe-attachment-right", null);
  }


  //! Called by Vehicle::UnloadProduct() before the unloading takes place.
  //
  // This method overrides Industry::BeginLoad() so that the pipe animation is taken care if needed
  // and extra time is returned to allow for it.  This will only be done if the 
  // <l GenericIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of unloading operation.
  //
  // Returns:
  //     Returns 30.0 to allow for the pipe animation to start if needed, 0.0 otherwise.
  //
  public float BeginUnload(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    string attSide;
    if (report.sideFlags & LoadingReport.LEFT_SIDE)
      attSide = "pipe-attachment-left";
    else if (report.sideFlags & LoadingReport.RIGHT_SIDE)
      attSide = "pipe-attachment-right";
    else
      return 0.0;
    
    Asset pipeAsset = GetAsset().FindAsset(pipeName);
    if (pipeAsset)
    {
      MeshObject pipeMesh = report.GetSrcVehicle().SetFXAttachment(attSide, pipeAsset);

      if (pipeMesh)
      {
        pipeMesh.SetMeshAnimationState("default", true);
        return 30.0;
      }
      else
        return 0.0;

    }
    return 0.0;
  }

  //! Called by Vehicle::UnloadProduct() to determine how long the unloading operation is to take.
  //
  // This method is overrides Industry::GetUnloadTime() to ensure that the appropriate amount of
  // time is returned if the pipe animation is being used for loading.  This will only be done if
  // the <l GenericIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of loading operation.
  //
  // Returns:
  //     Returns 2.0 to allow for the pipe loading if needed, 0.0 otherwise.
  //
  public float GetUnloadTime(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    return 2.0;
  }

  //! Ends the pipe animation if needed.
  // 
  // This method is overrides Industry::EndUnload() to ensure that ThreadEndPipeAnimation() is
  // called at the end of an unloading operation as well as returning the appropriate amount of
  // time to allow for the animation.  This will only be done if the 
  // <l GenericIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of unloading operation.
  //
  // Returns:
  //     Returns 4.0 to allow for the pipe animation to end if needed, 0.0 otherwise.
  //
  public float EndUnload(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    ThreadEndPipeAnimation(report.GetSrcVehicle());
    
    return 4.0;
  }

  //! Called by Vehicle::LoadProduct() before the loading takes place.
  //
  // This method overrides Industry::BeginLoad() so that the pipe animation is taken care if needed
  // and extra time is returned to allow for it.  This will only be done if the 
  // <l GenericIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of unloading operation.
  //
  // Returns:
  //     Returns 30.0 to allow for the pipe animation to start if needed, 0.0 otherwise.
  //
  public float BeginLoad(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    string attSide;
    if (report.sideFlags & LoadingReport.LEFT_SIDE)
      attSide = "pipe-attachment-left";
    else if (report.sideFlags & LoadingReport.RIGHT_SIDE)
      attSide = "pipe-attachment-right";
    else
      return 0.0;
    
    Asset pipeAsset = GetAsset().FindAsset(pipeName);
    if (pipeAsset)
    {
      MeshObject pipeMesh = report.GetDstVehicle().SetFXAttachment(attSide, pipeAsset);

      float delayTime = 0.0f;
      if (pipeMesh)
      {
        delayTime = 30.0f;
        pipeMesh.SetMeshAnimationState("default", true);
      }
      else
        delayTime = 0.0f;
    
      return delayTime;
    }
    return 0.0;
  
  }

  //! Called by Vehicle::LoadProduct() to determine how long the loading operation is to take.
  //
  // This method is overrides Industry::GetLoadTime() to ensure that the appropriate amount of time
  // is returned if the pipe animation is being used for loading.  This will only be done if the
  // <l GenericIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of loading operation.
  //
  // Returns:
  //     Returns 2.0 to allow for the pipe loading if needed, 0.0 otherwise.
  //
  public float GetLoadTime(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    return 2.0;
  }

  //! Ends the pipe animation if needed.
  //
  // This method is overrides Industry::EndLoad() to ensure that ThreadEndPipeAnimation() is called
  // at the end of an unloading operation as well as returning the appropriate amount of time to
  // allow for the animation.  This will only be done if the 
  // <l GenericIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of unloading operation.
  //
  // Returns:
  //     Returns 4.5 to allow for the pipe animation to end if needed, 0.0 otherwise.
  //
  public float EndLoad(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    ThreadEndPipeAnimation(report.GetDstVehicle());

    return 4.5;
  }


  /*
  public define string PROPERTY_NAME = "name";
	public define string PROPERTY_DESC = "desc";
	public define string PROPERTY_TYPE = "type";
	public define string PROPERTY_SETVALUE = "setvalue";

  public string GetPropertyString(string propertyID, string key, string propertyToGet)
  {
    Asset asset = GetAsset();
    if (asset)
    {
      int i;
      int l;
      for (i = 0; i < queues.size(); i++)
      {
        Asset[] assets = queues[i].GetProductList();
        for (l = 0; l < assets.size(); l++)
        {
          if (propertyID == assets.
        }

      }
    }
  }

        if (propertyID == "input-amount/diesel")
          return "Amount of diesel to consume";


  public string SetPropertyStringValue(string propertyID, int value)
  {
  }

*/

};

