//
// BaseIndustry.gs
//
//  Copyright (C) 2003-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Industry.gs"
include "Vehicle.gs"
include "IndustryTrainController.gs"
include "Common.gs"
include "BaseIndustryInfo.gs"
include "IndustryProductInfoCollection.gs"
include "IndustryProductInfoQueues.gs"


//! A generic industry base class.
//
// This class provides generic industry functionality that script programmers can re-use and extend
// so they can have their industries up and running quickly.  This class can't run a custom 
// user-created industry on its own - it needs various methods implemented.  However, what this
// class does provide is a framework that does handle the more complex parts of an industry like 
// trigger message programming.
//
// Examples of this class being used can be seen in the script source of the following industries:
//  - <l astSrcIndCoalMine   Coal Mine>
//  - <l astSrcIndContStat   Container Station>
//  - <l astSrcIndForest     Forestry>
//  - <l astSrcIndHydePulp   Hyde Pulp Mill>
//  - <l astSrcIndLumbMill   Lumber Mill>
//  - <l astSrcIndMulti      Multiple Industry>
//  - <l astSrcIndMultiNew   Multiple Industry New>
//  - <l astSrcIndOilField   Oil Field>
//  - <l astSrcIndOilRefin   Oil Refinery>
//  - <l astSrcIndPowerStat  Power Station>
//  - <l astSrcIndSteamFill  Steam Filling Station>
//
// See Also:
//     BaseIndustryInfo, IndustryProductInfoCollection, IndustryProductInfoComplete, 
//     IndustryProcessInfo, IndustryProductInfo, IndustryTrainController, GenericIndustry
//
class BaseIndustry isclass Industry
{
  IndustryTrainController itc;  // Lists vehicles/trains that are currently under loading/unloading commands.
  Vehicle[] m_ignoreList;       // Lists vehicles that are being ignored by this industry
  Browser info;                 // Browser for displaying ViewDetails() request.

  bool useGenericViewDetails = false;
  bool scriptletEnabled = true;
  public string userDescription = "";
  public float m_trainLoadingSpeed = 3.0f;  //!< Speed for product loading/unloading when a train is under control of the <l BaseIndustry::itc  industry train controller>.

  // For generic Pipe animations
  string pipeName;        //!< Name of the pipe animation to use when loading/unloading liquid products.
  bool usePipeAnimation;  //!< Indicates if this industry does use the pipe animation.  If so, extra time is allowed for loading/unloading.

  //
  bool m_bShouldLockControlsWhilePerformingStoppedLoad = true;    // Locking the controls during a stopped load is now optional.
  

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

  public void Init(void);
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

  thread void ThreadEndPipeAnimation(Vehicle vehicle);
  public float BeginUnload(LoadingReport report);
  public float GetUnloadTime(LoadingReport report);
  public float EndUnload(LoadingReport report);
  public float BeginLoad(LoadingReport report);
  public float GetLoadTime(LoadingReport report);
  public float EndLoad(LoadingReport report);
  public void NotifyProcessFinished(string processName);
  public string [] GetProductNameList(ProductQueue queue);
  public void SetProperties(Soup soup);
  public Soup GetProperties(void);



  //! Information object that allows tracking of industry products and their associated assets, queues and tracks etc.
  public IndustryProductInfoCollection industryProductInfoCollection = new IndustryProductInfoCollection();


  //! Display details about this industry in a Browser window.
  //
  // This method is called by BaseIndustryMain() when a (<m"%MapObject">, <m"View-Details">) message
  // is received.  The default implementation provide in this class is empty and does nothing and it
  // is intended that the scriptlet programmer implements this method to display industry information
  // in the <l BaseIndustry::info  info> browser if desired.
  //
  // BaseIndustryMain() also waits for messages of type (<m"%Browser-Closed">, <m"">) so it can
  // reset <l BaseIndustry::info  info> to null when the user closes the browser window.  So that
  // the main thread can keep processing messages while the user is reading the browser window, 
  // ViewDetails() runs on a thread of its own.
  //
  // Note:
  //     The HTMLWindow class provides several handy utility methods that can be used to construct
  //     HTML code that describes an industry.
  //
  // See Also:
  //     Browser
  //
  thread void ViewDetails(void)
  {
    if (!useGenericViewDetails)
      return;

    if (!info)
    {
      info = Constructors.NewBrowser();
      info.LoadHTMLString(GetViewDetailsHTMLCode());
      info.SetWindowRect(100, 110, 500, 545);
    }
  }

  void RefreshViewDetails(void)
  {
    if (info and useGenericViewDetails)
      info.LoadHTMLString(GetViewDetailsHTMLCode());
  }

  string GetViewDetailsHTMLCode()
  {
    return HTMLWindow.GetCompleteIndustryViewDetailsHTMLCode(me, scriptletEnabled);
  }
  
  
  
  // ============================================================================
  // Name: GetLocallyUniqueMessageCookie
  // Desc: Return a cookie string which is unique to this Industry. This can be
  //       used as a message minor string to ensure that only the intended
  //       recipient can receive it.
  // Retn: string - The cookie string.
  // ============================================================================
  int m_locallyUniqueMessageCookie = 0;
  string GetLocallyUniqueMessageCookie(void)
  {
    m_locallyUniqueMessageCookie ++;
    return "" + m_locallyUniqueMessageCookie;
  }
  
  
  // ============================================================================
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
  // ============================================================================
  public void SetShouldLockControlsWhilePerformingStoppedLoad(bool bShouldLockControlsWhilePerformingStoppedLoad)
  {
    m_bShouldLockControlsWhilePerformingStoppedLoad = bShouldLockControlsWhilePerformingStoppedLoad;
  }


  //! Called by either PerformStopped() or ThreadPerformStoppedLoad() to load/unload a vehicle when it has stopped.
  //
  // This method has an empty implementation and must be implemented by the script programmer if
  // they want their industry to load/unload a stopped vehicle.  No user implementation is needed
  // if the industry concerned doesn't support the loading/unloading of stopped vehicles or a mass
  // stopped load.
  //
  // Param:  vehicle      Vehicle to load when stopped on <i triggerName>.
  // Param:  triggerName  Name of the scenery trigger where loading is to take place.
  //
  void PerformStoppedLoad(Vehicle vehicle, string triggerName)
  {
  }


  //! Called by either PerformInnerEnterMoving() or ThreadPerformMovingLoad() to load/unload a vehicle while it is moving.
  //
  // This method has an empty implementation and must be implemented by the script programmer if
  // they want their industry to load/unload a moving vehicle.  No user implementation is needed
  // if the industry concerned doesn't support the loading/unloading of moving vehicles.
  //
  // Param:  vehicle      Vehicle to load while moving over <i triggerName>.
  // Param:  triggerName  Name of the scenery trigger where loading is to take place.
  //
  void PerformMovingLoad(Vehicle vehicle, string triggerName)
  {
  }


  //! Called by ThreadPerformMassStoppedLoad() to perform a stopped load/unload across an entire train.
  //
  // This method iterates through all of the <l Vehicle::GetMyTrain()  vehicles> in the 
  // <l Train::GetVehicles()  train> that <i vehicle> belongs to and calls ThreadPerformStoppedLoad()
  // on each one such that an  attempt to load/unload the entire train in one go is attempted.
  //
  // Param:  vehicle      Vehicle in the train to perform a mass stopped load/unload on.
  // Param:  triggerName  Name of the scenery trigger where loading is to take place.  
  //
  // Returns:
  //     Always returns true.
  //
  // See Also:
  //     Vehicle::GetMyTrain(), Train::GetVehicles()
  //
  bool PerformMassStoppedLoad(Vehicle vehicle, string triggerName)
  { 
    Interface.Log("* Using default PerformMassStoppedLoad(), and calling all ThreadPerformStoppedLoad() instead.");
    Train myTrain = vehicle.GetMyTrain();
    Vehicle[] vehicles = myTrain.GetVehicles();
    int i;
    for (i = 0; i < vehicles.size(); i++)
    {
      ThreadPerformStoppedLoad(vehicles[i], triggerName);
    }    
    return true; 
  }


  //! Determines if the given vehicle can be loaded/unloaded at the named scenery trigger while stopped.
  //
  // This method is called by BaseIndustryMain() to determine if <i triggerName> allows <i vehicle>
  // to be loaded/unloaded on it while stopped.  As the BaseIndustry implementation always returns false,
  // the script programmer needs to write their own implementation if they want any loading/unloading 
  // while stopped to happen on a trigger in their industry.
  //
  // Note:
  //     If no loading/unloading while stopped is supported on any of your industry triggers, then
  //     you don't need to implement this method as the default return value of false is sufficient.
  //
  // Param:  vehicle      Vehicle that has recently entered/stopped on the scenery trigger.
  // Param:  triggerName  Name of the scenery trigger to check for support of loading/unloading with
  //                      a stopped vehicle.
  //
  // Returns:
  //     Returns true if <i triggerName> supports loading from <i vehicle> while stopped, false otherwise.
  //
  bool TriggerSupportsStoppedLoad(Vehicle vehicle, string triggerName) { return false; }


  //! Determines if the given vehicle can be loaded/unloaded at the named scenery trigger while moving.
  //
  // This method is called by BaseIndustryMain() to determine if <i triggerName> allows <i vehicle>
  // to be loaded/unloaded on it while moving.  As the BaseIndustry implementation always returns 
  // false, the script programmer needs to write their own implementation if they want any 
  // loading/unloading while moving to happen on a trigger in their industry.
  //
  // Note:
  //     If no loading/unloading while moving is supported on any of your industry triggers, then
  //     you don't need to implement this method as the default return value of false is sufficient.
  //
  // Param:  vehicle      Vehicle that has recently entered/stopped on the scenery trigger.
  // Param:  triggerName  Name of the scenery trigger to check for support of loading/unloading with
  //                      a moving vehicle.
  //
  // Returns:
  //     Returns true if <i triggerName> supports loading from <i vehicle> while moving, false otherwise.
  //
  bool TriggerSupportsMovingLoad(Vehicle vehicle, string triggerName) { return false; }


  //! Determines if the given vehicle (and its train) can have a mass load/unload performed while moving over the named scenery trigger.
  //
  // This method is called by BaseIndustryMain() and PerformInnerEnterMoving() to determine if
  // <i triggerName> allows <i vehicle> and all of the <l Train::GetVehicles()  vehicles> in 
  // <l Vehicle::GetMyTrain()  its train> to be mass loaded/unloaded in one hit while moving 
  // (hence the term mass).  If so, then PerformInnerEnterMoving() will attempt to load/unload
  // all vehicles in <i vehicle>'s train via ThreadPerformMovingLoad().
  //
  // Note:
  //     If no mass loading/unloading while moving is supported on any of your industry triggers,
  //     then you don't need to implement this method as the default return value of false is 
  //     sufficient.
  //
  // Param:  vehicle      Vehicle that has recently entered/stopped on the scenery trigger.
  // Param:  triggerName  Name of the scenery trigger to check for support of mass loading/unloading
  //                      while moving.
  //
  // Returns:
  //     Returns true if this industry supports mass loading/unloading when <i vehicle> is moving 
  //     over <i triggerName>, false otherwise.
  //
  bool TriggerSupportsMassMovingLoad(Vehicle vehicle, string triggerName) { return false; }


  //! Determines if the given vehicle (and its train) can have a mass load/unload performed while stopped on the named scenery trigger.
  //
  // This method is called by BaseIndustryMain() to determine if <i triggerName> allows <i vehicle>
  // and all of the <l Train::GetVehicles()  vehicles> in <l Vehicle::GetMyTrain()  its train> to be
  // loaded/unloaded in one hit when stopped (hence the term mass).  If so, then PerformMassStopped()
  // is called by BaseIndustryMain() to handle the mass stopped load/unload.
  //
  // A good example of a mass stopped load/unload situation would be a passenger station as 
  // generally, all coaches are stopped along the platform and will have passengers boarding and
  // disembarking at once.  The loading/unloading of a train on a per vehicle basis may be ideal
  // for an ore dump in a mine but probably isn't a very good way to run a passenger service.
  // The GenericPassengerStation class, which is derived from BaseIndustry, uses mass stopped
  // loading/unloading for passengers.
  //
  // Note:
  //     If no mass loading/unloading while stopped is supported on any of your industry triggers,
  //     then you don't need to implement this method as the default return value of false is 
  //     sufficient.
  //
  // Param:  vehicle      Vehicle that has recently entered/stopped on the scenery trigger.
  // Param:  triggerName  Name of the scenery trigger to check for support of mass loading/unloading
  //                      while stopped.
  //
  // Returns:
  //     Returns true if this industry supports mass loading/unloading when <i vehicle> is stopped
  //     on <i triggerName>, false otherwise.
  //
  bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName) { return false; }


  //! Called by PerformMassStoppedLoad() to load/unload a vehicle.
  //
  // This method is called by PerformMassStoppedLoad() for each vehicle in the train to perform a 
  // mass stopped load/unload.  It will call PerformStoppedLoad() to handle the vehicle and post a
  // message to this industry of type (<m"%GenericIndustry">, <m "LoadComplete">) for 
  // BaseIndustryMain() to process before ending.
  //
  // Param:  vehicle      Vehicle to forward on to PerformMassStoppedLoad() for loading/unloading.
  // Param:  triggerName  Name of the scenery trigger to forward on to PerformMassStoppedLoad().
  //
  thread void ThreadPerformStoppedLoad(Vehicle vehicle, string triggerName)
  {
    PerformStoppedLoad(vehicle, triggerName);
    PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
    PostMessage(me, "GenericIndustry", "LoadComplete:" + vehicle.GetName(), 0.0f);
  }


  //! Called by PerformInnerEnterMoving() to perform a moving load/unload on a vehicle.
  //
  // This method is called by PerformInnerEnterMoving() to load/unload a moving vehicle.  It will
  // call PerformMovingLoad() to handle the vehicle and post a message to this industry of type
  // (<m"%GenericIndustry">, <m "LoadComplete">) for BaseIndustryMain() to process before ending.
  //
  // Param:  vehicle      Vehicle to forward on to PerformMovingLoad() for loading/unloading.
  // Param:  triggerName  Name of the scenery trigger to forward on to PerformMovingLoad().
  //
  thread void ThreadPerformMovingLoad(Vehicle vehicle, string triggerName)
  {
    PerformMovingLoad(vehicle, triggerName);
    PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
    PostMessage(me, "GenericIndustry", "LoadComplete:" + vehicle.GetName(), 0.0f);
  }


  //! Called by PerformMassStopped() to perform a mass stopped load/unload on the given vehicles.
  //
  // This method is called by PerformMassStopped() to allow for vehicle being part of a train that
  // a mass stopped load/unload is being attempted on.  It will call PerformMassStoppedLoad() to 
  // handle the vehicle.  If this is successful, a (<m"HandleTrain">, <m "Release">) message is 
  // posted <i vehicle>'s <l Vehicle::GetMyTrain()  train> along with a 
  // (<m"%GenericIndustry">, <m "LoadComplete">) message to this industry for BaseIndustryMain() to
  // process.
  //
  // Param:  vehicle      Vehicle to forward on to PerformMassStoppedLoad() for loading/unloading.
  // Param:  triggerName  Name of the scenery trigger to forward on to PerformMassStoppedLoad().
  //
  thread void ThreadPerformMassStoppedLoad(Vehicle vehicle, string triggerName)
  {
    // TrainzScript.Log("BaseIndustry.ThreadPerformMassStoppedLoad> IN vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName);

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
      PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
      PostMessage(me, "GenericIndustry", "LoadComplete:" + vehicle.GetName(), 0.0f);
    }
    
    // TrainzScript.Log("BaseIndustry.ThreadPerformMassStoppedLoad> OUT vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName);
  }
  

  thread void ThreadPerformMassStoppedLoadChild(Vehicle vehicle, string triggerName, string messageCookie)
  {
    Interface.Log("ThreadPerformMassStoppedLoadChild> vehicle=" + vehicle.GetLocalisedName() + " trigger=" + triggerName + " messageCookie=" + messageCookie);
    
    if (PerformMassStoppedLoad(vehicle, triggerName))
      vehicle.PostMessage(me, "BaseIndustry.ThreadPerformMassStoppedLoad", "Success-" + messageCookie, 0.0f);
    
    else
      vehicle.PostMessage(me, "BaseIndustry.ThreadPerformMassStoppedLoad", "Failed-" + messageCookie, 0.0f);
  }


  //! Perform a load/unload operation on a moving vehicle.
  //
  // This method is called by BaseIndustryMain() to load/unload a moving vehicle that has entered
  // an industry trigger.  If this industry supports mass loading/unloading when moving, 
  // ThreadPerformMovingLoad() will be called to handle all the vehicles in a mass load/unload 
  // operation.  Otherwise PerformMovingLoad() will be called just to process <i vehicle>.
  //
  // If the train that <i vehicle> is in is under a script control, a message of type
  // (<m"HandleTrain">, <m "Release">) is sent to the train once the loading/unloading has been 
  // completed.
  //
  // Param:  vehicle      Vehicle that has entered the trigger,
  // Param:  triggerName  Name of the trigger being entered.
  //
  thread void PerformInnerEnterMoving(Vehicle vehicle, string triggerName)
  {
    //Interface.Log("BaseIndustry.PerformInnerEnterMoving");

    bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

    // Ensure we only lock and unlock on the same train.
    Train myTrain = vehicle.GetMyTrain();
    myTrain.IncTrainBusy();

    if (TriggerSupportsMassMovingLoad(vehicle, triggerName))
    {
      Train myTrain = vehicle.GetMyTrain();
      Vehicle[] vehicles = myTrain.GetVehicles();
      int i;
      for (i = 0; i < vehicles.size(); i++)
      {
        ThreadPerformMovingLoad(vehicles[i], triggerName);
      }
    }
    else
    {
      PerformMovingLoad(vehicle, triggerName);
      PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
      PostMessage(me, "GenericIndustry", "LoadComplete:" + vehicle.GetName(), 0.0f);
    }


    myTrain.DecTrainBusy();

    if (isUnderScriptControl)
      if (itc.RemoveVehicle(vehicle))
        PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);

    //Interface.Log("BaseIndustry.PerformInnerEnterMoving - done");
  }


  //! Stops a moving train so a vehicle can be loaded/unloaded.
  //
  // This method is called by BaseIndustryMain() when a vehicle has entered a trigger but the 
  // trigger doesn't support loading/unloading while moving yet it supports loading/unloading while
  // stopped and the vehicle is not under user control.  It stops the train <i vehicle> is attached
  // to and as a result, BaseIndustryMain() will detect the vehicle stopping on the on the trigger
  // and react appropriately.
  //
  // Param:  vehicle  Vehicle to stop the train of if needed.
  //
  void PerformInnerEnterStop(Vehicle vehicle)
  {
    //Interface.Log("BaseIndustry.PerformInnerEnterStop");

    // Tell the train to stop
    Train train = vehicle.GetMyTrain();
    train.SetAutopilotMode(Train.CONTROL_SCRIPT);
    train.SetDCCThrottle(0.0);

    // When its stopped, we shall load.
    // Don't release the train just yet until then..
  }


  //! Perform a load/unload operation on a moving vehicle.
  //
  // This method is called by BaseIndustryMain() to load/unload a vehicle that has stopped on a
  // scenery trigger.  It will stop the train if necessary and call PerformStoppedLoad() to handle
  // the actual transfer of products (which must be user-implemented if they want their industry to
  // load/unload stopped vehicles).  If the train that <i vehicle> is in is under script control, a
  // message of type (<m"HandleTrain">, <m "Release">) is sent to the train once the 
  // loading/unloading has been completed.
  //
  // Param:  vehicle      Vehicle that has entered the trigger,
  // Param:  triggerName  Name of the scenery trigger being entered.
  //
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

      on "GenericIndustry", "", msg:
        if (msg.src == me and msg.minor == "LoadComplete:" + vehicle.GetName()) // TODO: may need to improve the uniqueness of this message.
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


  thread void PerformStoppedChild(Vehicle vehicle, string triggerName)
  {
    PerformStoppedLoad(vehicle, triggerName);
    PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
    PostMessage(me, "GenericIndustry", "LoadComplete:" + vehicle.GetName(), 0.0f);
  }


  //! Attempts to perform a mass load/unload on the entire stopped train.
  //
  // If this industry supports mass stopped loading/unloading as reported TriggerSupportsStoppedLoad()
  // when called from BaseIndustryMain(), this method is called to handle the entire mass stopped 
  // load/unload.  Not only will <i vehicle> be loaded/unloaded, but also the entire train.  The
  // ThreadPerformMassStoppedLoad() method will be called to handle this.
  //
  // Param:  vehicle      Vehicle that has entered the trigger,
  // Param:  triggerName  Name of the scenery trigger being entered.
  //
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


  //! Starts moving a stopped train in this industry that isn't user controlled.
  //
  // This method is called by BaseIndustryMain() to start moving a train not under user control
  // that has a vehicle stopped outside an industry trigger.  It will set the train to keep driving
  // so that the vehicle will eventually encounter a trigger.
  //
  // Param:  vehicle  Vehicle that is stopped yet not on a trigger.
  //
  void PerformStoppedNoTrigger(Train train)
  {
    //Interface.Log("BaseIndustry.PerformStoppedNoTrigger");

    if (itc.IsControllingTrain(train))
      if (!itc.IsTrainLocked(train))
        itc.SetTrainSpeed(train, m_trainLoadingSpeed);
  }


  //! Generic main industry operating thread.
  //
  // This thread is started by the Init() method when the industry game object is created to manage
  // the industry.  It can be thought of as the conductor that makes the industry run.  Once
  // started, it cycles through a <l gscLangKeyWait  wait> statement indefinitely waiting for 
  // messages to process and act on.
  //
  // Messages processed by this thread are:
  //
  // {[ Major              | Minor              ]
  //  [ "GenericIndustry"  | "LoadComplete"     ]
  //  [ "GenericIndustry"  | "ProcessComplete"  ]
  //  [ "Object"           | "Stopped"          ]
  //  [ "Object"           | "Leave"            ]
  //  [ "Object"           | "InnerEnter"       ]
  //  [ "MapObject"        | "View-Details"     ]
  //  [ "Browser-Closed"   | ""                 ]}
  //
  // Depending on what message is received, this method will call methods within this class to 
  // handle the required task.
  //
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
          //Interface.Log("BaseIndustry.BaseIndustryMain> (Train,Cleanup) recieved, removing train from itc");
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

        HandleVehicleStopped(vehicle, FindTriggerContainingNode(vehicle.GetId(), true));
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

        HandleVehicleMovingEnter(vehicle, FindTriggerContainingNode(vehicle.GetId(), true));
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
      on "Browser-Closed", "", msg:
      {
        if (msg.src == info)
          info = null;
        continue;
      }
    }
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
          ;//Interface.Log("BaseIndustry.HandleVehicleStopped> !TriggerSupportsStoppedLoad");
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


  //! Called by HandleTrain() to drive a train that is not under user control through the industry to be loaded.
  //
  // This method ensures the train is driven through the industry when not under user control so it
  // can be loaded.  Actual loading is handled by BaseIndustryMain() as it detects vehicles on
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


  //! Called by HandleTrain() to drive a train not under user control through the industry to be unloaded.
  //
  // This method ensures the train is driven through the industry when not under user control so it
  // can be unloaded.  Actual loading is handled by BaseIndustryMain() as it detects vehicles on 
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
  //                      See \ref loadUnloadCmds  "Load and Unload Driver Command Strings" for
  //                      details.
  //
  // Returns:
  //     Returns true if the train is in a trigger and the command was performed successfully,
  //     false otherwise.
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
    {
      return HandleTrainLoadCommand(train);
    }
    else if (loadCommand == Industry.UNLOAD_COMMAND)
    {
      return HandleTrainUnloadCommand(train);
    }

    return false;
  }


  //! Initialization method that launches the main industry thread.
  //
  // If provided, %Trainz calls the Init() method when it creates the game object.  Usually the 
  // script programmer would define an Init() method themselves to handle the  initialization of
  // data members and possibly even start a thread to manage the object.
  //
  // The implementation in this class initializes the <l BaseIndustry::itc  itc> object and then
  // starts the BaseIndustryMain() thread is started.  This thread will handle the messaging 
  // required to 'run' an industry.
  //
  public void Init(void)
  {
    itc = new IndustryTrainController();
    itc.SetOwnerIndustry(me);
    m_ignoreList = new Vehicle[0];

    industryProductInfoCollection.Init(me);

    BaseIndustryInfo info = new BaseIndustryInfo();
    info.industry = me;
    SetPropertyHandler(info);

    pipeName = "pipe";
    usePipeAnimation = false;

    BaseIndustryMain();
  }


  //! Sets the initial count of the given queue such that it contains a set amount of a particular product.
  //
  // Note:
  //     <l ProductQueue::DestroyAllProducts  DestroyAllProducts>() is called on <i queue> so any
  //     current contents will be destroyed.
  //
  // Param:  queue     Queue in this industry to set the initial count of.
  // Param:  asset     Type of asset <i queue> is to contain.
  // Param:  newValue  Amount of products of type <i asset> that <i queue> is to have as its initial default.
  //
  // See Also:
  //     ProductQueue::DestroyAllProducts(), ProductQueue::CreateProduct(), MapObject::GetQueues()
  //
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
    // else we already have the right number, so don't do anything...
  }


  //! Allows a product to be added as being valid input/output for the named process.
  //
  // Param:  asset                     Product asset to add to the process.
  // Param:  queueName                 Name of queue in this industry that the process is to use for the
  //                                   input/output of the product.
  // Param:  processName               Name of the industry process that is to produce/consume the product.
  // Param:  isInput                   Specifies if <i queueName> is an input queue (true) or output queue
  //                                   (false) when used by the process.
  // Param:  showInViewDetails         Specifies if details of this product capability should be displayed
  //                                   in the browser window when the user requests details of the industry.
  // Param:  showInSurveyorProperties  Specifies if details of this product capability should be displayed
  //                                   in the properties window of this industry.
  //
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


  //! Allows a product to be added as being valid input/output for the named process.
  //
  // Param:  assetName                 Name of product asset to add to the process.
  // Param:  queueName                 Name of queue in this industry that the process is to use for the
  //                                   input/output of the product.
  // Param:  processName               Name of the industry process that is to produce/consume the product.
  // Param:  isInput                   Specifies if <i queueName> is an input queue (true) or output queue
  //                                   (false) when used by the process.
  // Param:  showInViewDetails         Specifies if details of this product capability should be displayed
  //                                   in the browser window when the user requests details of the industry.
  // Param:  showInSurveyorProperties  Specifies if details of this product capability should be displayed
  //                                   in the properties window of this industry.
  //
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails, bool showInSurveyorProperties)
  {
    Asset asset = GetAsset().FindAsset(assetName);
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, showInViewDetails, showInSurveyorProperties);
  }


  //! Allows a product to be added as being valid input/output for the named process.
  //
  // Param:  asset              Product asset to add to the process.
  // Param:  queueName          Name of queue in this industry that the process is to use for the
  //                            input/output of the product.
  // Param:  processName        Name of the industry process that is to produce/consume the product.
  // Param:  isInput            Specifies if <i queueName> is an input queue (true) or output queue
  //                            (false) when used by the process.
  // Param:  showInViewDetails  Specifies if details of this product capability should be displayed
  //                            in the browser window when the user requests details of the industry.
  //
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput, bool showInViewDetails)
  {
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, showInViewDetails, true);
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
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput, bool showInViewDetails)
  {
    Asset asset = GetAsset().FindAsset(assetName);
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, showInViewDetails, true);
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
  public void AddAssetToIndustryProductInfo(string assetName, string queueName, string processName, bool isInput)
  {
    AddAssetToIndustryProductInfo(assetName, queueName, processName, isInput, true, true);
  }


  //! Allows a product to be added as being valid input/output for the named process.
  //
  // Param:  asset        Product asset to add to the process.
  // Param:  queueName    Name of queue in this industry that the process is to use for the 
  //                      input/output of the product.
  // Param:  processName  Name of the industry process that is to produce/consume the product.
  // Param:  isInput      Specifies if <i queueName> is an input queue (true) or output queue
  //                      (false) when used by the process.
  //
  public void AddAssetToIndustryProductInfo(Asset asset, string queueName, string processName, bool isInput)
  {
    AddAssetToIndustryProductInfo(asset, queueName, processName, isInput, true, true);
  }


  //! Adds any products that this industry is currently capable of consuming/producing to the end of the given list.
  //
  // This methods appends all of the products that this industry allows into <i productList> that
  // are not already in the <i productList>.
  //
  // Param:  productList  List of products to append the products of this industry to.
  //
  public void AppendProductList(Asset[] productList)
  {
    bool found;
    int l;
    int k;
    
    // 
    // Find products that we are outputting.
    for (k = 0; k < industryProductInfoCollection.ipicCollection.size(); k++)
    {
      Asset asset = industryProductInfoCollection.ipicCollection[k].GetProduct();
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
            HandleVehicleStopped(vehicle, FindTriggerContainingNode(vehicle.GetId(), true));
          else
            HandleVehicleMovingEnter(vehicle, FindTriggerContainingNode(vehicle.GetId(), true));
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
      if (m_ignoreList[i] == vehicle)
        return true;

    return false;
  }


  //! Gets the names of the products that the given queue in this industry can contain.
  //
  // Param:  queue  Queue to get the products names for.
  //
  // Returns:
  //     Returns an array of strings containing the asset names of the products that <i queue> is 
  //     able to contain.
  //
  public string [] GetProductNameList(ProductQueue queue)
  {
    int i;
    Asset[] assets = World.GetAssetList("product");
    string[] retList = new string[0];
    ProductFilter pf = queue.GetProductFilter();
    Asset[] assetList = queue.GetProductList();
    for (i = 0; i < assets.size(); i++)
    {
      // ensure does not alrady exist.
      int k;
      bool exists = false;
      for (k = 0; k < assetList.size(); k++)
      {
        if (assetList[k] == assets[i])
        {
          exists = true;
          break;
        }
      }

      // pass each product thru this:
      if (!exists)
        if (pf.DoesAcceptProduct(assets[i]))
          retList[retList.size()] = assets[i].GetLocalisedName();
    }

    return retList;
  }


  //! Plays the pipe retraction animation on the given vehicle.
  //
  // Note:
  //     This method was written to work with the GATX Oil Tanker vehicle and it is not going to
  //     work unless the vehicle has two attachment points named <m "pipe-attachment-left"> and 
  //     <m "pipe-attachment-right">.  The retractable pipe is a separate asset that is attached
  //     to the vehicle.
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
  // <l BaseIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of unloading operation.
  //
  // Returns:
  //     Returns 30.0 to allow for the pipe animation to start if needed, 0.0 otherwise.
  //
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
      else
        return 0.0;

    }
    return 0.0;
  }


  //! Called by Vehicle::UnloadProduct() to determine how long the unloading operation is to take.
  //
  // This method is overrides Industry::GetUnloadTime() to ensure that the appropriate amount of
  // time is returned if the pipe animation is being used for loading.  This will only be done if
  // the <l BaseIndustry::usePipeAnimation  usePipeAnimation> flag is set.
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
  // <l BaseIndustry::usePipeAnimation  usePipeAnimation> flag is set.
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
  // <l BaseIndustry::usePipeAnimation  usePipeAnimation> flag is set.
  //
  // Param:  report  Progress report of unloading operation.
  //
  // Returns:
  //     Returns 30.0 to allow for the pipe animation to start if needed, 0.0 otherwise.
  //
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
  // <l BaseIndustry::usePipeAnimation  usePipeAnimation> flag is set.
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
  // for the animation.  This will only be done if the 
  // <l BaseIndustry::usePipeAnimation  usePipeAnimation> flag is set.
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


  //! Called by %Trainz once when a process is ready to stop running.
  //
  // This method is overridden from Industry::NotifyProcessFinished() so that a message of type
  // (<m"%GenericIndustry">, <m "ProcessComplete">) is sent from this object to itself whenever a
  // process finishes.
  //
  // Param:  processName  Name of process that has stopped.
  //
  public void NotifyProcessFinished(string processName)
  {
    PerformProcessOutput(processName);
    PerformProcessFinished(processName);
    PostMessage(me, "GenericIndustry", "ProcessComplete", 0.0f);
  }


  public void SetProperties(Soup soup)
  {
    inherited(soup);

    userDescription = soup.GetNamedTag("GenericIndustry.userDescription");

    industryProductInfoCollection.SetProperties(soup, me);
    itc.SetProperties(soup.GetNamedSoup("generic-itc"));
  }

  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    soup.SetNamedTag("GenericIndustry.userDescription", userDescription);

    industryProductInfoCollection.GetProperties(soup, me);
    soup.SetNamedSoup("generic-itc", itc.GetProperties());

    return soup;
  }
};

