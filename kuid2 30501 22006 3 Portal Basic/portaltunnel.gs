//
// PortalTunnel.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "BasePortal.gs"
include "IndustryTrainController.gs"
include "ConsistHelperInfo.gs"
include "common.gs"
include "PortalTunnelInfo.gs"
include "Track.gs"
include "permit.gs"
include "MultiplayerGame.gs"


//
// Portal industry
//
class PortalTunnel isclass BasePortal
{
  IndustryTrainController itc;  // industry train controller - used to track incoming/outgoing vehicles
  Browser      info;         // browser for displaying info on this industry
  //Asset        thisAsset;    // handy reference to the asset
  StringTable  stringTable;  // asset's string table
  
  // handles the properties options specific to this asset
  HTMLPropertyGroup group;
	PortalTunnelInfo  portalInfo;

  // portal state definition
	define int IDLE_STATE = 0;
	define int CONSUME_STATE = 1;
	define int PRODUCE_STATE = 2;

	int m_currentState = IDLE_STATE;
	

	define int PORTAL_IDLE = 0;
	define int PORTAL_CREATE = 1;
	define int PORTAL_CLEAR = 2;
	int portalDebugMode = PORTAL_IDLE;


  //
  // Method definitions
  //
  public void Init(void);
  void ViewDetails(void);

  thread void ThreadMain(void);
	thread void ConsumeTrain(Train train, Vehicle triggerVehicle);
	thread void ThreadEmitTrains(void);
	thread void ThreadProductionSchedule(void);

	void EmitTrain(Soup consistDescription);
	void CheckEmitTrains(void);
	bool ShouldConsumeTrain(Train train);
	thread void NotifyConsumedTrain(Soup consistDescriptor);


  //
  // Portal methods
  //

	bool portalInDriver = false;

	void ModuleInitHandler(Message msg)
	{
		if (portalInDriver)
			return;

    // are we in Driver?, so kick off portal threads needed
    if (World.GetCurrentModule() == World.DRIVER_MODULE)
    {
			portalInDriver = true;

      ThreadEmitTrains();
      ThreadProductionSchedule();
      ThreadMain();
    }
	}


  //
  // Init method called by Trainz when an instance of this industry has been created.
  //
  public void Init(void)
  {
    inherited();

    info        = null;
    itc         = new IndustryTrainController();
    //thisAsset   = me.GetAsset();
    stringTable = GetAsset().GetStringTable();

    // property handlers for this asset
    group = new HTMLPropertyGroup();

    portalInfo = new PortalTunnelInfo();
    portalInfo.Init(me);
    group.AddHandler(portalInfo, "portalinfo/");

		SetPropertyHandler(group);

		AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
  }

	
	void BeginPortalState(int state)
	{
		while (m_currentState != IDLE_STATE)
		{
			Interface.Log("PortalTunnel.BeginPortalState> in state " + m_currentState + "; waiting for state " + state);
			wait()
			{
  		  on "PortalTunnel", "Consume-Done":
	  			break;
  		  on "PortalTunnel", "Produce-Done":
	  			break;
			}
		}
		
		m_currentState = state;
	}


	void EndPortalState(int state)
	{
		if (m_currentState == state)
			m_currentState = IDLE_STATE;
		else
			Exception("EndPortalState> portal is not in state " + state);
	}


  //
  // Manage this game object.
  //
  thread void ThreadMain(void)
  {
    // Nothing to do on multiplayer clients, the server does all work
    if (MultiplayerGame.IsActive() and !MultiplayerGame.IsServer())
      return;

    Message msg;

    wait()
    {
      // as a start, this industry will only eat trains up!
      on "Object", "InnerEnter", msg:
      {
        // obtain vehicle data to determine what to do
        Vehicle vehicle = cast<Vehicle>(msg.src);
        if (vehicle)
        {
          Train train = vehicle.GetMyTrain();

  				if (m_currentState == IDLE_STATE)
          {
		  			if (ShouldConsumeTrain(train))
			  		{
				  		BeginPortalState(CONSUME_STATE);
					  	ConsumeTrain(train, vehicle);
  					}
          }
		  		//else
			  	//	Interface.Log("PortalTunnel.ThreadMain> portal is busy- ignoring train " + train.GetId());
			  }
        continue;
			}

      // User has right-clicked on this industry and selected View Details menu option.
      // Start the ViewDetails() thread to display a browser with industry info.
      on "MapObject", "View-Details" :
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


  //
  // View details of this asset (non functional now)
  //
  void ViewDetails(void)
  {
    //StringTable strTable = me.GetAsset().GetStringTable();

    if (!info)
    {
      info = Constructors.NewBrowser();

      // DW: usual industry details aren't really what we need - something special with train 
      //     statistics instead would be preferable
			string str = "<b>" + me.GetLocalisedName() + "</b><br>";
			
			if (m_currentState == IDLE_STATE)
      {
        if (portalInfo.GetProduce() and portalInfo.GetConsume())
          str = str + stringTable.GetString("html_viewdetails_wait_both");

        else if (portalInfo.GetProduce() and !portalInfo.GetConsume())
          str = str + stringTable.GetString("html_viewdetails_wait_produce");

        else if (portalInfo.GetConsume() and !portalInfo.GetProduce())
          str = str + stringTable.GetString("html_viewdetails_wait_consume");

        else
          str = str + stringTable.GetString("html_viewdetails_wait_inactive");
      }
			else if (m_currentState == CONSUME_STATE)
        str = str + stringTable.GetString("html_viewdetails_consuming");

			else if (m_currentState == PRODUCE_STATE)
        str = str + stringTable.GetString("html_viewdetails_producing");

			else
        str = str + stringTable.GetString("html_viewdetails_unknown");

/*
			if (portalDebugMode == PORTAL_IDLE)
				str = str + "<p>DEBUG: EmitTrain is IDLE</p>";
			else if (portalDebugMode == PORTAL_CREATE)
				str = str + "<p>DEBUG: EmitTrain is CREATING</p>";
			else if (portalDebugMode == PORTAL_CLEAR)
				str = str + "<p>DEBUG: EmitTrain is CLEARING</p>";
			else
				str = str + "<p>DEBUG: EmitTrain is in unknown state</p>";
*/

      info.LoadHTMLString("<html><body>" + str + "</body></html>");
      info.SetWindowRect(100, 80, 500, 250);
    }
  }



  //
  // Handle in InnterEnter of a specific vehicle during consumption process
  //
	void ConsumeTrain_InnerEnter(Vehicle vehicle)
	{
    // initialise and get info needed to determine if this inner-enter is valid part of consumption
    string    triggerName   = FindTriggerContainingNode(vehicle.GetId(), true);
    Train     train         = vehicle.GetMyTrain();
    //float     trainSpeed    = train.GetVelocity();
    //float     vehicleSpeed  = vehicle.GetVelocity();
    int       trackRelation = vehicle.GetRelationToTrack(me, "out_track0");
    //bool      trainRelation = vehicle.GetDirectionRelativeToTrain();


    // is this the first portal entry trigger?
    if (triggerName == "trig_entry")
    {
      // is this train not yet under industry control and moving into the tunnel?
      if (!itc.IsControllingTrain(train)) 
      {
        // TODO: dw - if it is from a seperate train, then we should ignore it (bullet proof late)
        // ok this is the first vehicle, we need to wait out this train (ie swallow it)
        itc.AddVehicle(vehicle, false);

      }
      // is this vehicle in a train being driven into this industry but not yet itself in the industry's list?
      else
      {
        itc.AddVehicle(vehicle, false);
      }
    }

	}


  //
  // inOut - true for incoming (consume), false for outoging (emitting)
  //
  void UpdateDCCThrottle(Vehicle vehicle, float capturedSpeed, bool inOut)
  {
    bool vehicleToTrain   = vehicle.GetDirectionRelativeToTrain();
    int  directionToTrack = vehicle.GetRelationToTrack(me, "out_track0");

    bool vehicleToTrack = (directionToTrack == Vehicle.DIRECTION_FORWARD);
    bool trainToTrack   = (vehicleToTrack == vehicleToTrain);

    float throttle = 0.5f;
    float speed    = capturedSpeed;

    if (speed < 0) 
      speed = -speed;

    if (speed < 5)
      speed = 5;

    if (inOut and trainToTrack)
    {
      throttle = -throttle;
      speed    = -speed;
    }
    else if (!inOut and !trainToTrack)
    {
      throttle = -throttle;
      speed    = -speed;
    }

    vehicle.GetMyTrain().SetHandBrake(false);
    vehicle.GetMyTrain().SetDCCThrottle(throttle);
    vehicle.GetMyTrain().SetVelocity(speed);
  }


  //
  // Waits for given train and consumes it
  //
	thread void ConsumeTrain(Train train, Vehicle triggerVehicle)
  {
		Vehicle[] vehicleList = train.GetVehicles();
		if (triggerVehicle == vehicleList[0])
		{
			// forwards order
		}
		else if (triggerVehicle == vehicleList[vehicleList.size() - 1])
		{
			// backwards order
			Vehicle[] tempList = vehicleList;
			int i, count = tempList.size();
			vehicleList = new Vehicle[count];

			for (i = 0; i < count; i++)
				vehicleList[i] = tempList[count - 1 - i];
		}
		else
		{
			// a problem- better ignore this train!

			// set industry state back to idle and post message to indicate end of consumption process
			EndPortalState(CONSUME_STATE);
			PostMessage(me, "PortalTunnel", "Consume-Done", 0);
			return;
		}


    // blank consist description to save incoming consist to
    ConsistHelperInfo consumedConsist = new ConsistHelperInfo();

    float dccValue = 0.4;

    // save driver (if any)
    DriverCharacter driver = train.GetActiveDriver();
    if (driver)
    {
      DriverCommands commands = driver.GetDriverCommands();
			commands.ProceedToNextCommand();
      consumedConsist.SetDriverCommands(commands);
      consumedConsist.SetDriverName(driver.GetLocalisedName());
      consumedConsist.SetDriverKUID(driver.GetAsset().GetKUID());

      // remove driver from world - we don't want it on the loose to be assigned to
      // another train or anything like that
      World.RemoveDriverCharacter(driver);

      // destroy shceudle/threads once they are saved
			train.StopScheduleAndWait();
      train.SetAutopilotMode(Train.CONTROL_SCRIPT);
    }

    // handle first vehicle entry
		ConsumeTrain_InnerEnter(triggerVehicle);

    float capturedSpeed = train.GetTrainVelocity();
    if (capturedSpeed < 0)
      capturedSpeed = -capturedSpeed;

    UpdateDCCThrottle(triggerVehicle, capturedSpeed, true);

		
    PostMessage(me, "Timer", "Tick", 0.25);


    Message msg;
    wait()
    {
      on "Object", "InnerEnter", msg:
      {
        Vehicle vehicle = cast<Vehicle>(msg.src);
        if (vehicle)
        {
          Train vehicleTrain = vehicle.GetMyTrain();

	  			if (vehicleTrain != triggerVehicle.GetMyTrain())
		  			// wrong train! ignore it..
			  		continue;

          ConsumeTrain_InnerEnter(vehicle);
        }
        continue;
      }


      on "Object", "InnerLeave", msg:
      {
        // obtain vehicle & consist info to determine what to do
        Vehicle vehicle = cast<Vehicle>(msg.src);
        if (vehicle)
        {
  				if (vehicle.GetMyTrain() != triggerVehicle.GetMyTrain())
	  				return;
				
		  		vehicle = triggerVehicle;

          int trackRelation = vehicle.GetRelationToTrack(me, "out_track0");
				
          // remove vehicle from this controller
          itc.RemoveVehicle(vehicle);

          bool vehicleFacing = (trackRelation == Vehicle.DIRECTION_BACKWARD);

          // put swallowed vehicle into our consist helper's list
          consumedConsist.AppendVehicle(vehicle, portalInfo.GetRegurgitateAction(), vehicleFacing);

          // is this not the last vehicle?
          if (vehicleList.size() > 1)
          {
  					vehicleList[0, 1] = null;
	  				triggerVehicle = vehicleList[0];

            World.DeleteVehicle(vehicle);
					
            //UpdateDCCThrottle(triggerVehicle, capturedSpeed, true);
          }
          else
          {
            World.DeleteTrain(vehicle.GetMyTrain());
            break;
          }
        }
        continue;
      }


			on "Timer", "Tick":
			{
				if (capturedSpeed > 10.f)
					capturedSpeed = capturedSpeed - 1.f;
				
        UpdateDCCThrottle(triggerVehicle, capturedSpeed, true);
				PostMessage(me, "Timer", "Tick", 0.25);
				continue;
			}
    }  // wait()

		ClearMessages("Timer", "Tick");

		// convert captured consist to soup and add to the list
		Soup consumedConsistSoup = consumedConsist.GetProperties();
    NotifyConsumedTrain(consumedConsistSoup);

    // set industry state back to idle and post message to indicate end of consumption process
		EndPortalState(CONSUME_STATE);
    PostMessage(me, "PortalTunnel", "Consume-Done", 0);
  }



  //
  // Emits a vehicle from the 
  //
  Vehicle EmitNewVehicle(ConsistHelperInfo emitTrain, int currentVehicleIndex, Vehicle prevVehicle, Permit permit)
  {
    // use an array as CreateTrain requires that (Even though it is only one vehicle in it)
    KUID[] currentVehicleKUID = new KUID[1];
    currentVehicleKUID[0] = emitTrain.vehicles[currentVehicleIndex].vehicle;

    // create the vehicle to emit in a consist of its own
    Train newTrain = World.CreateTrain(currentVehicleKUID, me, "out_track0", 60.0, true);
    if (!newTrain)
    {
      Interface.Log("PortalTunnel.EmitNewVehicle> Failed to create initial consist for exiting train!");
      return null;
    }
		newTrain.ShowInConsistMenu(false);


    // set the vehicle up to correct direction + running number
    Vehicle[] newTrainVehicles = newTrain.GetVehicles();
    Vehicle   newVehicle       = newTrainVehicles[0];

    // running number
    string savedRunningNumber = emitTrain.vehicles[currentVehicleIndex].runningNumber;
    if (savedRunningNumber.size() > 0)
      newVehicle.SetRunningNumber(savedRunningNumber);


    // vehicel load (just use whatever the setting is from the descriptor - the consume
    // method will have seen to adjusting the load specs if needed)
    emitTrain.vehicles[currentVehicleIndex].LoadVehicle(newVehicle);

    // Reposition and attach to exiting train (if any)
    if (prevVehicle)
    {
      // if rear vehicles is not same direction as train, it's front coupler will be train's rear
      bool vehicleToTrack = (prevVehicle.GetRelationToTrack(me, "out_track0") == Vehicle.DIRECTION_FORWARD);
      int exitingVehicleRear = Vehicle.COUPLE_BACK;

      // if prev vehicle is against track, it's front coupler is facing us
      if (!vehicleToTrack)
        exitingVehicleRear = Vehicle.COUPLE_FRONT;

      bool ok = newVehicle.Reposition(prevVehicle, Vehicle.COUPLE_FRONT, exitingVehicleRear);
			if (!ok)
			{
				Interface.Log("PortalTunnel.EmitNewVehicle> Vehicle.Reposition failed - will retry");
				World.DeleteVehicle(newVehicle);
				return prevVehicle;
			}

      newTrain = newVehicle.GetMyTrain();
    }

		// assign the permit
    permit.SetOwnerObject(newTrain);

    // adjust direction of vehicle if needed
    // (always do this after we have repositioned vehicle into the exiting consist, chaos otherwise!
    if (!emitTrain.vehicles[currentVehicleIndex].facing)
      newVehicle.Reverse();

    UpdateDCCThrottle(newVehicle, 5, false);

/*
    // does the train have a driver yet? - if not add one (all trains must leave with drivers)
    if (!newTrain.GetActiveDriver())
    {
      // attach a driver to vehicle if it is a loco
      Locomotive loco = cast<Locomotive> newVehicle;
      if (loco)
      {
        Asset driverAsset;
        if (!emitTrain.GetDriverKUID())
        {
          // if we can't find a driver, then choose on at random
          Asset[] driverAssets = World.GetAssetList("drivercharacter");
          int randomDriver = Math.Rand(0, driverAssets.size());

          driverAsset = driverAssets[randomDriver];
          emitTrain.SetDriverName(driverAsset.GetName());
        }
        else
          driverAsset = World.FindAsset(emitTrain.GetDriverKUID());

        DriverCharacter newDriver = World.AddDriverCharacter(driverAsset);
        if (newDriver)
        {
          // assign to train
          newDriver.SetLocalisedName(emitTrain.GetDriverName());
          newDriver.SetLocation(newVehicle);
        }
      }
    }
*/
		Interface.Log("PortalTunnel.EmitNewVehicle> new vehicle " + newVehicle.GetId() + " on train " + newVehicle.GetMyTrain().GetId());

    return newVehicle;
  }


  //
  // Sends out the specified train from either the cached array or consist pool
  //
  void EmitTrain(Soup consistDescription)
  {
    // setup access to consist from soup descrition
    ConsistHelperInfo emitTrain = new ConsistHelperInfo();
    emitTrain.SetProperties(consistDescription);

    if (emitTrain.vehicles.size() < 1)
    {
      Interface.Log("PortalTunnel.EmitTrain> Failure, empty consist!");
//      goto abort;
      return;
    }


    Message msg;

    //bool trainDone = false;
    int  currentVehicleIndex = 0;
    int  trainSize = emitTrain.vehicles.size();


    // wait for a permit
    Track portalTrack = me.GetAttachedTrack("out_track0");
    Permit permit = portalTrack.RequestPermit(me);

		if (!permit.IsGranted())
			wait()
			{
			  on "Permit", "Granted":
				  if (permit.IsGranted())
					  break;
				  continue;
			}

		BeginPortalState(PRODUCE_STATE);
    Interface.Log("PortalTunnel.EmitTrain> Permit granted, safe to create train now...");


    // emit first vehicle
    Vehicle emitVehicle = EmitNewVehicle(emitTrain, currentVehicleIndex, null, permit);
		if (!emitVehicle)
			goto abort;

    // only move into next vehicle if we are ready (ie count isn't enough)
    if (emitTrain.vehicles[currentVehicleIndex].number > 1)
      emitTrain.vehicles[currentVehicleIndex].number--;
    else
      currentVehicleIndex++;
		

    PostMessage(me, "Timer", "Tick", 0.25);


		portalDebugMode = PORTAL_CREATE;

		int retryCount = 0;

    wait()
    {
      on "Timer", "Tick", msg:
      {
        // if is still in the trigger, push it out...
        if (FindTriggerContainingNode(emitVehicle.GetId(), true) == "trig_end")
				{
          if (Math.Fabs(emitVehicle.GetVelocity()) < 5.0)
            UpdateDCCThrottle(emitVehicle, 5, false);
				}
				else// if (!trainDone)
				{
					// not in the trigger? ack, we must have missed the InnerLeave somehow

					if (retryCount++ >= 4)
					{
						///
						///


						// before we do anything, determine if last vehicle has been done, if so, break the cycle
						// (we need to check at start, otherwise it could complicate things if there was only one
						// vehicle to emit for the entire consist)
						if (currentVehicleIndex == trainSize)
							break;

						// emit the next vehicle as previous one has left the trigger
						Vehicle prevVehicle = emitVehicle;
						emitVehicle = EmitNewVehicle(emitTrain, currentVehicleIndex, prevVehicle, permit);
						
						if (emitVehicle != prevVehicle)
						{
							// only move into next vehicle if we are ready (ie count isn't enough)
							if (emitTrain.vehicles[currentVehicleIndex].number > 1)
								emitTrain.vehicles[currentVehicleIndex].number--;
							else
								currentVehicleIndex++;
						}

						if (!emitVehicle)
							goto abort;

						retryCount = 0;
						///
						///
					}

          if (Math.Fabs(emitVehicle.GetVelocity()) < 5.0)
            UpdateDCCThrottle(emitVehicle, 5, false);
				}

        PostMessage(me, "Timer", "Tick", 0.25);
        continue;
      }

      on "Object", "InnerLeave", msg:
      {
        Vehicle vehicle = cast<Vehicle>(msg.src);

        // get info needed to determine what vehicle left this trigger
        string triggerName = FindTriggerContainingNode(vehicle.GetId(), false); // vehicle is outside inner radius once we get here

        // trigger at rear, move onto next vehicle 
        if (vehicle == emitVehicle)//  and  !trainDone) //triggerName == "trig_end")
        {
          //if (!trainDone)
          {
					///
					///


            // before we do anything, determine if last vehicle has ben done, if so, break the cycle
            // (we need to check at start, otehrwise it could complicate things if there was only one
            // vehicle to emit for the entire consist)
            if (currentVehicleIndex == trainSize)
							break;

            // emit the next vehicle as previous one has left the trigger
						Vehicle prevVehicle = emitVehicle;
            emitVehicle = EmitNewVehicle(emitTrain, currentVehicleIndex, prevVehicle, permit);
						
						if (emitVehicle != prevVehicle)
						{
							// only move into next vehicle if we are ready (ie count isn't enough)
							if (emitTrain.vehicles[currentVehicleIndex].number > 1)
								emitTrain.vehicles[currentVehicleIndex].number--;
							else
								currentVehicleIndex++;
						}

						if (!emitVehicle)
							goto abort;

						retryCount = 0;
					///
					///
          } // !trainDone
        }
        /*else if (trainDone  and  vehicle == emitVehicle  and  triggerName != "trig_end")
        {
          // TODO: What if a vehicle isn't part of the train???

          //Vehicle[] vehicles = vehicle.GetMyTrain().GetVehicles();
          //if (vehicle == vehicles[vehicles.size()-1])
          {
            break;
          }
        }*/
        //PostMessage(me, "Timer", "Tick", 0.25);
        continue;

      } // on "Object", "InnerLeave"
    }

		ClearMessages("Timer", "Tick");


		Train exitingTrain = emitVehicle.GetMyTrain();

		//
		// Allow the train to clear the portal before handing over control.
		//
		portalDebugMode = PORTAL_CLEAR;
		
		if (!exitingTrain.GetFrontmostLocomotive())
		{
				// no locomotive = can't move train, so don't bother trying
		}
		else
		{
			exitingTrain.SetAutopilotMode(Train.CONTROL_AUTOPILOT);
			AITrainScope scope = exitingTrain.OpenAITrainScope();

			Sniff(exitingTrain, "Train", null, true);

			bool emitVehicleInTrigEntry = false;

			PostMessage(me, "Portal-Exit", "Tick", 10.f);
			
			wait()
			{
				on "Object", "InnerEnter", msg:
					if (msg.src == emitVehicle)
					{
						string triggerName = FindTriggerContainingNode(emitVehicle.GetId(), false);
						
						if (triggerName == "trig_entry")
							emitVehicleInTrigEntry = true;
					}
					continue;

				on "Object", "Enter", msg:
					if (msg.src == emitVehicle)
					{
						string triggerName = FindTriggerContainingNode(emitVehicle.GetId(), false);

						if (triggerName == "trig_entry")
							emitVehicleInTrigEntry = true;
					}
					continue;

				on "Object", "Leave", msg:
					if (msg.src == emitVehicle  and  emitVehicleInTrigEntry)
					{
						string triggerName = FindTriggerContainingNode(emitVehicle.GetId(), false);
						if (triggerName == "")
							break;
					}
					continue;

				on "Train", "StoppedMoving", msg:
					if (msg.src == exitingTrain)
						exitingTrain.BeginAITrainStuck(scope);
					continue;

				on "Train", "StartedMoving", msg:
					if (msg.src == exitingTrain)
						exitingTrain.EndAITrainStuck(scope);
					continue;

				on "Train", "Cleanup", msg:
					if (msg.src == exitingTrain)
						goto abort;
					continue;


				on "Portal-Exit", "Tick", msg:
					{
						Vehicle[] vehicles = emitVehicle.GetMyTrain().GetVehicles();
						int i;
						for (i = 0; i < vehicles.size(); i++)
							if (FindTriggerContainingNode(vehicles[i].GetId(), false) != "")
								goto keepWaiting;

						// uhoh.. we've run off the end of the portal without noticing.
						break;
					}

				keepWaiting:
					PostMessage(me, "Portal-Exit", "Tick", 5.f);
					continue;
			}

			ClearMessages("Timer", "Tick");
			Sniff(exitingTrain, "Train", null, false);
			exitingTrain.CloseAITrainScope(scope);
			//
		}
		

		DriverCharacter theDriver = exitingTrain.GetActiveDriver();
		
		if (!theDriver)
		{
			Vehicle driverVehicle = exitingTrain.GetFrontmostLocomotive();
			if (!driverVehicle)
				driverVehicle = exitingTrain.GetVehicles()[0];
			
			// determine which Driver asset to use
			Asset driverAsset;
      if (!emitTrain.GetDriverKUID())
      {
        // if we can't find a driver, then choose on at random
        Asset[] driverAssets = World.GetAssetList("drivercharacter");
        int randomDriver = Math.Rand(0, driverAssets.size());

        driverAsset = driverAssets[randomDriver];
        emitTrain.SetDriverName(driverAsset.GetName());
      }
      else
        driverAsset = World.FindAsset(emitTrain.GetDriverKUID());
			
			// create the Driver
      theDriver = World.AddDriverCharacter(driverAsset);
      if (theDriver)
      {
        // assign to train
        theDriver.SetLocalisedName(emitTrain.GetDriverName());
        theDriver.SetLocation(driverVehicle);
      }
		}
		
    // allow user to get control of the train if they wish
    exitingTrain.SetDCCThrottle(0.0);
    exitingTrain.SetAutopilotMode(Train.CONTROL_AUTOMANUAL);
		exitingTrain.ShowInConsistMenu(true);

		
		// always set driver commands last
		if (theDriver)
		{
			DriverCommands driverCommands = emitTrain.GetDriverCommands();
			theDriver.SetDriverCommands(driverCommands);
			theDriver.SetRunningCommands(true);
		}


	abort:
		portalDebugMode = PORTAL_IDLE;

    // set this portal back to an idle state and post message indicating this emission has finished
		EndPortalState(PRODUCE_STATE);
    PostMessage(me, "PortalTunnel", "Produce-Done", 0);
  }


  //
  // ?
  //
	bool ShouldConsumeTrain(Train train)
	{
		if (m_currentState != IDLE_STATE)
			return false;

		return portalInfo.ShouldConsumeTrain(train);
	}


	thread void ThreadProductionSchedule(void)
	{
		float delay = portalInfo.GetProduceTimeInSeconds();
		
		if (delay <= 0)
  		// we don't want to produce anything
			return;

		while (1)
		{
			Sleep(delay);
			Soup consistDescriptor = portalInfo.GetRandomProduceConsist();
			AddProduceTrain(consistDescriptor);
		}
	}


	thread void ThreadEmitTrains(void)
	{
		wait()
		{
		  on "PortalTunnel", "Consume-Done":
			  CheckEmitTrains();
			  continue;

		  on "PortalTunnel", "Produce-Done":
			  CheckEmitTrains();
			  continue;

		  on "PortalTunnel", "EmitTrain":
			  CheckEmitTrains();
			  continue;
		}
	}


	void CheckEmitTrains(void)
	{
		if (m_currentState == IDLE_STATE)
		{
			Soup consistDescriptor = PopFirstProduceTrain();
			if (consistDescriptor)
			{
	  		EmitTrain(consistDescriptor);
        return;
      }
		}
	}

	
  //
  //
  //


	thread void NotifyConsumedTrain(Soup consistDescriptor)
	{
		float time = portalInfo.GetRegurgitateTimeInSeconds(consistDescriptor);
	
    if (time <= 0)
			// we don't want to regurgitate anything now
			return;

		Sleep(time);

		string altPortal = portalInfo.GetRegurgitateAlternatePortalName();
		BasePortal portal;

		if (altPortal == "")
		{
			portal = me;
		}
		else
		{
			portal = cast<BasePortal> Router.GetGameObject(altPortal);
			if (!portal)
			{
				Exception("PortalTunnel> Alternate portal named '" + altPortal + "' was not found.");
				return;
			}
		}

		portal.AddProduceTrain(consistDescriptor);
	}


  //=============================================================================
  // Name: AppendDependencies
  // Desc: Gathers all dependencies of this map object instance
  //=============================================================================
  public void AppendDependencies(KUIDList io_dependencies)
  {
    // Call base
    inherited(io_dependencies);

    // Call PortalTunnelInfo.AppendDependencies() to get any produced consist dependencies
    portalInfo.AppendDependencies(io_dependencies);
  }

};
