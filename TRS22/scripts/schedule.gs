//
// Schedule.gs
//
//  Copyright (C) 2002-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Interface.gs"
include "gs.gs"
include "Junction.gs"
include "Trigger.gs"
include "Train.gs"
include "timetable.gs"
include "Track.gs"
include "DriverCharacter.gs"


//! Custom command for a train schedule.
// 
// CustomCommand allows you to define your own custom schedule commands.  To do this, inherit this
// class and override the Execute() method.  Use Schedule::Custom(CustomCommand) or 
// Schedule::Custom(CustomCommand,int,int,int) to add a custom command to a schedule.
//
// See Also:
//     Command, DriverCommand, DriverScheduleCommand, Schedule
//
class CustomCommand
{
  //! Called by a train object when running the schedule.
  //
  // Param:  train  Train the schedule is running on.
  // Param:  px     Handy parameter.  User implementation can use this for any purpose.
  // Param:  py     Another spare handy parameter.
  // Param:  pz     Another spare handy parameter.
  //
  // Sets these parameters when adding a custom command to the schedule.
  //
  // Returns:
  //     User implementation should return true on success, false otherwise.
  //
  public bool Execute(Train train, int px, int py, int pz)
  {
    return false;
  }

  public bool ShouldStopTrainOnCompletion() { return true; }
};


//! A command in a schedule.
//
// A Command object is used within the Schedule and contains all the information required by the 
// train to execute a command.
//
// See Also:
//     CustomCommand, DriverCommand, DriverScheduleCommand, Schedule, \ref cmdTypes "Command Types"
//
final class Command
{
  public int            command;  // Command to run, see Schedule.CMD_* defines below.
  public int            ca;       // Multi-purpose integer parameter (not always used).
  public int            cb;       // Multi-purpose integer parameter (not always used).
  public int            cc;       // Multi-purpose integer parameter (not always used).
  public float          cd;       // Multi-purpose floating point parameter (not always used).
  public CustomCommand  custom;   // Custom command with user-provided function to execute.
  public GameObjectID   objID;    // Multi-purpose GameObjectID parameter (not always used).
  public object         obj;      // Cached object reference for objID (not always used).
  public string         major;    // Major string for the message sent when this command executes.
  public string         minor;    // Minor string for the message sent when this command executes.

  public Command GetCopy()
  {
    Command cmdCopy = new Command();
    cmdCopy.command = command;
    cmdCopy.ca = ca;
    cmdCopy.cb = cb;
    cmdCopy.cc = cc;
    cmdCopy.cd = cd;
    cmdCopy.custom = custom;
    cmdCopy.objID = objID;
    cmdCopy.obj = obj;
    cmdCopy.major = major;
    cmdCopy.minor = minor;
    return cmdCopy;
  }

};


//! Manages a list of commands in a train.
//
// This class manages a list of <l Command commands> for a Train.  Use the methods in the schedule
// class to build a list of instructions/commands for your train.
//
// A Schedule object lets you build a list of commands for a train (e.g. TakeJunction(), 
// StopAtTrigger() etc.).  You can also add your own custom commands by creating your own
// CustomCommand-derived class.  Note that the custom commands will run in the Train::RunSchedule()
// thread.
//
// Messages used by a Train that relate to its running of a Schedule are:
// {[ Major       | Minor       | Source  | Destination  ]
//  [ "Schedule"  | "Complete"  | train   | broadcast    ]
//  [ "Schedule"  | "Abort"     | train   | train        ]
//  [ "Schedule"  | "Touch"     | train   | train        ]}
//
// See Also:
//     Command, CustomCommand, DriverCharacter, DriverCommands, DriverCommand, Train::RunSchedule()
//
final class Schedule
{

  //! Place the train in autopilot mode through the named junction.
  //
  // When the train reaches the named junction, it will wait until it is permitted on the track on
  // the other side of the junction in the given direction.  Once the train is permitted on the 
  // track, it will request permission for the junction.  This is when the next command in the 
  // schedule will be executed.
  //
  // Note:
  //     When using this method, you <bi MUST> specify <bi EVERY> junction the train will encounter
  //     along your desired route.  <bi THIS IS IMPORTANT!!!>
  //
  // Note:
  //     This method is only for junctions of type Junction that are of the Trackside variety.  Use
  //     TakeJunction(JunctionBase,int) for non-Trackside junctions.
  //
  // Param:  junctionName  Name of the junction object.
  // Param:  direction     %Junction direction to take.  Use one of the \ref  juncStates "Junction States"
  //                       from the JunctionBase class for this parameter.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule. false otherwise.
  //
  public bool TakeJunction(JunctionBase junction, int direction);
  public obsolete bool TakeJunction(string junctionName, int direction);

  //! Place train in autopilot mode through the given track.
  //
  // Param:  track  Track to get a permit for.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool TakeTrackPermit(Track track);

  //! Place the train in autopilot mode and wait until it is has cleared all junctions that TakeJunction() has been called for.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool CompleteJunctions();

  //! Place the train in autopilot mode and wait till it receives the (<m"%Trigger">, <m "Enter">) message for the named trigger.
  //
  // When the train reaches the trigger, it will stop, and then wait for time seconds.  The schedule
  // will then continue.
  //
  // Param:  triggerName  Name of the trigger object.
  // Param:  time         Number of seconds to stall at the trigger for.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool StopAtTrigger(Trigger trigger, float time);
  public obsolete bool StopAtTrigger(string triggerName, float time);

  //! Place the train in autopilot mode and wait till it enters/leaves the specified trigger.
  //
  // Param:  triggerName  Name of the trigger.
  // Param:  enter        If true, this command waits until the train enters the trigger and if
  //                      false, the command waits for the train leaves the trigger.
  //
  // Note: 
  //     You should not call this method if the train is required to pass through any junctions to
  //     reach the trigger.  Use TakeJunction() for each junction the train is to pass through
  //     before reaching the trigger.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  // See Also:
  //     Trigger, Navigate::OnTrigger()
  //
  public bool OnTrigger(Trigger trigger, bool enter);
  public obsolete bool OnTrigger(string triggerName, bool enter);

  //! Calls <l Train::Turnaround  Turnaround>() on the train, then continues the schedule.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  // See Also:
  //     Train::Turnaround()
  //
  public bool ReverseTrain(void);

  //! Stop the train for the given amount of time.  This is effectively a waiting command.
  //
  // Param:  time  Amount of time to stop for in seconds.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool StopTrain(float time);

  //! Deletes this train, and in effect, stop the schedule.  
  //
  // Note:
  //     There is no point in putting any more schedule commands after a delete.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool DeleteTrain();

  //! Post a message of the specified type from <i srcId> to <i dstId>.
  //
  // This method takes the same parameters as Router::PostMessage().  It will post the message and
  // then continue the schedule.
  //
  // Param:  srcId  Node ID of source object.  Use <l GameObject::GetId  GetId>() on the object
  //                to get its node ID.
  // Param:  dstId  Node ID of destination object.
  // Param:  major  Message major type.
  // Param:  minor  Message minor type.
  // Param:  time   Amount of time to delay in seconds before sending the message.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public obsolete bool PostMessage(int srcId, int dstId, string major, string minor, float time);

  //! Call <l Timetable::Announce  Announce>() on the static Timetable object.  The train will then continue the schedule.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  // See Also:
  //     Timetable::Announce()
  //
  public obsolete bool Announce(string state);

  //! Wait for the named announcement from the static Timetable object.
  //
  // Param:  state  Timetable state to wait on an announcement from.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  // See Also:
  //     Timetable::OnAnnouncement()
  //
  public obsolete bool OnAnnounce(string state);

  //! Set the signal state for the given named signal object.
  //
  // Param:  signal  ID of signal object to set the state of.
  // Param:  state   State to set the signal to.
  // Param:  reason  Reason for signal state (mouse-over text appears).
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool SetSignal(GameObjectID signal, int state, string reason);

  // Obsolete, use GameObjectID variant above
  public obsolete bool SetSignal(string signal, int state, string reason);

  //! Reset the static timetable class.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  // See Also:
  //     Timetable::Reset()
  //
  public bool ResetTimetable();

  //! Adds a custom command to the schedule.
  //
  // Param:  custom  Custom command to call CustomCommand::Execute() on.
  // Param:  px      Argument to pass on to <l CustomCommand::Execute  Execute>()'s <i px> parameter.
  // Param:  py      Argument to pass on to <l CustomCommand::Execute  Execute>()'s <i py> parameter.
  // Param:  pz      Argument to pass on to <l CustomCommand::Execute  Execute>()'s <i pz> parameter.
  //
  // Returns:
  //     Return true if the command was successfully added to the schedule, false otherwise.
  //
  public bool Custom(CustomCommand custom, int px, int py, int pz);

  //! Adds a custom command to the schedule.
  //
  // Param:  custom  Custom command to call <l CustomCommand::Execute  Execute>() on.
  //
  // Returns:
  //     Return true if the command was successfully added to the schedule, false otherwise.
  //
  public bool Custom(CustomCommand custom);

  //! Resets the schedule such that it has no commands and is now empty.
  public void Reset();




  //! \name   Command Types
  //  \anchor cmdTypes
  //@{
  //! Types of commands that can be used in a schedule.
  //
  // See Also:
  //     Command::command
  //

  public define int CMD_TAKE_JUNCTION           = 1;   //!< %Command type for TakeJunction().
  public define int CMD_COMPLETE_JUNCTIONS      = 2;   //!< %Command type for CompleteJunctions().
  public define int CMD_STOP_AT_TRIGGER         = 3;   //!< %Command type for StopAtTrigger().
  public define int CMD_ON_TRIGGER              = 4;   //!< %Command type for OnTrigger().
  public define int CMD_REVERSE_TRAIN           = 5;   //!< %Command type for ReverseTrain().
  public define int CMD_STOP_TRAIN              = 6;   //!< %Command type for StopTrain().
  public define int CMD_DELETE_TRAIN            = 7;   //!< %Command type for DeleteTrain().
  public obsolete define int CMD_POST_MESSAGE            = 8;   //!< %Command type for PostMessage().
  public obsolete define int CMD_ANNOUNCE                = 9;   //!< %Command type for Announce().
  public obsolete define int CMD_ON_ANNOUNCEMENT         = 10;  //!< %Command type for OnAnnouncement().
  public define int CMD_SET_SIGNAL              = 11;  //!< %Command type for SetSignal().
  public define int CMD_RESET_TIMETABLE         = 12;  //!< %Command type for ResetTimetable().
  public define int CMD_CUSTOM                  = 13;  //!< %Command type for Custom().
  public define int CMD_STOP_AT_SCENERY         = 14;  //!< %Command type for StopAtScenery().
  public define int CMD_DRIVE_FOREVER           = 15;  //!< %Command type for DriveForever().
  public define int CMD_TAKE_TRACK_PERMIT       = 16;  //!< %Command type for TakeTrackPermit().
  public define int CMD_COUPLE_VEHICLE          = 17;  //!< %Command type for CoupleVehicle().
  public define int CMD_STOP_AT_TRACKMARK       = 18;  //!< %Command type for StopAtTrackMark().
  public define int CMD_DRIVE_THROUGH_TRACKMARK = 19;  //!< %Command type for DriveThroughTrackMark().

  //@}


  //! Array of commands that make up this schedule.
  public Command[] commands = new Command[0];

  //! Flag that when set, ensures permits used during this schedule are released.
  //
  // Note:
  //     Setting this variable to false can <b significantly> improve the schedule behavior.
  //     It's not really advisable for this value to be true unless absolutely necessary.
  //
  // See Also:
  //     Permit::Release()
  //
  public bool releasePermitsWhenComplete = true;

  //! Flag that indicates if the Train is currently handling a SPAD (Signal Passed at Red).
  public bool signalPassedAtDanger = false;

  //! Driver character to notify if this schedule is stalled for long periods.
  public DriverCharacter notifyDriver;

  //! Flag to enable/disable coupling on the train this schedule is running on.
  public bool allowCoupling = false;

  //! Train to limit coupling to.
  public Train limitCouplingTo;



  public bool TakeTrackPermit(Track track)
  {
    if (!track)
    {
      Interface.Log("Schedule.TakeTrackPermit> null track");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_TAKE_TRACK_PERMIT;
    cmd.objID = track.GetGameObjectID();
    cmd.obj = track;

    commands[commands.size()] = cmd;
    return true;
  }


  //! Drives the train to couple up with the given target vehicle.
  //
  // This command does not drive the train to the vehicle, it is assumed the <i vehicle> is
  // located nearby and no junctions need to be navigated through.  It will only succeed if the
  // target <i vehicle> is not running a schedule and isn't moving.  As well as that, both the
  // train the schedule is running on and <i vehicle> must permit coupling.
  //
  // Param:  vehicle  Target vehicle to couple up with.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool CoupleVehicle(Vehicle vehicle)
  {
    if (!vehicle)
    {
      Interface.Log("Schedule.CoupleVehicle> null vehicle");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_COUPLE_VEHICLE;
    cmd.objID = vehicle.GetGameObjectID();
    cmd.obj = vehicle;

    commands[commands.size()] = cmd;
    return true;
  }


  //! Place the train in autopilot mode through the given junction.
  //
  // When the train reaches the given junction, it will wait until it is permitted on the track on
  // the other side of the junction in the given direction.  Once the train is permitted on the 
  // track, it will request permission for the junction.  This is when the next command in the 
  // schedule will be executed.
  //
  // Note:
  //     When using this method, you <bi MUST> specify <bi EVERY> junction the train will encounter
  //     along your desired route.  <bi THIS IS IMPORTANT!!!>
  //
  // Note:
  //     This method is for all junctions derived from JunctionBase, not just Trackside-derived 
  //     junctions based on the Junction class.
  //
  // Param:  junction   %Junction to take the train through.
  // Param:  direction  %Junction direction to take.  Use one of the \ref  juncStates "Junction States"
  //                    from the JunctionBase class for this parameter.
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule. false otherwise.
  //
  public bool TakeJunction(JunctionBase junction, int direction)
  {
    if (!junction)
    {
      Interface.Log("Schedule.TakeJunction> Bad parameter");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_TAKE_JUNCTION;
    cmd.obj = junction;
    cmd.ca = direction;
    cmd.cb = -1;

    Junction tsideJunction = cast<Junction>(junction);
    if (tsideJunction)
    {
      // Object is a simple trackside junction
      cmd.obj = tsideJunction;
      cmd.objID = tsideJunction.GetGameObjectID();
    }
    else
    {
      SceneryWithTrack swt = cast<SceneryWithTrack>(junction.GetMapObject());
      if (swt)
      {
        // Junction belongs to a SceneryWithTrack, find the index
        JunctionBase[] swtJunctions = swt.GetAttachedJunctions();
        int i;
        for (i = 0; i < swtJunctions.size(); ++i)
        {
          if (swtJunctions[i] == junction)
          {
            cmd.obj = swtJunctions[i];
            cmd.objID = swt.GetGameObjectID();
            cmd.cb = i;
            break;
          }
        }
      }
    }


    commands[commands.size()] = cmd;
    return true;
  }


  public obsolete bool TakeJunction(string junctionName, int direction)
  {
    Junction junction = cast<Junction>(Router.GetGameObject(junctionName));
    return TakeJunction(junction, direction);
  }


  public bool CompleteJunctions()
  {
    Command cmd = new Command();
    cmd.command = CMD_COMPLETE_JUNCTIONS;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool StopAtTrigger(Trigger trigger, float time)
  {
    if (!trigger)
    {
      Interface.Log("Schedule.StopAtTrigger> Bad parameter");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_STOP_AT_TRIGGER;
    cmd.cd = time;
    cmd.objID = trigger.GetGameObjectID();
    cmd.obj = trigger;

    commands[commands.size()] = cmd;
    return true;
  }


  public obsolete bool StopAtTrigger(string triggerName, float time)
  {
    Trigger trigger = cast<Trigger>(Router.GetGameObject(triggerName));
    return StopAtTrigger(trigger, time);
  }


  public bool OnTrigger(Trigger trigger, bool enter)
  {
    if (!trigger)
    {
      Interface.Log("Schedule.OnTrigger> Bad parameter");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_ON_TRIGGER;
    cmd.objID = trigger.GetGameObjectID();
    cmd.obj = trigger;
    cmd.ca = (int)enter;

    commands[commands.size()] = cmd;
    return true;
  }


  public obsolete bool OnTrigger(string triggerName, bool enter)
  {
    Trigger trigger = cast<Trigger>(Router.GetGameObject(triggerName));
    return OnTrigger(trigger, enter);
  }


  //! Stops the train at the named scenery object.
  //
  // Param:  sceneryName   Name of the scenery object to drive to.  Must be a Buildable object (or
  //                       any type that inherits from Buildable such as Industry).
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool StopAtScenery(Buildable scenery)
  {
    if (!scenery)
    {
      Interface.Log("Schedule.StopAtScenery> Bad parameter");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_STOP_AT_SCENERY;
    cmd.objID = scenery.GetGameObjectID();
    cmd.obj = scenery;

    commands[commands.size()] = cmd;
    return false;
  }


  public obsolete bool StopAtScenery(string sceneryName)
  {
    Buildable scenery = cast<Buildable>(Router.GetGameObject(sceneryName));
    return StopAtScenery(scenery);
  }


  //! Stops the train at the specified trackside object.
  //
  // Param:  trackMark  Name of the scenery object to drive to.  Must be a Buildable object (or
  //                    any type that inherits from Buildable such as Industry).
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool StopAtTrackMark(TrackMark trackMark)
  {
    if (!trackMark)
    {
      Interface.Log("Schedule.StopAtTrackMark> Bad parameter");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_STOP_AT_TRACKMARK;
    cmd.objID = trackMark.GetGameObjectID();
    cmd.obj = trackMark;

    commands[commands.size()] = cmd;
    return true;
  }


  //! Stops the train at the specified trackside object.
  //
  // Param:  trackMark  Name of the scenery object to drive to.  Must be a Buildable object (or
  //                    any type that inherits from Buildable such as Industry).
  //
  // Returns:
  //     Returns true if the command was successfully added to the schedule, false otherwise.
  //
  public bool DriveThroughTrackMark(TrackMark trackMark)
  {
    if (!trackMark)
    {
      Interface.Log("Schedule.DriveThroughTrackMark> Bad parameter");
      return false;
    }

    Command cmd = new Command();
    cmd.command = CMD_DRIVE_THROUGH_TRACKMARK;
    cmd.objID = trackMark.GetGameObjectID();
    cmd.obj = trackMark;

    commands[commands.size()] = cmd;
    return true;
  }


  //! Adds a command to the schedule telling the train to keep driving forever.
  //
  // Returns:
  //     Always returns true.
  //
  public bool DriveForever(void)
  {
    Command cmd = new Command();
    cmd.command = CMD_DRIVE_FOREVER;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool ReverseTrain(bool force)
  {
    Command cmd = new Command();
    cmd.command = CMD_REVERSE_TRAIN;
    if (force)
      cmd.ca = 1;
    else
      cmd.ca = 0;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool ReverseTrain(void)
  {
    return ReverseTrain(false);
  }



  public bool StopTrain(float time)
  {
    Command cmd = new Command();
    cmd.command = CMD_STOP_TRAIN;
    cmd.cd = time;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool DeleteTrain()
  {
    Command cmd = new Command();
    cmd.command = CMD_DELETE_TRAIN;

    commands[commands.size()] = cmd;
    return true;
  }


  public obsolete bool PostMessage(int srcId, int dstId, string major, string minor, float time)
  {
    Command cmd = new Command();
    cmd.command = CMD_POST_MESSAGE;
    cmd.cd = time;
    cmd.ca = srcId;
    cmd.cb = dstId;
    cmd.major = major;
    cmd.minor = minor;

    commands[commands.size()] = cmd;
    return true;
  }


  public obsolete bool Announce(string state)
  {
    Command cmd = new Command();
    cmd.command = CMD_ANNOUNCE;
    cmd.minor = state;

    commands[commands.size()] = cmd;
    return true;
  }


  public obsolete bool OnAnnounce(string state)
  {
    Command cmd = new Command();
    cmd.command = CMD_ON_ANNOUNCEMENT;
    cmd.minor = state;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool SetSignal(GameObjectID signal, int state, string reason)
  {
    Command cmd = new Command();
    cmd.command = CMD_SET_SIGNAL;
    cmd.objID = signal;
    // Use the minor string to store the reason text. No message will be posted.
    cmd.minor = reason;
    cmd.ca = state;

    commands[commands.size()] = cmd;
    return true;
  }

  public obsolete bool SetSignal(string signalName, int state, string reason)
  {
    // This will fail if the object is not currently loaded
    Signal signal = cast<Signal>(Router.GetGameObject(signalName));
    if (!signal)
    {
      Interface.Exception("Schedule.SetSignal> Signal not found: " + signalName);
      return false;
    }

    return SetSignal(signal.GetGameObjectID(), state, reason);
  }


  public bool ResetTimetable()
  {
    Command cmd = new Command();
    cmd.command = CMD_RESET_TIMETABLE;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool Custom(CustomCommand custom, int px, int py, int pz)
  {
    Command cmd = new Command();
    cmd.command = CMD_CUSTOM;
    cmd.ca = px;
    cmd.cb = py;
    cmd.cc = pz;
    cmd.custom = custom;

    commands[commands.size()] = cmd;
    return true;
  }


  public bool Custom(CustomCommand custom)
  {
    Command cmd = new Command();
    cmd.command = CMD_CUSTOM;
    cmd.custom = custom;

    commands[commands.size()] = cmd;
    return true;
  }


  public void Reset()
  {
    commands = new Command[0];
  }
};

