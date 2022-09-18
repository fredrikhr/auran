//=============================================================================
// File: GenericIndustry.gs
// Desc: 
//=============================================================================
include "Industry.gs"
include "Vehicle.gs"
include "IndustryTrainController.gs"
include "Common.gs"



//=============================================================================
// Name: IndustryProductInfo
// Desc: Describes the product input/output of an industry process. This object
//       only covers the input or output of a single product type on a single
//       product queue for a particular process. Each process is likely to
//       require multiple of these objects to decribe it, and each industry is
//       likely to have multiple different processes defined.
//=============================================================================
class IndustryProductInfo
{
  public string       processName;        // The name of the industry process.
  public Asset        asset;              // Type of product this object is describing the input/output of.
  public bool         isInput;            // Specifies whether this is an input (true) or output (false) for the process.
  public ProductQueue queue;              // Queue that the process uses for input/output of the product.
  public bool         showInViewDetails;  // Specifies if this info is to be displayed in a browser window.


  //=============================================================================
  // Name: Init
  // Desc: Initialises any default state. Currently this is empty but this may
  //       change in the future so make sure you call it.
  //=============================================================================
  public mandatory void Init(void)
  {
  }

};



//=============================================================================
// Name: IndustryProcessInfo
// Desc: Describes the amount of different products and industry process
//       consumes and produces. Mainly used within GetDescriptionHTML().
//=============================================================================
class IndustryProcessInfo
{
  public string       processName;        // The name of the industry process.
  public int          assets_produce;     // Amount of different types of products the process produces.
  public int          assets_consume;     // Amount of different types of products the process consumes.


  //=============================================================================
  // Name: Init
  // Desc: Initialises any default state. Currently this is empty but this may
  //       change in the future so make sure you call it.
  //=============================================================================
  public void Init(void)
  {
  }

};



//=============================================================================
// Name: GenericIndustry
// Desc: This class provides generic industry functionality that script
//       programmers can use as a basis for new custom industries. This object
//       is not complete, and needs various methods implemented by the
//       inheriting class.
//
// Note: Although this class still works and is supported, it's considered
//       obsolete by the newer and superior BaseIndustry class.
//
//=============================================================================
class GenericIndustry isclass Industry
{
  IndustryTrainController itc;  // Lists vehicles/trains that are currently under loading/unloading commands.
  Browser info;                 // Browser for displaying ViewDetails() request

  // For generic Pipe animations (i.e. the GATX oil car)
  string  pipeName;           // Name of the pipe animation to use when loading/unloading liquid products.
  bool    usePipeAnimation;   // Indicates if this industry does use the pipe animation.  If so, extra time is allowed for loading/unloading.

  // Array describing all of the products this industry can input and output.  See IndustryProductInfo for details.
  public IndustryProductInfo[] industryProductList;


  //=============================================================================
  // Forward declarations.

  public void Init(void);

  thread void ViewDetails(void);

  void PerformStoppedLoad(Vehicle vehicle, string triggerName);
  void PerformMovingLoad(Vehicle vehicle, string triggerName);
  bool TriggerSupportsStoppedLoad(Vehicle vehicle, string triggerName);
  bool TriggerSupportsMovingLoad(Vehicle vehicle, string triggerName);
  thread void PerformInnerEnterMoving(Vehicle vehicle, string triggerName);
  void PerformInnerEnterStop(Vehicle vehicle);
  thread void PerformStopped(Vehicle vehicle, string triggerName);
  void PerformStoppedNoTrigger(Vehicle vehicle);
  thread void GenericIndustryMain(void);

  public bool HandleTrain(Train train, string loadCommand);
  public void SetQueueInitialCount(ProductQueue queue, Asset asset, int newValue);
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails);
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput);
  public void AppendProductList(Asset[] productList);
  thread void ThreadEndPipeAnimation(Vehicle vehicle);



  //=============================================================================
  // Name: Init
  // Desc: Initialization method that launches the main industry thread.
  //=============================================================================
  public void Init(void)
  {
    itc = new IndustryTrainController();
    industryProductList = new IndustryProductInfo[0];

    pipeName = "pipe";
    usePipeAnimation = false;

    GenericIndustryMain();
  }


  //=============================================================================
  // Name: ViewDetails
  // Desc: Display details about this industry in a Browser window. This is
  //       called by BaseIndustryMain() when a "MapObject","View-Details" message
  //       is received. By default, this function is empty and does not display
  //       any details. It is up to the inheriting class to implement an
  //       appropriate display. (See the HTMLWindow class for several useful
  //       functions which can help in generating browser html.)
  // Note: BaseIndustryMain() also waits for "Browser","Closed" messages so it
  //       can reset BaseIndustry::info to null when the user closes the window.
  //=============================================================================
  thread void ViewDetails(void)
  {
  }


  //=============================================================================
  // Name: PerformStoppedLoad
  // Desc: Called by either PerformStopped() or ThreadPerformStoppedLoad() to
  //       load/unload a vehicle which has stopped at this industry.
  //       This method has an empty implementation and must be implemented by the
  //       script programmer if they want their industry to load/unload a stopped
  //       vehicle. No user implementation is needed if the industry concerned
  //       doesn't support the loading/unloading of stopped vehicles or a mass
  //       stopped load.
  // Parm: vehicle - The vehicle which has stopped to be loaded/unloaded.
  // Parm: triggerName - The name of the trigger where the vehicle has stopped.
  //=============================================================================
  void PerformStoppedLoad(Vehicle vehicle, string triggerName)
  {
  }


  //=============================================================================
  // Name: PerformMovingLoad
  // Desc: Called by PerformInnerEnterMoving() or ThreadPerformMovingLoad() to
  //       load/unload a vehicle while it is moving. This is empty by default and
  //       must be implemented by the inheriting class if the content creator
  //       wishes to support moving load.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  //=============================================================================
  void PerformMovingLoad(Vehicle vehicle, string triggerName)
  {
  }


  //=============================================================================
  // Name: TriggerSupportsStoppedLoad
  // Desc: Returns whether a given trigger/vehicle combo is capable of running a
  //       "stopped load" operation. A stopped load is a load/unload operation
  //       where a single car in the train is loaded while the train is stopped.
  //       An example of an industry which would use this a boxcar loaded with
  //       goods, where each car needs to be aligned to a platform to be loaded.
  //       (Note that multiple cars may be loaded/unloaded at the same time using
  //       this method, but each must be on an appropriate trigger. For loading
  //       operations that don't require each car to be lined up, see the
  //       TriggerSupportsMassStoppedLoad() function below.)
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Retn: bool - Whether to attempt a moving load for this vehicle and trigger.
  //       Returns false (not supported) by default.
  //=============================================================================
  bool TriggerSupportsStoppedLoad(Vehicle vehicle, string triggerName)
  {
    return false;
  }


  //=============================================================================
  // Name: TriggerSupportsMovingLoad
  // Desc: Returns whether a given trigger/vehicle combo is capable of running a
  //       "moving load" operation. A moving load is a load/unload operation
  //       where a single car in the train is loaded while the train is moving.
  //       An example of an industry where this could be used is an ore dump.
  // Parm: vehicle - Vehicle that has entered the industry trigger. It is usually
  //       appropriate to check the speed of this vehicle before returning true.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Retn: bool - Whether to attempt a moving load for this vehicle and trigger.
  //       Returns false (not supported) by default.
  //=============================================================================
  bool TriggerSupportsMovingLoad(Vehicle vehicle, string triggerName)
  {
    return false;
  }


  //=============================================================================
  // Name: PerformInnerEnterMoving
  // Desc: Perform a load/unload operation on a moving vehicle. This is called by
  //       GenericIndustryMain() to load/unload a vehicle that has entered a
  //       trigger within the industry.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Note: PerformMovingLoad() is empty by default, and must be implemented by
  //       the inheriting script.
  // Note: If the stopped train is under script control a "HandleTrain","Release"
  //       message is sent to the train once the loading/unloading completes.
  //=============================================================================
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
    {
      if (itc.RemoveVehicle(vehicle))
        PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
    }

    //Interface.Log("GenericIndustry.PerformInnerEnterMoving - done");
  }


  //=============================================================================
  // Name: PerformInnerEnterStop
  // Desc: Stops a moving train so a vehicle can be loaded/unloaded. This is
  //       called by GenericIndustryMain() when a script controlled vehicle
  //       enters a trigger which doesn't support moving load/unload but does
  //       stopped load/unload. It simply stops the train the vehicle is in, as
  //       a result, BaseIndustryMain() will detect the vehicle stopping on the
  //       on the trigger and react appropriately.
  // Note: This function does not perform any loading. It simply stops the
  //       entering train and relies on BaseIndustryMain() to detect that and
  //       react appropriately.
  //=============================================================================
  void PerformInnerEnterStop(Vehicle vehicle)
  {
    //Interface.Log("GenericIndustry.PerformInnerEnterStop>");

    // Tell the train to stop
    Train train = vehicle.GetMyTrain();
    train.SetAutopilotMode(Train.CONTROL_SCRIPT);
    train.SetDCCThrottle(0.0);

    // When it's stopped we'll load, don't release the train until then.
  }


  //=============================================================================
  // Name: PerformStopped
  // Desc: Perform a load/unload operation on a stopped vehicle. This is called
  //       by GenericIndustryMain() to load/unload a vehicle that has stopped on
  //       a trigger within the industry. It will stop the train (if necessary)
  //       and call PerformStoppedLoad() to handle the actual transfer.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Note: PerformStoppedLoad() is empty by default, and must be implemented by
  //       the inheriting script.
  // Note: If the stopped train is under script control a "HandleTrain","Release"
  //       message is sent to the train once the loading/unloading completes.
  //=============================================================================
  thread void PerformStopped(Vehicle vehicle, string triggerName)
  {
    if (itc.IsLockedVehicle(vehicle))
    {
      // This vehicle is already involved in some other loading. (Probably caused
      // by having two overlapping triggers both calling PerformStopped.)
      //Interface.Log("GenericIndustry.PerformStopped> Vehicle already locked");
      return;
    }

    //Interface.Log("GenericIndustry.PerformStopped> Running.");

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

    //Interface.Log("GenericIndustry.PerformStopped> Done.");
  }


  //=============================================================================
  // Name: PerformStoppedNoTrigger
  // Desc: Called by GenericIndustryMain() to drive a train forward when it stops
  //       beyond a valid industry load/unload trigger.
  //=============================================================================
  void PerformStoppedNoTrigger(Vehicle vehicle)
  {
  //Interface.Log("GenericIndustry.PerformStoppedNoTrigger");

    if (itc.IsControllingVehicle(vehicle))
    {
      if (!itc.IsTrainLocked(vehicle.GetMyTrain()))
        itc.SetVehicleSpeed(vehicle, 3.0f);
    }
  }


  //=============================================================================
  // Name: GenericIndustryMain
  // Desc: Generic main industry operating thread. This thread is started at Init
  //       to manage the industry. It can be thought of as the conductor that
  //       manages the industry tasks. Once started, it uses a wait() statement
  //       to process industry messages as they occur.
  //
  //       The messages processed by this thread are:
  //        [ Major              | Minor              ]
  //        [ "Object"           | "Stopped"          ]
  //        [ "Object"           | "Leave"            ]
  //        [ "Object"           | "InnerEnter"       ]
  //        [ "MapObject"        | "View-Details"     ]
  //        [ "Browser"          | "Closed"           ]
  //=============================================================================
  thread void GenericIndustryMain(void)
  {
    Train train;
    Vehicle vehicle;
    string triggerName;
    bool shouldIgnoreVehicle;

    Message msg;
    wait()
    {
      on "Object", "Stopped", msg:
        // Vehicle has stopped moving in an industry trigger.
        vehicle = cast<Vehicle>(msg.src);
        train = vehicle.GetMyTrain();

        triggerName = FindTriggerContainingNode(vehicle.GetGameObjectID(), true);
        shouldIgnoreVehicle = train.IsScheduleRunning() and itc.ShouldIgnoreVehicle(vehicle);
        //Interface.Log("GenericIndustryMain> handling Object,Stopped (v = " + vehicle.GetLocalisedName() +
        //              ", train = " + train.GetName() + ", trigger=" + triggerName);


        if (triggerName and !shouldIgnoreVehicle)
        {
          // Don't load from triggers which are on the wrong track.
          if (train.GetLastVisitedTrack())
          {
            if (itc.IsControllingVehicle(vehicle))
            {
              Track track = GetTriggerTrack(triggerName);
              if (track)
              {
                if (track != train.GetLastVisitedTrack())
                {
                  Track track = train.GetLastVisitedTrack();
                  //Interface.Log("GenericIndustryMain> Incorrect track for trigger (track: " + track.GetName() + ", trigger: " + triggerName);
                  continue;
                }
              }
            }
          }
          else
          {
            //Interface.Log("GenericIndustryMain> Train doesnt have last-visited-track");
          }


          if (itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())
          {
            if (TriggerSupportsStoppedLoad(vehicle, triggerName))
              PerformStopped(vehicle, triggerName);
            else
              ; //Interface.Log("GenericIndustryMain> !TriggerSupportsStoppedLoad()");
          }
          else
          {
            //Interface.Log("GenericIndustryMain> !(itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())");
          }
        }
        else
        {
          // uhoh.. well.. umm.. move along, nothing to see here...
          PerformStoppedNoTrigger(vehicle);
        }
        continue;


      on "Object", "Leave", msg:
        // Vehicle left an industry trigger from the outer radius (always 150
        // meters, trigger's actual radius defines inner region.)
        vehicle = cast<Vehicle>(msg.src);
        train = vehicle.GetMyTrain();
        if (!IsTrainInTriggers(train, false))
        {
          // send a release now, just in case. ideally it'll have already been released
          PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
        }
        continue;


      on "Object", "InnerEnter", msg:
        // Vehicle has entered a trigger's inner region in this industry
        vehicle = cast<Vehicle>(msg.src);
        train = vehicle.GetMyTrain();

        triggerName = FindTriggerContainingNode(vehicle.GetGameObjectID(), true);
        shouldIgnoreVehicle = train.IsScheduleRunning() and itc.ShouldIgnoreVehicle(vehicle);
        //Interface.Log("GenericIndustryMain> handling Object,InnerEnter (v = " + vehicle.GetLocalisedName() +
        //              ", train = " + train.GetName() + ", trigger=" + triggerName);

        if (triggerName and !shouldIgnoreVehicle)
        {
          // Don't load from triggers which are on the wrong track.
          if (train.GetLastVisitedTrack())
          {
            if (itc.IsControllingVehicle(vehicle))
            {
              Track track = GetTriggerTrack(triggerName);
              if (track and track != train.GetLastVisitedTrack())
                continue;
            }
          }

          if (TriggerSupportsMovingLoad(vehicle, triggerName))
          {
            if (itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())
              PerformInnerEnterMoving(vehicle, triggerName);
          }
          else if (TriggerSupportsStoppedLoad(vehicle, triggerName))
          {
            if (vehicle.GetMyTrain().IsStopped())
            {
              // This message must have resulted on someone InnerReEnter'ing a
              // stopped vehicle, so just treat it like another stop message.
              vehicle.PostMessage(me, "Object", "Stopped", 0.0);
            }
            else if (itc.IsControllingVehicle(vehicle))
            {
              // Otherwise it's still moving, ask it politely if it wants to stop?
              PerformInnerEnterStop(vehicle);
            }
          }
        }
        continue;


      // User has right-clicked on this industry and selected View Details menu option.
      // Start the ViewDetails() thread to display a browser with industry info.
      on "MapObject", "View-Details":
        ViewDetails();
        continue;


      // Kill browser created by ViewDetails() as it has been closed.
      on "Browser", "Closed", msg:
        if (msg.src == info)
        {
          Sniff(info, "Browser", "", false);
          Sniff(info, "Browser-URL", "", false);

          info = null;
        }
        continue;

    } // wait()

  }


  //=============================================================================
  // Name: HandleTrainUnloadCommand
  // Desc: Called by HandleTrain() to drive an "AI" train through the industry
  //       to be loaded. This method ensures the train is driven through the
  //       industry when not under user control so it can be loaded. Actual
  //       loading is handled by BaseIndustryMain() as it detects vehicles on 
  //       triggers.
  //=============================================================================
  bool HandleTrainLoadCommand(Train train)
  {
    itc.AddTrain(train);
    itc.SetTrainSpeed(train, 3.0f);
    itc.SetTrainCommand(train, Industry.LOAD_COMMAND);

    // Re-send any enter messages in case we missed them while executing a
    //  previous command not mentioning any names, Mr. Drive To.)
    InnerReEnterTrain(train);

    Message msg;
    wait()
    {
      on "HandleTrain", "Release", msg:
        // Train is being released, check if it's the one we want.
        if (msg.dst == train and msg.src == me)
          break;
        continue;

      on "Schedule", "Abort", msg:
        // Release any unlocked vehicles so we abort as soon as possible.
        if (msg.dst == train and itc.RemoveAllUnlockedVehicles(train))
          break;
        continue;

    } // wait()

    // Clean up the ITC (in case the train left the industry behind while still
    // in loading mode).
    itc.RemoveAllUnlockedVehicles(train);
    itc.ClearTrainCommand(train);

    return true;
  }


  //=============================================================================
  // Name: HandleTrainUnloadCommand
  // Desc: Called by HandleTrain() to drive an "AI" train through the industry
  //       to be unloaded. This method ensures the train is driven through the
  //       industry when not under user control so it can be unloaded. Actual
  //       loading is handled by BaseIndustryMain() as it detects vehicles on 
  //       triggers.
  //=============================================================================
  bool HandleTrainUnloadCommand(Train train)
  {
    itc.AddTrain(train);
    itc.SetTrainSpeed(train, 3.0f);
    itc.SetTrainCommand(train, Industry.UNLOAD_COMMAND);

    // Re-send any enter messages in case we missed them while executing a
    //  previous command not mentioning any names, Mr. Drive To.)
    InnerReEnterTrain(train);

    Message msg;
    wait()
    {
      on "HandleTrain", "Release", msg:
        // Train is being released, check if it's the one we want.
        if (msg.dst == train and msg.src == me)
          break;
        continue;

      on "Schedule", "Abort", msg:
        // Release any unlocked vehicles so we abort as soon as possible.
        if (msg.dst == train and itc.RemoveAllUnlockedVehicles(train))
          break;
        continue;

    } // wait()

    // Clean up the ITC (in case the train left the industry behind while still
    // in loading mode).
    itc.RemoveAllUnlockedVehicles(train);
    itc.ClearTrainCommand(train);

    return true;
  }


  //=============================================================================
  // Name: HandleTrain
  // Desc: Called by the Load and Unload> driver commands to initiate "AI"
  //       loading or unloading of a train. This implementation allows for
  //       generic loading or unloading operations to be performed.
  // Parm: train - Train to load/unload. Must be in an industry trigger.
  // Parm: loadCommand - String indicating which driver command to run.
  //=============================================================================
  public bool HandleTrain(Train train, string loadCommand)
  {
    // Don't process this command unless the train is at the correct location (in the triggers)
    // This prevents the train from being in the already-past-the-triggers scenario, which would
    //  cause it to drive on forever waiting for a trigger.
    if (!IsTrainInTriggers(train, false))
    {
      // We're not even within the "outer" range of our triggers, don't bother
      // trying to load, it probably won't work.

      // Log an error into the UI. This should not have happened, but we can at
      // least provide the player a hint as to how to resolve it.
      Interface.Print("Too far from industry.");
      return false;
    }

    if (loadCommand == Industry.LOAD_COMMAND)
      return HandleTrainLoadCommand(train);

    if (loadCommand == Industry.UNLOAD_COMMAND)
      return HandleTrainUnloadCommand(train);

    Interface.Log("GenericIndustry.HandleTrain> Unknown command: " + loadCommand);
    return false;
  }


  //=============================================================================
  // Name: SetQueueInitialCount
  // Desc: Sets the amount of an asset product on the given queue. Despite the
  //       name, this will affect the current product count on this queue.
  // Parm: queue - The queue in this industry to set the count for.
  // Parm: asset - The product asset to alter the count for.
  // Parm: newValue - The amount of product to set into the queue.
  //=============================================================================
  public void SetQueueInitialCount(ProductQueue queue, Asset asset, int newValue)
  {
    // Qestroy the queue, and recreate it
    queue.DestroyAllProducts();

    // Create the product, with the newValue
    queue.CreateProduct(asset, newValue);
  }


  //=============================================================================
  // Name: AddAssetToIndustryProductInfo
  // Desc: Adds a product as being a valid input/output for the named process.
  // Parm: assetName - The name of the asset (as per this assets kuid-table) to
  //       add to the process.
  // Parm: queueName - Name of the queue that the process is to use for the
  //       product input/output.
  // Parm: processName - Name of the process to produce/consume the product.
  // Parm: isInput - Specifies if whether the queue is an input queue (true) or
  //       an output queue (false) when used by the process.
  // Parm: showInViewDetails - Specifies if details of this product capability
  //       should be displayed in the view-details window for this industry.
  //=============================================================================
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


  //=============================================================================
  // Name: AddAssetToIndustryProductInfo
  // Desc: Adds a product as being a valid input/output for the named process.
  // Parm: assetName - The name of the asset (as per this assets kuid-table) to
  //       add to the process.
  // Parm: queueName - Name of the queue that the process is to use for the
  //       product input/output.
  // Parm: processName - Name of the process to produce/consume the product.
  // Parm: isInput - Specifies if whether the queue is an input queue (true) or
  //       an output queue (false) when used by the process.
  //=============================================================================
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput)
  {
    AddAssetToIndustryProductInfo(assetName, queueName, processName, isInput, true);
  }


  //=============================================================================
  // Name: GetDescriptionHTML
  // Desc: Gets a description of this industry as a HTML page to be displayed
  //       in the Surveyor property edit dialog. This implementation lists any
  //       editable industry processes for configuration of the initial state.
  //=============================================================================
  public string GetDescriptionHTML(void)
  {
    StringTable strTable = Constructors.GetTrainzStrings();

    // Use the industry name as a heading.
    string retString = "<p><b><font size=3>" + GetLocalisedName() + "</font></b></p>";

    // Determine all the processes we have, from the user data.
    IndustryProcessInfo[] processes = new IndustryProcessInfo[0];

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
        retString = retString + "<tr><td width=10></td><td width=64></td><td></td><td><b>" + strTable.GetString("interface-common-html0") + "</b></td>";
        retString = retString + "<td><b>" + strTable.GetString("interface-common-html1") + "</b></td></tr>";
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
        retString = retString + "<tr><td width=10></td><td width=64></td><td></td><td><b>" + strTable.GetString("interface-common-html0") + "</b></td>";
        retString = retString + "<td><b>" + strTable.GetString("interface-common-html1") + "</b></td></tr>";
        for (l = 0; l < industryProductList.size(); l++)
        {
          if (!industryProductList[l].isInput and industryProductList[l].processName == processes[i].processName)
            retString = retString + HTMLWindow.GetInputOutputPropertyHTMLCode(me, industryProductList[l].processName, industryProductList[l].queue, industryProductList[l].asset, (string)l, industryProductList[l].isInput);
        }
        retString = retString + "</table><BR>";
      }
    }

    return retString;
  }


  //=============================================================================
  // Name: GetPropertyName
  // Desc: Returns the readable localised name for the given editable property.
  //       Note: Returned names are sourced from the base "Core Strings" asset.
  //=============================================================================
  public string GetPropertyName(string propertyID)
  {
    if (propertyID[0, 13] == "input-amount/")
      propertyID[0, 13] = null;
    else if (propertyID[0, 14] == "output-amount/")
      propertyID[0, 14] = null;
    else if (propertyID[0, 14] == "initial-count/")
      propertyID[0, 14] = null;
    else
      return inherited(propertyID);

    int productIndex = Str.ToInt(propertyID);

    Asset productAsset = industryProductList[productIndex].asset;
    if (!productAsset)
      return "";

    string productName = productAsset.GetLocalisedName();

    StringTable strTable = Constructors.GetTrainzStrings();
    return strTable.GetString1("interface-genericindustry-name0", productName);
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Returns the readable localised description for the given editable
  //       property. Note: The returned descriptions are sourced from the base
  //       "Core Strings" asset.
  //=============================================================================
  public string GetPropertyDescription(string propertyID)
  {
    bool isInitialCount = false;
    if (propertyID[0, 13] == "input-amount/")
    {
      propertyID[0, 13] = null;
    }
    else if (propertyID[0, 14] == "output-amount/")
    {
      propertyID[0, 14] = null;
    }
    else if (propertyID[0, 14] == "initial-count/")
    {
      propertyID[0, 14] = null;
      isInitialCount = true;
    }
    else
    {
      return inherited(propertyID);
    }

    int productIndex = Str.ToInt(propertyID);

    Asset productAsset = industryProductList[productIndex].asset;
    if (!productAsset)
      return "";

    StringTable strTable = Constructors.GetTrainzStrings();
    string productName = productAsset.GetLocalisedName();

    if (isInitialCount)
      return strTable.GetString1("interface-industryinfo-name0", productName);

    if (industryProductList[productIndex].isInput)
      return strTable.GetString1("interface-industryinfo-name1", productName);

    return strTable.GetString1("interface-industryinfo-name2", productName);
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the "type" of the given editable property, so that Trainz can
  //       display an appropriate edit interface.
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    if (propertyID[0, 13] == "input-amount/")
      propertyID[0, 13] = null;
    else if (propertyID[0, 14] == "output-amount/")
      propertyID[0, 14] = null;
    else if (propertyID[0, 14] == "initial-count/")
      propertyID[0, 14] = null;
    else
      return inherited(propertyID);

    int productIndex = Str.ToInt(propertyID);

    ProductQueue queue = industryProductList[productIndex].queue;
    if (!queue)
      return "";

    // All our properties are integer product amounts. Allow any value from 0
    // up to the queue size.
    return "int,0," + (string)queue.GetQueueSize() + ",10";
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of an editable integer property.
  //=============================================================================
  public void SetPropertyValue(string propertyID, int value)
  {
    bool isInitialCount = false;

    if (propertyID[0, 13] == "input-amount/")
    {
      propertyID[0, 13] = null;
    }
    else if (propertyID[0, 14] == "output-amount/")
    {
      propertyID[0, 14] = null;
    }
    else if (propertyID[0, 14] == "initial-count/")
    {
      propertyID[0, 14] = null;
      isInitialCount = true;
    }
    else
    {
      inherited(propertyID, value);
      return;
    }

    int productIndex = Str.ToInt(propertyID);

    string processName = industryProductList[productIndex].processName;
    ProductQueue queue = industryProductList[productIndex].queue;
    Asset asset = industryProductList[productIndex].asset;

    if (isInitialCount)
      SetQueueInitialCount(queue, asset, value);
    else if (industryProductList[productIndex].isInput)
      SetProcessInput(processName, queue, asset, value);
    else
      SetProcessOutput(processName, queue, asset, value);

  }


  //=============================================================================
  // Name: AppendProductList
  // Desc: Adds any products that this industry is currently capable of producing
  //       to the end of the given list.
  //=============================================================================
  public void AppendProductList(Asset[] productList)
  {
    // Find products that we are outputting.
    int i;
    for (i = 0; i < industryProductList.size(); i++)
    {
      if (!industryProductList[i].isInput)
      {
        Asset asset = industryProductList[i].asset;

        // Search for this product and append it to the productList, if not found.
        bool found = false;

        int l;
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


  //=============================================================================
  // Name: ThreadEndPipeAnimation
  // Desc: Plays the pipe retraction animation on the given vehicle.
  // Note: This was written to work with the GATX Oil Tanker vehicle and it is
  //       not going to work unless the vehicle has attachment points named
  //       "pipe-attachment-left" and "pipe-attachment-right". The retractable
  //       pipe is a separate asset that is attached to the vehicle.
  //=============================================================================
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


  //=============================================================================
  // Name: BeginUnload
  // Desc: Called by Vehicle::UnloadProduct() before the unloading takes place.
  //       Overridden from Industry to allow sufficient time for any pipe
  //       animation to run.
  // Parm: report - Progress report of the loading operation.
  // Retn: float - 30.0 to allow for the pipe animation to start if needed, 0.0
  //       otherwise.
  //=============================================================================
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
    }

    return 0.0;
  }


  //=============================================================================
  // Name: GetUnloadTime
  // Desc: Called by Vehicle::UnloadProduct() to determine how long the unloading
  //       operation is to take.
  // Parm: report - Progress report of the loading operation.
  //=============================================================================
  public float GetUnloadTime(LoadingReport report)
  {
    // If we have a pipe animation then allow sufficient time for it to run.
    if (usePipeAnimation)
      return 2.0;

    // Otherwise allow it to be instant. (Note: Industry returns 1.0 by default.)
    return 0.0;
  }


  //=============================================================================
  // Name: EndUnload
  // Desc: Called when ending an unload operation. Overridden from Industry in
  //       order to finalise any pipe animation.
  // Parm: report - Progress report of the loading operation.
  // Retn: float - The time, in seconds, before loading can complete and the
  //       train is able to safely drive away.
  //=============================================================================
  public float EndUnload(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    ThreadEndPipeAnimation(report.GetSrcVehicle());
    return 4.0;
  }


  //=============================================================================
  // Name: BeginLoad
  // Desc: Called by Vehicle::LoadProduct() before the loading takes place.
  //       Overridden from Industry to allow sufficient time for any pipe
  //       animation to run.
  // Parm: report - Progress report of the loading operation.
  // Retn: float - 30.0 to allow for the pipe animation to start if needed, 0.0
  //       otherwise.
  //=============================================================================
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

      return delayTime;
    }

    return 0.0;
  }


  //=============================================================================
  // Name: GetLoadTime
  // Desc: Called by Vehicle::LoadProduct() to determine how long the loading
  //       operation is to take.
  // Parm: report - Progress report of the loading operation.
  //=============================================================================
  public float GetLoadTime(LoadingReport report)
  {
    // If we have a pipe animation then allow sufficient time for it to run.
    if (usePipeAnimation)
      return 2.0;

    // Otherwise allow it to be instant. (Note: Industry returns 1.0 by default.)
    return 0.0;
  }


  //=============================================================================
  // Name: EndLoad
  // Desc: Called when ending a load operation. Overridden from Industry in
  //       order to finalise any pipe animation.
  // Parm: report - Progress report of the loading operation.
  // Retn: float - The time, in seconds, before loading can complete and the
  //       train is able to safely drive away.
  //=============================================================================
  public float EndLoad(LoadingReport report)
  {
    if (!usePipeAnimation)
      return 0.0;

    ThreadEndPipeAnimation(report.GetDstVehicle());
    return 4.5;
  }


};



