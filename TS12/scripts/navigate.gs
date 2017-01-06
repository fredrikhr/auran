//
// navigate.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "interface.gs"
include "junction.gs"
include "world.gs"
include "train.gs"
include "trigger.gs"
include "signal.gs"


//! Create your own StationBehaviour object to give stations unique navigation properties.
//
// See Also:
//     Navigate::Station(), SignalBehaviour
//
class StationBehaviour
{
  //! Objective to display on the interface as the user approaches the station so they know to slow down and prepare to stop.
  public InterfaceObjective warning = new InterfaceObjective();

  //! Alert to display on the interface if the user has overrun the station stop.
  public InterfaceAlert overrun = new InterfaceAlert();

  //! Alert to display on the interface if the user reverses back over trigger def
  public InterfaceAlert reverse = new InterfaceAlert();

  //! Alert to display on the interface if the user moves the train while they are supposed to be stopped at the station.
  public InterfaceAlert mwstopped  = new InterfaceAlert();

  //! Objective to display on the interface after station has been successfully stopped at and navigated through.
  public InterfaceObjective done = new InterfaceObjective();

  //! Objective to display on the interface when stopped at the station.
  public InterfaceObjective stopped = new InterfaceObjective();

  public string major;  //!< <l Message::major  Major message type> to broadcast when the train has stopped.
  public string minor;  //!< <l Message::minor  Minor message type> to broadcast when the train has stopped.
  public float delay;   //!< Delay in seconds of message broadcast when the train has stopped.


  //! Initialize data members of this StationBehaviour object to their default values.
  public void SetDefaults()
  {
    StringTable strTable = Constructors.GetTrainzStrings();
		
		warning.objective = strTable.GetString("navigate_station_warning_objective");

    overrun.alert = strTable.GetString("navigate_station_overrun_alert");
    overrun.log = strTable.GetString("navigate_station_overrun_log");
    overrun.score = -100;
    overrun.colour = Interface.Colour_Red;

    reverse.alert = strTable.GetString("navigate_station_reverse_alert");
    reverse.colour = Interface.Colour_Red;
    reverse.score = -50;

    stopped.objective = strTable.GetString("navigate_station_stopped_objective");

    mwstopped.alert = strTable.GetString("navigate_station_mwstopped_alert");
    mwstopped.log = strTable.GetString("navigate_station_mwstopped_log");
    mwstopped.score = -200;

    done.log = strTable.GetString("navigate_station_done_log");
    done.score = 500;
  }
};


//! Class that allows signals to have unique navigation properties.
//
// See Also:
//     Navigate::Signal(), StationBehaviour
//
class SignalBehaviour
{
  //! Warning to display in the interface as train approaches the signal.
  public InterfaceObjective warning = new InterfaceObjective();

  //! Alert to display in the interface when a train runs past a red signal.
  public InterfaceAlert runred = new InterfaceAlert();

  //! Objective to display in the interface when a train has successfully navigated through the signal.
  public InterfaceObjective done = new InterfaceObjective();

  //! Flag indicating if controls of the train should be locked as the train passes a red signal (true) or not (false).
  public bool lockControlsOnRed = true;

  //! Initialize data members of this SignalBehaviour object to their default values.
  public void SetDefaults()
  {
    StringTable strTable = Constructors.GetTrainzStrings();
		
    warning.objective = strTable.GetString("navigate_signal_warning_objective");
    runred.alert = strTable.GetString("navigate_signal_runred_alert");
    runred.colour = Interface.Colour_Red;
    runred.log = strTable.GetString("navigate_signal_runred_alert");
    runred.score = -100;
  }
};


//! The Navigate class has a few functions that make building scenarios a little easier.
//
// See Also:
//     Junction, Signal, SignalBehaviour, StationBehaviour, 
//
static class Navigate
{
  //! Sets the state of the named signal.
  //
  // Param:  signal   Name of the signal to set the state of.
  // Param:  state    Desired state of the signal.
  // Param:  reason   Reason for signal state (mouse-over appearance for curious user).
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public bool SetSignal(string signal, int state, string reason)
  {
    Signal sg = cast<Signal> Router.GetGameObject(signal);
    if(sg)
    {
      sg.SetSignalState(state, reason);
      return true;
    }
    else
    {
      Interface.Log("Could not get signal object " + signal);
    }
    return false;
  }


  //! Changes a named junction to the given direction with the option of locking it.
  //
  // Param:  junction       Name of the junction to change.
  // Param:  direction      Direction to set the junction to.  Use one of the \ref juncStates "junction state"
  //                        constants for this argument.
  // Param:  manualControl  Flag to enable (true) or disable (false) the user from changing the
  //                        junction themselves manually.
  //
  // Returns:
  //     Returns true if successful, false otherwise (i.e. <i junction> doesn't exist).
  //
  // See Also:
  //     JunctionBase::AllowManualControl(), JunctionBase::SetDirection(), JunctionBase::GetDirection(),
  //     \ref juncStates "Junction States"
  //
  public bool LockJunction(string junction, int direction, bool manualControl)
  {
    Junction jn = cast<Junction> Router.GetGameObject(junction);
    if(jn)
    {
      jn.SetDirection(direction);
      jn.AllowManualControl(manualControl);
      return true;
    }
    else
    {
      Interface.Log("Could not get junction object " + junction);
    }
    return false;
  }


  //! Default StationBehaviour object for when user does not provide their on in Station().
  StationBehaviour defaultStationBehaviour = new StationBehaviour();

  //! Navigates a train through a station stop.
  //
  // Param:  runningThread     Thread that this method was called from.
  // Param:  train             Train that has to stop at the station.
  // Param:  stationName       Name of the station to stop at (for display purposes only).
  // Param:  warningTrigger    Name of the trigger you for the station reminder objective (may be null).
  // Param:  stationTrigger    Name of the trigger at the station.  The train is to stop in this 
  //                           trigger.
  // Param:  overrunTrigger    Name of the trigger, that upon reaching a station overrun object will
  //                           be set (may be null).
  // Param:  backwardsTrigger  Name of trigger behind the train, that upon reaching, a 'wrong way'
  //                           message will be set (may be null).
  // Param:  behaviour         A StationBehaviour class that defines various properties of the 
  //                           station.  If null, defaults will be applied.
  // Param:  waitMin           Minimum time to wait after stopping at the station before clearance
  //                           to proceed is granted.
  // Param:  waitMax           Maximum time to wait after stopping at the station before clearance
  //                           to proceed is granted.
  //
  // Returns:
  //     Returns true when the station stop cycle is complete.  If <i stationTrigger>, <i train> or
  //     <i runningThread> are null, false will be returned as this method can't work if these
  //     parameters are not set.
  //
  public bool Station(GameObject runningThread, Train train, string stationName, string warningTrigger, string stationTrigger,
                      string overrunTrigger, string backwardsTrigger, StationBehaviour behaviour, float waitMin, float waitMax)
  {
    Message msg;

    //
    // get the triggers required for the station
    //
    Trigger tgWarn = cast<Trigger> Router.GetGameObject(warningTrigger);
    Trigger tgStop = cast<Trigger> Router.GetGameObject(stationTrigger);
    Trigger tgOver = cast<Trigger> Router.GetGameObject(overrunTrigger);
    Trigger tgBack = cast<Trigger> Router.GetGameObject(backwardsTrigger);

    if(!tgStop or !train or !runningThread) 
			return false;
    if(!behaviour)
    {
      behaviour = defaultStationBehaviour;
      behaviour.SetDefaults();
    }

    //
    // reenter the triggers
    //
    if(tgWarn) 
			tgWarn.ReEnter(train.GetId());
    if(tgStop) 
			tgStop.ReEnter(train.GetId());
    if(tgOver)
			tgOver.ReEnter(train.GetId());

    runningThread.Sniff(train, "Trigger", "", true);

    //
    // wait for trigger messages
    //
    wait()
    {
      on "Trigger", "Enter", msg :
      {
        if(msg.src == tgWarn)
        {
          behaviour.warning.Objective(stationName);
        }
        else if(msg.src == tgOver)
        {
          behaviour.overrun.Alert(stationName);
        }
        else if(msg.src == tgBack)
        {
          behaviour.reverse.Alert(stationName);
        }
        continue;
      }
      on "Trigger", "Stopped", msg :
      {
        if(msg.src == tgStop and ((tgOver == null) or !tgOver.ReEnter(train.GetId())))
        {
          behaviour.stopped.Objective(null);
          if(behaviour.major and behaviour.minor)
          {
            Router.PostMessage(train.GetId(), Router.MESSAGE_BROADCAST, behaviour.major, behaviour.minor, behaviour.delay);
          }
          break;
        }
        continue;
      }
    }

    runningThread.Sniff(train, "Trigger", "", false);

    float time = Math.Rand(waitMin, waitMax);

    runningThread.PostMessage(runningThread, "Timer", stationName, time);
    runningThread.Sniff(train, "Train", "StartedMoving", true);

    wait()
    {
      on "Timer", "", msg :
      {
        if(msg.minor == stationName)
        {
          train.SetAutopilotMode(Train.CONTROL_MANUAL);
          break;
        }
        continue;
      }
      on "Train", "StartedMoving", msg :
      {
        if(msg.src == train)
        {
          behaviour.mwstopped.Alert(null);
          train.SetAutopilotMode(Train.CONTROL_SCRIPT);
          train.SetDCCThrottle(0);
        }
        continue;
      }
    }

    runningThread.Sniff(train, "Train", "StartedMoving", false);

    behaviour.done.Objective(stationName);

    return true;
  }


  //! Default SignalBehaviour object for when one is not provided by the user in Signal().
  SignalBehaviour defaultSignalBehaviour = new SignalBehaviour();

  //! Navigates a train through a signal.  The signal will be set to red.
  //
  // Param:  runningThread   Thread that this method was called from.
  // Param:  train           Train that has to stop at the signal.
  // Param:  signalName      Name of the signal to be navigated.
  // Param:  reason          %Signal reason text (mouse-over for user).
  // Param:  announce        If not null, will be announced to the timetable after <i delay> seconds.
  // Param:  delay           Delay in seconds to wait for before posting messages.
  // Param:  onAnnouncement  Timetable announcement that will be waited on before setting the signal
  //                         back to automatic.
  // Param:  behaviour       %Signal behavior definition.  If null, a default will be used.
  //
  // Returns:
  //     Returns true the signal is successfully navigated, false otherwise.
  //
  public bool Signal(GameObject runningThread, Train train, string signalName, string reason, string announce, float delay,
                     string onAnnouncement, SignalBehaviour behaviour)
  {
    Message msg;
    bool		ok = true;

    Signal signal = cast<Signal> Router.GetGameObject(signalName);

    if(!signal or !runningThread or !train)
    {
      Interface.Log("Invalid parameters for Navigate::Signal");
      return false;  
    }
    if(!behaviour)
    {
      behaviour = defaultSignalBehaviour;
      behaviour.SetDefaults();
    }

    //
    // Set the signal to red and tell the user what's happening.
    //
    signal.SetSignalState(Signal.RED, reason);
    behaviour.warning.Objective(null);

    if(announce) runningThread.PostMessage(runningThread, "Navigate::Signal", signalName, delay);

    if(!onAnnouncement or Timetable.OnAnnouncement(onAnnouncement, runningThread.GetId()))
    {
      signal.SetSignalState(Signal.AUTOMATIC, "");
      return true;
    }

    runningThread.Sniff(train, "Train", "", true);

    wait()
    {
      on "Navigate::Signal", "", msg :
      {
        if(msg.minor == signalName)
        {
          Timetable.Announce(announce, runningThread.GetId());
        }
        continue;
      }
      on "Timetable", "", msg :
      {
        if(msg.minor == onAnnouncement)
        {
          break;
        }
        continue;
      }
      on "Train", "Entered red signal", msg :
      {
        if(msg.src == signal)
        {
          ok = false;
          behaviour.runred.Alert(null);
          if(behaviour.lockControlsOnRed)
          {
            train.SetAutopilotMode(Train.CONTROL_SCRIPT);
            train.SetDCCThrottle(0);
          }
        }
        continue;
      }
    }    

    runningThread.Sniff(train, "Train", "", false);

    behaviour.done.Objective(null);
    if(!ok) Interface.AdjustScore(-behaviour.done.score);

    train.SetAutopilotMode(Train.CONTROL_MANUAL);
    signal.SetSignalState(Signal.AUTOMATIC, "");
    return true;
  }


  //! \name   Train Trigger Events
  //  \anchor trainTrig
  //@{
  //! Values that define what type of event a train has caused in relation to a trigger.
  //
  // See Also:
  //     Navigate::OnTrigger()
  //

  public define int TRIGGER_ENTER = 0;    //!< %Train has entered the trigger.
  public define int TRIGGER_STOPPED = 1;  //!< %Train has stopped in the trigger.
  public define int TRIGGER_LEAVE = 2;    //!< %Train has left the trigger.

  //@}


  //! Waits until a train has reached the desired trigger.
  //
  // Param:  runningThread  Thread that this method was called from.
  // Param:  train          The train that has to reach the trigger.
  // Param:  triggerName    Name of the trigger that <i train> is to reach.
  // Param:  stage          %Trigger action the train has to satisfy for this method to return.  Use
  //                        one of the \ref trainTrig "train trigger event" constants for this argument.
  //
  // Returns:
  //     Returns true when the train satisfies the trigger event specified by <i stage>, false in
  //     the case of error.
  //
  public bool OnTrigger(GameObject runningThread, Train train, string triggerName, int stage)
  {
    Message msg;
    string minor;
    Trigger trigger = cast<Trigger> Router.GetGameObject(triggerName);
		if (!trigger)
		{
			Interface.Log("Navigate.OnTrigger> missing trigger '" + triggerName + "'");
			return false;
		}
		

    runningThread.Sniff(train, "Trigger", "", true);
    trigger.ReEnter(train.GetId());

    switch(stage)
    {
      case TRIGGER_ENTER:
				minor = "Enter";
				break;

      case TRIGGER_STOPPED:
				minor = "Stopped";
				break;

      case TRIGGER_LEAVE:
				minor = "Leave";
				break;

      default:
				Interface.Log("Navigate.OnTrigger> bad 'stage' param");
				return false;
    }

    wait()
    {
      on "Trigger", "", msg :
      {
        if (msg.src == trigger and msg.minor == minor)
          break;
        
        continue;
      }
    }

    runningThread.Sniff(train, "Trigger", "", false);
		return true;
  }


  //! \name   Train Junction Events
  //  \anchor trainJunc
  //@{
  //! Values that define what type of event a train has caused in relation to a junction.
  //
  // The train will enter the junction when it is 150 meters away from the junction and will 
  // inner-enter the junction when it reaches the actual junction.
  //
  // See Also:
  //     Navigate::OnJunction()
  //

  public define int JUNCTION_ENTER = 0;       //!< %Train has entered the junction.
  public define int JUNCTION_INNERENTER = 1;  //!< %Train has entered the inner region of the junction.
  public define int JUNCTION_STOPPED = 2;     //!< %Train has stopped on the junction.
  public define int JUNCTION_INNERLEAVE = 3;  //!< %Train has left the inner area of the junction.
  public define int JUNCTION_LEAVE = 4;       //!< %Train has left the junction totally.

  //@}


  //! Waits until a train has reached the desired junction.
  //
  // Param:  runningThread  Thread that this method was called from.
  // Param:  train          Train that has to reach this junction.
  // Param:  junctionName   Name of the junction.
  // Param:  stage          %Junction action the train has to satisfy for this method to return.
  //                        Use one of the \ref trainJunc "train junction event" constants.
  //
  // Returns:
  //     Returns true when the train has satisfied the <i stage> criteria, otherwise false in the
  //     case of an error.
  //
  // See Also:
  //     \ref trainJunc "Train Junction Events"
  //
  public bool OnJunction(GameObject runningThread, Train train, string junctionName, int stage)
  {
    Message msg;
    string minor;
    Junction junction = cast<Junction> Router.GetGameObject(junctionName);
    if(junction)
    {
      switch(stage)
      {
        case JUNCTION_ENTER : minor = "Enter"; break;
        case JUNCTION_INNERENTER : minor = "InnerEnter"; break;
        case JUNCTION_STOPPED : minor = "Stopped"; break;
        case JUNCTION_INNERLEAVE : minor = "InnerLeave"; break;
        case JUNCTION_LEAVE : minor = "Leave"; break;
        default : return false;
      }

      runningThread.Sniff(train, "Junction", "", true);
      junction.ReEnter(train.GetId());

      wait()
      {
        on "Junction", "", msg :
        {
          if(msg.src == junction and msg.minor == minor) 
            break;
          continue;
        }
      }

      runningThread.Sniff(train, "Junction", "", false);

      return true;     
    }
    return false;
  }
};
