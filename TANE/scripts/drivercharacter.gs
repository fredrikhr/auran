//
// DriverCharacter.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "ModuleScript.gs"
include "Schedule.gs"
include "DriverCommand.gs"


//! A driver character is a driver asset that can be attached to a Vehicle and drive the Train by following a schedule.
//
// For each driver character asset found, %Trainz creates a DriverCharacter object that is now part
// of the list of drivers in World.  Drivers can be added and removed from World through the
// World::AddDriverCharacter() and World::RemoveDriverCharacter() methods.  A list of all drivers
// that currently exist in the %Trainz world can be obtained by calling World::GetDriverCharacterList().
//
// Messages sent from a DriverCharacter game object are:
//  [ Major             | Minor         | Source  | Destination | Description                     ]
//  [ DriverCharacter   | Removed       | Driver  | World       | Driver deleted from the world   ]
//  [ DriverCharacter   | Created       | Driver  | World       | New Driver added to the world   ]
//  [ DriverCharacter   | LeftTrain     | Driver  | Driver      | Driver has left a locomotive    ]
//  [ Train             | DriverLeft    | Train   | Driver      | Driver has left a locomotive    ]
//  [ DriverCharacter   | BoardedTrain  | Driver  | Driver      | Driver assigned to a loco       ]
//  [ Train             | DriverBoarded | Train   | Driver      | Driver assigned to a loco       ]
//  [ DriverCharacter   | OwnerChanged  | Driver  | World       | Driver owner has changed        ]
//
// See Also:
//     DriverCommands, DriverCommand, DriverScheduleCommand, Schedule, Locomotive::SetHasDriver(), 
//     Train::GetActiveDriver(), World::AddDriverCharacter(), World::GetDriverCharacterList(), 
//     World::RemoveDriverCharacter()
//
class DriverCharacter isclass ModuleScript
{
	Schedule schedule, scheduleReady;
	Train driverTrain;
	bool isRunningCommand = false;

	// set to true by the game when this driver is being removed from the game state
	bool killDriver = false;


	//! Issues the previous command for this driver to follow.
	public native void ReissueLastCommand(void);

	//! Issues the next command for this driver to follow.
	public native void IssueNextCommand(void);


	//! Sets the Vehicle this driver character is currently attached to.
	//
	// Note: During multiplayer games this function will only succeed on the owning client/server
	//
	// A driver character can only be attached to one object at any one time so if it is already
	// attached to another object, calling this method removes it from whatever it is currently
	// attached to.
	//
	// Param:  location  Object to attach this driver character to.  Must be of type Vehicle or a class
	//                  derived from Vehicle such as Locomotive.
	//
	public native void SetLocation(GameObject location);

	//! Gets the Vehicle this driver character is currently attached to.
	//
	// Returns:
	//     Returns the Vehicle game object this driver is currently attached to, null otherwise.
	//
	public native GameObject GetLocation(void);


	//! Gets the localised name of this driver asset.
	//
	// Note:
	//     The localised name may be different from the unique name provided by GameObject::GetName().
	//
	// Returns:
	//     Returns the localised name of this driver character's asset.
	//
	public native string GetLocalisedName(void);

	//! Sets the localised name for this driver asset.
	//
	// Param:  name  Localised name that this driver asset now has.
	//
	// Note: During multiplayer games this function will only succeed on the server
	//
	public native void SetLocalisedName(string name);


	native void SetAlertIcon(bool hasAlertIcon);


	//public native void CmdDriveTo(GameObject object, string attachedTrackName);


	//thread void ThreadedIssueSchedule(Train train, Schedule p_schedule);
	thread void ScheduleThread(void);


	//! Stops the trains current schedule to this driver's schedule is ready to run.
	//
	// If the train this driver is on is already running a schedule, that schedule will be stopped so
	// this driver's schedule can be started.
	//
	// See Also:
	//     Train::IsScheduleRunning(), Train::StopSchedule()
	//
	public void DriverIssueSchedule(void);


	//! Gets the train that this driver is currently active on.
	//
	// Returns:
	//     Returns the train on which this driver is active, otherwise null if this driver isn't 
	//     active on any train.
	//
	public Train GetTrain(void)
	{
		return driverTrain;
	}


	//! Gets the current schedule of driver commands.
	//
	// Returns:
	//     Returns the DriverCommands object for this driver character which has the current commands schedule.
	//
	public native DriverCommands GetDriverCommands(void);

	//! Sets this driver to use the specified DriverCommands object as its commands schedule.
	//
	// Param:  driverCommands  Schedule of driver commands for this driver character to perform.
	//
	public native void SetDriverCommands(DriverCommands driverCommands);
	
	//! Restricts the commands the user can access for this DriverCharacter.
	//
	// Note:
	//     Restrictions applied by this method do not affect any existing commands already queued.
	//
	// Param:  allowedCommands  Array of KUIDs of driver commands that this driver will have available in its 
	//                          right-click menu.  If null, this driver will allow all available commands.  If
	//                          an empty array is provided, no driver commands will be available.
	//
	public native void SetDriverCommandFilter(KUID[] allowedCommands);
	
	//! Gets the KUIDs of the driver commands the user is allowed to use with this DriverCharacter.
	//
	// Returns:
	//     Returns a copy of the command limitations as specified in SetDriverCommandFilter().
	//
	public native KUID[] GetDriverCommandFilter(void);
	
	
	
	// ============================================================================
  // Name: SetOwnerPlayer
  // Desc: Sets the designated player as the owner of this DriverCharacter. This
  //       is to be called on the Game Server only, as the ownership will be
  //       replicated out to all clients. This function may also be used in a
  //       single-player environment to allow script-controlled DriverCharacters,
  //       or in the server setup phase prior to creating a Multiplayer Session.
  // Parm: playerUsername - The new designated owner. This is the iTrainz
  //       username of a player in the current Multiplayer Session, the empty
  //       string if this DriverCharacter is currently not owned by any entity,
  //       or a string prefixed with the dollar ("$") character to indicate
  //       a non-player custom scripted owner.
  // Retn: bool - true if the owner was set as requested, false otherwise
  // Note: A user may only control this DriverCharacter if the designated 
  //       player username matches the local iTrainz username. All 
  //       DriverCharacters on the Game Server or in a single-player session are 
  //       initially owned by the local user; it is the responsibility of the
  //       Session Rules to reassign the DriverCharacter as required. All 
  //       DriverCharacters on a non-server Game Client have no initial ownership
  //       until the current ownership is replicated out from the Game Server.
  // ============================================================================
	public native bool SetOwnerPlayer(string playerUsername);
	
	
	// ============================================================================
  // Name: GetOwnerPlayer
  // Desc: Returns the player designated as the owner of this DriverCharacter.
  //       This may be called on the Game Server, any Game Client, or in single-
  //       player mode.
  // Retn: string - The designated owner. This is the iTrainz
  //       username of a player in the current Multiplayer Session, or the empty
  //       string if this DriverCharacter is currently not owned by any player.
  // ============================================================================
	public native string GetOwnerPlayer(void);
  
  
  
	// ============================================================================
  // Name: IsLocalPlayerOwner
  // Desc: Returns whether the local player owns this DriverCharacter.
  //       This may be called on the Game Server, any Game Client, or in single-
  //       player mode.
  // Retn: bool - True if the local player is the current owner of this
  //       DriverCharacter, or false if no player, a remote player or a
  //       script/AI player is currently controllig this DriverCharacter.
  // ============================================================================
  public native bool IsLocalPlayerOwner(void);



  //=============================================================================
  // Name: NotifyRemoveDriver
  // Desc: Called from native code to nofity of Driver removal from the world.
  //=============================================================================
  void NotifyRemoveDriver(void)
  {
    PostMessage(World, "DriverCharacter", "Removed", 0);

    // Legacy support, do not rely on this message as it will eventually be removed
    Router.LegacyBroadcastMessage(me, "DriverCharacter", "Removed", 0, true);

    killDriver = true;
  }


  //=============================================================================
  // Name: Init
  // Desc: Initialize this driver character
  //=============================================================================
  public void Init(Asset asset)
  {
    inherited(asset);

    PostMessage(World, "DriverCharacter", "Created", 0);

    // Legacy support, do not rely on this message as it will eventually be removed
    Router.LegacyBroadcastMessage(me, "DriverCharacter", "Created", 0, true);

    ScheduleThread();
  }



  //! Determines if this driver is currently executing a command.
  //
  // Returns:
  //     Returns true if this driver is running a command, false otherwise.
  //
  public bool IsRunningCommand(void)
  {
    return isRunningCommand;
  }

  //! Enable or disable the running of commands on the schedule by this driver character.
  //
  // Param:  enable  Flag indicating whether to enable (true) or disable (false) the running of 
  //                 commands by this driver.
  //
  public native void SetRunningCommands(bool enable);


  //=============================================================================
  // Name: SetTrain
  // Desc: Sets this driver to the train passed.
  // Parm: train - The train that this driver is being moved to
  // Parm: isActiveDriver - Whether the driver is 'active' on the train. (i.e.
  //       whether it is in the controlling loco, or just a support loco.)
  //=============================================================================
  void SetTrain(Train train, bool isActiveDriver)
  {
    if (!isActiveDriver)
    {
      // We're not the active driver on the new train. Since we don't track this
      // state we'll post a leave message and clear the previous train to make
      // sure we don't early out (and not generate the boarded message).
      PostMessage(me, "DriverCharacter", "LeftTrain", 0);
      if (driverTrain)
        driverTrain.PostMessage(me, "Train", "DriverLeft", 0);

      // Legacy support, do not rely on this message as it will eventually be removed
      Router.LegacyBroadcastMessage(me, "DriverCharacter", "LeftTrain", 0, true);

      // Clear this, to ensure we generate a boarded message if we're moving
      // between vehicles in the same train.
      driverTrain = null;

      // Make sure any schedule is cleared to
      schedule = null;
      DriverIssueSchedule();
    }

    // Do nothing if not actually changing trains
    if (train == driverTrain)
      return;


    // Clear up any schedule on the old train
    if (driverTrain)
    {
      schedule = null;
      DriverIssueSchedule();
    }

    // Swap over to the new train
    driverTrain = train;

    PostMessage(me, "DriverCharacter", "BoardedTrain", 0.0);
    if (driverTrain)
      driverTrain.PostMessage(me, "Train", "DriverBoarded", 0.0);

    // Legacy support, do not rely on this message as it will eventually be removed
    Router.LegacyBroadcastMessage(me, "DriverCharacter", "BoardedTrain", 0, true);

    // Ensure the schedule thread is alive if we now/still have a train
    if (driverTrain)
      PostMessage(me, "Schedule", "Touch", 0.0);

  }


	void CreateSchedule(void)
	{
		if (!driverTrain)
			Exception("DriverCharacter.CreateSchedule> null driverTrain");

		if (!schedule)
		{
			schedule = new Schedule();
			schedule.releasePermitsWhenComplete = false;
			schedule.notifyDriver = me;
		}
	}


	//! Adds a command to this driver's schedule telling it to take the train through the given junction in the specified direction.
	//
	// Param:  junction   Junction to take the train through.  Use Router::GetGameObject() to get a
	//                    reference to a junction by name.
	// Param:  direction  Direction to take through junction.  See \ref juncStates "Junction States"
	//                    for details.
	//
	// See Also:
	//     Schedule::TakeJunction()
	//
	public void DriverTakeJunction(Junction junction, int direction)
	{
		CreateSchedule();
		
		schedule.TakeJunction(junction, direction);
	}
	public void DriverTakeJunction(JunctionBase junction, int direction)
	{
		CreateSchedule();
		
		//Interface.Log("DriverTakeJunction> junctionBase");
		//Interface.Log("  =" + junction.GetDebugString());
		schedule.TakeJunction(junction, direction);
	}


	void DriverNullCommand(void)
	{
		CreateSchedule();
	}

	//! Adds a command to this driver's schedule telling it to take the train to the given scenery object and stop.
	//
	// Param:  sceneryName  Name of the scenery object to drive to.  Must be a Buildable object (or 
	//                      any type that inherits from Buildable such as Industry).
	//
	// See Also:
	//     Schedule::StopAtScenery()
	//
	public void DriverVisitScenery(Buildable scenery)
	{
		CreateSchedule();
		schedule.StopAtScenery(scenery);
	}
	public obsolete void DriverVisitScenery(string sceneryName)
  {
    Buildable scenery = cast<Buildable>(Router.GetGameObject(sceneryName));
    DriverVisitScenery(scenery);
  }

	//! Adds a command to this driver's schedule telling it to take the train to the given TrackMark and stop.
	//
	// Param:  trackMark  Track mark to drive to. 
	//
	// See Also:
	//     Schedule::StopAtScenery()
	//
	public void DriverVisitTrackMark(TrackMark trackMark)
	{
		CreateSchedule();
		
		schedule.StopAtTrackMark(trackMark);
	}

	//! Adds a command to this driver's schedule telling it to take the train to the given TrackMark but NOT stop.
	//
	// Param:  trackMark  TrackMark to drive to.
	//
	public void DriverThroughTrackMark(TrackMark trackMark)
	{
		CreateSchedule();
		
		schedule.DriveThroughTrackMark(trackMark);
	}

	//! Adds a command to this driver's schedule telling it to take the train through the given track.
	//
	// Param:  track  Track to get a permit for.
	//
	// See Also:
	//     Schedule::TakeTrackPermit()
	//
	public void DriverVisitTrack(Track track)
	{
		CreateSchedule();
		schedule.TakeTrackPermit(track);
	}

	//! Adds a command to this driver's schedule telling it to couple up with the given target vehicle.
	//
	// Param:  vehicle  Target vehicle to couple up with.
	//
	// See Also:
	//     Schedule::CoupleVehicle()
	//
	public void DriverCoupleVehicle(Vehicle vehicle)
	{
		CreateSchedule();

		schedule.CoupleVehicle(vehicle);
	}

	//! Adds a commands to this driver's schedule telling it to complete all junctions and then to change the conceptual direction of the train (i.e. forward is now reverse).
	//
	// See Also:
	//     Schedule::CompleteJunctions(), Schedule::ReverseTrain()
	//
	public void DriverTurnAround(bool force)
	{
		CreateSchedule();
		
		schedule.CompleteJunctions();
		schedule.ReverseTrain(force);
	}

	public void DriverTurnAround(void)
	{
		DriverTurnAround(false);
	}

	//! Adds a command to this driver's schedule telling it to complete all junctions.
	//
	// See Also:
	//     Schedule::CompleteJunctions()
	// 
	public void DriverCompleteJunctions(void)
	{
		CreateSchedule();
		
		schedule.CompleteJunctions();
	}

	//! Adds the given custom command to this driver's schedule.
	//
	// Param:  cmd  Custom command to add to this driver's schedule.
	//
	// See Also:
	//     Schedule::Custom()
	//
	public void DriverCustomCommand(CustomCommand cmd)
	{
		CreateSchedule();
		schedule.Custom(cmd, 0, 0, 0);
	}

	//! Allows/disallows this driver from coupling to another train.
	//
	// Param:  allowCoupling  Flag indicating if coupling by this driver is allowable (true) or not (false).
	// Param:  limitTrain     Train to limit coupling to.
	//
	public void DriverSetAllowCoupling(bool allowCoupling, Train limitTrain)
	{
		CreateSchedule();
		schedule.allowCoupling = allowCoupling;
		schedule.limitCouplingTo = limitTrain;
	}

	thread void ScheduleThread(void)
	{
		Message msg;

		Interface.Log("  DriverCharacter.ScheduleThread> monitor thread started");

		while (1)
		{
			if (scheduleReady and !driverTrain.IsScheduleRunning() and !driverTrain.IsTrainBusy())
			{
        // run the current schedule
        //Interface.Log("  DriverCharacter.ScheduleThread> running scheduled command on train=" + driverTrain.GetId());

				Schedule schedule = scheduleReady;
				Train train = driverTrain;
				scheduleReady = null;
				
				isRunningCommand = true;
				Sniff(train, "Schedule", "Complete", true);

				train.RunSchedule(schedule, false, 0);
				wait()
				{
					on "Schedule", "Complete", msg:
						if (msg.src == me or msg.src == train)
							break;
						continue;
				}
				
				Sniff(train, "Schedule", "Complete", false);
				isRunningCommand = false;

				if (killDriver)
					return;

        //Interface.Log("  DriverCharacter.ScheduleThread> finished scheduled command on train=" + train.GetId());

        // This is done in Train.RunSchedule(), if appropriate
        //train.SetAutopilotMode(Train.CONTROL_MANUAL);
        //train.StopTrainGently();

				if (train == driverTrain and !scheduleReady)
				{
					//
					// only request more commands if we dont already have some queued
					//
					if (train.WasRunScheduleSuccessful())
						IssueNextCommand();
					else
						ReissueLastCommand();
				}
			}
			else
			{
				// 
				// wait for a schedule to become ready
				//
				
				Train train = driverTrain;

				if (train)
					Sniff(train, "Schedule", null, true);
				
					// make sure that we have the correct status set
				isRunningCommand = false;

				wait()
				{
					on "Schedule", "Complete", msg:
						if (msg.src == me or msg.src == train)
							break;
						continue;
						break;
					on "Schedule", "Touch", msg:
						if (msg.src == me or msg.src == train)
							break;
						continue;
						break;
				}
				
				if (train)
					Sniff(train, "Schedule", null, false);
			}

			
			if (killDriver)
				return;

			
			// ceeb040323: play nice, and clear out the post queue
			ClearMessages("Schedule", "Complete");
			ClearMessages("Schedule", "Touch");

			//
			// Break execution for a moment; it doesnt matter how long really but
			// we need to "swallow" any Scenario-Abort or Scenario-Complete messages which may be
			// currently in flight. (ie. if a scenario completed at the same time as a Scenario-Abort was sent)
			//
			PostMessage(me, "Timer", "Tick", 0.3);
			wait()
			{
				on "Timer", "Tick", msg:
					break;
			}

		}
	}


  public void DriverIssueSchedule(void)
  {
    scheduleReady = schedule;
    schedule = null;

    // Set running status immediately; Otherwise there would be a short pause
    // before the schedule runs, which causes problems.
    if (scheduleReady)
      isRunningCommand = true;

    // Stop the current schedule (if any) and cause the monitor thread
    // to wake up and run the newly read schedule
    if (driverTrain)
    {
      if (driverTrain.IsScheduleRunning())
        Interface.Log("  DriverCharacter.DriverIssueSchedule> StopSchedule() for train=" + driverTrain.GetGameObjectID().GetDebugString());

      driverTrain.StopSchedule();
    }
    else
    {
      PostMessage(me, "Schedule", "Touch", 0.0);
    }
  }


  // Called when Trainz is about to issue a new schedule to reset any existing
  // partially-issued schedule.
  public void DriverBeginIssueSchedule(void)
  {
    schedule = null;
  }


  // Adds a command to this driver's schedule telling the driver to keep
  // driving on forever. See Also: Schedule::DriveForever()
  public void DriverDriveForever(void)
  {
    CreateSchedule();

    schedule.DriveForever();
  }


  //! Adds the given driver schedule command to this driver's schedule.
  //
  // Param:  cmd  Driver schedule command to add.
  //
  public native void AddDriverScheduleCommand(DriverScheduleCommand cmd);

  //! Instructs this driver character to take its train to the specified track on the given industry.
  // The driver will try to route around trains to get there.
  //
  // Param:  industry           Industry to drive to.
  // Param:  attachedTrackName  Name of destination track in <m industry> to drive to.
  //
  // Returns:
  //     Returns true if successful added to this driver's schedule, false otherwise.
  //
  public native bool NavigateToIndustry(Industry industry, string attachedTrackName);

  //! Instructs this driver character to couple up with the given vehicle.
  // The driver will try to route around trains to get there.
  //
  // This command will only succeed if the target <m vehicle> is not running a schedule and isn't 
  // moving.  As well as that, both the train this driver character is attached to and <i vehicle>
  // must <l Train::SetCouplingMask()  permit coupling>.
  //
  // Param:  vehicle  Target vehicle to couple up with.
  //
  // Returns:
  //     Returns true if successful added to this driver's schedule, false otherwise.
  //
  public native bool NavigateToVehicle(Vehicle vehicle);

  //! Instructs this driver character to couple up with the given vehicle from a set direction.
  // The driver will try to route around trains to get there.
  //
  // This command will only succeed if the target <m vehicle> is not running a schedule and isn't 
  // moving.  As well as that, both the train this driver character is attached to and <i vehicle>
  // must <l Train::SetCouplingMask()  permit coupling>.  It is also expected that the front or 
  // back of <i vehicle> that this drivers train is being instructed to couple with is not already
  // coupled to another vehicle.
  //
  // Param:  vehicle                     Target vehicle to couple up with.
  // Param:  directionRelativeToVehicle  Defines which end of <i vehicle> this driver's train couples to.
  //                                     Use true to couple to the front of <i vehicle>, false for the back.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public native bool NavigateToVehicle(Vehicle vehicle, bool directionRelativeToVehicle);

  //! Instructs this driver character to take its train to the given Trackside object.
  // The driver will try to route around trains to get there.
  //
  // Note:
  //     This method is restricted to types of trackside object that have trigger behaviour.  Currently
  //     only TrackMark objects supported, although other types will be added in the future.
  //
  // Param:  trackside  %Track side item to navigate to.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public native bool NavigateToTrackside(Trackside trackside);

  //! Instructs this driver character to take its train through the given Trackside object.
  // The driver will try to route around trains to get there.
  //
  // This method is the same as NavigateToTrackside() except that it won't slow down as it reaches the
  // destination.  It was intended for the <l astSrcDriveCmdViaTrackMrk  Drive Via Trackmark> command.
  //
  // Note:
  //     This method is restricted to types of trackside object that have trigger behaviour.  Currently
  //     only TrackMark objects supported, although other types will be added in the future.
  //
  // Param:  trackside  %Track side item to navigate through to.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public native bool NavigateThroughTrackside(Trackside trackside);



  //! Instructs this driver character to take its train to the specified track on the given industry.
  // The driver will NOT try to route around trains to get there.
  //
  // Param:  industry           Industry to drive to.
  // Param:  attachedTrackName  Name of destination track in <m industry> to drive to.
  //
  // Returns:
  //     Returns true if successful added to this driver's schedule, false otherwise.
  //
  public native bool DriveToIndustry(Industry industry, string attachedTrackName);

  //! Instructs this driver character to couple up with the given vehicle.
  // The driver will NOT try to route around trains to get there.
  //
  // This command will only succeed if the target <m vehicle> is not running a schedule and isn't 
  // moving.  As well as that, both the train this driver character is attached to and <i vehicle>
  // must <l Train::SetCouplingMask()  permit coupling>.
  //
  // Param:  vehicle  Target vehicle to couple up with.
  //
  // Returns:
  //     Returns true if successful added to this driver's schedule, false otherwise.
  //
  public native bool DriveToVehicle(Vehicle vehicle);

  //! Instructs this driver character to couple up with the given vehicle from a set direction.
  // The driver will NOT try to route around trains to get there.
  //
  // This command will only succeed if the target <m vehicle> is not running a schedule and isn't 
  // moving.  As well as that, both the train this driver character is attached to and <i vehicle>
  // must <l Train::SetCouplingMask()  permit coupling>.  It is also expected that the front or 
  // back of <i vehicle> that this drivers train is being instructed to couple with is not already
  // coupled to another vehicle.
  //
  // Param:  vehicle                     Target vehicle to couple up with.
  // Param:  directionRelativeToVehicle  Defines which end of <i vehicle> this driver's train couples to.
  //                                     Use true to couple to the front of <i vehicle>, false for the back.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public native bool DriveToVehicle(Vehicle vehicle, bool directionRelativeToVehicle);

  //! Instructs this driver character to take its train to the given Trackside object.
  // The driver will NOT try to route around trains to get there.
  //
  // Note:
  //     This method is restricted to types of trackside object that have trigger behaviour.  Currently
  //     only TrackMark objects supported, although other types will be added in the future.
  //
  // Param:  trackside  %Track side item to navigate to.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public native bool DriveToTrackside(Trackside trackside);

  //! Instructs this driver character to take its train through the given Trackside object.
  // The driver will NOT try to route around trains to get there.
  //
  // This method is the same as NavigateToTrackside() except that it won't slow down as it reaches the
  // destination.  It was intended for the <l astSrcDriveCmdViaTrackMrk  Drive Via Trackmark> command.
  //
  // Note:
  //     This method is restricted to types of trackside object that have trigger behaviour.  Currently
  //     only TrackMark objects supported, although other types will be added in the future.
  //
  // Param:  trackside  %Track side item to navigate through to.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public native bool DriveThroughTrackside(Trackside trackside);



  // Driver stuck state defines
  public define int TRAIN_IS_STUCK = 1;   // This driver's train is stuck.
  public define int TRAIN_NOT_STUCK = 2;  // This driver's train is not stuck.

  float m_trainStuckTime = 0;


  //! Notifies the user through the %Trainz interface if this train is stuck or not.
  //
  // If <i msg> is equal to \ref driveStuck "TRAIN_IS_STUCK", the alert image appears in the driver
  // character's icon in Driver so the user knows.  Otherwise if <i msg> is \ref driveStuck "TRAIN_NOT_STUCK",
  // then the alert icon will be turned off.
  //
  // This method may be overridden to play an appropriate radio message for example.  Just make sure
  // to call through to the parent method with the <l gscLangKeyInherit  inherited> keyword.
  //
  // Param:  msg  \ref driveStuck "Stuck state" this driver is in.
  //
  // See Also:
  //     \ref driveStuck "Driver Stuck States"
  //
  public void NotifyUser(int msg)
  {
    float curTime = World.GetSeconds();

    if (msg == TRAIN_IS_STUCK and driverTrain)
    {
      if (curTime > m_trainStuckTime + 60.0)
        Interface.Print(GetLocalisedName() + " - " + driverTrain.GetScheduleStateString());

      SetAlertIcon(true);
      m_trainStuckTime = curTime;
    }
    else if (msg == TRAIN_NOT_STUCK and driverTrain)
    {
      SetAlertIcon(false);
    }

  }


};


