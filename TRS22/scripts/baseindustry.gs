//=============================================================================
// File: BaseIndustry.gs
// Desc: 
//=============================================================================
include "Industry.gs"
include "Vehicle.gs"
include "IndustryTrainController.gs"
include "Common.gs"
include "BaseIndustryInfo.gs"
include "IndustryProductInfoCollection.gs"
include "IndustryProductInfoQueues.gs"



//=============================================================================
// Name: BaseIndustry
// Desc: A generic industry base class that can be re-used and extended to get
//       industries up and running quickly. Note that this class is incomplete
//       and needs various functions implemented in order to be complete, but
//       much of the common base functionality is already in place.
//       For examples of this being used see the following builtin assets:
//        * Coal Mine  (kuid:-25:416)
//        * Container Station  (kuid:-25:36)
//        * Forestry  (kuid:-25:521)
//        * Lumber Mill  (kuid:-25:630)
//        * Multiple Industry  (kuid:-25:73)
//        * Multiple Industry New  (kuid:-25:1090)
//        * Oil Refinery  (kuid:-25:671)
//        * Powerstation  (kuid:-25:752)
//
// Extra messages added/supported by this class:
//
//  Major             | Minor                 | Source        | Destination
//--------------------|-----------------------|---------------|----------------
//  GenericIndustry   | LoadComplete          | BaseIndustry  | BaseIndustry
//  GenericIndustry   | LoadComplete          | Vehicle       | BaseIndustry
//  GenericIndustry   | ProcessComplete       | BaseIndustry  | BaseIndustry
//  BaseIndustry      | InterruptIndustryLoad | BaseIndustry  | BaseIndustry
//  HandleTrain       | Release               | Train         | BaseIndustry
//
//=============================================================================
class BaseIndustry isclass Industry
{
  IndustryTrainController itc;              // Lists vehicles/trains that are currently under loading/unloading commands
  Vehicle[]               m_ignoreList;     // Lists vehicles that are being ignored by this industry
  Browser                 info;             // Browser for displaying ViewDetails() request

  bool          useGenericViewDetails = false;
  bool          scriptletEnabled = true;    // Whether the industry is operating (can be changed by inheriting classes)
  bool          industryHasPower = true;    // Whether the industry currently has power (used for display only, does not affect operation)
  public string userDescription = "";
  public float  m_trainLoadingSpeed = 3.0f; // Speed for product loading/unloading when a train is under control of the itc

  // For generic Pipe animations
  string        pipeName;                   // Name of the pipe animation to use when loading/unloading liquid products.
  bool          usePipeAnimation;           // Indicates if this industry uses the pipe animation. If so, extra time is allowed for loading/unloading.

  bool m_bShouldLockControlsWhilePerformingStoppedLoad = true;  // If false, allows a train to remain under player control while loading/unloading.
  bool m_bRequiresLegacyLoadCompleteMessages = false;           // Specifies that this industry relies on certain legacy "LoadComplete:" messages.

  // Information object that allows tracking of industry products and their associated assets, queues and tracks etc.
  public IndustryProductInfoCollection industryProductInfoCollection = new IndustryProductInfoCollection();


  //=============================================================================
  // Forward declarations.

  public void Init(void);

  thread void ViewDetails(void);
  void RefreshViewDetails(void);
  string GetViewDetailsHTMLCode();

  void PerformStoppedLoad(Vehicle vehicle, string triggerName);
  void PerformMovingLoad(Vehicle vehicle, string triggerName);
  bool PerformMassStoppedLoad(Vehicle vehicle, string triggerName);

  bool TriggerSupportsStoppedLoad(Vehicle vehicle, string triggerName);
  bool TriggerSupportsMovingLoad(Vehicle vehicle, string triggerName);
  bool TriggerSupportsMassMovingLoad(Vehicle vehicle, string triggerName);
  bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName);

  thread void ThreadPerformStoppedLoad(Vehicle vehicle, string triggerName);
  thread void ThreadPerformMovingLoad(Vehicle vehicle, string triggerName);
  thread void ThreadPerformMassStoppedLoadChild(Vehicle vehicle, string triggerName, string messageCookie);
  thread void ThreadPerformMassStoppedLoad(Vehicle vehicle, string triggerName);
  thread void PerformInnerEnterMoving(Vehicle vehicle, string triggerName);

  void PerformInnerEnterStop(Vehicle vehicle);
  thread void PerformStoppedChild(Vehicle vehicle, string triggerName);
  thread void PerformStopped(Vehicle vehicle, string triggerName);
  thread void PerformStoppedChild(Vehicle vehicle, string triggerName);
  thread void PerformMassStopped(Vehicle vehicle, string triggerName);

  void PerformStoppedNoTrigger(Train train);
  void PerformStoppedNoTrigger(Vehicle vehicle) { PerformStoppedNoTrigger(vehicle.GetMyTrain()); }

  thread void BaseIndustryMain(void);

  void HandleVehicleStopped(Vehicle vehicle, string triggerName);
  void HandleVehicleMovingEnter(Vehicle vehicle, string triggerName);
  bool HandleTrainLoadCommand(Train train);
  bool HandleTrainUnloadCommand(Train train);
  public bool HandleTrain(Train train, string loadCommand);

  public void SetQueueInitialCount(ProductQueue queue, Asset asset, int newValue);
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput, bool showInViewDetails, bool showInSurveyorProperties);
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails, bool showInSurveyorProperties);
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput, bool showInViewDetails);
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails);
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput);
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput);
  public void AppendProductList(Asset[] productList);

  public void SetVehicleIgnored(Vehicle vehicle, bool ignored);
  public bool IsVehicleIgnored(Vehicle vehicle);

  public bool DoesHavePower() { return industryHasPower; }

  thread void ThreadEndPipeAnimation(Vehicle vehicle);
  public void NotifyProcessFinished(string processName);
  public obsolete string[] GetProductNameList(ProductQueue queue);


  //=============================================================================
  // Name: Init
  // Desc: Initialization method that launches the main industry thread.
  //=============================================================================
  public void Init(void)
  {
    itc = new IndustryTrainController();
    itc.SetOwnerIndustry(me);
    m_ignoreList = new Vehicle[0];

    industryProductInfoCollection.Init(me);

    BaseIndustryInfo industryInfo = new BaseIndustryInfo();
    industryInfo.industry = me;
    SetPropertyHandler(industryInfo);

    pipeName = "pipe";
    usePipeAnimation = false;


    // Assume "LoadComplete:<vehicle name>" type messages are required for anything
    // prior to the version they were obsoleted at, for max compatibility. Overriding
    // classes can disable this if desired.
    if (!GetAsset().SupportsTrainzBuildVersion(4.5))
      m_bRequiresLegacyLoadCompleteMessages = true;

    BaseIndustryMain();
  }


  //=============================================================================
  // Name: ViewDetails
  // Desc: Display details about this industry in a Browser window. This is
  //       called by BaseIndustryMain() when a "MapObject","View-Details" message
  //       is received.
  // Note: BaseIndustryMain() also waits for "Browser","Closed" messages so it
  //       can reset BaseIndustry::info to null when the user closes the window.
  //=============================================================================
  thread void ViewDetails(void)
  {
    if (!useGenericViewDetails)
      return;

    if (!info)
    {
      info = Constructors.NewBrowser();
      info.LoadHTMLString(GetAsset(), GetViewDetailsHTMLCode());
      info.SetWindowRect(100, 110, 500, 545);

      Sniff(info, "Browser", "", true);
      Sniff(info, "Browser-URL", "", true);
    }
  }


  //=============================================================================
  // Name: RefreshViewDetails
  // Desc: Reloads any active view-details window.
  //=============================================================================
  void RefreshViewDetails(void)
  {
    if (info and useGenericViewDetails)
      info.LoadHTMLString(GetAsset(), GetViewDetailsHTMLCode());
  }


  //=============================================================================
  // Name: GetViewDetailsHTMLCode
  // Desc: Returns the html for a view-details browser. This may be overridden to
  //       add extra output to the window, but scripters should avoid attemptting
  //       to reimplement the function entirely, as they risk missing out on new
  //       features added to the base implementation.
  //=============================================================================
  string GetViewDetailsHTMLCode()
  {
    return HTMLWindow.GetCompleteIndustryViewDetailsHTMLCode(me, scriptletEnabled);
  }


  //=============================================================================
  // Name: GetLocallyUniqueMessageCookie
  // Desc: Return a cookie string which is unique within this Industry. This can
  //       be used as a message minor string to ensure that only the intended
  //       recipient can receive it.
  // Retn: string - The cookie string.
  //=============================================================================
  int m_locallyUniqueMessageCookie = 0;
  string GetLocallyUniqueMessageCookie(void)
  {
    ++m_locallyUniqueMessageCookie;
    return "" + m_locallyUniqueMessageCookie;
  }


  //=============================================================================
  // Name: SetShouldLockControlsWhilePerformingStoppedLoad
  // Desc: Sets whether this industry will take over control of a Train while
  //       that Train is involved in a "stopped load" or "stopped unload"
  //       operation. Old industries always lock the controls. New industries may
  //       lock or not as they see fit. This function allows the construction of
  //       a rule so that the session builder may override this Industry's
  //       default state. Depending on the specific Industry, disabling locking
  //       the controls may result in brief visual glitches, however it should
  //       never result in a script error or ongoing visual error.
  // Parm: bShouldLockControlsWhilePerformingStoppedLoad - True if this Industry
  //       should lock the Train's controls while perming a stopped load, or
  //       False if this Industry should not lock the Train's controls.
  //=============================================================================
  public void SetShouldLockControlsWhilePerformingStoppedLoad(bool bShouldLockControlsWhilePerformingStoppedLoad)
  {
    m_bShouldLockControlsWhilePerformingStoppedLoad = bShouldLockControlsWhilePerformingStoppedLoad;
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
  // Name: PerformMassStoppedLoad
  // Desc: This method iterates through all of vehicles in the train and calls
  //       ThreadPerformStoppedLoad() as part of a "mass stopped load".
  //       See also: TriggerSupportsMassStoppedLoad().
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  //=============================================================================
  bool PerformMassStoppedLoad(Vehicle vehicle, string triggerName)
  {
    //Interface.Log("BaseIndustry.PerformMassStoppedLoad> Using default PerformMassStoppedLoad()");

    Vehicle[] vehicles = vehicle.GetMyTrain().GetVehicles();
    int i;
    for (i = 0; i < vehicles.size(); i++)
      ThreadPerformStoppedLoad(vehicles[i], triggerName);

    return true;
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
  // Name: TriggerSupportsMassStoppedLoad
  // Desc: Returns whether a given trigger/vehicle combo is capable of running a
  //       "mass stopped load" operation. A mass stopped load is a load/unload
  //       operation where every car in the train is loaded at the same time. A
  //       good example of this is a passenger station, where the cargo is able
  //       to effectively load itself.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Retn: bool - Whether to attempt a mass stopped load for this train and
  //       trigger. Returns false (not supported) by default.
  //=============================================================================
  bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName)
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
  // Name: TriggerSupportsMassMovingLoad
  // Desc: Returns whether a given trigger/vehicle combo is capable of running a
  //       "mass moving load" operation. A mass moving load is a load/unload
  //       operation where every car in the train is loaded at the same time,
  //       while the train is moving. See also: TriggerSupportsMassStoppedLoad().
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Retn: bool - Whether to attempt a mass moving load for this train and
  //       trigger. Returns false (not supported) by default.
  //=============================================================================
  bool TriggerSupportsMassMovingLoad(Vehicle vehicle, string triggerName)
  {
    return false;
  }


  //=============================================================================
  // Name: PostLoadCompleteMessages
  // Desc: Posts messages indicating that a load/unload process is complete.
  //=============================================================================
  legacy_compatibility void PostLoadCompleteMessages(Vehicle vehicle, string triggerName)
  {
    PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
    vehicle.PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);

    // This message is obsolete and posted for legacy support only.
    if (m_bRequiresLegacyLoadCompleteMessages)
      PostObsoleteMessage(me, "GenericIndustry", "LoadComplete:" + vehicle.GetName(), 0.0f);
  }


  //=============================================================================
  // Name: ThreadPerformStoppedLoad
  // Desc: Called by PerformMassStoppedLoad() to perform a stopped load/unload on
  //       a vehicle. PerformStoppedLoad() will be called to handle the vehicle,
  //       and post a "GenericIndustry","LoadComplete" message before ending.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Note: PerformStoppedLoad() is empty by default, and must be implemented by
  //       the inheriting script for this to work.
  //=============================================================================
  thread void ThreadPerformStoppedLoad(Vehicle vehicle, string triggerName)
  {
    PerformStoppedLoad(vehicle, triggerName);
    PostLoadCompleteMessages(vehicle, triggerName);
  }


  //=============================================================================
  // Name: ThreadPerformMovingLoad
  // Desc: Called by PerformInnerEnterMoving() to perform a moving load/unload on
  //       a vehicle. PerformMovingLoad() will be called to handle the vehicle,
  //       and post a "GenericIndustry","LoadComplete" message before ending.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Note: PerformMovingLoad() is empty by default, and must be implemented by
  //       the inheriting script for this to work.
  //=============================================================================
  thread void ThreadPerformMovingLoad(Vehicle vehicle, string triggerName)
  {
    PerformMovingLoad(vehicle, triggerName);
    PostLoadCompleteMessages(vehicle, triggerName);
  }


  //=============================================================================
  // Name: ThreadPerformMassStoppedLoad
  // Desc: Called by PerformMassStopped() to perform a mass stopped load/unload
  //       on the given vehicle. This is handled as a threaded operation to allow
  //       easy monitoring of relevant abort messages.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Note: PerformStoppedLoad() is empty by default, and must be implemented by
  //       the inheriting script for this to work.
  // Note: If the stopped train is under script control a "HandleTrain","Release"
  //       message is sent to the train once the loading/unloading completes.
  //=============================================================================
  thread void ThreadPerformMassStoppedLoad(Vehicle vehicle, string triggerName)
  {
    //TrainzScript.Log("BaseIndustry.ThreadPerformMassStoppedLoad> IN vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName);

    // Stop the train
    itc.AddVehicleLock(vehicle);
    if (m_bShouldLockControlsWhilePerformingStoppedLoad)
      itc.SetVehicleSpeed(vehicle, 0.0f);

    Train myTrain = vehicle.GetMyTrain();

    //bool loadingAllDone = false;

    itc.StartMonitoringTrain(myTrain);

    string messageCookie = GetLocallyUniqueMessageCookie();
    ThreadPerformMassStoppedLoadChild(vehicle, triggerName, messageCookie);

    Message msg;
    wait()
    {
      on "Train", "Cleanup", msg:
        if (msg.src == myTrain)
        {
          itc.RemoveVehicleLock(vehicle);
          itc.StopMonitoringTrain(myTrain);
          return;
        }
        continue;

      on "Train", "ConsistChanged", msg:
        if (msg.src == myTrain)
        {
          // abort!
          PostMessage(myTrain, "BaseIndustry", "InterruptIndustryLoad", 0.0f);

          // Don't interrupt the wait() because background threads are still running.
          //break;
        }
        continue;

      on "Train", "StartedMoving", msg:
        if (msg.src == myTrain)
        {
          if (!m_bShouldLockControlsWhilePerformingStoppedLoad)
          {
            // abort!
            PostMessage(myTrain, "BaseIndustry", "InterruptIndustryLoad", 0.0f);

            // Don't interrupt the wait() because background threads are still running.
            //break;
          }
        }
        continue;

      on "BaseIndustry.ThreadPerformMassStoppedLoad", "", msg:
        if (msg.src == vehicle)
        {
          if (msg.minor == "Success-" + messageCookie)
          {
            //loadingAllDone = true;
            break;
          }
          else if (msg.minor == "Failed-" + messageCookie)
          {
            //loadingAllDone = false;
            break;
          }
        }
        continue;
    }

    itc.StopMonitoringTrain(myTrain);

    itc.RemoveVehicleLock(vehicle);

    myTrain.DecTrainBusy();

    itc.RemoveVehicle(vehicle);

    // If this was the last vehicle in the train that was loading, we may as well consider ourselves as done.
    // This helps prevent the case where every vehicle fails out and none flags as done.
    //if (!itc.IsControllingTrain(myTrain))
    //  loadingAllDone = true;

    //if (loadingAllDone)
    if (!itc.IsTrainLocked(myTrain))
    {
      // TODO: Evaluate whether we should be sending these messages even if one or more of the loads failed.
      PostMessage(myTrain, "HandleTrain", "Release", 1.0);
      PostLoadCompleteMessages(vehicle, triggerName);
    }

    //TrainzScript.Log("BaseIndustry.ThreadPerformMassStoppedLoad> OUT vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName);
  }


  //=============================================================================
  // Name: ThreadPerformMassStoppedLoadChild
  // Desc: Called from PerformMassStoppedLoad.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Parm: messageCookie - 
  //=============================================================================
  thread void ThreadPerformMassStoppedLoadChild(Vehicle vehicle, string triggerName, string messageCookie)
  {
    //Interface.Log("BaseIndustry.ThreadPerformMassStoppedLoadChild> vehicle=" + vehicle.GetLocalisedName() +
    //              " trigger=" + triggerName + " messageCookie=" + messageCookie);

    if (PerformMassStoppedLoad(vehicle, triggerName))
      vehicle.PostMessage(me, "BaseIndustry.ThreadPerformMassStoppedLoad", "Success-" + messageCookie, 0.0f);
    else
      vehicle.PostMessage(me, "BaseIndustry.ThreadPerformMassStoppedLoad", "Failed-" + messageCookie, 0.0f);
  }


  //=============================================================================
  // Name: PerformInnerEnterMoving
  // Desc: Perform a load/unload operation on a moving vehicle. This is called by
  //       BaseIndustryMain() to load/unload a vehicle that has entered a
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
    //Interface.Log("BaseIndustry.PerformInnerEnterMoving");

    bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

    // Ensure we only lock and unlock on the same train.
    Train myTrain = vehicle.GetMyTrain();
    myTrain.IncTrainBusy();

    if (TriggerSupportsMassMovingLoad(vehicle, triggerName))
    {
      Vehicle[] vehicles = vehicle.GetMyTrain().GetVehicles();
      int i;
      for (i = 0; i < vehicles.size(); ++i)
        ThreadPerformMovingLoad(vehicles[i], triggerName);
    }
    else
    {
      PerformMovingLoad(vehicle, triggerName);
      PostLoadCompleteMessages(vehicle, triggerName);
    }


    myTrain.DecTrainBusy();

    if (isUnderScriptControl)
    {
      if (itc.RemoveVehicle(vehicle))
        PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
    }

    //Interface.Log("BaseIndustry.PerformInnerEnterMoving - done");
  }


  //=============================================================================
  // Name: PerformInnerEnterStop
  // Desc: Stops a moving train so a vehicle can be loaded/unloaded. This is
  //       called by BaseIndustryMain() when a script controlled vehicle enters a
  //       trigger which doesn't support moving load/unload but does stopped
  //       load/unload. It simply stops the train the vehicle is in, as a result,
  //       BaseIndustryMain() will detect the vehicle stopping on the on the
  //       trigger and react appropriately.
  // Note: This function does not perform any loading. It simply stops the
  //       entering train and relies on BaseIndustryMain() to detect that and
  //       react appropriately.
  //=============================================================================
  void PerformInnerEnterStop(Vehicle vehicle)
  {
    //Interface.Log("BaseIndustry.PerformInnerEnterStop>");

    // Tell the train to stop
    Train train = vehicle.GetMyTrain();
    train.SetAutopilotMode(Train.CONTROL_SCRIPT);
    train.SetDCCThrottle(0.0);

    // When it's stopped we'll load, don't release the train until then.
  }


  //=============================================================================
  // Name: PerformStopped
  // Desc: Perform a load/unload operation on a stopped vehicle. This is called by
  //       BaseIndustryMain() to load/unload a vehicle that has stopped on a
  //       trigger within the industry. It will stop the train (if necessary) and
  //       call PerformStoppedLoad() to handle the actual transfer of products.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  // Note: PerformStoppedLoad() is empty by default, and must be implemented by
  //       the inheriting script.
  // Note: If the stopped train is under script control a "HandleTrain","Release"
  //       message is sent to the train once the loading/unloading completes.
  //=============================================================================
  thread void PerformStoppedChild(Vehicle vehicle, string triggerName);
  thread void PerformStopped(Vehicle vehicle, string triggerName)
  {
    if (itc.IsLockedVehicle(vehicle))
    {
      // this vehicle is already involved in some other loading.
      // probably caused by having two overlapping triggers both calling PerformStopped.
      //Interface.Log("BaseIndustry.PerformStopped> vehicle already locked");
      return;
    }


    //Interface.Log("BaseIndustry.PerformStopped");

    // Ensure we only lock and unlock on the same train.
    Train myTrain = vehicle.GetMyTrain();
    myTrain.IncTrainBusy();


    // Ensure the user can't take control of the train while it is loading
    itc.AddVehicle(vehicle, false);

    // Stop the train
    itc.AddVehicleLock(vehicle);
    if (m_bShouldLockControlsWhilePerformingStoppedLoad)
      itc.SetVehicleSpeed(vehicle, 0.0f);

    PerformStoppedChild(vehicle, triggerName);

    itc.StartMonitoringTrain(myTrain);

    Message msg;
    wait()
    {
      on "Train", "Cleanup", msg:
        if (msg.src == vehicle.GetMyTrain())
        {
          itc.RemoveVehicleLock(vehicle);
          itc.StopMonitoringTrain(myTrain);
          return;
        }
        continue;

      on "Train", "ConsistChanged", msg:
        if (msg.src == myTrain)
        {
          // abort!
          PostMessage(myTrain, "BaseIndustry", "InterruptIndustryLoad", 0.0f);

          // Don't interrupt the wait() because background threads are still running.
          //break;
        }
        continue;

      on "Train", "StartedMoving", msg:
        if (msg.src == vehicle.GetMyTrain())
        {
          if (!m_bShouldLockControlsWhilePerformingStoppedLoad)
          {
            // abort!
            PostMessage(myTrain, "BaseIndustry", "InterruptIndustryLoad", 0.0f);

            // Don't interrupt the wait() because background threads are still running.
            //break;
          }
        }
        continue;

      on "GenericIndustry", "LoadComplete", msg:
        if (msg.src == vehicle)
          break;
        continue;
    }

    itc.StopMonitoringTrain(myTrain);

    itc.RemoveVehicleLock(vehicle);

    myTrain.DecTrainBusy();

    if (itc.RemoveVehicle(vehicle))
      PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
    else if (itc.IsControllingVehicle(vehicle) and !itc.IsTrainLocked(vehicle.GetMyTrain()) and m_bShouldLockControlsWhilePerformingStoppedLoad)
      itc.SetVehicleSpeed(vehicle, m_trainLoadingSpeed);

    //Interface.Log("BaseIndustry.PerformStopped> DONE - vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName);
  }


  //=============================================================================
  // Name: PerformStoppedChild
  // Desc: See above.
  //=============================================================================
  thread void PerformStoppedChild(Vehicle vehicle, string triggerName)
  {
    PerformStoppedLoad(vehicle, triggerName);
    PostLoadCompleteMessages(vehicle, triggerName);
  }


  //=============================================================================
  // Name: PerformMassStopped
  // Desc: Attempts to perform a mass load/unload on the entire stopped train.
  //       If this industry supports mass stopped loading/unloading (as per
  //       TriggerSupportsStoppedLoad) then this method is called to handle the
  //       entire load/unload operation. Not just thethe triggering vehicle will
  //       be loaded/unloaded, but the entire train.
  // Parm: vehicle - Vehicle that has entered the industry trigger.
  // Parm: triggerName - Name of the scenery trigger being entered.
  //=============================================================================
  thread void PerformMassStopped(Vehicle vehicle, string triggerName)
  {
    Train myTrain = vehicle.GetMyTrain();

    if (itc.IsLockedVehicle(vehicle))
    {
      // this vehicle is already involved in some other loading.
      // probably caused by having two overlapping triggers both calling PerformStopped.
      //Interface.Log("BaseIndustry.PerformMassStopped> vehicle already locked");
      return;
    }

    if (vehicle.HasLoadedThisStop())
      return;

    //Interface.Log("BaseIndustry.PerformMassStopped");

    bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

    myTrain.IncTrainBusy();

    // Ensure the user can't take control of the train while it is loading
    if (!isUnderScriptControl)
      itc.AddVehicle(vehicle, true);

    ThreadPerformMassStoppedLoad(vehicle, triggerName);

    //Interface.Log("BaseIndustry.PerformMassStopped- handing over to the threads");
  }


  //=============================================================================
  // Name: PerformStoppedNoTrigger
  // Desc: Called by BaseIndustryMain() to drive a train forward when it stops
  //       beyond a valid industry load/unload trigger.
  //=============================================================================
  void PerformStoppedNoTrigger(Train train)
  {
    //Interface.Log("BaseIndustry.PerformStoppedNoTrigger");

    if (itc.IsControllingTrain(train))
    {
      if (!itc.IsTrainLocked(train))
        itc.SetTrainSpeed(train, m_trainLoadingSpeed);
    }
  }


  //=============================================================================
  // Name: BaseIndustryMain
  // Desc: Generic main industry operating thread. This thread is started at Init
  //       to manage the industry. It can be thought of as the conductor that
  //       manages the industry tasks. Once started, it uses a wait() statement
  //       to process industry messages as they occur.
  //
  //       The messages processed by this thread are:
  //        [ Major              | Minor              ]
  //        [ "Train"            | "Cleanup"          ]
  //        [ "GenericIndustry"  | "LoadComplete"     ]
  //        [ "GenericIndustry"  | "ProcessComplete"  ]
  //        [ "Object"           | "Stopped"          ]
  //        [ "Object"           | "Leave"            ]
  //        [ "Object"           | "InnerEnter"       ]
  //        [ "MapObject"        | "View-Details"     ]
  //        [ "Browser"          | "Closed"           ]
  //        [ "IndustryPower"    | "On" / "Off"       ]
  //=============================================================================
  thread void BaseIndustryMain(void)
  {
    Message msg;
    wait()
    {
      on "Train", "Cleanup", msg:
      {
        Train train = cast<Train>(msg.src);
        if (train)
        {
          //Interface.Log("BaseIndustry.BaseIndustryMain> (Train,Cleanup) received, removing train from itc");
          itc.RemoveTrain(train);
        }
        continue;
      }

      on "GenericIndustry", "LoadComplete":
      {
        if (info)
          RefreshViewDetails();
        continue;
      }

      on "GenericIndustry", "ProcessComplete":
      {
        if (info)
          RefreshViewDetails();
        continue;
      }

      // vehicle has stopped moving in an industry trigger
      on "Object", "Stopped", msg:
      {
        Vehicle vehicle = cast<Vehicle>(msg.src);
        if (!vehicle)
          continue;

        if (IsVehicleIgnored(vehicle))
        {
          //Interface.Log("BaseIndustry.BaseIndustryMain> Skipping ignored vehicle '" + vehicle.GetLocalisedName() + "'");
          continue;
        }

        // Don't grab player trains unless they intend to stop
        if (vehicle.GetMyTrain().GetAutopilotMode() != Train.CONTROL_MANUAL or
            vehicle.GetMyTrain().GetDCCThrottle() == 0 or
            vehicle.GetMyTrain().GetTrainBrakes() != Train.TRAIN_BRAKE_RELEASE)
        {
          HandleVehicleStopped(vehicle, FindTriggerContainingNode(vehicle.GetGameObjectID(), true));
        }
        continue;
      }

      // vehicle has left an industry trigger from the outer radius (is always 150 meters,
      // trigger's actual radius defines inner region)
      on "Object", "Leave", msg:
      {
        Vehicle vehicle = cast<Vehicle>(msg.src);
        if (!vehicle)
          continue;

        if (!IsTrainInTriggers(vehicle.GetMyTrain(), false))
        {
          // send a release now, just in case. ideally it'll have already been released
          PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
        }
        continue;
      }

      // vehicle has entered a trigger's inner region in this industry
      on "Object", "InnerEnter", msg:
      {
        Vehicle vehicle = cast<Vehicle>(msg.src);
        if (!vehicle)
          continue;

        if (IsVehicleIgnored(vehicle))
        {
          //Interface.Log("BaseIndustry.BaseIndustryMain> Skipping ignored vehicle '" + vehicle.GetLocalisedName() + "'");
          continue;
        }

        HandleVehicleMovingEnter(vehicle, FindTriggerContainingNode(vehicle.GetGameObjectID(), true));
        continue;
      }

      // User has right-clicked on this industry and selected View Details menu option.
      // Start the ViewDetails() thread to display a browser with industry info.
      on "MapObject", "View-Details":
      {
        ViewDetails();
        continue;
      }

      // Kill browser created by ViewDetails() as it has been closed.
      on "Browser", "Closed", msg:
      {
        if (msg.src == info)
        {
          Sniff(info, "Browser", "", false);
          Sniff(info, "Browser-URL", "", false);

          info = null;
        }
        continue;
      }

      on "IndustryPower", "", msg:
      {
        // This message is posted from the power station rule (but could be from
        // elsewhere). Use it to update whether this industry currently has power.
        if (msg.minor == "On")
          industryHasPower = true;
        else if (msg.minor == "Off")
          industryHasPower = false;

        continue;
      }

    } // wait()

  }


  //=============================================================================
  // Name: HandleVehicleStopped
  // Desc: Called when a vehicle is stopped and should be handled by the industry
  //=============================================================================
  void HandleVehicleStopped(Vehicle vehicle, string triggerName)
  {
    Train train = vehicle.GetMyTrain();

    /*Interface.Log("BaseIndustry.HandleVehicleStopped> vehicle='" + vehicle.GetLocalisedName() +
                  "' train='" + train.GetName() + "' trigger='" + triggerName +
                  "' isScheduleRunning=" + train.IsScheduleRunning() +
                  " shouldIgnoreVehicle=" + itc.ShouldIgnoreVehicle(vehicle));*/

    bool shouldIgnoreVehicle = train.IsScheduleRunning() and itc.ShouldIgnoreVehicle(vehicle);

    if (triggerName != "" and !shouldIgnoreVehicle)
    {
      // ceeb030909 don't load from triggers which are on the wrong track
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
              //Interface.Log("BaseIndustry.HandleVehicleStopped> train not at correct track for trigger (track: '" + track.GetName() + "' trigger: '" + triggerName + "')");
              return;
            }
          }
        }
      }
      else
      {
        //Interface.Log("BaseIndustry.HandleVehicleStopped> train doesnt have last-visited-track");
      }

      if (itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())
      {
        if (TriggerSupportsMassStoppedLoad(vehicle, triggerName))
          PerformMassStopped(vehicle, triggerName);
        else if (TriggerSupportsStoppedLoad(vehicle, triggerName))
          PerformStopped(vehicle, triggerName);
        else
          ; //Interface.Log("BaseIndustry.HandleVehicleStopped> !TriggerSupportsStoppedLoad");
      }
      else
      {
        //Interface.Log("BaseIndustry.HandleVehicleStopped> !(controlling vehicle || allows user control)");
      }
    }
    else
    {
      // uhoh.. well.. umm.. move along, nothing to see here...
      PerformStoppedNoTrigger(train);
    }
  }


  //=============================================================================
  // Name: HandleVehicleMovingEnter
  // Desc: Called when a moving vehicle should be handled by the industry
  //=============================================================================
  void HandleVehicleMovingEnter(Vehicle vehicle, string triggerName)
  {
    Train train = vehicle.GetMyTrain();

    /*Interface.Log("BaseIndustry.HandleVehicleMovingEnter> vehicle='" + vehicle.GetLocalisedName() +
                  "' train='" + train.GetName() + "' trigger='" + triggerName + "'");*/

    bool shouldIgnoreVehicle = train.IsScheduleRunning() and itc.ShouldIgnoreVehicle(vehicle);

    if (triggerName != "" and !shouldIgnoreVehicle)
    {
      // ceeb030909 don't load from triggers which are on the wrong track
      if (train.GetLastVisitedTrack() and itc.IsControllingVehicle(vehicle))
      {
        Track track = GetTriggerTrack(triggerName);
        if (track and track != train.GetLastVisitedTrack())
          return;
      }

      if (TriggerSupportsMovingLoad(vehicle, triggerName) or TriggerSupportsMassMovingLoad(vehicle, triggerName))
      {
        if (itc.IsControllingVehicle(vehicle) or train.GetAllowsUserControl())
          PerformInnerEnterMoving(vehicle, triggerName);
      }
      else if (TriggerSupportsStoppedLoad(vehicle, triggerName) or TriggerSupportsMassStoppedLoad(vehicle, triggerName))
      {
        if (vehicle.GetMyTrain().IsStopped())
        {
          // this message must have resulted on someone InnerReEnter'ing a stopped vehicle
          // .. so just treat it like another stop message ..
          vehicle.PostMessage(me, "Object", "Stopped", 0.0);
        }
        else if (itc.IsControllingVehicle(vehicle))
        {
          // otherwise it's still moving.. ask it politely if it wants to stop?
          PerformInnerEnterStop(vehicle);
        }
      }
    }
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
    itc.SetTrainSpeed(train, m_trainLoadingSpeed);
    itc.SetTrainCommand(train, Industry.LOAD_COMMAND);

    // re-send any enter messages in case we missed them while executing a previous command
    // (not mentioning any names, Mr. Drive To.)
    InnerReEnterTrain(train);

    AITrainScope aiScope = train.OpenAITrainScope();

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

      on "Train", "StoppedMoving", msg:
        // ceeb040316: added this to ensure a clear path (through junctions) out of the industry
        // this may be fired off due to the industry stopping the train. that shouldnt be a problem
        if (msg.src == train)
          train.BeginAITrainStuck(aiScope);
        continue;

      on "Train", "StartedMoving", msg:
        if (msg.src == train)
          train.EndAITrainStuck(aiScope);
        continue;
    }

    train.CloseAITrainScope(aiScope);

    // clean up the ITC (in case the train left the industry behind while still in loading mode)
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
    // Handle the unloading of diesel

    // Move the train forwards slowly, if the train enters a trigger, stop it, and start filling it.
    itc.AddTrain(train);
    itc.SetTrainSpeed(train, m_trainLoadingSpeed);
    itc.SetTrainCommand(train, Industry.UNLOAD_COMMAND);

    // re-send any enter messages in case we missed them while executing a previous command
    // (not mentioning any names, Mr. Drive To.)
    InnerReEnterTrain(train);

    AITrainScope aiScope = train.OpenAITrainScope();

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

      on "Train", "StoppedMoving", msg:
        // ceeb040316: added this to ensure a clear path (through junctions) out of the industry
        // this may be fired off due to the industry stopping the train. that shouldnt be a problem
        if (msg.src == train)
          train.BeginAITrainStuck(aiScope);
        continue;

      on "Train", "StartedMoving", msg:
        if (msg.src == train)
          train.EndAITrainStuck(aiScope);
        continue;
    }

    train.CloseAITrainScope(aiScope);

    // clean up the ITC (in case the train left the industry behind while still in loading mode)
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

    Interface.Log("BaseIndustry.HandleTrain> Unknown command: " + loadCommand);
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
    // destroy the queue, and recreate it
    //queue.DestroyAllProducts();

    // Ensure the queue can take this product. If it can't, MAKE IT! :D
    ProductFilter existingPf = queue.GetProductFilter();
    if (!existingPf.DoesAcceptProduct(asset))
    {
      // Add it to the filter.
      ProductFilter newPf = Constructors.NewProductFilter();
      newPf.CopyFilter(existingPf);
      newPf.AddProduct(asset);
      queue.SetProductFilter(newPf);
    }

    ProductFilter pf = Constructors.NewProductFilter();
    pf.AddProduct(asset);

    int existingCount = queue.CountProductMatching(pf);
    if (existingCount > newValue)
    {
      // remove surplus product
      queue.DestroyProductMatching(pf, existingCount - newValue);
    }
    else if (existingCount < newValue)
    {
      // Create additional product
      queue.CreateProduct(asset, newValue - existingCount);
    }
    else
    {
      // we already have the right number, so don't do anything...
    }
  }


  //=============================================================================
  // Name: AddAssetToIndustryProductInfo
  // Desc: Adds a product as being a valid input/output for the named process.
  // Parm: asset - Product asset to add to the process.
  // Parm: queueName - Name of the queue that the process is to use for the
  //       product input/output.
  // Parm: processName - Name of the process to produce/consume the product.
  // Parm: isInput - Specifies if whether the queue is an input queue (true) or
  //       an output queue (false) when used by the process.
  // Parm: showInViewDetails - Specifies if details of this product capability
  //       should be displayed in the view-details window for this industry.
  // Parm: showInSurveyorProperties - Specifies if details of this process should
  //       be displayed in the Surveyor properties window of this industry.
  //=============================================================================
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput, bool showInViewDetails, bool showInSurveyorProperties)
  {
    ProductQueue queue = GetQueue(queueName);
    if (!queue)
    {
      Interface.Exception("AddAssetToIndustryProductInfo> unknown queue name '" + queueName + "'");
      return;
    }

    IndustryProductInfoComplete ipic = industryProductInfoCollection.AddProduct(asset, null);
    industryProductInfoCollection.AddQueueToProduct(asset, queue);
    int productIndex = industryProductInfoCollection.GetProductIndex(asset);
    int queueIndex = industryProductInfoCollection.GetQueueIndex(productIndex, queue);

    IndustryProductInfoProcess ipip = industryProductInfoCollection.AddProcessToProduct(asset, processName);
    if (isInput)
    {
      ipip.SetVisibleInSurveyor(true, showInSurveyorProperties);
      ipip.SetVisibleInViewDetails(true, showInViewDetails);
      IPICQueue ipicQueue = industryProductInfoCollection.FindIPICQueue(queue);
      ipip.SetInputAmount(GetProcessInput(processName, queue, asset));
      ipip.SetInputQueue(ipicQueue);
    }
    else
    {
      ipip.SetVisibleInSurveyor(false, showInSurveyorProperties);
      ipip.SetVisibleInViewDetails(false, showInViewDetails);
      IPICQueue ipicQueue = industryProductInfoCollection.FindIPICQueue(queue);
      ipip.SetOutputAmount(GetProcessOutput(processName, queue, asset));
      ipip.SetOutputQueue(ipicQueue);
    }
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
  // Parm: showInSurveyorProperties - Specifies if details of this process should
  //       be displayed in the Surveyor properties window of this industry.
  //=============================================================================
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails, bool showInSurveyorProperties)
  {
    Asset asset = GetAsset().FindAsset(assetName);
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, showInViewDetails, showInSurveyorProperties);
  }


  //=============================================================================
  // Name: AddAssetToIndustryProductInfo
  // Desc: Adds a product as being a valid input/output for the named process.
  // Parm: asset - Product asset to add to the process.
  // Parm: queueName - Name of the queue that the process is to use for the
  //       product input/output.
  // Parm: processName - Name of the process to produce/consume the product.
  // Parm: isInput - Specifies if whether the queue is an input queue (true) or
  //       an output queue (false) when used by the process.
  // Parm: showInViewDetails - Specifies if details of this product capability
  //       should be displayed in the view-details window for this industry.
  //=============================================================================
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput, bool showInViewDetails)
  {
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, showInViewDetails, true);
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
    Asset asset = GetAsset().FindAsset(assetName);
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, showInViewDetails, true);
  }


  //=============================================================================
  // Name: AddAssetToIndustryProductInfo
  // Desc: Adds a product as being a valid input/output for the named process.
  // Parm: asset - Product asset to add to the process.
  // Parm: queueName - Name of the queue that the process is to use for the
  //       product input/output.
  // Parm: processName - Name of the process to produce/consume the product.
  // Parm: isInput - Specifies if whether the queue is an input queue (true) or
  //       an output queue (false) when used by the process.
  //=============================================================================
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput)
  {
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, true, true);
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
    AddAssetToIndustryProductInfo(assetName, queueName, processName, isInput, true, true);
  }


  //=============================================================================
  // Name: AppendProductList
  // Desc: Adds any products that this industry is currently capable of consuming
  //       or producing to the end of the given list.
  //=============================================================================
  public void AppendProductList(Asset[] productList)
  {
    // Find products that we are outputting.
    int k;
    for (k = 0; k < industryProductInfoCollection.ipicCollection.size(); ++k)
    {
      Asset asset = industryProductInfoCollection.ipicCollection[k].GetProduct();

      // Search for this product and append it to the productList, if not found.
      bool found = false;

      int l;
      for (l = 0; l < productList.size(); ++l)
      {
        if (productList[l] == asset)
        {
          found = true;
          break;
        }
      }

      if (!found)
        productList[productList.size()] = asset;

    } // for (k = 0; k < industryProductInfoCollection.ipicCollection.size(); ++k)

  }


  //=============================================================================
  // Name: SetVehicleIgnored
  // Desc: Sets whether a specific vehicle should be ignored by this industry.
  //       Ignored vehicles should not be loaded/unload/locked or altered in any
  //       way.
  //=============================================================================
  public void SetVehicleIgnored(Vehicle vehicle, bool ignored)
  {
    if (!vehicle)
      return;

    int i;
    for (i = 0; i < m_ignoreList.size(); ++i)
    {
      if (m_ignoreList[i] == vehicle)
      {
        if (!ignored)
        {
          m_ignoreList[i, i + 1] = null;

          //Interface.Log("BaseIndustry.SetVehicleIgnored> '" + vehicle.GetLocalisedName() + "' removed");

          itc.AddVehicle(vehicle, false);
          if (vehicle.GetMyTrain().IsStopped())
            HandleVehicleStopped(vehicle, FindTriggerContainingNode(vehicle.GetGameObjectID(), true));
          else
            HandleVehicleMovingEnter(vehicle, FindTriggerContainingNode(vehicle.GetGameObjectID(), true));
        }

        // Vehicle found, and either removed or in the list, return
        return;
      }
    }

    if (ignored)
    {
      //Interface.Log("BaseIndustry.SetVehicleIgnored> '" + vehicle.GetLocalisedName() + "' added");
      m_ignoreList[m_ignoreList.size()] = vehicle;
    }
  }


  //=============================================================================
  // Name: IsVehicleIgnored
  // Desc: Returns whether the vehicle passed is in the ignore list
  //=============================================================================
  public bool IsVehicleIgnored(Vehicle vehicle)
  {
    int i;
    for (i = 0; i < m_ignoreList.size(); ++i)
    {
      if (m_ignoreList[i] == vehicle)
        return true;
    }

    return false;
  }


  //=============================================================================
  // Name: GetProductNameList
  // Desc: Returns the names of the products that the passed queue can contain.
  //       Deprecated, uses should be updated to use asynchronous searches or
  //       "asset-list" properties.
  //=============================================================================
  public obsolete string[] GetProductNameList(ProductQueue queue)
  {
    int i;

    ProductFilter filter = queue.GetProductFilter();
    string[] retList = new string[0];

    Asset[] installedProductAssets = World.GetAssetList("product");
    for (i = 0; i < installedProductAssets.size(); i++)
    {
      if (filter.DoesAcceptProduct(installedProductAssets[i]))
        retList[retList.size()] = installedProductAssets[i].GetLocalisedName();
    }

    return retList;
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
    if (m_overriddenBeginLoadTime > 0.0)
      return m_overriddenBeginLoadTime;

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
    if (m_overriddenBeginLoadTime > 0.0)
      return m_overriddenBeginLoadTime;

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


  //=============================================================================
  // Name: NotifyProcessFinished
  // Desc: Called by Trainz once when a process is ready to stop running.
  //       This is overridden from Industry in order to post a "ProcessComplete"
  //       whenever a process finishes.
  // Parm: processName - The identifying name of the process that has finished.
  //=============================================================================
  public void NotifyProcessFinished(string processName)
  {
    inherited(processName);

    PostMessage(me, "GenericIndustry", "ProcessComplete", 0.0f);
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Restores the state of this object using a soup generated by a previous
  //       call to GetProperties().
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    inherited(soup);

    userDescription = soup.GetNamedTag("GenericIndustry.userDescription");
    m_bShouldLockControlsWhilePerformingStoppedLoad = soup.GetNamedTagAsBool("GenericIndustry.shouldLockControlsForStoppedLoad", m_bShouldLockControlsWhilePerformingStoppedLoad);

    industryProductInfoCollection.SetProperties(soup, me);
    itc.SetProperties(soup.GetNamedSoup("generic-itc"));
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Saves this object state to the Soup passed, such that it can be
  //       restored with a later call to SetProperties().
  //=============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    soup.SetNamedTag("GenericIndustry.userDescription", userDescription);
    soup.SetNamedTag("GenericIndustry.shouldLockControlsForStoppedLoad", m_bShouldLockControlsWhilePerformingStoppedLoad);

    industryProductInfoCollection.GetProperties(soup, me);
    soup.SetNamedSoup("generic-itc", itc.GetProperties());

    return soup;
  }


};


