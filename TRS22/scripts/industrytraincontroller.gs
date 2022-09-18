//
// IndustryTrainController.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Vehicle.gs"
include "Industry.gs"



// Internal use only.
//! Defines a Train and the type of command it is to perform in this industry.
//
// This class is used by IndustryTrainController to keep track of the different trains and the
// command it is going to use in the host industry.
//
// See Also:
//     IndustryTrainController,  IndustryTrainController::m_trainCommands,
//     \ref loadUnloadCmds "Load and Unload Driver Command Strings"
//
class ITCTrainCommand
{
  public Train train;  //!< Train that running the command.
  
  //! Name of the command that the train is to perform in this industry.  
  //
  // Use either \ref loadUnloadCmds "Industry.LOAD_COMMAND" or \ref loadUnloadCmds "Industry.UNLOAD_COMMAND"
  // when setting this data member.
  //
  public string command;
  
};


// Internal use only.
class ITCTrainValues
{
  public Train  train;
  public int    reverserSetting = 0;
  public float  advisoryLimit = 0;
};


// Internal use only.
class ITCTrainMonitor
{
  public Train train;
  public int count;
};



//! Class that provides tracking capabilities for an Industry to manage and keep track of vehicles.
//
// An instance of this class is usually declared in a host industry and the Industry object uses it to track
// vehicles as they enter and leave the industry.  It has an internal array that lists vehicles currently 
// under its control.  This list can be modified and queried through the various methods of this class.
//
// Vehicles under control of a controller can also be locked which means that they are busy and shouldn't be
// moved.  They can be locked more than once as well.
//
// A Train is considered to be under the control of an industry if any one of its vehicles is currently being
// managed by this controller.  Both the BaseIndustry and GenericIndustry classes make use of this class.
//
// See Also:
//     BaseIndustry, GenericIndustry, Industry, Train, Vehicle
//
class IndustryTrainController isclass GSObject
{
  ITCTrainCommand[] m_trainCommands;    // List of trains and the commands they will execute
  Vehicle[]         m_vehicles;         // List of vehicle under our control
  ITCTrainValues[]  m_trainValues;      // State of train control before entering the controller
  Vehicle[]         m_lockedVehicles;   // List of 'locked' vehicles
  Industry          m_ownerIndustry;    // The owning industry, or null for no owner.
  ITCTrainMonitor[] m_monitoringTrains; // List of trains currently being monitored.


  public void SetTrainCommand(Train train, string command);
  public void ClearTrainCommand(Train train);
  public string GetTrainCommand(Train train);
  public bool IsTrainCommand(Train train, string command);

  public int CountVehicles();
  public bool IsControllingTrain(Train train);
  public bool IsControllingVehicle(Vehicle vehicle);
  public bool IsAlreadyAdded(Vehicle vehicle);
  public int CountVehiclesNotAdded(Train train);
  public bool ShouldIgnoreVehicle(Vehicle vehicle);
  public void ReSendStoppedMessages(Industry industry);
  public bool AddVehicle(Vehicle v, bool allowDuplication);
  public bool AddTrain(Train train);
  public void SetTrainSpeed(Train train, float speed);
  public void SetVehicleSpeed(Vehicle v, float speed);
  public bool RemoveVehicle(Vehicle v);
  public void RemoveTrain(Train train);

  public void AddVehicleLock(Vehicle v);
  public void RemoveVehicleLock(Vehicle v);
  public bool IsTrainLocked(Train train);
  public bool IsLockedVehicle(Vehicle vehicle);
  public bool RemoveAllUnlockedVehicles(Train train);

  public void SetProperties(Soup soup);
  public Soup GetProperties(void);
  
  public void StartMonitoringTrain(Train train);
  public void StopMonitoringTrain(Train train);



  // IMPLEMENTATION
  
  
  public void SetOwnerIndustry(Industry ownerIndustry)
  {
    m_ownerIndustry = ownerIndustry;
  }


  //! Sets the command that the given train is to execute under this controller.
  //
  // This method locks in <i train> as being able to perform the named <i command> in this industry controller.
  //
  // Param:  train    Train to lock in a command for in this controller.
  // Param:  command  Name of the industry controller command <i train> is to be locked in for in this controller.
  //                  This will usually be one of the \ref loadUnloadCmds "industry load/unload" strings.
  //
  public void SetTrainCommand(Train train, string command)
  {
    if (!m_trainCommands)
      m_trainCommands = new ITCTrainCommand[0];
    
    ITCTrainCommand cmd = new ITCTrainCommand();
    cmd.train = train;
    cmd.command = command;

    m_trainCommands[m_trainCommands.size()] = cmd;
    
    // Start paying attention to some important messages that we'll likely need to know
    // about during the execution of this command.
    StartMonitoringTrain(train);
  }


  //! Removes the command that the given train was to execute from this controller.
  //
  // Param:  train  Train that this controller is to remove the command from if possible.
  //
  public void ClearTrainCommand(Train train)
  {
    if (!m_trainCommands)
      return;

    int i;
    for (i = 0; i < m_trainCommands.size(); i++)
    {
      if (m_trainCommands[i].train == train)
      {
        m_trainCommands[i, i+1] = null;
        break;
      }
    }
    
    // Finish paying attention to the important messages.
    StopMonitoringTrain(train);
  }
  
  
  // Start listening for key messages related to the loading/unloading of this train.
  public void StartMonitoringTrain(Train train)
  {
    if (train == null)
      return;
    
    if (m_ownerIndustry == null)
      return;
    
    // Create the monitor array, if it doesn't exist.
    if (!m_monitoringTrains)
      m_monitoringTrains = new ITCTrainMonitor[0];
    
    // Check whether this train is already being monitered.
    int i;
    for (i = 0; i < m_monitoringTrains.size(); i++)
    {
      if (m_monitoringTrains[i].train == train)
      {
        // Yes, it's already being monitored- so just increment the monitor
        // count and exit.
        m_monitoringTrains[i].count++;
        return;
      }
    }
    
    // No, it's not being monitored- start monitoring now.
    ITCTrainMonitor monitor = new ITCTrainMonitor();
    monitor.train = train;
    monitor.count = 1;
    m_monitoringTrains[m_monitoringTrains.size()] = monitor;
    
    // Monitor some key messages on the train.
    m_ownerIndustry.Sniff(train, "Schedule", "Abort", true);
    m_ownerIndustry.Sniff(train, "Train", "Cleanup", true);
    m_ownerIndustry.Sniff(train, "Train", "ConsistChanged", true);
    m_ownerIndustry.Sniff(train, "Train", "StartedMoving", true);
    m_ownerIndustry.Sniff(train, "Train", "StoppedMoving", true);
    m_ownerIndustry.Sniff(train, "HandleTrain", "Release", true);
  }
  
  
  // Stop listening for key messages related to the loading/unloading of this train.
  public void StopMonitoringTrain(Train train)
  {
    if (train == null or m_monitoringTrains == null)
      return;
    
    // Check whether this train is being monitered.
    int i;
    for (i = 0; i < m_monitoringTrains.size(); i++)
    {
      if (m_monitoringTrains[i].train == train)
      {
        // Yes, it's being monitored. Is this the last monitor?
        if (m_monitoringTrains[i].count > 1)
        {
          // No, so just decrement the count and exit.
          m_monitoringTrains[i].count--;
          return;
        }
        
        // Yes, so remove the monitor.
        m_monitoringTrains[i, i+1] = null;
        break;
      }
    }
    
    if (m_ownerIndustry != null)
    {
      // We're done with monitoring messages on the train.
      m_ownerIndustry.Sniff(train, "Schedule", "Abort", false);
      m_ownerIndustry.Sniff(train, "Train", "Cleanup", false);
      m_ownerIndustry.Sniff(train, "Train", "ConsistChanged", false);
      m_ownerIndustry.Sniff(train, "Train", "StartedMoving", false);
      m_ownerIndustry.Sniff(train, "Train", "StoppedMoving", false);
      m_ownerIndustry.Sniff(train, "HandleTrain", "Release", false);
    }
  }


  //! Gets name of the command the given train is to execute in this industry controller.
  //
  // Param:  train  Train to get the command name of.
  //
  // Returns:
  //     Returns the name of the command which the train is to execute, which will usually be one of the 
  //     \ref loadUnloadCmds "industry load/unload" strings.  Otherwise an empty string (<m"">) will be 
  //     returned if no command has been locked in for <i train> (i.e. it may not even be under this 
  //     controller's watch).
  //
  public string GetTrainCommand(Train train)
  {
    if (!m_trainCommands)
      return "";

    int i;
    for (i = 0; i < m_trainCommands.size(); i++)
      if (m_trainCommands[i].train == train)
        return m_trainCommands[i].command;

    return "";
  }

  
  //! Determines if the given train is running the named command.
  //
  // Param:  train    Train to verify the command of in this controller.
  // Param:  command  Name of the industry controller command.  This will usually be one of the
  //                  \ref loadUnloadCmds "industry load/unload" strings.
  //
  // Returns:
  //     Returns true if <i train> is to execute <i command> in this controller's industry, 
  //     false otherwise.
  //
  public bool IsTrainCommand(Train train, string command)
  {
    string trainCommand = GetTrainCommand(train);
    
      // return true if the train isnt locked to any particular command
    if (trainCommand == "")
      return true;
    
      // return true if the train is locked to the specified command
    if (trainCommand == command)
      return true;
    
      // return false if the train is locked to some other command
    return false;
  }


  //! Gets the amount of vehicles in this controller (including duplicates).
  //
  // Returns:
  //     Returns the amount of vehicles in this controller (including duplicates).
  //
  public int CountVehicles()
  {
    if (!m_vehicles)
      return 0;

    return m_vehicles.size();
  }


  //! Determines if the given train is under the control of this industry train controller.
  //
  // A train is considered to be under the control if any one of its vehicles is being tracked by
  // this controller.
  //
  // Param:  train  Train to check for.
  //
  // Returns:
  //     Returns true if <i train> is under the control of this industry train controller,
  //     false otherwise.
  //
  public bool IsControllingTrain(Train train)
  {
    if (!m_vehicles)
      return false;

    int i;
    for (i = 0; i < m_vehicles.size(); i++)
      if (m_vehicles[i].GetMyTrain() == train)
        return true;

    return false;
  }

  
  //! Determines of the given vehicle is under the control of this industry train controller.
  // 
  // Param:  vehicle  Vehicle to check for being under control.
  //
  // Returns:
  //    Returns true if <i vehicle> is under the control of this controller, false otherwise.
  //
  public bool IsControllingVehicle(Vehicle vehicle)
  {
    return IsControllingTrain(vehicle.GetMyTrain());
  }


  //! Determines if the given vehicle is already in this controller.
  //
  // This method differs from IsControllingVehicle() in that it determines whether or not <i vehicle> is 
  // within this controller's internal list without regard to whether the train or vehicles in that train are
  // under control of this industry.  This means if the train is under industry control yet <i vehicle>
  // hasn't been added, false will be returned.
  //
  // Param:  vehicle  Vehicle to check for in this controller.
  //
  // Returns:
  //    Returns true if <i vehicle> is already in this controller at least once, false otherwise even if the
  //     train <i vehicle> belongs to is under industry control.
  //
  public bool IsAlreadyAdded(Vehicle vehicle)
  {
    if (!m_vehicles)
      return false;

    int i;
    for (i = 0; i < m_vehicles.size(); i++)
     if (m_vehicles[i] == vehicle)
       return true;

    return false;
  }


  //! Finds out how many vehicles from the given Train are not in this controller.
  //
  // Note:
  //     If the vehicle has been added to this controller more than once, the duplicate times it has been 
  //     found won't be considered.  This is a utility method needed for a scenry script and not really 
  //     something that is as general purpose as other methods in this class.
  //
  // Returns:
  //     Returns the number of vehicles in <i train> that are not in this controller's list of tracked 
  //     vehicles.
  //
  public int CountVehiclesNotAdded(Train train)
  {
    int i, q;
    int vehicleCount = 0;

    Vehicle[] vehicles = train.GetVehicles();

    for (i = 0; i < vehicles.size(); i++)
    {
      for (q = 0; q < m_vehicles.size(); i++)
      {
        if (vehicles[i] == m_vehicles[q])
        {
          vehicleCount++;
          break; // break out of the inner loop - we only want to count a vehicle once 
        }
      }
    }

    return vehicleCount;
  }


  //! Determines if the given vehicle has already been processed and thus ignored.
  //
  // Param:  vehicle  Vehicle to check.
  //
  // Returns:
  //     Returns false if <i vehicle> is still in this controller or if no vehicles from <i vehicle>'s train
  //     are in this controller.  If <m vehicle>'s train is under the control of this industry controller yet
  //     <i vehicle> isn't, true is returned.
  //
  public bool ShouldIgnoreVehicle(Vehicle vehicle)
  {
    if (!m_vehicles)
      return false;

    if (!IsControllingTrain(vehicle.GetMyTrain()))
      return false;

    int i;
    for (i = 0; i < m_vehicles.size(); i++)
      if (m_vehicles[i] == vehicle)
        return false;

    return true;
  }


  //! Tells the given industry that all vehicles in this controller have stopped in it.
  //
  // Sends message of type (<m"Object">, <m "Stopped">) from all vehicles under the watch of this
  // controller to the given industry.
  //
  // Param:  industry  Industry to send (<m"Object">, <m "Stopped">) messages to from each vehicle.
  //
  public void ReSendStoppedMessages(Industry industry)
  {
    if (!m_vehicles)
      return;

    int i;
    for (i = 0; i < m_vehicles.size(); i++)
    {
      if (m_vehicles[i].GetMyTrain().IsStopped())
        m_vehicles[i].PostMessage(industry, "Object", "Stopped", 0.0);
    }
  }


  //! Called when the given vehicle has entered an industry trigger.
  //
  // Param:  v                 Vehicle to add to this industry controller as it has entered an industry trigger.
  // Param:  allowDuplication  If true, <i v> will be added to this controller once for each call to this 
  //                           method and removed once for each call to RemoveVehicle().  This would probably
  //                           be suitable for normal usage in most cases.  If false, <i v> will be added only
  //                           once to this controller, regardless of how many times the function is called
  //                           with that vehicle.  This means it will only be removed once on the first call
  //                           to RemoveVehicle().
  //
  // Returns:
  //     Returns true if <i v> is the first vehicle of in its train to enter the industry, false otherwise.
  //
  public bool AddVehicle(Vehicle v, bool allowDuplication)
  {
    // Interface.LogCallStack("IndustryTrainController.AddVehicle> Adding " + v.GetId());

    if (!m_vehicles and !m_trainValues)
    {
      m_vehicles = new Vehicle[0];
      m_trainValues = new ITCTrainValues[0];
    }
    else if (!allowDuplication)
    {
      //
      // Don't add the vehicle twice
      //
      int i;
      for (i = 0; i < m_vehicles.size(); i++)
        if (m_vehicles[i] == v)
          return false;
    }

    Train train = v.GetMyTrain();


    bool wasntControllingTrain = !IsControllingTrain(train);

    if (wasntControllingTrain)
    {
      int i;
      for (i = 0; i < m_trainValues.size(); i++)
        if (m_trainValues[i].train == train)
          return false;

      ITCTrainValues t = new ITCTrainValues();
      t.train = train;
      t.reverserSetting = train.GetReverser();
      t.advisoryLimit = train.GetAdvisoryLimit();
      m_trainValues[m_trainValues.size()] = t;
    }

    m_vehicles[m_vehicles.size()] = v;
    
    return wasntControllingTrain;
  }


  //! Adds all vehicles in the given train to this controller.
  //
  // This method calls AddVehicle() for every vehicle in the <i train>.
  // 
  // Param:  train  Train to add all of the vehicles from to this controller.
  //
  // Returns:
  //     Returns true if this controller wasn't already controlling <i train>, false otherwise.
  //
  public bool AddTrain(Train train)
  {
    Vehicle[] vehicles = train.GetVehicles();
    
    bool wasntControllingTrain = AddVehicle(vehicles[0], false);
    
    int i;
    for (i = 1; i < vehicles.size(); i++)
      AddVehicle(vehicles[i], false);

    return wasntControllingTrain;
  }


  //! Sets the speed for the given train.
  //
  // Note:
  //     The given train <bi MUST> be under the control of this industry controller.  <bi DO NOT>
  //     read the implementation code of this method and assume that this warning is incorrect.  
  //     The code may be changed in the future.
  //
  // Param:  train  Train to set the speed of.  <bi MUST> be under the control of this controller, otherwise
  //                undefined behavior will occur - which is a Bad Thing(tm).
  // Param:  speed  Speed to set <i train> to in KPH (kilometers per hour).
  //
  public void SetTrainSpeed(Train train, float speed)
  {
    if (speed <= 0)
    {
      train.SetAutopilotMode(Train.CONTROL_SCRIPT);
      train.SetDCCThrottle(0.0);
      
      // Interface.LogCallStack("SetTrainSpeed - stopping train");
    }
    else
    {
      if (train.GetDCCThrottle() < 0.01f)
        train.SetDCCThrottle(0.3f);

      train.SetAutopilotMode(Train.CONTROL_AUTOPILOT);
      train.SetAdvisoryLimit(speed);
    }
  }


  //! Sets the speed for the given vehicle's train.
  //
  // Note:
  //     The given train <bi MUST> be under the control of this industry controller.  <bi DO NOT> read the
  //     implementation code of this method and assume that this warning is incorrect.  The code may be 
  //     changed in the future.
  //
  // Param:  v      Vehicle to of the train to set the speed of.  This vehicle <bi MUST> be under the control
  //                of this controller, otherwise undefined behavior will occur - which is a bad thing.
  // Param:  speed  Speed to set the train to.
  //
  public void SetVehicleSpeed(Vehicle v, float speed)
  {
    SetTrainSpeed(v.GetMyTrain(), speed);
  }


  //! Removes the given vehicle from being under control of this controller.
  //
  // Param:  v  Vehicle to remove from this controller.
  //
  // Returns:
  //     Returns true if <i v> is the last one in its train, false otherwise.
  //
  public bool RemoveVehicle(Vehicle v)
  {
    // Interface.Log("IndustryTrainController.RemoveVehicle> Removing " + v.GetId());

    if (!m_vehicles and !m_trainValues)
      return true;
      
    Train train = v.GetMyTrain();

    int i;
    for (i = 0; i < m_vehicles.size(); i++)
    {
      if (m_vehicles[i] == v)
      {
        m_vehicles[i,i+1] = null;


        if (!IsControllingTrain(train))
        {
          // last vehicle in the train
          if (train.GetAutopilotMode() != Train.CONTROL_SCRIPT)
          {
            // If we're already under manual control, then the user could be doing
            // something with the train. Don't interrupt the user.
            
            // But still remove the train from the history.
            if (m_trainValues)
            {
              int j;
              for (j = 0; j < m_trainValues.size();j++)
              {
                if (train == m_trainValues[j].train)
                {
                  m_trainValues[j, j+1] = null;
                  
                  // We aren't restoring the advisory limit here because whatever caused it to be set originally
                  // may no longer be relevant. This is a limitation of having a singular advisory limit rather
                  // than one per caller. It's safer to erase the limit than to leave an arbitrary one set.
                  train.SetAdvisoryLimit(0);
                  
                  break;
                }
              }
            } //  if (m_trainValues)
          }
          else
          {
            // We're under scripted control, so give control back to the user and
            // reset a few controls back to how they were set before we took control.
            
            train.SetAutopilotMode(Train.CONTROL_MANUAL);
            train.SetAdvisoryLimit(0);
            
            if (m_trainValues)
            {
              int j;
              for (j = 0; j < m_trainValues.size();j++)
              {
                if (train == m_trainValues[j].train)
                {
                  // We aren't restoring the advisory limit here because whatever caused it to be set originally
                  // may no longer be relevant. This is a limitation of having a singular advisory limit rather
                  // than one per caller. It's safer to erase the limit than to leave an arbitrary one set.
                  train.SetAdvisoryLimit(0);//m_trainValues[j].advisoryLimit);
                  train.SetReverser(m_trainValues[j].reverserSetting);

                  m_trainValues[j, j+1] = null;
                  return true;
                }
              }
            } //  if (m_trainValues)
          }
          
          return true;
        }
        
        //Interface.Print("<<DEBUG>> IndustryTrainController.RemoveVehicle> vehicles remain: " + (string)m_vehicles.size());
        // more vehicles to go
        return false;
      }
    }
    
    //Interface.Print("<<DEBUG>> IndustryTrainController.RemoveVehicle> not found, vehicles remain: " + (string)m_vehicles.size());

    // vehicle was not in the list- this is not necessarily an error condition
    return !IsControllingTrain(train);
  }


  //! Removes all vehicles from the train passed
  // 
  // Param:  train  The train to be removed
  //
  public void RemoveTrain(Train train)
  {
    Vehicle[] vehicles = train.GetVehicles();

    int i;
    for (i = 0; i < vehicles.size(); ++i)
      RemoveVehicle(vehicles[i]);

    //Interface.Print("IndustryTrainController.RemoveTrain> Removed " + vehicles.size() + " vehicles, " + m_vehicles.size() + " remain");
  }
  

  //! Increment the lock count of the given vehicle.
  //
  // Note:
  //     RemoveVehicleLock() must be called <bi EXACTLY> once per every AddVehicleLock() call for a given vehicle.
  //
  // Param:  v  Vehicle to decrement the lock count of.
  //
  public void AddVehicleLock(Vehicle v)
  {
    if (!m_lockedVehicles)
      m_lockedVehicles = new Vehicle[0];

    m_lockedVehicles[m_lockedVehicles.size()] = v;
  }


  //! Decrement the lock count of the given vehicle.
  //
  // Note:
  //     This method will throw a script exception if called incorrectly on a vehicle without a matching 
  //     AddVehicleLock() call (i.e. a lock count of 0).
  //
  // Param:  v  Vehicle to decrement this controller's lock count of.
  //
  public void RemoveVehicleLock(Vehicle v)
  {
    if (m_lockedVehicles)
    {
      int i;
      for (i = 0; i < m_lockedVehicles.size(); i++)
      {
        if (m_lockedVehicles[i] == v)
        {
          m_lockedVehicles[i, i+1] = null;
          return;
        }
      }
    }

    v.Exception("IndustryTrainController.RemoveVehicleLock> vehicle not locked!");
  }


  //! Determines if any of the vehicles in the given Train are locked by this controller.
  //
  // If any one of the vehicles in <i train> has a lock count greater than 0, then it is locked by this
  // controller.  This indicates that the train is busy and shouldn't be moved.
  // 
  // Param:  train  Train to check the vehicles of.
  //
  // Returns:
  //     Returns true of any of the vehicles in <i train> are locked by this industry controller, false
  //     otherwise if no vehicles are locked.
  //
  public bool IsTrainLocked(Train train)
  {
    if (!m_lockedVehicles)
      return false;

    int i;
    for (i = 0; i < m_lockedVehicles.size(); i++)
      if (m_lockedVehicles[i].GetMyTrain() == train)
        return true;

    return false;
  }


  //! Determines if the given vehicle is locked into this controller (i.e. under its control).
  //
  // If a vehicle is locked by a controller, this indicates it is busy and shouldn't be moved.
  //
  // Param:  vehicle  Vehicle to check.
  //
  // Returns:
  //     Returns true if <i vehicle> has a lock count greater than 0. false otherwise if the lock count of
  //     <i vehicle> is 0.
  //
  public bool IsLockedVehicle(Vehicle vehicle)
  {
    if (!m_lockedVehicles)
      return false;

    int i;
    for (i = 0; i < m_lockedVehicles.size(); i++)
      if (m_lockedVehicles[i] == vehicle)
        return true;

    return false;
  }



  //! Removes all unlocked vehicles of the given train from this controller.
  //
  // Param:  train  Train to get vehicles to unlock from.
  //
  // Returns:
  //     Returns true if all vehicles in <i train> been removed from this controller successfully, otherwise 
  //     false if some of the vehicles are still locked.
  //
  public bool RemoveAllUnlockedVehicles(Train train)
  {
    bool hasLockedVehicles = false;
    Vehicle[] vehicles = train.GetVehicles();
    int i;

    for (i = 0; i < vehicles.size(); i++)
    {
      Vehicle vehicle = vehicles[i];

      if (IsLockedVehicle(vehicle))
        hasLockedVehicles = true;
      else
        RemoveVehicle(vehicle);
    }

    return !hasLockedVehicles;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Restores the list of vehicles within this itc
  //=============================================================================
  public void SetProperties(Soup soup)
  {
    if (!soup)
      return;

    int i;

    Soup vehicleIDsSoup = soup.GetNamedSoup("vehicle-ids");
    for (i = 0; i < vehicleIDsSoup.CountTags(); ++i)
    {
      GameObjectID vehicleID = vehicleIDsSoup.GetNamedTagAsGameObjectID((string)i);

      // We should be safe to abandon control of any vehicles that no longer
      // exist but print a script log warning about them nonetheless.
      Vehicle vehicle = cast<Vehicle>(World.GetGameObjectByIDIfLoaded(vehicleID));
      if (vehicle)
        AddVehicle(vehicle, false);
      else
        Interface.Log("IndustryTrainController.SetProperties> Cannot find vehicle '" + vehicleID.GetDebugString() + "'");
    }
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Saves the list of vehicles within this itc
  //=============================================================================
  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();

    if (m_vehicles)
    {
      int i;
      
      Soup vehicleNamesSoup = Constructors.NewSoup();
      Soup vehicleIDsSoup = Constructors.NewSoup();

      for (i = 0; i < m_vehicles.size(); ++i)
      {
        vehicleNamesSoup.SetNamedTag((string)i, m_vehicles[i].GetLocalisedName());
        vehicleIDsSoup.SetNamedTag((string)i, m_vehicles[i].GetGameObjectID());
      }

      soup.SetNamedSoup("vehicles", vehicleNamesSoup);
      soup.SetNamedSoup("vehicle-ids", vehicleIDsSoup);
    }
    
    return soup;
  }

};
