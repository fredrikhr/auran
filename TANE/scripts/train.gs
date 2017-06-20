//
// train.gs
//
//  Copyright (C) 2002-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "vehicle.gs"
include "trackmark.gs"
include "locomotive.gs"
include "gs.gs"
include "permit.gs"
include "schedule.gs"
include "JunctionBase.gs"
include "Junction.gs"
include "interface.gs"
include "world.gs"
include "signal.gs"
include "TrainTimetable.gs"



//=============================================================================
// Name: JunctionPermitInfo
// Desc: This class is used privately and internally by Train and is not a
//       %Trainz API class intended for general use.
//
// WARN: THIS CLASS IS NOT TO BE USED OR RELIED ON
//=============================================================================
final class JunctionPermitInfo
{
  // PRIVATE IMPLEMENTATION. DO NOT USE OR RELY ON THESE MEMBERS.
  public JunctionBase junction;
  public int          direction;
  public bool         otherSide;
  public Permit       trackPermit;
  public bool         inStuckThread = false;
};


//=============================================================================
// Name: AITrainScope
// Desc: This class is used privately and internally by Train and is not a
//       %Trainz API class intended for general use.
//
// WARN: THIS CLASS IS NOT TO BE USED OR RELIED ON
//=============================================================================
final class AITrainScope
{
  // PRIVATE IMPLEMENTATION. DO NOT USE OR RELY ON THESE MEMBERS.
  public bool aiTrainIsStuck  = false;
  public int  trainScopeIndex = 0;
};


//=============================================================================
// Name: ScheduleHistoryRec
// Desc: This class is used privately and internally by Train and is not a
//       %Trainz API class intended for general use.
//
// WARN: THIS CLASS IS NOT TO BE USED OR RELIED ON
//=============================================================================
final class ScheduleHistoryRec
{
  // PRIVATE IMPLEMENTATION. DO NOT USE OR RELY ON THESE MEMBERS.
  public int    state;
  public string localisedName;
};



//! A train is a collection of vehicles in Driver.
//
// They are one entity and may be controlled using this class.  A train is placed on a track by
// using World::CreateTrain() or World1::CreateTrain().
//
// %Trainz will automatically create a Train object for each consist that appears in the game such
// as when an existing train is uncoupled and split up into two separate consists.
//
// See Also:
//     DriverCharacter, GameObject, Locomotive, Schedule, Track, TrackMark, TrainTimetable, Vehicle,
//     World, Track::RequestPermitForTrain(), Vehicle::GetMyTrain()
//
//=============================================================================
// Name: Train
// Desc: The script representation for a Train/Consist in the game world.
//       Trainz will automatically create Train instances for any set of
//       coupled traincars/vehicles in the world (including single instances).
//
// Messages posted by Vehicle:
//  [ Major       | Minor                         | Source    | Destination   ]
//  [=========================================================================]
//  [ "Train"     | "Over speed limit"            | train     | train         ]
//  [ "Train"     | "Under speed limit"           | train     | train         ]
//  [ "Train"     | "Over advisory speed limit"   | train     | train         ]
//  [ "Train"     | "Under advisory speed limit"  | train     | train         ]
//  [ "Train"     | "Over floating speed limit"   | train     | train         ]
//  [ "Train"     | "Under floating speed limit"  | train     | train         ]
//  [ "Train"     | "StoppedMoving"               | train     | train         ]
//  [ "Train"     | "StartedMoving"               | train     | train         ]
//  [ "Train"     | "NotifyHorn"                  | train     | train         ]
//  [ "Train"     | "NotifyBell"                  | train     | train         ]
//  [ "Train"     | "NotifySanding"               | train     | train         ]
//  [ "Train"     | "NotifyPantographs"           | train     | train         ]
//  [ "Train"     | "Entered red signal"          | signal    | train         ]
//  [ "Train"     | "Entered Signal"              | signal    | train         ]
//  [ "Train"     | "EnterTrack"                  | track     | train         ]
//  [ "Train"     | "InnerEnterTrack"             | track     | train         ]
//  [ "Train"     | "InnerLeaveTrack"             | track     | train         ]
//  [ "Train"     | "LeaveTrack"                  | track     | train         ]
//  [ "Train"     | "SlowingForTarget"            | train     | train         ]
//  [ "Train"     | "Cleanup"                     | train     | train         ]
//  [ "Schedule"  | "Complete"                    | train     | broadcast     ]
//  [ "Schedule"  | "Abort"                       | train     | train         ]
//  [ "Schedule"  | "Touch"                       | train     | train         ]}
//  [ "Schedule"  | "Blocked"                     | train     | blocking object owner ]}
//
// Legacy messages, which will be phased out and should not be used:
//  [ "Train"     | "Over speed limit"            | train     | broadcast     ]
//  [ "Train"     | "Under speed limit"           | train     | broadcast     ]
//  [ "Train"     | "Over advisory speed limit"   | train     | broadcast     ]
//  [ "Train"     | "Under advisory speed limit"  | train     | broadcast     ]
//  [ "Train"     | "Over floating speed limit"   | train     | broadcast     ]
//  [ "Train"     | "Under floating speed limit"  | train     | broadcast     ]
//  [ "Train"     | "Entered red signal notify"   | train     | broadcast     ]
//  [ "Train"     | "Passed Signal"               | train     | broadcast     ]
//
//=============================================================================
final game class Train isclass GameObject
{

  //=============================================================================
  // Name: CONTROL_*
  // Desc: Values that specify the modes of control a train can be in
  //  See: GetAutopilotMode(), GetAllowsUserControl(), SetAutopilotMode
  //=============================================================================
  public define int CONTROL_MANUAL = 1;      // User controls train, script can change settings.
  public define int CONTROL_AUTOPILOT = 2;   // Autopilot controls train
  public define int CONTROL_AUTOMANUAL = 3;  // User controls train, autopilot takes over when train is not currently 'focused'.
  public define int CONTROL_SCRIPT = 4;      // Only the script can control train.


  //=============================================================================
  // Name: PHYSICS_*
  // Desc: DEPRECATED
  //       SetPhysicsMode() never worked and isn't supported, these constants are
  //       therefore redundant and should be avoidied
  //=============================================================================
  public define int PHYSICS_DCC = 1;          // DCC physics.
  public define int PHYSICS_SIMULATION = 2;   // Simulation physics.


  //=============================================================================
  // Name: TRACTION_*
  // Desc: Traction modes that a train's reverser lever can be in
  //  See: SetReverser(), GetReverser(), Turnaround()
  //=============================================================================
  public define int TRACTION_FORWARD = 2;     // Reverser is in currently forward.
  public define int TRACTION_NEUTRAL = 1;     // Reverser is neutral.
  public define int TRACTION_REVERSE = 0;     // Reverser is currently in reverse.


  //=============================================================================
  // Name: TRAIN_BRAKE_*
  // Desc: Specifies the state of the train brakes
  //  See: SetTrainBrakes(), GetTrainBrakes()
  //=============================================================================
  public define float TRAIN_BRAKE_RELEASE = 0.0;      // Train brakes are released.
  public define float TRAIN_BRAKE_INITIAL = 1.0;      // Train brakes are in initial mode.
  public define float TRAIN_BRAKE_APPLICATION = 2.0;  // Train brakes are applied.
  public define float TRAIN_BRAKE_HANDLE_OFF = 3.0;   // Train brake handle is off.
  public define float TRAIN_BRAKE_EMERGENCY = 4.0;    // Train brakes are in emergency stop position.
  public define float TRAIN_BRAKE_LAP = 5.0;          // Train brakes are in the lap position. Not available on all trains.


  //=============================================================================
  // Name: DYNAMIC_BRAKE_*
  // Desc: States the dynamic brakes of a train can be in
  //  See: SetDynamicBrakeMode()
  //=============================================================================
  public define int DYNAMIC_BRAKE_TRACTION = 0;  // Dynamic brakes in traction mode.
  public define int DYNAMIC_BRAKE_NEUTRAL = 1;   // Dynamic brakes are neutral.
  public define int DYNAMIC_BRAKE_BRAKE = 2;     // Dynamic brakes are on.


  //=============================================================================
  // Name: RESULT_
  // Desc: Results codes for Train.GetTrackmarkDirection()
  //  See: GetTrackmarkDirection()
  //=============================================================================
  public define int RESULT_NONE = 0;          // Item not found.
  public define int RESULT_FORWARD = 1;       // Item is in front of the train.
  public define int RESULT_INSIDE = 2;        // Item is in the train (i.e. on track the train is on, not literally inside the train).
  public define int RESULT_BACKWARD = 3;      // Item is behind the train.


  //=============================================================================
  // Name: TAILLIGHT_STATE_*
  // Desc: Defines for the various tail-light states. When set to auto the lights
  //       will be switched on if the train has a driver character assigned to it
  //  See: IsTailLightLit(), SetTailLightState
  //=============================================================================
  public define int TAILLIGHT_STATE_AUTO = 0;  // Lights are controlled by native
  public define int TAILLIGHT_STATE_ON   = 1;  // Lights are on
  public define int TAILLIGHT_STATE_OFF  = 2;  // Lights are off


  //=============================================================================
  // Name: CLASSIFICATION_*
  // Desc: The possible train classification signal states.
  //  See: GetClassificationSignal(), SetClassificationSignal()
  //=============================================================================
  public define int CLASSIFICATION_TIMETABLED = 0;  // Timetabled, no classification signal
  public define int CLASSIFICATION_EXTRA = 1;       // Extra train (white)
  public define int CLASSIFICATION_FOLLOWING = 2;   // Has following section (green)

  //=============================================================================
  // Name: PANTOGRAPHS_*
  // Desc: The possible train pantograph states
  //  See: GetPantographState(), SetPantographState()
  //=============================================================================
  public define int PANTOGRAPHS_DOWN = 0;
  public define int PANTOGRAPHS_UP_FRONT = 1;
  public define int PANTOGRAPHS_UP_BACK = 2;
  public define int PANTOGRAPHS_UP_BOTH = 3;


  //=============================================================================
  // Desc: Measurement conversion multiplier values
  //=============================================================================
  public define float KPH_TO_MPS = 0.278;     // KPH (kilometres per hour) to MPS (meters per second)
  public define float MPH_TO_MPS = 0.447;     // MPH (miles per hour) to MPS (meters per second)
  public define float MPH_TO_KPH = 1.609;     // MPH (miles per hour) to KPG (kilometres per hour)



  bool expandSchedule = false;


  // ============================================================================
  // Name: GetVehicles
  // Desc: Gets the list of vehicles which currently comprise this train. Index 0
  //       of the returned vehicles array is always the frontmost vehicle of the
  //       train, which is dependent on the train's logical forward direction.
  //       The forward direction of the train can be changed during play and may
  //       not necessarily correspond to the train's visual appearance or
  //       movement direction.
  // Retn: Vehicle[] - An array of vehicles that comprise this train.
  // ============================================================================
  public native Vehicle[] GetVehicles(void);
  

  // ============================================================================
  // Name: GetFrontmostLocomotiveVehicle
  // Desc: Returns the frontmost vehicle which is of type 'Locomotive'.
  // ============================================================================
  public native Locomotive GetFrontmostLocomotive(void);
  

  // ============================================================================
  // Name: GetFrontmostLocomotiveVehicle
  // Desc: Returns the vehicle with the frontmost driving position in this train.
  //       This is the (logical) frontmost vehicle which has the 'full'
  //       interior-controls-type.
  // ============================================================================
  public native Vehicle GetFrontmostLocomotiveVehicle(void);


  //
  // TRAIN CONTROL
  //

  //! Sets the control mode of this train.
  //
  // Param:  controlMode  Control mode of this train.  Use one of the \ref ctrlFlags "train control mode"
  //                      constants to specify the control mode.
  //
  // See Also:
  //     \ref ctrlFlags "Train Control Modes"
  //
  public native void SetAutopilotMode(int controlMode);

  //! Gets the current control mode of this train.
  //
  // Returns:
  //     Returns the \ref ctrlFlags "control mode" this train is currently in.
  //
  // See Also:
  //     \ref ctrlFlags "Train Control Modes"
  //
  public native int GetAutopilotMode(void);

  //! Determines if this train allows the user to control it directly through DCC or %Cabin interfaces.
  //
  // Returns:
  //     Returns true if this train allows the user to control it directly, false otherwise.
  //
  public native bool GetAllowsUserControl(void);

  //! Determines if this train is owned by the local client in a multiplayer game.
  //
  // Returns:
  //     Returns true if this train is owned by the local client, false otherwise.
  //
  public native bool IsOwningClient(void);

  //! Returns the username of the owning client during a multiplayer game
  //
  public native string GetOwningClient(void);

  //! Deprecated - this method has never worked and is no longer required.
  public void SetPhysicsMode(int physicsMode) {}

  //! Deprecated as SetPhysicsMode() doesn't work, this method is no longer required.
  public native int GetPhysicsModel(void);

  //! Enable/disables physics calculations on this train.
  //
  // Note: During multiplayer games this function will only succeed on the server
  // 
  // Note:
  //     Turning physics off for scenic rolling stock that the player cannot interact with can boost 
  //     performance.  There is no point in doing physic calculations for idle rollingstock.
  //
  // Param:  enable  If true, physics calculations are enabled for this train, false to disable.
  //
  public native void EnablePhysics(bool enable);

  //! Shows/hides this train from the in-game consist menu.
  //
  // Param:  show  If true, the consist is displayed in the consist menu, false to hide it.
  //
  public native void ShowInConsistMenu(bool show);

  //! Sets the coupling mask for all of the vehicles in this consist.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  // This method can be used to only allow coupling from one end or not at all on the train.  For
  // example, you don't want the player to couple to a script controlled train.  Masked couplers
  // cannot be coupled to.
  //
  // Param:  mask  Coupling mask setting to apply to all vehicles in this consist.  Use the
  //               \ref coupFlags "coupler flags" to specify which couplers are to be masked off
  //               from being decoupled.
  //
  // See Also:
  //     \ref coupFlags "Coupling Flags", Vehicle::SetCouplingMask()
  //
  public native void SetCouplingMask(int mask);

  //! Sets the decoupling mask for all of the vehicles in this consist.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  // This is useful, for example, if you don't want the player to decouple vehicles from a script
  // controlled train.  Masked couplers cannot be decoupled.
  //
  // Param:  mask  Decoupling mask setting to apply to all vehicles in this consist.  Use the
  //               \ref coupFlags "coupler flags" to specify which couplers are to be masked off
  //               from being decoupled.
  //
  // See Also:
  //     \ref coupFlags "Coupler Flags", Vehicle::SetDecouplingMask()
  //
  public native void SetDecouplingMask(int mask);

  //! <bi BUGGY FUNCTION. OBSOLETE. DO NOT USE!>
  // 
  // As an alternative, use GetTrainVelocity() or GetSmoothedVelocity() instead.
  // This function is only retained for script backward compatibility reasons.
  // 
  public obsolete native float GetVelocity(void);

  //! Gets the current velocity of this train.
  // 
  // Provides a smoothed velocity, intended for human consumption. If you require an accurate
  // velocity readout for physics operations, use Train::GetTrainVelocity() instead.
  // 
  // Returns:
  //     Returns the current velocity of the train in meters per second.
  // 
  // See Also:
  //     Vehicle::GetTrainVelocity(), \ref measureConv "Measurement Conversion Multipliers"
  // 
  public native float GetSmoothedVelocity(void);

  //! Gets the current velocity of this train.
  // 
  // This function provides the instantaneous velocity for vehicles in this train, which is good
  // for physics calculations but not good for human-readable display.  If you want human-readable
  // display, use Train::GetSmoothedVelocity() instead.
  // 
  // Returns:
  //     Returns the current velocity of the train in meters per second.
  // 
  // See Also:
  //     Vehicle::GetSmoothedVelocity(), 	\ref measureConv "Measurement Conversion Multipliers"
  // 
  public native float GetTrainVelocity(void);

  //! Determines if this train is currently not moving and at a total stop.
  //
  // Returns:
  //     Returns true if this train is not moving, false otherwise.
  //
  public native bool IsStopped();


  //! Determines if this train has moved since the beginning of the session.
  //
  // Returns:
  //     Returns true if this train has moved, false otherwise.
  //
  public native bool HasMoved();


  //! Instantly modify the Train's velocity.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  vel  Velocity to set as the current train velocity (in meters per second.)
  //
  public native void SetVelocity(float vel);


  //! Instantly modify the Train's velocity.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  vel  Velocity to add to current train velocity (in meters per second.)
  //
  public native void AddVelocity(float vel);

  //! Obsolete, do not use.
  public obsolete void SetAdhesion(float adhesion) { Interface.WarnObsolete("Adhesion values are no longer used in Trainz EE"); }

  //! Sets the DCC throttle setting for this train when using DCC physics.
  //
  // Param:  throttle  Throttle setting for DCC.  Must be in the range of [-1.0 - 1.0] where -1.0 is
  //                   full throttle in reverse, 0,0 is stop/neutral and 1.0 is full throttle forward.
  //
  public native void SetDCCThrottle(float throttle);

  //! Gets the DCC throttle setting for this train when using DCC physics.
  //
  // Returns:
  //     Returns the current DCC throttle setting of this train.  This value will be in the range of
  //     [-1.0 - 1.0] where -1.0 is full throttle in reverse, 0.0 is stop/neutral and 1.0 is full 
  //     throttle forward.
  //
  public native float GetDCCThrottle(void);

  //! Sets the hand brake state for all non-loco vehicles in this train.
  //
  // Param:  state  State to set the handbrake of non-loco vehicles to.  If true, the hand brake is
  //                applied.  Use false to release the hand brake.
  //
  public void SetHandBrake(bool state);


  //! Causes the train to come to a gentle stop by reducing the throttle to zero over a short time interval.
  public native void StopTrainGently(void);


  //
  // SIMULATION PHYSICS
  //

  //! Sets the notch of this train's throttle.
  //
  // Param:  throttleNotch  Notch to set the throttle to that is to be in the range of [0 - 8].
  //
  public native void SetManualThrottle(int throttleNotch);

  //! Sets the state of this train's reverser lever.
  //
  // Param:  reverserDirection  State to set the reverser lever to.  Use one of the 
  //                            \ref revTract "reverser traction mode" constants to
  //                            specify the state to set the reverser lever to.
  //
  // See Also:
  //     \ref revTract "Reverser Traction Modes"
  //
  public native void SetReverser(int reverserDirection);

    //! Gets the state of this train's reverser lever.
  //
  // Return:  int  State of the reverser lever.  
  //
  // See Also:
  //     \ref revTract "Reverser Traction Modes"
  //
  public native int GetReverser();

  //! Sets the mode of this train's brakes.
  //
  // Param:  brakeMode  Mode to set the brakes of this train to.  Use one of the 
  //                    \ref trainBrakes "train brake state" constants to specify
  //                    the mode to set the brakes to.
  //
  // See Also:
  //     \ref trainBrakes "Train Brake States"
  //
  public native void SetTrainBrakes(float brakeMode);

  //! Gets the current state of this train's brakes.
  //
  // Returns:
  //     Returns one of the \ref trainBrakes "train brake state" constants to indicate the current
  //     state of this train's brakes.
  //
  // See Also:
  //     \ref trainBrakes "Train Brake States"
  //
  public native float GetTrainBrakes(void);


  //! Sets the mode of this train's dynamic brakes.
  //
  // Param:  dynamicBrakeMode  Mode to set the dynamic brakes of this train to.  Use one of the
  //                           \ref dynamicBrakes "dynamic brake state" constants to specify the
  //                           mode to set the dynamic brakes to.
  //
  // See Also:
  //     \ref dynamicBrakes "Dynamic Brake States"
  //
  public native void SetDynamicBrakeMode(int dynamicBrakeMode);



  //=============================================================================
  // Name: GetHeadlightState
  // Desc: Gets the on/off state of the headlights in this train
  // Note: Only the frontmost locomotive will actually display a lit headlight
  // Parm: lightsOn - true the headlights are on, false if they're off
  //=============================================================================
  public native bool GetHeadlightState(void);

  //=============================================================================
  // Name: SetHeadlightState
  // Desc: Switch the headlights of this train on or off
  // Parm: lightsOn - true to switch on the headlights, false to switch them off
  // Note: Only the frontmost locomotive will actually display a lit headlight
  //=============================================================================
  public native void SetHeadlightState(bool lightsOn);


  //=============================================================================
  // Name: HasLights
  // Desc: Returns whether any vehicle in this train has lights
  //=============================================================================
  public native bool HasLights();


  //=============================================================================
  // Name: GetHighbeamState
  // Desc: Returns whether the headlight is set to high beam
  // Note: This being true is not an indication of whether the headlight is
  //       actually on, see GetHeadlightState() for that
  //=============================================================================
  public native bool GetHighbeamState(void);

  //=============================================================================
  // Name: SetHighbeamState
  // Desc: Set whether the trains headlight is in 'high beam' mode
  // Parm: highBeam - true to active high/full beam, false for low/dip beam
  // Note: This will not actually set whether the headlight is on/off, see
  //       SetHeadlightState() for that
  //=============================================================================
  public native void SetHighbeamState(bool highBeam);


  //=============================================================================
  // Name: IsTailLightLit
  // Desc: Returns whether this trains tail-lights are list. This function may
  //       return true even if no tail-light is actually displayed (e.g. if the
  //       rearward facing end of the rearmost traincar has no tail-light).
  //=============================================================================
  public native bool IsTailLightLit(void);

  //=============================================================================
  // Name: SetTailLightState
  // Desc: Sets this trains tail-lights state. The entire train is considered to
  //       have its tail-lights on/off, but only the rearward facing end of the
  //       rearmost traincar will actually display its lights as lit (if it has
  //       any). By default any traincar with a driver will have its tail-lights
  //       lit, but this function allows that state to be overridden.
  // Parm: tailLightsState - The new state, see TAILLIGHT_STATE_*
  // Note: During multiplayer this will only succeed on the server and owning clients
  //=============================================================================
  public native void SetTailLightState(int tailLightsState);


  //=============================================================================
  // Name: GetDitchlightState
  // Desc: Gets the state of the ditchlights in this train
  //=============================================================================
  public native bool GetDitchlightState(void);

  //=============================================================================
  // Name: SetDitchlightState
  // Desc: Sets whether the flashing train ditchlights are active
  // Note: In multiplayer this will only succeed on the server and owning clients
  //=============================================================================
  public native void SetDitchlightState(bool lightsFlashing);

  //=============================================================================
  // Name: HasDitchlight
  // Desc: Returns whether any vehicle in this train has ditchlights
  //=============================================================================
  public native bool HasDitchlight();


  //=============================================================================
  // Name: SetInteriorLightState
  // Desc: Sets the interior lights on/off for every vehicle in this train. See
  //       also: Vehicle.SetInteriorLightState(), Vehicle.GetInteriorLightState()
  // Note: In multiplayer this will only succeed on the server and owning clients
  //=============================================================================
  public native void SetInteriorLightState(bool interiorLightsOn);


  //=============================================================================
  // Name: GetPantographState
  // Desc: Gets the state of the pantographs of any electric locos in this train
  // Retn: One of the PANTOGRAPHS_* defines, indicating state
  //=============================================================================
  public native int GetPantographState(void);

  //=============================================================================
  // Name: SetPantographState
  // Desc: Sets the state of the pantographs of any electric locos in this train
  // Parm: state - One of the PANTOGRAPHS_* defines, indicating the new state
  //=============================================================================
  public native void SetPantographState(int state);

  //=============================================================================
  // Name: HasPantographs
  // Desc: Returns whether any vehicle in this train has pantographs
  //=============================================================================
  public native bool HasPantographs();


  //=============================================================================
  // Name: SoundHorn
  // Desc: Blows the horn (or whistle) for all locomotives in this train
  //=============================================================================
  public native void SoundHorn(void);

  //=============================================================================
  // Name: HasHorn
  // Desc: Returns true if any vehicle in this train has a horn/whistle
  //=============================================================================
  public native bool HasHorn();


  //=============================================================================
  // Name: GetBellState
  // Desc: Gets the state of the bell for this train
  // Retn: Returns true if the bell is ringing, false otherwise
  //=============================================================================
  public native bool GetBellState(void);

  //=============================================================================
  // Name: SetBellState
  // Desc: Sets the state of the bell for this train, activating sounds and
  //       effects as appropriate
  // Parm: bellOn - true to ring bell, or false to silence bell
  //=============================================================================
  public native void SetBellState(bool bellOn);

  //=============================================================================
  // Name: HasBell
  // Desc: Returns true if any vehicle in this train has a bell sound
  //=============================================================================
  public native bool HasBell();


  //=============================================================================
  // Name: GetClassificationSignal
  // Desc: Returns the classification signal set for this train. This function
  //       return value may not match the actual display state if classification
  //       signal support is not fully provided by the lead traincar.
  // Retn: int - One of the Train.CLASSIFICATION_* defines
  //=============================================================================
  public native int GetClassificationSignal();

  //=============================================================================
  // Name: SetClassificationSignal
  // Desc: Sets the displayed classification signal for this train. Display
  //       changes will take effect immediately.
  // Parm: newClassification - The new classification for the train, must be one
  //       of the Train.CLASSIFICATION_* defines.
  //=============================================================================
  public native void SetClassificationSignal(int newClassification);


  //! Sets the bail control as depressed for a short period.
  public native void SetBail(void);


  //! Gets all of the various objects on a length of track that is either in front of or behind this train.
  //
  // This method determines the length of track to search by using the given direction and length
  // provided through the arguments.  All industry and trackside objects along that length of track
  // will be returned in an array.
  //
  // Param:  dir       Direction to search in.  Use true to search forward or false to search
  //                   backward.  Note that the train's direction is virtual and may not necessarily
  //                   match what the 3D train vehicles may indicate.
  // Param:  distance  Distance down the track in the direction specified by <i dir> to search.  If
  //                   <i dir> is false indicating to search backwards from the train, the length of
  //                   the train will be added to this value.
  //
  // Returns:
  //     Returns an array of objects found along the stretch of track defined by the arguments, an
  //     empty array otherwise.
  //
  public native MapObject[] TrackSearch(bool dir, float distance);


  //
  // POSITIONING
  //

  //! Purposely derails this train.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  public native void Derail(void);

  //! Reverse the conceptual direction of this train (i.e. forward becomes backwards and backwards becomes forward).
  //
  // Note:
  //     The 3D vehicle objects do not turnaround, just the concept of forward so the 
  //     throttle and reverser are affected.
  //
  public native void Turnaround(void);


  //
  // SPEED LIMITS
  //

  //! Set the speed limit for a script controlled train.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  // Param:  speed  Advisory speed limit in m/s.  Use 0 for no speed limit.
  //
  // See Also:
  //     \ref measureConv "Measurement Conversion Multipliers"
  //
  public native void SetAdvisoryLimit(float speed);

  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  public native void SetAdvisoryLimit2(float speed);

  //! Sets the floating speed limit level above the sign posted limit.
  //
  // The floating limit is an amount of tolerance above the current speed limit.  Messages for
  // floating speed violations are not to be confused with regular speed limit messages.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Note:
  //     The floating limit is monitored by the Scenario::Monitor() thread, and may be used for
  //     point deduction when speeding.  It should therefore be reserved for player trains.
  //
  // Param:  delta   Float level difference from the posted limit in MPS (meters per second).
  // Param:  enable  Enable/disable the floating limit messages.  Use true to enable, false by 
  //                 default.
  //
  // See Also:
  //     \ref measureConv "Measurement Conversion Multipliers"
  //
  public native void SetFloatingLimit(float delta, bool enable);

  //! Gets the current sign posted speed limit.
  //
  // Note:
  //     The speed limit is dependent on the trackside signs placed in Surveyor as well as the
  //     direction of the train.  A default value applies to track that isn't sign posted.
  //
  // Returns:
  //     Returns the current speed limit for the track this train is travelling on.
  //
  public native float GetSpeedLimit(void);      

  //! Gets the current script-set advisory speed limit.
  //
  // Returns:
  //     Returns the current script set advisory limit.
  //
  public native float GetAdvisoryLimit(void);

  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  public native void MarkAdvisoryLimit(void);    

  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  public native void RevertAdvisoryLimit(void);

  public native float GetAdvisoryLimit2(void);


  // ============================================================================
  // Name: SetTrainLimitMonitorLinear
  // Desc: Sets a limit monitor on this train which observes for various possible
  //       threshold conditions, and sends a <majorType>, 'over-limit' message
  //       when any threshold is exceeded, and a <majorType>, 'under-limit' 
  //       message when the threshold is no longer exceeded. No tolerance is
  //       permitted for exceeding the limit, however a small tolerance may be
  //       allowed (either temporal or actual) for returning back under the
  //       limit.
  // Parm: monitor - The object to receive the limit messages.
  // Parm: majorType - The major type of the limit messages.
  // Parm: speedLimit - The speed limit threshold, or zero. (m/s)
  // Parm: forwardAccelerationLimit - The forward acceleration threshold, or 
  //       zero. (m/s/s)
  // Parm: sidewaysAccelerationLimit - The sideways acceleration threshold, or 
  //       zero. (m/s/s)
  // Parm: jerkLimit - The undirectional jerk threshold, or zero. (m/s/s/s)
  // ============================================================================
  public native void SetTrainLimitMonitorLinear(GameObject monitor, string majorType, float speedLimit, float forwardAccelerationLimit, float sidewaysAccelerationLimit, float jerkLimit);


  // ============================================================================
  // Name: ClearTrainLimitMonitor
  // Desc: Clears the specified limit monitor from this train.
  // Parm: monitor - The object which was receiving the limit messages.
  // Parm: optionalMajorType - The major type to be removed, or empty for all.
  // ============================================================================
  public native void ClearTrainLimitMonitor(GameObject monitor, string optionalMajorType);





  //! Gets the direction of the given track mark relative to this train.
  //
  // Param:  mark  %Track mark to get the direction of relative to this train.
  //
  // Returns:
  //     Returns the \ref foundRes "direction" of the track mark relative to this train.
  //
  // See Also:
  //     \ref foundRes "Found Results"
  //
  public native int GetTrackmarkDirection(TrackMark mark);

  //! Called by %Trainz to initialize this train.
  //
  // Note:
  //    Feel free to override, but <bi ALWAYS> call through to the base method.  Use the
  //    <l gscLangKeyInherit  inherited> keyword to explicitly invoke an overridden method in a
  //    parent class.
  //
  public void Init(void);


  //! Sets the priority value of this train.
  //
  // All trains and track sections and a priority value in the range of [1 - 3] with the default
  // value being 2.  The priority value for tracks and trains is not a numerical scale of 
  // precedence, but rather a value to user for matching by the AI driver.  This means the driver
  // will try and take the train along track sections that have a priority equal to that of the
  // train.  See the Track class description for a detailed explanation of priority values.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
  //
  // Note:
  //     Changing the priority of the train won't affect the train immediately.  It will only take
  //     affect when the driver restarts a new schedule.
  //
  // Param:  priority  Priority value to assign to this train.  Must be either 1, 2 or 3.
  //
  // See Also:
  //     Track::SetTrackPriorityNumber()
  //
  public native void SetTrainPriorityNumber(int priority);

  //! Gets the priority of this train.
  //
  // Returns:
  //     Returns the priority number of this section of track.  This value will be either 1, 2 or 3.
  //     See the Track class description or SetTrainPriorityNumber() for a detailed explanation of 
  //     priority values.
  //
  // See Also:
  //     Track::GetTrackPriorityNumber()
  //
  public native int GetTrainPriorityNumber(void);


  //! Instructs this train to drive to the named scenery trigger in a Buildable object.
  //
  // Param:  obj          Destination scenery object that the autopilot is to take this train to.
  // Param:  triggerName  Name of industry trigger within the destination object to drive to.
  //
  public native void SetAutopilotTarget(Buildable obj, string triggerName);

  //! Instructs this train to drive to the given Trackside object.
  //
  // Param:  obj  Destination Trackside item for the autopilot to take this train to.
  //
  public native void SetAutopilotTarget(Trackside obj);

  //! Instructs this train to drive to the given Track segment.
  //
  // Param:  track  Destination Track segment for the autopilot to take this train to.
  //
  public native void SetAutopilotTarget(Track track);

  //! Instructs this train to drive to the given junction.
  //
  // Param:  junction  Destination junction for the autopilot to take this train to.
  //
  public native void SetAutopilotTarget(JunctionBase junction);

  //! Sets the minimum speed of the autopilot when at its target.
  //
  // Note:
  //     This method is only meant to be used with the various <b SetAutopilot*> methods of this
  //     class.  It is of no use for any other purpose.
  //
  // Param:  speed  Minimum target speed in MPS (meters per second).
  //
  public native void SetAutopilotTargetMinimumSpeed(float speed);

  //! Sets the minimum distance from a target object that the autopilots needs to slow down from.
  //
  // Param:  distance  Distance in meters from a target object the autopilot will start slowing down.
  //
  public native void SetAutopilotTargetMinimumDistance(float distance);

  //! Determines if this train's autopilot is slowing down for its target.
  //
  // Returns:
  //     Returns true if the autopilot is slowing down for its target destination, false otherwise.
  //
  public native bool GetAutopilotTargetSlowing(void);


  //! Gets the Vehicle in this consist that is experiencing the greatest level of coupling stress.
  //
  // Returns:
  //     Returns the Vehicle in this consist that is experiencing the greatest level of coupling stress.
  //
  // See Also:
  //     Vehicle::GetCouplingStress()
  //
  public native Vehicle GetMaximumCouplingStressVehicle(void);


  //
  // SCHEDULING
  //

  //! Runs a schedule on this train.
  //
  // See Schedule for information on how to build a schedule.  Only one schedule may run on a 
  // train at a time and the user cannot control the train when it is running a schedule.
  //
  // Note:
  //     This method is a thread, so the calling code does not need to wait for it to finish and
  //     return once the schedule has been completed.
  //
  // Param:  schedule  Schedule for this train to run.
  // Param:  loop      If true, the schedule will be looped and run on this train continuously.
  //                   Use false to run the schedule only once.
  // Param:  delay     Time in seconds to delay before starting to run the schedule.
  // 
  public thread void RunSchedule(Schedule schedule, bool loop, float delay);

  //! Stops running the current schedule.
  public void StopSchedule();

  //! Determines if this train is currently running on a schedule.
  //
  // Returns:
  //     Returns true if there is a schedule running on this train, false otherwise,
  //
  public bool IsScheduleRunning();

  //! Updates the schedule view window from the vehicle.
  //
  // Param:  vehicleName  Vehicle to update from.
  //
  public void UpdateScheduleWindow(string vehicleName);


  //! Gets a localised display name of this train.
  //
  // Returns:
  //     Returns the localised display name of this train.  This will be a name %Trainz has 
  //     created for the consist such as "Consist 0" for example and will match the consist
  //     label shown in the Minimap view.
  //
  public native string GetTrainDisplayName(void);

  //! Gets the active driver of this train.
  //
  // Note:
  //     Note that there may be more than one driver on a train but there is only one active driver
  //     and an individual Locomotive may only have on driver assigned to it.
  //
  // Returns:
  //     Returns the driver who is currently active in this train, null otherwise.
  //
  public native DriverCharacter GetActiveDriver(void);

  //! Returns the approximate top speed of the consist when driven in AI mode.
  //
  // Note:
  //     Does not indicate that the AI will drive at this speed, just that it is capable of doing so.
  //		 This is not a precision result, particularly when there are locos of varying speed in a consist.
  //
  // Returns:
  //     Expected consist top speed as a float, in m/s.
  //
  public native float GetAITrainMaxSpeed(void);


  // ============================================================================
  // Name: GetBrakeLightOn
  // Desc: Determine whether the brake lights for this train should show as lit.
  //       This will return an appropriate value for the train regardless of 
  //       whether vehicles in the train are capable of displaying the result.
  // Retn: bool - True if the train is braking, or false if not.
  // Note: "Train", "BrakeLightChanged" is sent when this value changes.
  // ============================================================================
  public native bool GetBrakeLightOn(void);


  void ResetAITrainScope(void);

  //@ OpenAITrainScope() is not documented yet.
  //
  public AITrainScope OpenAITrainScope(void);

  //@ CloseAITrainScope() is not documented yet.
  //
  // Just returns whatever EndAITrainStuck() does, alternate name for same thing really.
  //
  public bool CloseAITrainScope(AITrainScope scope);

  //@ EndAITrainStuck() is not documented yet.
  //
  // Param:  scope  ??
  //
  // Returns:
  //     Returns true if ??, false otherwise.
  //
  public bool EndAITrainStuck(AITrainScope scope);

  //@ BeginAITrainStuck() is not documented yet.
  //
  // Param:  scope  ??
  //
  public void BeginAITrainStuck(AITrainScope scope);


  //! Called to update the view details window when something on the loco has changed like a driver.
  public void UpdateViewDetailsLocomotive(void);


  void HandleScheduleSPAD(void);



  //
  // Train Timetable interaction
  //

  //! Determines if this train has a <l TrainTimetable  train timetable> attached to it.
  //
  // Returns:
  //     Returns true if the train has a TrainTimetable, false otherwise.
  //
  public bool HasTrainTimetable(void);

  //! Sets the specified TrainTimetable to this train.
  //
  // This train <bi MUST NOT> have an existing TrainTimetable attached to it, so make sure it is
  // clear by calling ClearTrainTimetable() before hand.
  //
  // Note:
  //     It is the responsibility of the caller to post a (<m"%TrainTimetable">, <m "Touch">) message 
  //     after calling this function.
  //
  // Param:  timetable  TrainTimetable object to assign to this train.
  //
  public void SetTrainTimetable(TrainTimetable timetable);

  //! Clears the <l TrainTimetable  train timetable> of this train.
  //
  // By clearing the TrainTimetable from this train, it is now safe again to set another 
  // TrainTimetable for this train through SetTrainTimetable().
  //
  // This method <bi MUST> only be called by the rule which called SetTrainTimetable() in the first
  // place.
  //
  // Note:
  //     It is the responsibility of the caller to post a (<m"TrainTimetable">, <m "Touch">) message
  //     after calling this function.
  //
  // Param:  rule  Rule that called SetTrainTimetable() on this train.
  //
  public void ClearTrainTimetable(ScenarioBehavior rule);

  //! Gets the TrainTimetable this train is currently running.
  //
  // Returns:
  //     Returns the TrainTimetable currently attached to this train if any, null otherwise.
  //
  public TrainTimetable GetTrainTimetable(void);


  //! Called in response to "Train", "StoppedMoving" messages
  //
  //  Retests all permits to ensure they are correctly released after a schedule is aborted
  //
  public void OnTrainStopped(Message msg);


  //! Browser window to display timetable info for this train in.
  public Browser timeTableInfo;

  string lastVehicleName;

  ScheduleHistoryRec[] scheduleHistory;

  int trainScopeIndex = 1;

  JunctionBase m_trainInternalDriveToJunction;      // used internally when driving to a junction, to prevent premature permit release.



  // \name   Schedule States
  // \anchor schedStates
  //
  // Schedule States - Not fully documented yet.
  //
  // See Also:
  //     Train::GetScheduleState()
  //
  public define int SS_NONE = 0;            //@ Blank state.  %Schedule may not be valid or exist.
  public define int SS_JUNCTION = 1;        //@ Not documented yet.
  public define int SS_JUNCTION_TRACK = 2;  //@ Not documented yet.
  public define int SS_DRIVING = 3;         //@ Not documented yet.
  public define int SS_TRACK = 4;           //@ Not documented yet.
  public define int SS_STOP = 5;            //@ Not documented yet.
  public define int SS_VEHICLE = 6;         //@ Not documented yet.
  public define int SS_TURNAROUND = 7;      //@ Not documented yet.


  // Schedule state/history accessors
  public int GetScheduleState(void);
  public obsolete GameObject GetScheduleObject(void) { return null;	}
  public obsolete void PushScheduleState(AITrainScope scope, int state, object obj);
  public void PushScheduleState(AITrainScope scope, int state, string localisedObjectName);
  public void PopScheduleState(AITrainScope scope);
  void ClearScheduleState(void);
  public string GetScheduleStateString(void);


	//! Find the junction that has stopped the autopilot from taking this train any further.
	//
	// If the autopilot is stopped because of the setting of a junction, this method will find and
	// return the junction in question.
	//
	// Returns:
	//     Returns the junction that is causing the autopilot to stop if any, null otherwise.
	//
	public native JunctionBase GetAutopilotStopJunctionBase(void);
	
	public Junction GetAutopilotStopJunction(void)
	{
	  JunctionBase base = GetAutopilotStopJunctionBase();
	  return cast<Junction> base;
	}

	//! Find the train that has stopped the autopilot from taking this train any further.
	//
	// If the autopilot has stopped the train because of another train, this method will find and
	// return the other train in question.
	//
	// Returns:
	//     Returns the other train that has caused the autopilot on this one to stop..
	//
	public native Train GetAutopilotStopTrain(void);


  //
  //
  // PRIVATE PROTOTYPES
  //
  //

  // Trainz scripters need not worry about any code beyond this point

  TrainTimetable m_trainTimetable;
  StringTable strTable;

  bool      m_scheduleRunning;      // (deprecated; TRUE if a schedule is running)
  Schedule  m_schedule;             // the schedule currently running
  int       m_scheduleIndex = 0;

  Permit[]  m_junctionPermits;      // an array of permits for junctions we are on
  bool[]    m_junctionInner;        // true if we have received an inner-enter message for the junction

  Permit[]  m_trackPermits;         // an array of permits for the bits of track we occupy;
                                    //   NO LONGER BOUND TO m_junctionPermits

  Track     lastVisitedTrack;       // the last track we were assigned to visit, if any
  Permit    lastVisitedTrackPermit; // and a copy of the permit for it


	//! Gets thge last piece of Track this train visited.
	//
	// Returns:
	//     Returns the Track statement that this train last visited.  Note that this may be <l gscLangKeyNull null>.
	//
	public Track GetLastVisitedTrack(void) { return lastVisitedTrack; }


	int ccjRecursionDepth = 0;
	Permit[] ccjCrossedJunctions;
	bool runScheduleSuccessful = false;

	int m_trainBusyCount;				// a refcount determining whether this train is currently being controlled by the scripts

	//
	// brief PermitRelease() will release any junction permits we hold when it receives a "Junction" "InnerLeave" message.
	//
	void PermitReleaser(Message msg);
	void TrackPermitReleaser(Message msg);
	void JunctionInnerEnterHandler(Message msg);

  //
  // brief ReleaseAllPermits() will release all currently held permits
  //
  void ReleaseAllPermits();

	//
	void RetestAllPermits();


	//
	void RecordJunctionPermit(Permit junctionPermit, JunctionBase junction);
	Permit MatchExistingTrackPermit(Permit newPermit);
	void RecordTrackPermit(Permit newPermit);


	bool AITrainStoppedMoving(bool force);
	bool AIJunctionEnter(JunctionBase junction);


	//! Determines if this train is busy or not.
	//
	// This method allows the busy status of this train to be queried.
	//
	// Through the IncTrainBusy() method, any piece of script code can tag a train being busy.  The train can
	// be untagged later by calling DecTrainBusy().  This busy mechanism is mainly used by industries that are
	// doing something with the train.
	//
	// A train can be tagged as being busy more than once by calling IncTrainBusy() multiple times so different
	// industries can tag the train busy.  Each time IncTrainBusy() is called, an internal busy count is 
	// incremented and if that busy count is >= 1, the train is considered busy such that this method will return
	// true if called.
	//
	// For a train to no longer be busy such that this method will return false, DecTrainBusy() will need to be
	// called the same amount of times IncTrainBusy() has been to bring the busy count down to 0.
	//
	// Returns:
	//     Returns true if this train has been tagged as being busy one or more times, false otherwise.
	//
	public bool IsTrainBusy(void);

	//! Increments this train's busy count.
	//
	// If this train is not already busy, it will become busy.
	// See IsTrainBusy() for details on the train busy count.
	//
	public void IncTrainBusy(void);

	//! Decrements this train's busy count.
	//
	// If this train is <l IsTrainBusy()  not busy>, this method will do nothing as the busy count is already 0.
	// See IsTrainBusy() for details on the train busy count.
	//
	public void DecTrainBusy(void);


  //
  // Command methods
  //
  bool CommandNavigateJunction(JunctionBase junction, int direction, bool alreadyAtJunction, bool inStuckThread);
  bool CommandNavigateTrack(Track track);
  bool CommandStopAtTrigger(Trigger trigger, float time);
  bool CommandOnAnnouncement(string state);
  bool CommandSetSignal(GameObjectID signalId, int state, string reason);
  bool CommandStopTrain(float time);
  bool CommandOnTrigger(Trigger trigger, int direction);
  bool CommandStopAtScenery(Buildable p_scenery);
  bool CommandDriveToTrackMark(TrackMark trackmark, bool stopAtTrackmark);
  bool CommandCompleteJunctions(void);
  bool CommandDriveForever();
  bool CommandCoupleVehicle(Vehicle vehicle);
  bool CommandReverseTrain(bool force);



  //=============================================================================
  // Name: GetScheduleState
  // Desc: 
  //=============================================================================
  public int GetScheduleState(void)
  {
    if (!scheduleHistory)
      return SS_NONE;

    return scheduleHistory[scheduleHistory.size() - 1].state;
  }


  //=============================================================================
  // Name: PushScheduleState
  //=============================================================================
  public obsolete void PushScheduleState(AITrainScope scope, int state, object obj)
  {
    string localisedName;
    if (obj)
    {
      JunctionBase junction = cast<JunctionBase>(obj);
      if (junction)
      {
        localisedName = junction.GetMapObject().GetLocalisedName();
      }
      else
      {
        Vehicle vehicle = cast<Vehicle>(obj);
        if (vehicle)
          localisedName = vehicle.GetLocalisedName();
      }
    }

    PushScheduleState(scope, state, localisedName);
  }


  //=============================================================================
  // Name: PushScheduleState
  // Desc: 
  //=============================================================================
  public void PushScheduleState(AITrainScope scope, int state, string localisedObjectName)
  {
    if (scope.trainScopeIndex != trainScopeIndex)
    {
      Interface.Log("Train.PushScheduleState> scope out of date");
      return;
    }

    if (!scheduleHistory)
      scheduleHistory = new ScheduleHistoryRec[0];

    ScheduleHistoryRec rec = new ScheduleHistoryRec();
    rec.state = state;
    rec.localisedName = localisedObjectName;
    scheduleHistory[scheduleHistory.size()] = rec;

    UpdateViewDetailsLocomotive();
  }


  //=============================================================================
  // Name: PopScheduleState
  // Desc: Pops the schedule state
  //=============================================================================
  public void PopScheduleState(AITrainScope scope)
  {
    if (scope.trainScopeIndex != trainScopeIndex)
    {
      Interface.Log("Train.PopScheduleState> scope out of date");
      return;
    }

    int count = scheduleHistory.size();
    if (count > 1)
      scheduleHistory[count - 1, count] = null;
    else
      scheduleHistory = null;

    UpdateViewDetailsLocomotive();
  }


  //=============================================================================
  // Name: ClearScheduleState
  // Desc: Clear all recorded schedule history
  //=============================================================================
  void ClearScheduleState(void)
  {
    scheduleHistory = null;

    UpdateViewDetailsLocomotive();
  }


  //=============================================================================
  // Name: GetScheduleStateString
  // Desc: Returns a localised string to summarise the schedule state
  //=============================================================================
  public string GetScheduleStateString(void)
  {
    if (!scheduleHistory)
      return strTable.GetString("interface-train-schedule-state-none");

    int index = scheduleHistory.size() - 1;
    int state = scheduleHistory[index].state;

    if (state == SS_NONE)
    {
      // Whatever command we're executing has not provided any useful state information.
      return strTable.GetString("interface-train-schedule-state-none");
    }

    if (state == SS_JUNCTION)
      return strTable.GetString1("interface-train-schedule-state-junc", scheduleHistory[index].localisedName);

    if (state == SS_JUNCTION_TRACK)
      return strTable.GetString1("interface-train-schedule-state-jtrack", scheduleHistory[index].localisedName);

    if (state == SS_DRIVING)
    {
      JunctionBase junction = GetAutopilotStopJunctionBase();
      if (junction)
        return strTable.GetString1("interface-train-schedule-state-drive0", junction.GetMapObject().GetLocalisedName());

      Train train = GetAutopilotStopTrain();
      if (train)
        return strTable.GetString1("interface-train-schedule-state-drive1", train.GetTrainDisplayName());

      return strTable.GetString("interface-train-schedule-state-drive2");
    }

    if (state == SS_TRACK)
      return strTable.GetString("interface-train-schedule-state-track");

    if (state == SS_STOP)
      return strTable.GetString("interface-train-schedule-state-stop");

    if (state == SS_VEHICLE)
      return strTable.GetString1("interface-train-schedule-state-vehicle", scheduleHistory[index].localisedName);

    if (state == SS_TURNAROUND)
      return strTable.GetString("interface-train-schedule-state-turn");

    // oops- unknown state
    return strTable.GetString1("interface-train-schedule-state-unknown", (string)state);
  }


	public bool HasTrainTimetable(void)
	{
		return m_trainTimetable != null;
	}

	public void SetTrainTimetable(TrainTimetable timetable)
	{
		if (m_trainTimetable)
			Exception("Train.SetTrainTimetable> train already has timetable set");

		m_trainTimetable = timetable;
	}

	public void ClearTrainTimetable(ScenarioBehavior rule)
	{
		if (!m_trainTimetable)
			Exception("Train.ClearTrainTimetable> train doesnt have timetable set");

		if (rule != m_trainTimetable.GetTimetableRule())
			Exception("Train.ClearTrainTimetable> train timetable not owned by this rule");
		
		m_trainTimetable = null;
	}

	public TrainTimetable GetTrainTimetable(void)
	{
		return m_trainTimetable;
	}
	//


  public void OnTrainStopped(Message msg)
  {
    // Check that we're not running a schedule - don't want to go dropping permits randomly if a schedule is running!
    if (!m_schedule)
      RetestAllPermits();
  }


  public void SetHandBrake(bool state)
  {
    Vehicle[] vehicles = GetVehicles();
    int i;

    for (i = 0; i < vehicles.size(); ++i)
    {
      if(!vehicles[i].isclass(Locomotive))
      {
        vehicles[i].SetHandBrake(state);
      }
    }
  }


	public bool IsTrainBusy(void)
	{
		return m_trainBusyCount > 0;
	}

	public void IncTrainBusy(void)
	{
		m_trainBusyCount++;

		if (m_trainBusyCount == 1024)
			Interface.Log("Train.IncTrainBusy> ");
	}

	public void DecTrainBusy(void)
	{
		if (m_trainBusyCount <= 0)
		{
			Exception("Train.DecTrainBusy> train is not flagged as busy (may or may not be the fault of the calling function)");
			return;
		}

		m_trainBusyCount--;
		
			// send a message to wake up anyone who's waiting on this train
		if (m_trainBusyCount == 0)
			PostMessage(me, "Schedule", "Touch", 0.0);
	}


  
	//! Determines if the most recently run schedule on this train was completed successfully.
	//
	// Returns:
	//     Returns true if the most recently run schedule was completed successful, false otherwise.
	//
	public bool WasRunScheduleSuccessful(void)
	{
		return runScheduleSuccessful;
	}




	//! Get permits on our track where possible in the given direction.
	//
	// Param:  direction  Indicates the direction relative to the train in which to take the permits.
	//
	// Returns:
	//     Returns a list of any permits taken which have not yet been granted to this train.  Note that
	//     some of these permits may not have necessarily been <l Permit::IsGranted()  granted> yet.
	//
	public Permit[] TakePermitOnTrack(bool direction)
	{
		Permit[] ret = new Permit[0];
		Vehicle[] v = GetVehicles();
		int i;
		
		for (i = 0; i < v.size(); i++)
		{
			// NOTE: The permit may not be granted if someone else already has it, but
			// at least we're next in line if they leave..

			Permit permit = v[i].RequestTrackPermit( v[i].GetDirectionRelativeToTrain() == direction, me );
			if (permit)
			{
				Permit existingPermit = MatchExistingTrackPermit(permit);
				if (!existingPermit)
				{
					RecordTrackPermit(permit);

					if (!permit.IsGranted())
						ret[ret.size()] = permit;
				}
				else if (!existingPermit.IsGranted())
				{
					ret[ret.size()] = existingPermit;
				}
			}
		}

		return ret;
	}


  //! Immediately release any permits which are in the specified list.
  //
  // This method will release any permits from <i permits> that this train currently holds.  Other
  // permits in that array that are not part being held by this train will be ignored and left alone.
  //
  // Param:  permits  List of permits to release for this train.
  //
  public void ReleaseTrackPermits(Permit[] permits)
  {
    if (!permits  or  !m_trackPermits)
      return;

    int i, j;

    for (i = 0; i < permits.size(); ++i)
    {
      for (j = 0; j < m_trackPermits.size(); ++j)
      {
        if (m_trackPermits[j] == permits[i])
        {
          m_trackPermits[j, j+1] = null;
          break;
        }
      }
    }
  }



  public void Init(void)
  {
    // Add a handle to release our junctions
    AddHandler(me, "Junction", "InnerLeave", "PermitReleaser");
    AddHandler(me, "Junction", "Leave", "PermitReleaser");
    AddHandler(me, "Junction", "InnerEnter", "JunctionInnerEnterHandler");

    AddHandler(me, "Train", "InnerLeaveTrack", "TrackPermitReleaser");
    AddHandler(me, "Train", "LeaveTrack", "TrackPermitReleaser");
    AddHandler(me, "Train", "Cleanup", "TrainCleanup");
    AddHandler(me, "Train", "StoppedMoving", "OnTrainStopped");
    AddHandler(me, "Train", "Entered red signal", "HandleSPAD");

    AddHandler(me, "TrainTimetable", "Touch", "UpdateTimetable");

    AddHandler(me, "Browser-URL", "", "BrowserClick");
    AddHandler(me, "Browser", "Closed", "BrowserClose");

    TakePermitOnTrack(true);

    strTable = Constructors.GetTrainzStrings();

  }


	// Stuck states a train can be in.
	//
	// Note: These values are not used anymore - there is the now equivalent stuck states in DriverCharacter
	//

	public define int NOT_STUCK = 0;      // Train isn't stuck and there are no obstacles.
	public define int STUCK_DELAYED = 1;  // Train has been delayed by another moving train and is stuck.
	public define int STUCK_FULLY = 2;    // Train if fully stuck as it is stuck by a stuck train.



	//int m_trainIsStuck = 0;
	bool m_scheduleNotifier = false;
	int m_scheduleDrivingLocked = 0;

/*
	// ! Gets the current stuck state of this train.
	//
	// Returns:
	//     Returns one of the \ref stuckState "Stuck States" values indicating if this train is
	//     stuck or not.
	//
	// See Also:
	//     \ref stuckState "Stuck States"
	//
	public int IsStuck(void)
	{
		return m_trainIsStuck;
	}
*/


	//
	// Watches this train while it is running a schedule, and
	// notifies the driver if a long time period passes without any activity.
	//
	thread void RunScheduleNotifier(void)
	{
		Message msg;
		int delayedCount = 0;
		//bool notifiedTrainStuck = false;
		
		if (m_scheduleNotifier or !m_schedule)
			return;

		DriverCharacter driver = m_schedule.notifyDriver;
		if (!driver)
			return;

		m_scheduleNotifier = true;

		PostMessage(me, "Train.RunScheduleNotifier", "Tick", 10.0);

		wait()
		{
		on "Train.RunScheduleNotifier", "Tick", msg:
			if (msg.src != me)
				continue;
			
			int mode = GetAutopilotMode();

			if (mode == CONTROL_SCRIPT and m_scheduleDrivingLocked)
				mode = CONTROL_AUTOPILOT;

			int isStuck = 0;

			if (mode != CONTROL_AUTOPILOT)
			{
				// the train is not trying to move
				delayedCount = 0;
				isStuck = -1;
			}
			else if (!IsStopped())
			{
				// the train is moving
				delayedCount = 0;
				isStuck = -1;
			}
			else
			{
				delayedCount++;

				if (delayedCount >= 4)
					isStuck = 1;
			}


			if (isStuck == 1)
				driver.NotifyUser(DriverCharacter.TRAIN_IS_STUCK);
			else if (isStuck == -1)
				driver.NotifyUser(DriverCharacter.TRAIN_NOT_STUCK);
			
			PostMessage(me, "Train.RunScheduleNotifier", "Tick", 10.0);

			continue;

		on "Train", "StartedMoving", msg:
			if (msg.src == me)
			{
				// the train is moving
				delayedCount = 0;
				//m_trainIsStuck = NOT_STUCK;
				
				driver.NotifyUser(DriverCharacter.TRAIN_NOT_STUCK);
				/*
				if (notifiedTrainStuck)
				{
					driver.NotifyUser(DriverCharacter.TRAIN_NOT_STUCK);
					notifiedTrainStuck = false;
				}
				*/
			}
			continue;

		on "Schedule", "Complete", msg:
			if (msg.src == me)
			{
				if (!m_schedule)
					break;

				if (!m_schedule.notifyDriver)
					break;
				
				if (driver != m_schedule.notifyDriver)
				{
					driver = m_schedule.notifyDriver;
					//notifiedTrainStuck = false;
					delayedCount = 0;
				}
			}
			
			continue;
		}

		
		//// if we're not running a schedule, we're not stuck.. i guess..
		//delayedCount = 0;
		//m_trainIsStuck = NOT_STUCK;

		m_scheduleNotifier = false;
	}


  public thread void RunSchedule(Schedule schedule, bool loop, float delay)
  {
    // Is a schedule currently running?
    if (m_schedule)
    {
      Exception("Train.RunSchedule> schedule already running");
      return;
    }

    if (!schedule or !schedule.commands)
    {
      Interface.Log("Train.RunSchedule> Unable to start schedule - empty schedule or train already running schedule");
      return;
    }

    m_scheduleRunning = true;
    m_schedule = schedule;
    ccjRecursionDepth = 0;
    ccjCrossedJunctions = null;

    if (delay)
      Sleep(delay);

    // set our log message start
    string logMsg = "Schedule for train '" + GetDebugName() + "' ";

    // Add a handle to release our junctions
    //AddHandler(me, "Junction", "InnerLeave", "PermitReleaser");
    //AddHandler(me, "Junction", "Leave", "PermitReleaser");

    RetestAllPermits();

    runScheduleSuccessful = false;
    //lastVisitedTrack = null;
    //lastVisitedTrackPermit = null;    used to be enabled without the previous line enabled, but this causes issues :-)
    m_scheduleDrivingLocked = 0;

    bool stopTrainOnScheduleCompletion = true;

  run:

    //float oldAdvisoryLimit = GetAdvisoryLimit();

    if (m_schedule.notifyDriver and !m_scheduleNotifier)
      RunScheduleNotifier();


    for (m_scheduleIndex = 0; m_scheduleIndex < m_schedule.commands.size(); ++m_scheduleIndex)
    {
      stopTrainOnScheduleCompletion = true;
      Command cmd = m_schedule.commands[m_scheduleIndex];

      if (!cmd)
        goto done;

      // Ensure the object param is cached, force (re)loading it if necessary
      if (cmd.objID and (!cmd.obj or !Router.DoesGameObjectStillExist(cmd.obj)))
        cmd.obj = World.SynchronouslyLoadGameObjectByID(cmd.objID);

      //
      // Execute the command.
      //
      switch (cmd.command)
      {
        case Schedule.CMD_TAKE_JUNCTION:
        {
          JunctionBase junction = cast<JunctionBase>(cmd.obj);
          Interface.Log(logMsg + "CMD_TAKE_JUNCTION '" + junction.GetDebugString() + "' dir=" + cmd.ca);
          if (!CommandNavigateJunction(junction, cmd.ca, false, false))
            goto done;
          break;
        }

        case Schedule.CMD_TAKE_TRACK_PERMIT:
        {
          Track track = cast<Track>(cmd.obj);
          Interface.Log(logMsg + "CMD_TAKE_TRACK_PERMIT (" + track.GetDebugName() + ")");
          if (!CommandNavigateTrack(track))
            goto done;
          break;
        }

        case Schedule.CMD_COUPLE_VEHICLE:
        {
          Vehicle vehicle = cast<Vehicle>(cmd.obj);
          Interface.Log(logMsg + "CMD_COUPLE_VEHICLE (" + vehicle.GetDebugName()+ ")");
          if (!CommandCoupleVehicle(vehicle))
            goto done;
          break;
        }

        case Schedule.CMD_COMPLETE_JUNCTIONS:
        {
          Interface.Log(logMsg + "CMD_COMPLETE_JUNCTIONS");
          if (!CommandCompleteJunctions())
            goto done;
          break;
        }

        case Schedule.CMD_STOP_AT_TRIGGER:
        {
          Trigger trigger = cast<Trigger>(cmd.obj);
          Interface.Log(logMsg + "CMD_STOP_AT_TRIGGER (" + trigger.GetDebugName() + ")");
          if (!trigger or !CommandStopAtTrigger(trigger, cmd.cd))
            goto done;
          break;
        }

        case Schedule.CMD_ON_TRIGGER:
        {
          Trigger trigger = cast<Trigger>(cmd.obj);
          Interface.Log(logMsg + "CMD_ON_TRIGGER (" + trigger.GetDebugName() + ")");
          if (!trigger or !CommandOnTrigger(trigger, cmd.ca))
            goto done;
          break;
        }

        case Schedule.CMD_STOP_AT_SCENERY:
        {
          Buildable scenery = cast<Buildable>(cmd.obj);
          Interface.Log(logMsg + "CMD_STOP_AT_SCENERY (" + scenery.GetDebugName() + ")");
          if (!scenery or !CommandStopAtScenery(scenery))
            goto done;
          break;
        }

        case Schedule.CMD_STOP_AT_TRACKMARK:
        {
          TrackMark trackMark = cast<TrackMark>(cmd.obj);
          Interface.Log(logMsg + "CMD_STOP_AT_TRACKMARK (" + trackMark.GetDebugName() + ")");
          if (!trackMark or !CommandDriveToTrackMark(trackMark, true))
            goto done;
          break;
        }

        case Schedule.CMD_DRIVE_THROUGH_TRACKMARK:
        {
          TrackMark trackMark = cast<TrackMark>(cmd.obj);
          Interface.Log(logMsg + "CMD_DRIVE_THROUGH_TRACKMARK (" + trackMark.GetDebugName() + ")");
          if (!trackMark or !CommandDriveToTrackMark(trackMark, false))
            goto done;
          break;
        }

        case Schedule.CMD_DRIVE_FOREVER:
        {
          Interface.Log(logMsg + "CMD_DRIVE_FOREVER");
          if (!CommandDriveForever())
            goto done;
          break;
        }

        case Schedule.CMD_REVERSE_TRAIN:
        {
          Interface.Log(logMsg + "CMD_REVERSE_TRAIN " + cmd.ca);
          if (!CommandReverseTrain(cmd.ca == 1))
            goto done;
          break;
        }

        case Schedule.CMD_STOP_TRAIN:
        {
          Interface.Log(logMsg + "CMD_STOP_TRAIN " + cmd.cd);
          if (!CommandStopTrain(cmd.cd))
            goto done;
          break;
        }

        case Schedule.CMD_DELETE_TRAIN:
        {
          Interface.Log(logMsg + "CMD_DELETE_TRAIN");
          World.DeleteTrain(me);
          goto done;
        }

        case Schedule.CMD_POST_MESSAGE:
        {
          Interface.Log(logMsg + "CMD_POST_MESSAGE " + cmd.major + cmd.minor);
          Router.PostMessage(cmd.ca, cmd.cb, cmd.major, cmd.minor, cmd.cd);
          break;
        }

        case Schedule.CMD_ANNOUNCE:
        {
          Interface.Log(logMsg + "CMD_ANNOUNCE " + cmd.minor);
          Timetable.Announce(cmd.minor, GetId());
          break;
        }

        case Schedule.CMD_ON_ANNOUNCEMENT:
        {
          Interface.Log(logMsg + "CMD_ON_ANNOUNCEMENT " + cmd.minor);
          if (!CommandOnAnnouncement(cmd.minor))
            goto done;
          break;
        }

        case Schedule.CMD_SET_SIGNAL:
        {
          Interface.Log(logMsg + "CMD_SET_SIGNAL " + cmd.objID.GetDebugString());
          if (!CommandSetSignal(cmd.objID, cmd.ca, cmd.minor))
            goto done;
          break;
        }

        case Schedule.CMD_RESET_TIMETABLE:
        {
          Interface.Log(logMsg + "CMD_RESET_TIMETABLE");
          Timetable.Reset();
          break;
        }

        case Schedule.CMD_CUSTOM:
        {
          Interface.Log(logMsg + "CMD_CUSTOM" + cmd.ca + " " + cmd.cb + " " + cmd.cc);
          if (!cmd.custom.Execute(me, cmd.ca, cmd.cb, cmd.cc))
            goto done;

          stopTrainOnScheduleCompletion = cmd.custom.ShouldStopTrainOnCompletion();
          break;
        }

        default:
        {
          Interface.Log(logMsg + "INVALID");
          goto done;
        }
      }

      if (!m_schedule or !m_schedule.commands)
      {
        // May occur if the train's deleted (when driving into a portal, for example)
        Interface.Log("Train.RunSchedule> Warning: Schedule has been deleted mid-run");
        break;
      }
    }

    if (loop)
    {
      Sleep(0.01);
      goto run;
    }

    Interface.Log(logMsg + " COMPLETE");

    runScheduleSuccessful = true;
    m_scheduleDrivingLocked = 0;

   done:


    //AddHandler(me, "Junction", "InnerLeave", "");
    //AddHandler(me, "Junction", "Leave", "");

    ResetAITrainScope();


    // clean up in case we were aborted while moving
    SetAutopilotTarget(null);
    SetAutopilotMode(CONTROL_MANUAL);
    if (stopTrainOnScheduleCompletion)
      StopTrainGently();
    ccjRecursionDepth = 0;
    ccjCrossedJunctions = null;

    //SetAdvisoryLimit(oldAdvisoryLimit);
    //SetAdvisoryLimit(0);

    ClearScheduleState();


    if (schedule.signalPassedAtDanger)
      HandleScheduleSPAD();


    if (schedule.releasePermitsWhenComplete)
    {
      // old style - just forget everything we know
      // guaranteed to cause problems (eg. deadlocks)
      ReleaseAllPermits();
    }
    else
    {
      // retest now in case the schedule was aborted early
      // so we don't keep permits unnecessarily
      RetestAllPermits();
    }

    PostMessage(me, "Schedule", "Complete", 0.1f);

    // Legacy support, do not rely on this message as it will eventually be removed
    Router.LegacyBroadcastMessage(me, "Schedule", "Complete", 0.1f, true);

    m_scheduleRunning = false;
    m_schedule = null;
    m_scheduleIndex = 0;
  }



  // request that the schedule (if any) stops
  public void StopSchedule()
  {
    if (m_schedule)
    {
      // ceeb030310- this would be ideal as a
      //  send, since a post would stop a schedule started just after this in the same frame.
      // ceeb030311- unfortunately, SendMessage() is not allowed from the static thread
      PostMessage(me, "Schedule", "Abort", 0.0);
    }
    else
    {
      // In case someone wants to know
      PostMessage(me, "Schedule", "Touch", 0.0);
    }
  }


	//! Stops running this train's current schedule.
	//
	// This method stops the Schedule this train <l RunSchedule()  is currently running> (if any) and
	// waits until the train's schedule actually does stop before returning.
	//
	// If this train is not running a schedule, this method returns after broadcasting a message of
	// type (<m"%Schedule">, <m "Touch">) in case someone is listening for schedule messages.
	//
	public void StopScheduleAndWait()
	{
    if (m_schedule)
		{
			PostMessage(me, "Schedule", "Abort", 0.0);
			
			Message msg;
			wait()
			{
			on "Schedule", "Complete", msg:
				if (msg.src == me)
					break;
				continue;
			}
		}
		else
		{
			//
			// In case someone wants to know
			//
			PostMessage(me, "Schedule", "Touch", 0.0);
		}
	}



  public bool IsScheduleRunning()
  {
    return m_scheduleRunning;
  }

  public int GetCurrentScheduleIndex()
  {
    if (!m_scheduleRunning)
      return -1;
    return m_scheduleIndex;
  }

  public int GetCurrentScheduleSize()
  {
    if (!m_schedule)
      return 0;
    return m_schedule.commands.size();
  }

  public Command GetIndexedScheduleCommand(int index)
  {
    if (index >= GetCurrentScheduleSize())
      return null;

    return m_schedule.commands[index].GetCopy();
  }


  void JunctionInnerEnterHandler(Message msg)
  {
    JunctionBase junction = cast<JunctionBase>(msg.src);
    MapObject junctionMapObject = junction.GetMapObject();

    // Interface.Log("Train.JunctionInnerEnterHandler> " + junction.GetDebugString());

    if (m_junctionPermits)
    {
      int i, count = m_junctionPermits.size();

      for (i = 0; i < count; i++)
      {
        if (m_junctionPermits[i].GetObject() == junction  or  m_junctionPermits[i].GetObject() == junctionMapObject)
        {
          Interface.Log("Train.JunctionInnerEnterHandler> Already have permit " + junction.GetDebugString() + " (train: " + GetDebugName() + ")");
          m_junctionInner[i] = true;
          return;
        }
      }
    }

    //
    // Uhoh! we're in a junction without a permit?!
    // Trying to grab a permit here could result in a deadlock requiring user intervention.
    // But, failing to grab the permit could result in a derailment if someone else toggles the junction.
    //
    Permit junctionPermit = junction.RequestPermit(me);
    if (junctionPermit)
      RecordJunctionPermit(junctionPermit, junction);

    if (junctionPermit and junctionPermit.IsGranted())
      Interface.Log("Train.JunctionInnerEnterHandler> New permit granted " + junction.GetDebugString() + " (train: " + GetDebugName() + ")");
    else
      Interface.Log("Train.JunctionInnerEnterHandler> New permit NOT granted " + junction.GetDebugString() + " (train: " + GetDebugName() + ")");

  }


  void PermitReleaser(Message msg)
  {
    JunctionBase junction = cast<JunctionBase> msg.src;
    MapObject junctionMapObject = junction.GetMapObject();
    
    // The message should be from our oldest held junction permit.

    if (junction and m_junctionPermits and m_junctionPermits.size() > 0)
    {
      if (junction == m_junctionPermits[0].GetObject()  or   m_junctionPermits[0].GetObject() == junctionMapObject)
      {
        // we remove our oldest permits, and decrement the permit count

        m_junctionPermits[0,1] = null;
				m_junctionInner[0,1] = null;
				Interface.Log("** Train.PermitReleaser> releasing " + junction.GetDebugString() + " permit (" + m_junctionPermits.size() + " remain)");
				
				// at this point, we should be safe to release ALL ccj permits
				if (ccjCrossedJunctions  and  ccjRecursionDepth == 0)
				{
					Interface.Log("Train.PermitRelease> clearing ccjCrossedJunctions");
					ccjCrossedJunctions = null;
				}
      }
      else
      {
        // something funny could be going on.  see if we have missed a message
				
				/*
        int i, j = m_junctionPermits.size();
        for (i = 0; i < j; ++i)
        {
          if(m_junctionPermits[i].GetObject() == junction)
          {
						int k;
						for (k = 0; k <= i; k++)
							Interface.Log("Train.PermitReleaser> out-of-order junction permit release (" + m_junctionPermits[k].GetObject().GetId() + ")");

            ++i;
            m_junctionPermits[0,i] = null;
						m_junctionInner[0,i] = null;

            return;
          }
        }
				*/
        int i = 0;

				while (i < m_junctionPermits.size())
        {
          if (m_junctionPermits[i].GetObject() == junction  or   m_junctionPermits[i].GetObject() == junctionMapObject)
          {
						Interface.Log("Train.PermitReleaser> out-of-order junction permit release (" + m_junctionPermits[i].GetDebugString() + ")");

            m_junctionPermits[i,i+1] = null;
						m_junctionInner[i,i+1] = null;
          }
					else
						i++;
        }

				
					// debugging check-
					// we should normally get 'InnerLeave' then 'Leave' so we ignore the 'Leave' messages as they would generally
					// trigger this after the 'InnerLeave' has already cleaned up the permits.
				if (msg.minor == "InnerLeave")
					Interface.Log("** Train.PermitReleaser> Warning: Train was in " + junction.GetDebugString() + " without permit");
      }
    }
  }


	//! Determines if this train still holds a permit for the given junction.
	//
	// Param:  jn  Junction to check if this train has a permit for.
	//
	// Returns:
	//     Returns true if this train holds a permit for <i jn> (i.e. the train is still on it),
	//     false otherwise.
	//
	public bool IsStillInJunction(JunctionBase jn)
	{
		if (!m_junctionPermits)
			return false;

		int i, j = m_junctionPermits.size();
		for (i = 0; i < j; i++)
			if (m_junctionPermits[i].GetObject() == jn  or  m_junctionPermits[i].GetObject() == jn.GetGameObject()  or  m_junctionPermits[i].GetObject() == jn.GetMapObject())
				return true;

		return false;
	}


	//! Determines of this train is within the inner radius of the given junction.
	//
	// Param:  jn  %Junction to check if this train is on.
	//
	// Returns:
	//     Returns true if this train has entered the inner radius of <i jn>, false otherwise.
	//
	public bool HasReachedJunctionInnerRadius(JunctionBase jn)
	{
		if (!m_junctionPermits)
			return false;

		int i, j = m_junctionPermits.size();
		for (i = 0; i < j; i++)
			if (m_junctionPermits[i].GetObject() == jn  or  m_junctionPermits[i].GetObject() == jn.GetGameObject()  or  m_junctionPermits[i].GetObject() == jn.GetMapObject())
				return m_junctionInner[i];

		return false;
	}


		// this is a fairly dangerous thing to do
		// currently it's useful if we want to hand control over to the player
		// but we need a better solution, such as an automatic PermitTaker
  void ReleaseAllPermits()
  {
		Interface.Log("Train.ReleaseAllPermits> abandoning all permits");

			// this shouldn't be necessary any more and should be removed?

    //m_currentTrackPermit = null;
    m_trackPermits = null;
    m_junctionPermits = null;
		m_junctionInner = null;

		lastVisitedTrack = null;
		lastVisitedTrackPermit = null;
  }


	//! Determines if this train is within the track controlled by the given permit.
	//
	// Note:
	//     Throws a script exception if <i trackPermit> does not refer to a track.
	//
	// Param:  trackPermit  Permit of track to test.
	// Param:  innerOnly    If true, indicates to test inner radius only, otherwise the default outer
	//                      radius of 150 meters will be used.
	//
	// Returns:
	//     Returns true if this train is within the track controlled by <i trackPermit>, false 
	//     otherwise.
	//
	public native bool TestTrackPermit(Permit trackPermit, bool innerOnly);


	void RemoveTrackPermit(int j)
	{
		Permit permit = m_trackPermits[j];
		m_trackPermits[j, j+1] = null;

		if (permit == lastVisitedTrackPermit)
		{
      if (lastVisitedTrack)
        Interface.Log("RemoveTrackPermits> released lastVisistedTrack");
      
			lastVisitedTrack = null;
			lastVisitedTrackPermit = null;
		}
	}

	//
	// Retests all track-permits within the specified range (inclusive) and
	// removes them if they are not currently in use (ie. the train is not currently in that section of track.)
	//
	void RetestTrackPermits(int lo, int hi)
	{
		if (lo > hi)
			return;
		
		int j;

		for (j = hi; j >= lo; j--)
    {
      if (m_trackPermits[j].IsReleased())
				RemoveTrackPermit(j);
			else if (!TestTrackPermit(m_trackPermits[j], false))
				RemoveTrackPermit(j);
    }
		
		//Interface.Log("Train.RetestTrackPermits> " + m_trackPermits.size() + " remain (train " + GetId() + " " + GetTrainDisplayName() + ")");
	}

		
	// check each of our permits to determine whether they are up to date
	// this is basically a sanity check to make sure we haven't missed releasing a permit somewhere along the line
	void RetestAllPermits(void)
	{
		// if we're moving "fast", then we have to be a little careful about which junctions we release
		bool movingFast = Math.Fabs(GetTrainVelocity()) > 3.f;

    if (m_junctionPermits)
		{
			int i = m_junctionPermits.size();

			Interface.Log("Train.RetestAllPermits> " + (string)i + " permits (train " + GetId() + " " + GetTrainDisplayName() + ")");

			while (--i >= 0)
			{
				JunctionBase junction = cast<JunctionBase>(m_junctionPermits[i].GetObjectBase());
				bool releasePermit;

				if (!junction)
				{
					releasePermit = true;
					// warning: this can be trigger by animated-junctions; we may want to find a workaround for this
					Interface.Log("    " + i + ": permit has unknown object");
				}
				else
				{
          // Don't release the permit for the junction that we're currently driving towards.
          if (junction == m_trainInternalDriveToJunction)
            releasePermit = false;
					else if (movingFast)
						releasePermit = !junction.JunctionReEnter(GetGameObjectID());
					else
						releasePermit = !junction.JunctionInnerReEnter(GetGameObjectID());
            
					Interface.Log("    " + i + ": releasePermit=" + releasePermit + ", movingFast=" + movingFast);
				}
				
				if (releasePermit)
				{
					Interface.Log("    " + i + ": releasing permit for " + m_junctionPermits[i].GetDebugString());

					m_junctionPermits[i,i+1] = null;
					m_junctionInner[i, i+1] = null;
				}
			}
		}
		else
    {
			Interface.Log("Train.RetestAllPermits> no junction permits (train " + GetId() + " " + GetTrainDisplayName() + ")");
    }
		
		// check track permits
		if (m_trackPermits)
			RetestTrackPermits(0, m_trackPermits.size()-1);
	}


	void RecordJunctionPermit(Permit junctionPermit, JunctionBase junction)
	{
		Interface.Log("Train.RecordJunctionPermit> recording junction " + junction.GetDebugString());

    if (m_junctionPermits == null)
    {
			//
			// This is your first junction permit! Congratulations!
			//
      m_junctionPermits = new Permit[0];
			m_junctionInner = new bool[0];
    }
		else
		{
			//
			// Check if we already have this permit
			// - dont add it twice, it stuffs up the releaser.
			//
      MapObject junctionMapObject = junction.GetMapObject();
			int i;
			int n = m_junctionPermits.size();
			for (i = 0; i < n; i++)
      {
				if (m_junctionPermits[i].GetObject() == junction  or  m_junctionPermits[i].GetObject() == junctionMapObject)
				{
						// non-fatal.. this happens from time to time
					Interface.Log("RecordJunctionPermit> (duplicate junction permit, ignoring)");
					return;
				}
      }
		}

    int n = m_junctionPermits.size();
    m_junctionPermits[n] = junctionPermit;
		m_junctionInner[n] = false;
	}


	Permit MatchExistingJunctionPermit(Permit newPermit)
	{
		if (!m_junctionPermits)
			return null;

		int i, j = m_junctionPermits.size();
		for (i = 0; i < j; i++)
		{
			Permit permit;

			permit = m_junctionPermits[i];
			if (permit.IsForSameObjectAs(newPermit))
				return permit;
		}

		return null;
	}


	
	//
	// Record the new permit into our track-permit list.
	// The new permit should not already exist in the list.
	//
	void RecordTrackPermit(Permit newPermit)
	{
		if (!newPermit)
			return;

		if (!m_trackPermits)
			m_trackPermits = new Permit[0];
		
		m_trackPermits[m_trackPermits.size()] = newPermit;
	}

	
	//
	// Find any existing track permit that matches the new permit.
	//
	Permit MatchExistingTrackPermit(Permit newPermit)
	{
		if (!m_trackPermits)
			return null;

		int i, j = m_trackPermits.size();
		for (i = 0; i < j; i++)
		{
			Permit permit;

			permit = m_trackPermits[i];
			if (permit and permit.HasSamePermissionsAs(newPermit))
				return permit;
		}

		return null;
	}


	//
	// Find any existing track permit that blocks (or matches) the new permit.
	//
	Permit MatchBlockingTrackPermit(Permit newPermit)
	{
		if (!m_trackPermits)
			return null;

		int i, j = m_trackPermits.size();
		for (i = 0; i < j; i++)
		{
			Permit permit;

			permit = m_trackPermits[i];
			if (permit and permit.IsForSameObjectAs(newPermit))
				return permit;
		}

		return null;
	}

	//
	// Promote an existing track permit to the end of the track-permit list
	//
	void PromoteTrackPermit(Permit permit)
	{
		int i, j = m_trackPermits.size();
		for (i = 0; i < j; i++)
			if (m_trackPermits[i] == permit)
			{
				m_trackPermits[i, i+1] = null;
				m_trackPermits[j-1] = permit;
				return;
			}
	}


  //
  // Handler for "Train", "LeaveTrack" and etc.
  //
  void TrackPermitReleaser(Message msg)
  {
    GameObject obj = cast<GameObject>(msg.src);

    Interface.Log("Train.TrackPermitRelease> GameObject: " + obj.GetDebugName());
    if (!m_trackPermits)
      return;

    int i;
    for (i = 0; i < m_trackPermits.size(); i++)
    {
      if (m_trackPermits[i].GetObject() == msg.src)
      {
        Interface.Log("Train.TrackPermitRelease> Released permit for GameObject: " + obj.GetDebugName());
        RemoveTrackPermit(i);
        
        RetestTrackPermits(0, i-1);
        return;
      }
    }
  }


  Buildable lastVisitedScenery;           // The most recent Buildable object which we've entered the triggers of. Used to determine which industry to use for a 'load' command.
  Buildable m_lastVisitedSceneryFallback; // A fallback which catches some cases which 'lastVisitedScenery' does not, but which can be wrong in some edge cases.


  // ceeb140215: re-enabled but changed to prefer other options and only use this as a final
  //   fallback.
  //
  // ceeb040405: this was disabled again, due to the problem with 'Load' command when the train is
  //   in two industries simultaneously.
  //
  // ceeb040310: this was disabled in favor of CommandStopAtScenery()'s method of setting the var
  //   i've reenabled it to allow manual drive + LoadCommand
  void SceneryTriggerEnter(Message msg)
  {
    Buildable scenery = cast<Buildable>(msg.src);
    if (scenery)
      m_lastVisitedSceneryFallback = scenery;
  }


	//! Gets the last Buildable object this train visited.
	//
	// Note:
	//     The train may or may not still be within that object's trigger range.
	//
	// Returns:
	//     Returns the Buildable object this train most recently visited, null if this train hasn't
	//     visited one yet.
	//
	public Buildable GetLastVisitedBuildable(void)
	{
    if (!lastVisitedScenery)
      return m_lastVisitedSceneryFallback;
    
		return lastVisitedScenery;
	}

	//! Sets the last Buildable object this train has last visited.
	//
	// Param:  b  Buildable/industry that this train last visited.
	//
	public void SetLastVisitedBuildable(Buildable b)
	{
		lastVisitedScenery = b;
    m_lastVisitedSceneryFallback = b;
	}
  
  
	// N3V INTERNAL USE ONLY
	public void SetLastVisitedBuildableFallback(Buildable b)
	{
    m_lastVisitedSceneryFallback = b;
	}
  

	//! Gets the last industry object this train visited.
	//
	// This method is identical to GetLastVisitedBuildable() except it casts the last visited 
	// Buildable object to Industry and then returns it.
	//
	// Note:
	//     The train may or may not still be within that object's trigger range.
	//
	// Returns:
	//     Returns the Industry object this train most recently visited, null if this train
	//     hasn't visited one yet.
	//
	public Industry GetLastVisitedIndustry(void)
	{
		return cast<Industry>(GetLastVisitedBuildable());
	}


	void BeginDriveToJunction(JunctionBase junction)
	{
		Interface.Log("BeginDriveToJunction> " + GetTrainDisplayName() + " targetting " + junction.GetDebugString());
    SetAutopilotMode(Train.CONTROL_AUTOPILOT);
		SetAutopilotTarget(junction);
		SetAutopilotTargetMinimumSpeed(0);
		SetAutopilotTargetMinimumDistance(20.f);
	}

	bool DriveToJunction(JunctionBase junction)
	{
		Interface.Log("DriveToJunction> " + GetTrainDisplayName() + " targetting " + junction.GetDebugString());

    Message msg;

    SetAutopilotMode(Train.CONTROL_AUTOPILOT);
		
			// ceeb040406: do bother tracking it, since it's causing too many problems. added code
			//  below to hopefully resolve speed issue.
			//
			// ceeb040405: don't bother tracking the junction, since we've already got the permit.
			//  this could lead to some trouble with junctions which are close together, however
			//  otherwise we slow fast trains down until we hit the junction radius.
			//
		SetAutopilotTarget(junction);
		//SetAutopilotTarget(null);

		
		AITrainScope scope = OpenAITrainScope();
		if (IsStopped())
			BeginAITrainStuck(scope);
    
    // Make sure that we don't release the permit for this junction!
    m_trainInternalDriveToJunction = junction;


    // wait on the junction

    junction.JunctionReEnter(GetGameObjectID());
    wait()
    {
      on "Train", "StoppedMoving", msg :
      {
				if (msg.src == me)
				{
					JunctionBase jn = GetAutopilotStopJunction();
					if (jn == junction)
					{
					  // ceeb051214: we should not stop because of the junction. There must be a
					  // root cause...
					  
					  Train reasonTrain = GetAutopilotStopTrain();
					  if (reasonTrain  and  reasonTrain == m_schedule.limitCouplingTo)
					  {
					    Interface.Log("Train.DriveToJunction> forcing drive through junction (train is stuck and we want to couple with the train on the other side)");
					    
					    // we are somewhere within a coupling operation - let's force our way through this junction since the guy we want to couple
					    // with is on the other side anyway.
							SetAutopilotMode(Train.CONTROL_SCRIPT);
							SetDCCThrottle(Math.Sqrt(2.3/GetAITrainMaxSpeed()));
							break;
					  }
					  
					  // we are stuck, somehow?
						break;
					}

					Train train = GetAutopilotStopTrain();
					if (train)
					{
						// ceeb040419:
						// We have stopped because another train is between us and the junction?
						// Better to reset the schedule- since we have the junction locked at this point, it probably means
						// that we are deadlocked against the guy in front of us.
						Interface.Log("Train.DriveToJunction> probable deadlock; resetting schedule");
            m_trainInternalDriveToJunction = null;
						return false;
					}
					
					// JRM 20080506:
					// We aren't stuck because of the point we're headed to, nor because of a train,
					// so it's likely we're staring at a red signal and it's patiently waiting for us
					// to path our way across a series of points that are close together.
					// If we try to go one junction further on in our sequence, we are likely to find
					// that we get a path rather rapidly and that'd be far more useful than sitting
					// here like a lemon complaining to the user, which is all "BeginAITrainStuck"
					// would do...
					
					Sleep(0.1);
					
					break;

					BeginAITrainStuck(scope);
				}

        continue;
      }

			on "Train", "StartedMoving", msg:
			{
				if (msg.src == me)
        {
					if (!EndAITrainStuck(scope))
          {
            m_trainInternalDriveToJunction = null;
						return false;
          }
        }

				continue;
			}

      on "Junction", "Enter", msg :
      {
        if (msg.src == junction)
          break;
        continue;
      }

			on "Train", "SlowingForTarget" :
			{
				// ceeb040406: we're having to slow down due to our approach to this junction;
				//  that's good enough.. this is done to prevent the train slowing down at each
				//  junction it passes
				Interface.Log("Train.DriveToJunction> train is slowing for target; good enough");
				break;
			}

      on "Schedule", "Abort" :
        m_trainInternalDriveToJunction = null;
				return false;
    }
    
    m_trainInternalDriveToJunction = null;


		if (!CloseAITrainScope(scope))
			return false;
		
		SetAutopilotTarget(null);
		return true;
	}


	//
	// If DIRECTION_NONE is specified, returns whichever direction first
	// becomes available (ie. LEFT, RIGHT, or FORWARD; but not BACKWARD)
	//
	// Modifies the <info> parameter with updated details of the permit taken.
	//
	// Blocks until a permit is taken or a failure occurs.
	// Returns TRUE if a permit was taken, or FALSE if some failure occurred.
	//
	bool GetJunctionTrackPermit(JunctionPermitInfo info)
	{
		string str;
		int i;
		
		info.trackPermit = null;

		if (info.direction == Junction.DIRECTION_BACKWARD or info.otherSide)
			str = "backward";
		else if (info.direction == Junction.DIRECTION_LEFT)
			str = "left";
		else if (info.direction == Junction.DIRECTION_RIGHT)
			str = "right";
		else if (info.direction == Junction.DIRECTION_FORWARD)
			str = "forward";
		else if (info.direction == Junction.DIRECTION_BACKWARD)
			str = "backward";
		else if (info.direction == Junction.DIRECTION_NONE)
			str = "dont care";
		else if (info.direction == 1000)
			str = "prefer change";
		else
		{
			Interface.Log("  junction.RequestTrackPermit> bad Direction: " + info.direction);
			return false;
		}


    // get the track permit
		Interface.Log("  junction.RequestTrackPermit (direction = " + str + ")");
		

		// get a permit for the requested direction(s)
		Permit[] trackPermit;
		int[] trackDirection;
		int permitCount = 0;
		
		if (info.direction == Junction.DIRECTION_NONE  or  info.direction == 1000)
		{
			trackDirection = new int[3];

			int curDirection = info.junction.GetDirection();
			
				// this is a little hack added in the case where we would prefer
				// to have the junction change to a different state
				// because we've got a red signal currently
			if (info.direction == 1000)
				if (curDirection == Junction.DIRECTION_LEFT)
					curDirection = Junction.DIRECTION_RIGHT;
				else
					curDirection = Junction.DIRECTION_LEFT;

			
			if (curDirection == Junction.DIRECTION_LEFT)
			{
				// go left first if possible (junction is currently set that way)
				trackDirection[0] = Junction.DIRECTION_LEFT;
				trackDirection[1] = Junction.DIRECTION_FORWARD;
				trackDirection[2] = Junction.DIRECTION_RIGHT;
			}
			else if (curDirection == Junction.DIRECTION_FORWARD)
			{
				// go forward first if possible (junction is currently set that way)
				trackDirection[0] = Junction.DIRECTION_FORWARD;
				trackDirection[1] = Junction.DIRECTION_LEFT;
				trackDirection[2] = Junction.DIRECTION_RIGHT;
			}
			else if (curDirection == Junction.DIRECTION_RIGHT)
			{
				// go right first if possible (junction is currently set that way)
				trackDirection[0] = Junction.DIRECTION_RIGHT;
				trackDirection[1] = Junction.DIRECTION_FORWARD;
				trackDirection[2] = Junction.DIRECTION_LEFT;
			}
			else
			{
				// what?
				trackDirection[0] = Junction.DIRECTION_LEFT;
				trackDirection[1] = Junction.DIRECTION_FORWARD;
				trackDirection[2] = Junction.DIRECTION_RIGHT;
			}
		}
		else
		{
			trackDirection = new int[1];
			if (info.otherSide == true)
			{
				trackDirection[0] = Junction.DIRECTION_BACKWARD;
			}
			else
			{
				trackDirection[0] = info.direction;
			}
		}
		
		trackPermit = new Permit[trackDirection.size()];
		for (i = 0; i < trackDirection.size(); i++)
		{
			trackPermit[i] = info.junction.RequestTrackPermit(null, me, trackDirection[i]);
			if (trackPermit[i])
				permitCount++;
		}

		if (permitCount == 0)
		{
			// no directions were available - maybe a dud junction lever
			Interface.Log(info.junction.GetDebugString() + " rejected permit(s) for train " + me.GetDebugName());
			return false;
		}


		// check for an existing permit which matches
		for (i = 0; i < trackPermit.size(); i++)
		{
			if (trackPermit[i])
			{
				// if we already have a permit for this object, discard the new one
				// and just return the existing one
				// (this prevents deadlocks)
				Permit existingPermit = MatchExistingTrackPermit(trackPermit[i]);
				if (existingPermit)
				{
					PromoteTrackPermit(existingPermit);

					if (existingPermit.WasGranted())
					{
						info.trackPermit = existingPermit;
						if (!info.otherSide)
							info.direction = trackDirection[i];

						return true;
					}
					
					// oops, it isnt actually granted yet..
					trackPermit[i] = existingPermit;
				}
			}
		}



		// check for a permit held by the guy we're coupling to
		for (i = 0; i < trackPermit.size(); i++)
		{
			if (!trackPermit[i])
				continue;

			// if we are permitted to couple up with a SPECIFIED train, then we will
			// "borrow" this permit from them if they hold it.
			if (m_schedule  and  m_schedule.limitCouplingTo)
			{
				// sanity- dont couple if its running a schedule
				if (!m_schedule.limitCouplingTo.m_schedule)
				{
					Permit existingPermit = m_schedule.limitCouplingTo.MatchBlockingTrackPermit(trackPermit[i]);
					if (existingPermit)
					{
						if (existingPermit.WasGranted())
						{
							// caller should add this to our track permit list
							info.trackPermit = existingPermit;
							if (!info.otherSide)
								info.direction = trackDirection[i];

							return true;
						}

						// oops, it isnt actually granted yet..
						trackPermit[i] = existingPermit;
					}
				}
			}
		}

		AITrainScope scope = OpenAITrainScope();
		PushScheduleState(scope, SS_JUNCTION_TRACK, info.junction.GetMapObject().GetLocalisedName());

		//
		PostMessage(me, "Train.GetJunctionTrackPermit", "Timeout", 10.0f);

		//
		// wait for (one of) the permit(s) to be come available
		//
		m_scheduleDrivingLocked ++;

		Message msg;

    wait()
    {
      on "Permit", "Granted" :
      {
				for (i = 0; i < trackPermit.size(); i++)
					if (trackPermit[i])
						if (trackPermit[i].WasGranted())
						{
							info.trackPermit = trackPermit[i];
							if(!info.otherSide)
							{
								info.direction = trackDirection[i];
							}
							goto done_wait;
						}
        continue;
      }

      on "Schedule", "Abort":
				break;

			on "Train.ThreadAITrainStuck", "Touch":
				if (info.inStuckThread)
					break;
				continue;

			on "Train.GetJunctionTrackPermit", "Timeout":
				// cycle the command.. this will cause it to be re-issued and hopefully find a more successful solution
				Interface.Log("GetJunctionTrackPermit> timeout; restarting schedule");
				break;



			on "Train", "ReachedTarget":
				// guess we've reached the junction. better stop moving
				SetAutopilotMode(CONTROL_SCRIPT);
				SetDCCThrottle(0);
				continue;
/*
      on "Junction", "Enter", msg :
      {
        if (msg.src == junction)
				{
					// guess we've reached the junction. better stop moving
					SetAutopilotMode(CONTROL_SCRIPT);
					SetDCCThrottle(0);
        }
        continue;
      }*/

			on "Junction", "InnerEnter", msg:
				if (msg.src == info.junction)
				{
					// guess we've reached the junction. better stop moving
					SetAutopilotMode(CONTROL_SCRIPT);
					SetDCCThrottle(0);
				}
				continue;
    }

	done_wait:
		
		m_scheduleDrivingLocked--;
		

		ClearMessages("Train.GetJunctionTrackPermit", "Timeout");

		PopScheduleState(scope);
		if (!CloseAITrainScope(scope))
			return false;

		return (info.trackPermit != null);
	}


  Permit GetJunctionPermit(JunctionPermitInfo info)
  {
    // get the junction permit
    Interface.Log("Train.GetJunctionPermit> " + info.junction.GetDebugString());

    Permit junctionPermit;

    if (info.direction == JunctionBase.DIRECTION_BACKWARD  or  info.direction == JunctionBase.DIRECTION_NONE)
    {
      // This style shouldn't be used, but some legacy scripts require it.
      Interface.WarnObsolete("Train.GetJunctionPermit> DIRECTION_BACKWARD used");
      junctionPermit = info.junction.RequestPermit(me);
    }
    else
    {
      junctionPermit = info.junction.RequestPermit(null, me, info.direction);
    }

    if (!junctionPermit)
    {
      Interface.Log("Train.GetJunctionPermit> " + info.junction.GetDebugString() + " FAILED");
      return null;
    }

    // if we already have a permit for this object, discard the new one
    // and just return the existing one
    // (this prevents deadlocks)
    Permit existingPermit = MatchExistingJunctionPermit(junctionPermit);
    if (existingPermit)
    {
      if (existingPermit.WasGranted())
        return existingPermit;

      junctionPermit = existingPermit;
    }


		// if we are permitted to couple up with a SPECIFIED train, then we will
		// "borrow" this permit from them if they hold it.
		if (m_schedule  and  m_schedule.limitCouplingTo)
		{
			// sanity- dont couple if its running a schedule
			if (!m_schedule.limitCouplingTo.m_schedule)
			{
				existingPermit = m_schedule.limitCouplingTo.MatchExistingJunctionPermit(junctionPermit);
				if (existingPermit)
				{
					// todo: remove any existing non-granted permit from this train here!

					if (existingPermit.WasGranted())
						// caller should add this to our junction permit list
						return existingPermit;

					junctionPermit = existingPermit;
				}
			}
		}

    AITrainScope scope = OpenAITrainScope();
    PushScheduleState(scope, SS_JUNCTION, info.junction.GetMapObject().GetLocalisedName());
    m_scheduleDrivingLocked++;

    wait()
    {
      on "Permit", "Granted":
      {
        if(junctionPermit.WasGranted())
          break;
        continue;
      }

      on "Schedule", "Abort":
				m_scheduleDrivingLocked --;
				return null;

			on "Train.ThreadAITrainStuck", "Touch":
				if (info.inStuckThread)
				{
					m_scheduleDrivingLocked --;
					return null;
				}
				continue;
			
			on "Train", "ReachedTarget":
				// guess we've reached the junction. better stop moving
				SetAutopilotMode(CONTROL_SCRIPT);
				SetDCCThrottle(0);
				continue;
    }

		m_scheduleDrivingLocked--;
		
		PopScheduleState(scope);
		if (!CloseAITrainScope(scope))
			return null;

		return junctionPermit;
	}



	bool HasTrainBeforeJunction(JunctionBase junction)
	{
		Vehicle frontVehicle = GetVehicles()[0];
		GSTrackSearch search = frontVehicle.BeginTrackSearch(frontVehicle.GetDirectionRelativeToTrain());

		MapObject first, obj;

		obj = search.SearchNext();
		first = obj;

		
		while (1)
		{
			if (!obj)
			{
				Interface.Log("Train.HasTrainBeforeJunction> didn't find junction before end of track");

					// pretend that we found one, since we don't really know what's going on here.
				return true;
			}

			if (cast<Vehicle> obj)
					// we found a Vehicle before we got to the junction
				return true;

			if (obj == junction.GetMapObject())
					// we got to the junction before finding a Vehicle
				return false;
			

			obj = search.SearchNext();

			// sanity check
			if (obj == first)
			{
				Interface.Log("Train.HasTrainBeforeJunction> found track loop prior to junction?");

					// pretend that we found one, since we don't really know what's going on here.
				return true;
			}
		}
			
			// we never get here.
		return false;
	}

	

	//
	// If DIRECTION_NONE is specified, the junction will swap to whichever direction first
	// becomes available.
	//
  bool CommandNavigateJunction(JunctionBase junction, int direction, bool alreadyAtJunction, bool inStuckThread)
  {
    Message msg;
		
		float oldThrottle = GetDCCThrottle();

		if (!alreadyAtJunction)
		{
				// if we're still in this junction from an earlier schedule, we'd better clear it first.
				// otherwise we wont be able to get a permit, and swapping it would cause us to derail anyway.
			if (IsStillInJunction(junction) and HasReachedJunctionInnerRadius(junction))
			{
				Interface.Log("Train.CommandNavigateJunction> forcing CMD_COMPLETE_JUNCTIONS (" + GetTrainDisplayName() + " on " + junction.GetDebugString() + ")");
				
				if (!CommandCompleteJunctions())
					return false;
				

				//
				// Now that we've gone through the junction, determine that we are in fact on the 
				// correct side for the maneuver we are about to attempt.
				//
				int trainDirection = junction.GetDirectionToTrain(me);
				if (trainDirection == Junction.DIRECTION_BACKWARD)
				{
					if (direction == Junction.DIRECTION_BACKWARD)
					{
						// we're on the wrong side of the junction... oops!
						Interface.Log("Train.CommandNavigateJunctions> CCJ left us on the wrong side of the junction");
						return false;
					}
				}
				else if (trainDirection != Junction.DIRECTION_NONE)
				{
					if (direction != Junction.DIRECTION_BACKWARD  and  direction != Junction.DIRECTION_NONE)
					{
						// we're on the wrong side of the junction... oops!
						Interface.Log("Train.CommandNavigateJunctions> CCJ left us on the wrong side of the junction");
						return false;
					}
				}
				else
				{
					// uhhh.. ok? :-)
					Interface.Log("Train.CommandNavigateJunctions> unable to determine train relation to junction");
					return false;
				}
			}
			
			// ceeb040429: don't take a junction early if there is a train between us and the junction.
			if (HasTrainBeforeJunction(junction))
			{
				Interface.Log("Train.CommandNavigateJunction> there is a train between us and the next junction");

				if (!DriveToJunction(junction))
					return false;
			}
			
			BeginDriveToJunction(junction);
			//if (!DriveToJunction(junction))
			//	return false;
		}
		else
		{
			SetAutopilotMode(CONTROL_SCRIPT);
			SetDCCThrottle(0);
		}


		/*if (direction == Junction.DIRECTION_NONE)
		{
				// check that 'DIRECTION_NONE' is safe, otherwise use 'DIRECTION_BACKWARD'
			int fromDirection = junction.GetDirectionToTrain(me);
			if (fromDirection != Junction.DIRECTION_BACKWARD)
				direction = Junction.DIRECTION_BACKWARD;
		}*/
		
		bool otherSide = false;
		
		// We want 'direction' to reflect which way the Junction should switch,
		// regardless of which way the train is moving through it.
		if (direction == Junction.DIRECTION_NONE or direction == Junction.DIRECTION_BACKWARD)
		{
		  // We don't have a stated goal. See which way we are approaching to see if we
		  // can make any meaning of this.
		  int fromDirection = junction.GetDirectionToTrain(me);
		  
		  if (fromDirection == Junction.DIRECTION_BACKWARD)
		  {
		    // If we don't have a goal in mind, and we're coming up to a junction,
		    // we use the junction's current direction and hope for the best..
		    direction = junction.GetDirection();
		  }
		  else if (fromDirection == Junction.DIRECTION_NONE)
		  {
		    // We failed to resolve where we are relative to the junction.
		    Interface.Log("Train.CommandNavigateJunctions> Unable to determine junction direction relative to train.");
		    return false;
		  }
		  else
		  {
		    // Otherwise, we want the Junction to point at us so that we can cross safely.
		    direction = fromDirection;
		    otherSide = true;
		  }
		}

    JunctionPermitInfo info = new JunctionPermitInfo();
    info.junction = junction;
    info.direction = direction;
    info.otherSide = otherSide;
    info.inStuckThread = inStuckThread;

    if (junction.GetDirection() != direction and junction.GetJunctionOwner())
    {
      // Cannot alter owned junctions, avoid a script exception by not changing
      // the junction but attempt to resolve the situation by notifying the owner
      Interface.Log("Train.CommandNavigateJunction> Junction is owned and cannot be altered.");
      PostMessage(junction.GetJunctionOwner(), "Schedule", "Blocked", 0);
      return true;
    }

    if (!GetJunctionTrackPermit(info))
      return false;

    Permit junctionPermit = GetJunctionPermit(info);
    if (!junctionPermit)
      return false;


    // switch the junction and update our held permits
  retrySwitchForTrain:

    if (!junction.SetDirection(null, info.direction))
    {
      // Unable to set junction! We're just stuck, somehow..
      return false;
    }


    RecordTrackPermit(info.trackPermit);
    RecordJunctionPermit(junctionPermit, junction);
    
    if (!alreadyAtJunction)
    {
      if (!DriveToJunction(junction))
        return false;
    }
    
    // restore our previous throttle setting- 
    //  hopefully we can continue on at line speed. if we can't, the autopilot
    //  should take care of that in short order.
    if (oldThrottle > GetDCCThrottle())
      SetDCCThrottle(oldThrottle);

    // release the lock on the track we just left, but keep the new track permanently
    //m_currentTrackPermit = newTrackPermit;

    return true;
  }


	bool CommandNavigateTrack(Track track)
	{
		SetAutopilotTarget(track);

			// ceeb040407: the default is 3.f; let's not slow down quite that much
		SetAutopilotTargetMinimumDistance(20.f);
		SetAutopilotTargetMinimumSpeed(5.f);



		// stop the train, initially
		
			// train should be stopped already?
			//SetAutopilotMode(CONTROL_SCRIPT);
			//SetDCCThrottle(0);
		
		// and wait on a permit

		Permit permit = track.RequestPermitForTrain(me);
		Permit existingPermit = MatchExistingTrackPermit(permit);
		if (existingPermit)
		{
			PromoteTrackPermit(existingPermit);
			//RecordTrackPermit(m_currentTrackPermit);
			//m_currentTrackPermit = existingPermit;
			lastVisitedTrack = track;
			lastVisitedTrackPermit = existingPermit;
			return true;
		}
		
			// if we are permitted to couple up with a SPECIFIED train, then we will
			// "borrow" this permit from them if they hold it.
		if (m_schedule.limitCouplingTo)
		{
			// sanity- dont couple if its running a schedule
			if (!m_schedule.limitCouplingTo.m_schedule)
			{
				existingPermit = m_schedule.limitCouplingTo.MatchBlockingTrackPermit(permit);
				if (existingPermit)
				{
					RecordTrackPermit(existingPermit);
					lastVisitedTrack = track;
					lastVisitedTrackPermit = existingPermit;
					
					return true;
				}
			}
		}

		AITrainScope scope = OpenAITrainScope();
		PushScheduleState(scope, SS_TRACK, null);
		m_scheduleDrivingLocked ++;

		if (IsStopped())
			BeginAITrainStuck(scope);

		Message msg;

		wait()
		{
		on "Permit", "Granted":
			if (permit.WasGranted())
				break;
			continue;

    on "Schedule", "Abort":
			m_scheduleDrivingLocked --;
			PopScheduleState(scope);
			return false;

		on "Train", "StoppedMoving", msg:
			if (msg.src == me)
				BeginAITrainStuck(scope);
			continue;

		on "Train", "StartedMoving", msg:
			if (msg.src == me)
				if (!EndAITrainStuck(scope))
				{
					PopScheduleState(scope);
					m_scheduleDrivingLocked --;
					return false;
				}
			continue;
		}

		m_scheduleDrivingLocked--;

		
		// then continue

		RecordTrackPermit(permit);

		lastVisitedTrack				= track;
		lastVisitedTrackPermit	= permit;
		
		PopScheduleState(scope);
		if (!CloseAITrainScope(scope))
			return false;

		return true;
	}



  bool CommandStopAtTrigger(Trigger trigger, float time)
  {
		SetAutopilotTarget(cast<Trackside> trigger);

    if(!CommandOnTrigger(trigger, 1)) 
			return false;
    if(!CommandStopTrain(time))
			return false;
		
		SetAutopilotTarget( null );
    return true;
  }



  bool CommandOnAnnouncement(string state)
  {
    Message msg;

    if (!Timetable.OnAnnouncement(state, GetId()))
    {
      wait()
      {
        on "Timetable", "", msg :
        {
          if(msg.minor == state)
            break;
          continue;
        }
        on "Schedule", "Abort":
          return false;
      }
    }
    return true;
  }



  bool CommandSetSignal(GameObjectID signalId, int state, string reason)
  {
    if (!signalId)
    {
      Interface.Exception("Train.RunSchedule> CMD_SET_SIGNAL: Signal ID not set");
      return false;
    }

    Signal signal = cast<Signal>(World.SynchronouslyLoadGameObjectByID(signalId));
    if (!signal)
    {
      Interface.Exception("Train.RunSchedule> CMD_SET_SIGNAL: Signal not found: " + signalId.GetDebugString());
      return false;
    }

    return signal.SetSignalState(null, state, reason);
  }



  bool CommandStopTrain(float time)
  {
    AITrainScope scope = OpenAITrainScope();
    PushScheduleState(scope, SS_STOP, null);

    if(!IsStopped())
    {
      wait()
      {
        on "Train", "StoppedMoving" :
          break;

        on "Schedule", "Abort":
          PopScheduleState(scope);
          return false;
      }
    }

    if (time > 0)
    {
      PostMessage(me, "Train", "Tick", time);
      wait()
      {
        on "Train", "Tick" :
          break;
        on "Schedule", "Abort":
          PopScheduleState(scope);
          return false;
      }
    }

    PopScheduleState(scope);
    if (!CloseAITrainScope(scope))
      return false;

    return true;
  }



  bool CommandOnTrigger(Trigger trigger, int direction)
  {
    Message msg;

    SetAutopilotMode(Train.CONTROL_AUTOPILOT);
    trigger.ReEnter(me.GetGameObjectID());

    if(direction)
    {
      wait()
      {
        on "Trigger", "Enter", msg:
        {
          if(msg.src == trigger)
            break;
          continue;
        }
        on "Schedule", "Abort": return false;
      }
    }
    else
    {
      wait()
      {
        on "Trigger", "Leave", msg:
        {
          if(msg.src == trigger)
            break;
          continue;
        }
        on "Schedule", "Abort": return false;
      }
    }

    SetAutopilotMode(CONTROL_SCRIPT);
    StopTrainGently();//SetDCCThrottle(0);

    return true;
  }


	//! Determines if the given MapObject is in front of this Train within the specified distance.
	//
	// Param:  obj       Object to search four in front of this train.
	// Param:  maxRange  Maximum distance to limit the search by.
	//
	// Returns:
	//     Returns true if <i obj> is logically forward of this train, within the specified distance,
	//     false otherwise.
	//
	public bool MapObjectIsInFront(MapObject obj, float maxRange)
	{
		MapObject[] list = TrackSearch(true, maxRange);
		int i;

		for (i = 0; i < list.size(); i++)
			if (list[i] == obj)
				return true;

		return false;
	}

	//! Determines if the given MapObject is in front of this Train within the specified distance.
	//
	// Param:  obj       Trackside object to search for in front of this train.
	// Param:  maxRange  Maximum distance to limit the search by.
	//
	// Returns:
	//     Returns true if <i obj> is logically forward of this train, within the specified distance,
	//     false otherwise.
	//
	public bool TracksideIsInFront(Trackside obj, float maxRange)
	{
	  return MapObjectIsInFront(cast<MapObject>(obj), maxRange);
	}



  bool CommandStopAtScenery(Buildable p_scenery)
  {
    Message msg;
    bool okay = true;

    SetAutopilotMode(Train.CONTROL_AUTOPILOT);

    SetAutopilotTarget(p_scenery, "");
    SetAutopilotTargetMinimumSpeed(5.f);
    SetAutopilotTargetMinimumDistance(20.f);

    p_scenery.ReEnter(me.GetGameObjectID());

    Vehicle[] vehicles = GetVehicles();
    int i;
    for (i = 0; i < vehicles.size(); ++i)
      Sniff(vehicles[i], "SceneryTrigger", null, true);

    float oldAdvisoryLimit = GetAdvisoryLimit();

    AITrainScope scope = OpenAITrainScope();
    if (IsStopped())
      BeginAITrainStuck(scope);

    wait()
    {
      on "SceneryTrigger", "Enter", msg:
      {
        if (msg.src == p_scenery)
        {
          MarkAdvisoryLimit();
          SetAdvisoryLimit(5.0f);
          SetLastVisitedBuildable(p_scenery);
        }
        continue;
      }

      on "SceneryTrigger", "InnerEnter", msg:
      {
        if (msg.src == p_scenery)
        {
          // if we have a lastVisitedTrack set, only stop once we are on it
          if (lastVisitedTrack and !TestTrackPermit(lastVisitedTrackPermit, true))
          {
            Interface.Log("  CommandStopAtScenery> not on 'lastVisitedTrack', continuing");
            continue;
          }

          SetLastVisitedBuildable(p_scenery);
          break;
        }

        Interface.Log("  CommandStopAtScenery> SceneryTrigger, InnerEnter");
        Interface.Log("  src=" + (cast<GameObject>(msg.src)).GetDebugName());
        Interface.Log("  didnt match scenery " + p_scenery.GetDebugName());
        continue;
      }


      on "Schedule", "Abort":
        Interface.Log("CommandStopAtScenery> Schedule, Abort");
        okay = false;
        break;

      on "Train", "StoppedMoving", msg:
      {
        if (msg.src == me)
          BeginAITrainStuck(scope);

        continue;
      }

      on "Train", "StartedMoving", msg:
      {
        if (msg.src == me)
        {
          if (!EndAITrainStuck(scope))
          {
            okay = false;
            break;
          }
        }

        continue;
      }

      on "Junction", "Enter", msg:
      {
        JunctionBase junction = cast<JunctionBase>(msg.src);

        if (MapObjectIsInFront(junction.GetMapObject(), 200.0f))
        {
          if (!AIJunctionEnter(junction))
          {
            okay = false;
            break;
          }
        }

        // just in case we have entered the scenery object..
        p_scenery.ReEnter(me.GetGameObjectID());
        continue;
      }
    }

    if (!CloseAITrainScope(scope))
      return false;


    for (i = 0; i < vehicles.size(); ++i)
      Sniff(vehicles[i], "SceneryTrigger", null, false);

    SetAutopilotMode(CONTROL_SCRIPT);
    StopTrainGently();


    RevertAdvisoryLimit();
    SetAdvisoryLimit(oldAdvisoryLimit);
    return okay;
  }


  bool CommandDriveToTrackMark(TrackMark trackMark, bool stopAtTrackmark)
  {
    Message msg;
    bool okay = true;

    SetAutopilotMode(Train.CONTROL_AUTOPILOT);
    trackMark.ReEnter(me.GetGameObjectID());

    if (stopAtTrackmark)
      SetAutopilotTarget(cast<Trackside> trackMark);

    AITrainScope scope = OpenAITrainScope();
    if (IsStopped())
      BeginAITrainStuck(scope);

    wait()
    {
      on "TrackMark", "Enter", msg:
      {
        if (msg.src == trackMark)
          break;
        continue;
      }

      on "Train", "StoppedMoving", msg:
      {
        if (msg.src == me)
          BeginAITrainStuck(scope);

        continue;
      }

      on "Train", "StartedMoving", msg:
      {
        if (msg.src == me)
          if (!EndAITrainStuck(scope))
            return false;

        continue;
      }

      on "Schedule", "Abort":
        return false;
    }

    if (!CloseAITrainScope(scope))
      return false;

    SetAutopilotTarget(null);
    SetAutopilotMode(CONTROL_SCRIPT);
    StopTrainGently();//SetDCCThrottle(0);

    return okay;
  }


  // Helper function for CommandCompleteJunctions, removes junctions on leave
  bool UpdateCommandCompleteJunctionsList(GameObjectID[] junctionIDs, object msgSrc)
  {
    GameObject junctionObject = cast<GameObject>(msgSrc);
    if (!junctionObject)
      return false;

    int i = junctionIDs.size();

    while (--i >= 0)
    {
      if (junctionIDs[i].DoesMatch(junctionObject.GetGameObjectID()))
      {
        junctionIDs[i, i+1] = null;
        Interface.Log("Train.UpdateCommandCompleteJunctionsList> Released: " + junctionObject.GetDebugName() + ", " + junctionIDs.size() + " remain");
        return true;
      }
    }

    Interface.Log("Train.UpdateCommandCompleteJunctionsList> Not found: " + junctionObject.GetDebugName());
    return false;
  }

  
  // Helper function for CommandCompleteJunctions, logs any remaining junctions
  void LogCommandCompleteJunctionsList(string debugString, GameObjectID[] junctionIDs)
  {
    string junctionList = "";

    int i;
    for (i = 0; i < junctionIDs.size(); i++)
      junctionList = junctionList + "'" + junctionIDs[i].GetDebugString() + "', ";

    Interface.Log("Train.LogCommandCompleteJunctionsList> (" + debugString + ") " + junctionList);
  }


	bool AIJunctionEnter(JunctionBase junction)
	{
		if (IsStillInJunction(junction))
			return true;

		Interface.Log("Train.AIJunctionEnter> " + GetTrainDisplayName() + " encountered " + junction.GetDebugString() + " - calling NavigateJunction");
		
		float oldDCCThrottle = GetDCCThrottle();


		if (!CommandNavigateJunction(junction, Junction.DIRECTION_NONE/*direction*/, true, false))
			return false;


		Interface.Log("continuing after AIJunctionEnter ...");
		SetDCCThrottle(oldDCCThrottle);
		SetAutopilotMode(Train.CONTROL_AUTOPILOT);

		return true;
	}
	

	
	//
	// Pass <force> as true if you believe that the train is "stuck".
	// Pass <force> as false if you are just calling this function as a precaution.
	//
	bool AITrainStoppedMoving(bool force)
	{
		JunctionBase junction = GetAutopilotStopJunctionBase();
		if (!junction)
		{
			Interface.Log("Train.AITrainStoppedMoving> Autopilot didnt report a stop junction (force=" + force + ")");
			return true;
		}


		if (IsStillInJunction(junction))
		{
			Interface.Log("Train.AITrainStoppedMoving> Already hold permit for autopilot stop " + junction.GetDebugString());

			// If this junction is owned we'll never be able to change it, so we may
			// as well just abort and hope that it gets released/set later.
			if (junction.GetJunctionOwner())
			{
				Interface.Log("Train.CommandNavigateJunction> Junction is owned and cannot be altered.");
				PostMessage(junction.GetJunctionOwner(), "Schedule", "Blocked", 0);
				return false;
			}

			int direction = junction.GetDirectionToTrain(me);
			if (direction == Junction.DIRECTION_BACKWARD)
				direction = junction.GetDirection();
			else
				direction = Junction.DIRECTION_BACKWARD;

			if (!junction.SwitchForTrain(null, me, direction))
				return false;

			return true;
		}


		Interface.Log("Train.AITrainStoppedMoving> Navigating " + junction.GetDebugString());

		// pick a 'random' safe direction
		int direction = junction.GetDirectionToTrain(me);
		if (direction == Junction.DIRECTION_BACKWARD)
			direction = 1000; // Junction.DIRECTION_NONE;
		else
			direction = Junction.DIRECTION_BACKWARD;

		if (!CommandNavigateJunction(junction, direction, true, true))
			return false;
		
		// if we went through CommandNavigateJunction(), the chances are that it's
		// stopped the train by setting it to CONTROL_SCRIPT. We don't actually know what the
		// main thread is trying to do at this point in time, but since we're being asked to
		// kickstart the train, hopefully they want the train moving..
		SetAutopilotMode(Train.CONTROL_AUTOPILOT);

		return true;
	}
	

  //
  //
  // Train Scoping and "stuck" logic
  //
  //


  int aiTrainStuck = 0;
  bool aiTrainStuckThread = false;


  thread void ThreadAITrainStuck(void)
  {
    float timer = 1.0f;
    int scheduleTimeout = 0;

    ClearMessages("Train.ThreadAITrainStuck", "Tick");

    while (aiTrainStuck)
    {
      PostMessage(me, "Train.ThreadAITrainStuck", "Tick", timer);

      timer = 5.0f;
      wait()
      {
        on "Train.ThreadAITrainStuck", "Touch":
        break;

        on "Train.ThreadAITrainStuck", "Tick":
        scheduleTimeout++;
        break;
      };


      if (aiTrainStuck)
      {
        if (GetAutopilotMode() == CONTROL_AUTOPILOT)
        {
          AITrainStoppedMoving(false);

          // In case we failed and got set to stopped, or similar..
          if (aiTrainStuck)
            SetAutopilotMode(CONTROL_AUTOPILOT);

          if (scheduleTimeout > 3)
          {
            if (!IsStopped())
            {
              // This is not really a good thing to have happen, so lets
              // warn about it so people will notice if it happens too often.
              Interface.Log("Train.ThreadAITrainStuck> marked 'stuck' while train is moving?");
            }

            // Abandon schedule to force a retry
            if (m_schedule)
            {
              Vehicle frontVehicle = GetVehicles()[0];
              GSTrackSearch sigSearch = frontVehicle.BeginTrackSearch(frontVehicle.GetDirectionRelativeToTrain());

              // If we're blocked by an owned Signal make sure it knows we're here
              MapObject nextObj;
              while (nextObj = sigSearch.SearchNext())
              {
                Signal signal = cast<Signal>(nextObj);
                if (signal and signal.GetSignalState() == Signal.RED and signal.GetSignalOwner())
                  PostMessage(signal, "Signal", "Train Approaching", 0);

                if (sigSearch.GetDistance() > 100)
                  break;
              }

              StopSchedule();
            }
          }
        }
        else
        {
          scheduleTimeout = 0;
        }
      }
      else
      {
        scheduleTimeout = 0;
      }
    }

    aiTrainStuckThread = false;

    PostMessage(me, "Train.ThreadAITrainStuck", "Done", 0);

    // Legacy support, do not rely on this message as it will eventually be removed
    Router.LegacyBroadcastMessage(me, "Train.ThreadAITrainStuck", "Done", 0.0f, true);
  }


	bool TerminateAITrainStuck(void)
	{
		if (!aiTrainStuckThread)
			return true;

		PostMessage(me, "Train.ThreadAITrainStuck", "Touch", 0.0f);
		Message msg;
		
		while (aiTrainStuckThread)
		{
			wait()
			{
			on "Train.ThreadAITrainStuck", "Done", msg:
				if (msg.src == me)
					break;
				continue;

			on "Schedule", "Abort":
				return false;
			}
		}

		return true;
	}


	public void BeginAITrainStuck(AITrainScope scope)
	{
		if (!scope)
		{
			Exception("Train.BeginAITrainStuck> null scope");
			return;
		}
		if (scope.trainScopeIndex != trainScopeIndex)
		{
			Interface.Log("Train.BeginAITrainStuck> scope out of date");
			return;
		}
		if (scope.aiTrainIsStuck)
			return;
		scope.aiTrainIsStuck = true;
		

		aiTrainStuck++;

		if (!aiTrainStuckThread)
		{
			aiTrainStuckThread = true;
			ThreadAITrainStuck();
		}
	}

	public bool EndAITrainStuck(AITrainScope scope)
	{
		if (!scope)
		{
			Exception("Train.EndAITrainStuck> null scope");
			return false;
		}
		if (!scope.aiTrainIsStuck)
			return true;
		if (scope.trainScopeIndex != trainScopeIndex)
		{
			Interface.Log("Train.EndAITrainStuck> scope out of date");
			return false;
		}
		scope.aiTrainIsStuck = false;

		if (aiTrainStuck == 0)
		{
			Exception("Train.EndAITrainStuck> negative ref count");
			return false;
		}

		aiTrainStuck--;
		
		if (!aiTrainStuck)
			if (!TerminateAITrainStuck())
				return false;

		return true;
	}


	public AITrainScope OpenAITrainScope(void)
	{
		AITrainScope scope = new AITrainScope();
		scope.trainScopeIndex = trainScopeIndex;
		return scope;
	}

	public bool CloseAITrainScope(AITrainScope scope)
	{
		return EndAITrainStuck(scope);
	}

	void ResetAITrainScope(void)
	{
		trainScopeIndex++;

		if (aiTrainStuck)
			Interface.Log("ResetAITrainScope> aiTrainStuck=" + aiTrainStuck);
		
		aiTrainStuck = 0;
		TerminateAITrainStuck();
	}
	

	///
	///
	///




  void AddJunctionPermitsToArray(Permit[] io_permits)
  {
    if (!io_permits)
      return;

    int i;
    for (i = 0; i < m_junctionPermits.size(); i++)
    {
      Permit permit = m_junctionPermits[i];

      if (!permit.IsGranted())
      {
        Interface.Log("Train.AddJunctionPermitsToArray> Permit not granted, skipping " + permit.GetDebugString());
        continue;
      }

      bool bAlreadyAdded = false;

      int j;
      for (j = 0; j < io_permits.size() and !bAlreadyAdded; j++)
        if (io_permits[j] == permit)
          bAlreadyAdded = true;

      if (!bAlreadyAdded)
      {
        Interface.Log("Train.AddJunctionPermitsToArray> Adding " + permit.GetDebugString());
        io_permits[io_permits.size()] = permit;
      }
    }
  }


  thread void ThreadAIJunctionEnter(JunctionBase junction)
  {
    if (!AIJunctionEnter(junction))
      PostMessage(me, "Train", "ThreadAITrainStoppedMovingFailed", 0.0f);
    else
      AddJunctionPermitsToArray(ccjCrossedJunctions);
  }


  bool CommandCompleteJunctions(void)
  {
    if (m_junctionPermits == null or m_junctionPermits.size() == 0)
    {
      //Interface.Log("CommandCompleteJunctions> No junctions to complete");
      return true;
    }

    Interface.Log("Train.CommandCompleteJunctions> BEGIN");

    bool okay = true;

    AITrainScope stuckScope = OpenAITrainScope();

    if (ccjRecursionDepth++ > 0)
    {
      // I believe this should no longer happen.
      Interface.WarnObsolete("Train.CommandCompleteJunctions> WARNING- RECURSION");
      okay = false;
      goto fail_ccj;
    }

    // Build a set of junction IDs from the current permits. These will be removed
    // as we progress through, when the array is empty the command is done.
    GameObjectID[] junctionIDs = new GameObjectID[m_junctionPermits.size()];

    int i;
    for (i = 0; i < m_junctionPermits.size(); i++)
    {
      junctionIDs[i] = m_junctionPermits[i].GetObject().GetGameObjectID();
      //Interface.Log("*** CommandCompleteJunctions>  jnid " + junctionIDs[i].GetDebugString());
    }

    if (!ccjCrossedJunctions)
      ccjCrossedJunctions = new Permit[0];
    AddJunctionPermitsToArray(ccjCrossedJunctions);


    float oldAdvisoryLimit = GetAdvisoryLimit();
    MarkAdvisoryLimit();

    SetAutopilotMode(Train.CONTROL_AUTOPILOT);
    SetAdvisoryLimit(10.0f);

    if (IsStopped())
      BeginAITrainStuck(stuckScope);

    Message msg;

    wait()
    {
      on "Junction", "Leave", msg:
      {
        UpdateCommandCompleteJunctionsList(junctionIDs, msg.src);
        if (junctionIDs.size() == 0)
        {
          Interface.Log("CommandCompleteJunctions> Junction, Leave - 0 permits remain");
          break;
        }

        LogCommandCompleteJunctionsList("Junction,InnerLeave", junctionIDs);
        continue;
      }

      on "Junction", "InnerLeave", msg:
      {
        UpdateCommandCompleteJunctionsList(junctionIDs, msg.src);
        if (junctionIDs.size() == 0)
        {
          Interface.Log("CommandCompleteJunctions> Junction, InnerLeave - 0 permits remain");
          break;
        }

        LogCommandCompleteJunctionsList("Junction,InnerLeave", junctionIDs);
        continue;
      }

      on "Train", "StoppedMoving", msg:
      {
        if (msg.src != me)
          continue;

        BeginAITrainStuck(stuckScope);
        continue;
      }

      on "Train", "StartedMoving", msg:
      {
        if (msg.src != me)
          continue;

        if (!EndAITrainStuck(stuckScope))
        {
          okay = false;
          break;
        }

        continue;
      }

      on "Schedule", "Abort":
      {
        Interface.Log("CommandCompleteJunctions> Schedule, Abort");
        okay = false;
        break;
      }

      on "Train", "ThreadAITrainStoppedMovingFailed":
      {
        // we're probably in too much trouble to continue..
        okay = false;
        break;
      }

      on "Junction", "Enter", msg:
      {
        JunctionBase junction = cast<JunctionBase>(msg.src);
        if (MapObjectIsInFront(junction.GetMapObject(), 200.0f))
          ThreadAIJunctionEnter(junction);

        //SetAutopilotMode(Train.CONTROL_AUTOPILOT);
        //SetAdvisoryLimit(5.0f);
        continue;
      }
    }

    Interface.Log("CommandCompleteJunctions> Done");

fail_ccj:

    if (!CloseAITrainScope(stuckScope))
      okay = false;

    SetAutopilotMode(CONTROL_SCRIPT);
    SetDCCThrottle(0);
    //RevertAdvisoryLimit();
    SetAdvisoryLimit(oldAdvisoryLimit);
    ccjRecursionDepth--;


    Interface.Log("*** CommandCompleteJunctions> END");


    // Since we've completed all the old junctions, and dont care about the new
    // junctions, lets just clear the inner flag on everything. This prevents
    // NavigateJunction() from issuing another CCJ immediately.
    if (m_junctionInner)
    {
      for (i = 0; i < m_junctionInner.size(); i++)
        m_junctionInner[i] = false;
    }

    return okay;
  }


	bool CommandDriveForever()
	{
    SetAutopilotMode(Train.CONTROL_AUTOPILOT);
		
		Message msg;
		

		AITrainScope trainScope = OpenAITrainScope();
		if (IsStopped())
			BeginAITrainStuck(trainScope);

    wait()
    {
			on "Train", "StoppedMoving", msg:
			{
				if (msg.src == me)
					BeginAITrainStuck(trainScope);
				
				continue;
			}

			on "Train", "StartedMoving", msg:
			{
				if (msg.src == me)
					if (!EndAITrainStuck(trainScope))
					{
						CloseAITrainScope(trainScope);
						return false;
					}
				
				continue;
			}

      on "Schedule", "Abort":
				Interface.Log("CommandDriveForever> Schedule, Abort");
				CloseAITrainScope(trainScope);
				return false;

			on "Junction", "Enter", msg:
			{
				JunctionBase junction = cast<JunctionBase>(msg.src);
				
				if (MapObjectIsInFront(junction.GetMapObject(), 200.0f))
					if (!AIJunctionEnter(junction))
						return false;

				continue;
			}
    }

		if (!CloseAITrainScope(trainScope))
			return false;


    SetAutopilotMode(CONTROL_SCRIPT);
    StopTrainGently();//SetDCCThrottle(0);
		return true;
	}


	bool ContainsVehicle(Vehicle vehicle)
	{
		Vehicle[] vehicles = GetVehicles();
		int i;

    for (i = 0; i < vehicles.size(); ++i)
			if (vehicles[i] == vehicle)
				return true;
		
		return false;
	}


	bool CommandCoupleVehicle(Vehicle vehicle)
	{
		Vehicle[] vehicles = GetVehicles();
		
			// are we already coupled?
		if (vehicle.GetMyTrain() == me)
			return true;
		
			// are we already touching the vehicle's train?
		Vehicle[] targetVehicles = vehicle.GetMyTrain().GetVehicles();
		if (vehicles[0].Couple(targetVehicles[0]))
			return true;
		if (vehicles[0].Couple(targetVehicles[targetVehicles.size()-1]))
			return true;
		if (vehicles[vehicles.size()-1].Couple(targetVehicles[0]))
			return true;
		if (vehicles[vehicles.size()-1].Couple(targetVehicles[targetVehicles.size()-1]))
			return true;


		AITrainScope scope = OpenAITrainScope();
		PushScheduleState(scope, SS_VEHICLE, vehicle.GetLocalisedName());


		SetAutopilotMode(Train.CONTROL_AUTOPILOT);
		//float oldAdvisorySpeedLimit = GetAdvisoryLimit();
		//SetAdvisoryLimit(1.78);


		int i;
		for (i = 0; i < vehicles.size(); ++i)
    {
			Sniff(vehicles[i], "Vehicle", "Coupled", true);
			Sniff(vehicles[i], "Vehicle", "BadCouple", true);
    }

		PostMessage(me, "Train", "CommandCoupleVehicleTimer", 2.0f);

		
		Message msg;

    wait()
    {
			on "Train", "CommandCoupleVehicleTimer", msg:
				if (msg.src != me)
					continue;

				if (!IsStopped())
					continue;

				// fall through to "Train", "StoppedMoving"
				goto fall_0;

			on "Train", "StoppedMoving", msg:
			{
				fall_0:;
				if (msg.src == me)
				{
					Train reason = GetAutopilotStopTrain();

					if (reason)
						if (reason.ContainsVehicle(vehicle))
						{
							//
							// this may need to be improved, possibly with extra code support:
							//
							SetAutopilotMode(Train.CONTROL_SCRIPT);
							SetDCCThrottle(Math.Sqrt(2.3/GetAITrainMaxSpeed()));
							continue;
						}
				}
				
				Interface.Log("Train.CommandCoupleVehicle> stop reason is not correct train");
				BeginAITrainStuck(scope);
				//PostMessage(me, "Train", "CommandCoupleVehicleTimer", 2.0f);
				continue;
			}

			on "Train", "StartedMoving", msg:
				{
					if (msg.src == me)
						if (!EndAITrainStuck(scope))
						{
							PopScheduleState(scope);
							return false;
						}
				}
				continue;

			on "Vehicle", "Coupled", msg:
				goto couple_0;
				
			on "Vehicle", "BadCouple", msg:
				couple_0:;
					// if we now contain the target vehicle, all is well!
				if (ContainsVehicle(vehicle))
				{
					Interface.Log("Train.CommandCoupleVehicle> success");
					PopScheduleState(scope);
					if (!CloseAITrainScope(scope))
						return false;

					//SetAdvisoryLimit(oldAdvisorySpeedLimit);
					return true;
				}

				if (!ContainsVehicle(cast<Vehicle>(msg.src)))
						// guess we picked up someone else's message
					continue;

					// otherwise.. what *did* we couple with?
				Interface.Log("Train.CommandCoupleVehicle> coupled with wrong train?");
				PopScheduleState(scope);
				return false;


      on "Schedule", "Abort":
				Interface.Log("CommandCoupleVehicle> Schedule, Abort");
				PopScheduleState(scope);
				return false;
		};
		

			// we never get here
		return false;
	}

	//
	bool CommandReverseTrain(bool force)
	{
		if (!CommandCompleteJunctions())
			return false;
		
		if (!CommandStopTrain(0.0f))
			return false;

		SetAutopilotMode(CONTROL_SCRIPT);
		SetDCCThrottle(0);

		
		//
		//   We need to trade our permit for a permit-in-reverse PRIOR to turning around.
		//
		//   Well - mostly. In some cases (e.g. coupling to the train that is behind us)
		//   we won't get that permit - so we just turn around anyway.
		//

    if(!force)
    {

			PostMessage(me, "Train", "CommandReverseTrain.Pulse", 20.0f);
			
			Permit[] permits = TakePermitOnTrack(false);
			
			if (permits.size())
			{
				Interface.Log("Train.CommandReverseTrain> waiting for permit upgrade");
				AITrainScope scope = OpenAITrainScope();
				PushScheduleState(scope, SS_TURNAROUND, null);

				while (permits.size())
				{
					//
					// Wait until at least one permit becomes granted.
					//
					wait()
					{
					on "Schedule", "Abort":
						return false;

					on "Permit", "Granted":
						break;

					on "Train", "CommandReverseTrain.Pulse":
						{
							// we've failed to obtain a permit to reverse. this will generally cause a deadlock situation.
							// abort!
							Interface.Log("Train.CommandReverseTrain> timed out");
							Interface.Print(strTable.GetString("interface-train-command-reverse"));

								// release any remaining ungranted permits
							ReleaseTrackPermits(permits);
							PopScheduleState(scope);

							return false;
						}
						break;
					};
					
					//
					// Remove any permits which have been granted.
					//
					int i;
					for (i = permits.size() - 1; i >= 0; i--)
						if (permits[i].IsGranted())
							permits[i, i+1] = null;
				}

				PopScheduleState(scope);
				if (!CloseAITrainScope(scope))
					return false;
				Interface.Log("Train.CommandReverseTrain> finished permit upgrade");
			}
		}

		//
		// All permits have been granted- clear to proceed.
		//
		Turnaround();

		return true;
	}
	
	
	//
	bool CommandReverseTrain(void)
	{
		return CommandReverseTrain(false);
	}



	//! Toggles the schedule window of this train.
	//
	// If the schedule window is already open/visible, this method will destroy it.  Otherwise if the 
	// view details window is not visible, UpdateScheduleWindow() is called to create it for display.
	//
	public void ToggleScheduleWindow(void)
	{
		if (timeTableInfo)
			timeTableInfo = null;
		else
			UpdateScheduleWindow(GetTrainDisplayName());
	}

	//! Determines if the schedule window of this train is visible.
	//
	// Returns:
	//     Returns true if the schedule window of this train is visible, false otherwise.
	//
	public bool IsScheduleWindowVisible(void)
	{
		return (timeTableInfo != null);
	}

  
  //
  //
  //
  public void UpdateScheduleWindow(string vehicleName)
  {
    if (vehicleName == "" and lastVehicleName != "")
      vehicleName = lastVehicleName;

    if (!timeTableInfo)
    {
      timeTableInfo = Constructors.NewBrowser();
      timeTableInfo.SetWindowRect(100, 100, 460, 285);
      Sniff(timeTableInfo, "Browser", "", true);
      Sniff(timeTableInfo, "Browser-URL", "", true);
    }

    string paramOutput = "<html><body>";
    paramOutput = paramOutput + "<p><b><font size=3 color=#FFFFFF>" + BrowserInterface.Quote(vehicleName) + "</font></b></p>";

    if (!expandSchedule)
      paramOutput = paramOutput + "<a href=live://property/toggleExpand>" + strTable.GetString("interface-train-schedule-update0") + "</a></font><BR><BR>";
    else
      paramOutput = paramOutput + "<font color=#FFFFFF><a href=live://property/toggleExpand>" + strTable.GetString("interface-train-schedule-update1") + "</a></font><BR><BR>";


    // Display a pretty consist ;)
    paramOutput = paramOutput + "<table border=1 bordercolor=#000000 cellpadding=0 cellspacing=0 bgcolor=#66666633>";
    paramOutput = paramOutput + "<tr>";

    Vehicle[] vehicles = GetVehicles();
    int i = 0;
    // Maximum V. For that Maximum V taste.
    int maxV = vehicles.size();
    if (maxV > 7)
      maxV = 7;
    for (i = 0; i < maxV; ++i)
    {
      KUID vehiclekuid;
      string vehicleicon;
      vehiclekuid = vehicles[i].GetAsset().GetKUID();
      vehicleicon = vehiclekuid.GetHTMLString();

      if (vehicles[i].GetDirectionRelativeToTrain())
        paramOutput = paramOutput + "<td><img kuid='" + vehicleicon + "' width=48 height=24></td>";
			else
        paramOutput = paramOutput + "<td><img kuid='" + vehicleicon + "' width=48 height=24 hflip></td>";
    }
    
    paramOutput = paramOutput + "</tr>";
    paramOutput = paramOutput + "</table>";

    paramOutput = paramOutput + "<table>";

    if (HasTrainTimetable())
    {
      // Get the time table and display it.
      TrainTimetable timetableMain = GetTrainTimetable();
      TrainTimetableItem[] timetables = timetableMain.GetCurrentTimetable(16);
      for (i = 0; i < timetables.size(); i++)
      {
        TrainTimetableItem timetable = null;

        if (!expandSchedule)
          timetable = timetableMain.GetCurrentTimetableItem();
        else
          timetable = timetables[i];

        string icon;
        string displayedTrackName = timetable.trackName;
        if (timetable.mode == TrainTimetableItem.MODE_INDUSTRY)
        {
          Industry industry;
          if (timetable.destinationID)
            industry = cast<Industry>(World.GetGameObjectByIDIfLoaded(timetable.destinationID));
          else
            industry = cast<Industry>(Router.GetGameObject(timetable.destinationName));
          if (industry)
          {
            icon = industry.GetAsset().GetKUID().GetHTMLString();
            displayedTrackName = HTMLWindow.GetHumanReadableNameFromTrackName(timetable.trackName, industry);
          }
          else
          {
            Asset asset = Constructors.GetTrainzAsset();
            icon = asset.LookupKUIDTable("drive-to").GetHTMLString();
          }
        }
        else if (timetable.mode == TrainTimetableItem.MODE_TRACKMARK)
        {
          Asset asset = Constructors.GetTrainzAsset();
          icon = asset.LookupKUIDTable("drive-to-trackmark").GetHTMLString();
        }
        
        paramOutput = paramOutput + "<tr><td width=5></td>";
        paramOutput = paramOutput + "<td><img kuid='" + icon + "' width=32 height=32> </td><td width=5></td>";
        paramOutput = paramOutput + "<td><font color=#FFFFFF size=2>" + BrowserInterface.Quote(timetable.destinationName) + "</font></td><td width=5></td>";
        paramOutput = paramOutput + "<td><font color=#FFFFFF>" + BrowserInterface.Quote(displayedTrackName) + "</font></td><td width=5></td>";
  
        paramOutput = paramOutput + "</tr><tr>";

        paramOutput = paramOutput + "<tr><td width=5></td>";
        paramOutput = paramOutput + "<td width=32></td>";
        paramOutput = paramOutput + "<td width=5></td>";
        paramOutput = paramOutput + "<td><font color=#FFFFFF>" + strTable.GetString1("interface-train-schedule-arrival", BrowserInterface.Quote(HTMLWindow.GetFloatAsTimeString(timetable.arrivalTime))) + "</font></td><td width=5></td>";
        paramOutput = paramOutput + "<td><font color=#FFFFFF>" + strTable.GetString1("interface-train-schedule-departure", BrowserInterface.Quote(HTMLWindow.GetFloatAsTimeString(timetable.departureTime))) + "</font></td><td width=5></td>";
        paramOutput = paramOutput + "</tr>";
      
        paramOutput = paramOutput + "<tr><td width=5></td><td colspan=2>";
        if (timetable.msgLateSent)
          paramOutput = paramOutput + HTMLWindow.MakeLink("", HTMLWindow.MakeImage("imgLate.tga", false, 32, 32), strTable.GetString1("interface-train-schedule-output0", GetTrainDisplayName()));
        if (timetable.arrivedAtDestination)
          paramOutput = paramOutput + HTMLWindow.MakeLink("", HTMLWindow.MakeImage("imgArrived.tga", false, 32, 32), strTable.GetString1("interface-train-schedule-output1", GetTrainDisplayName()));
        if (timetable.arriveEarly)
          paramOutput = paramOutput + HTMLWindow.MakeLink("", HTMLWindow.MakeImage("imgArrivedEarly.tga", false, 32, 32), strTable.GetString1("interface-train-schedule-output2", GetTrainDisplayName()));
        if (timetable.arrivedLate)
          paramOutput = paramOutput + HTMLWindow.MakeLink("", HTMLWindow.MakeImage("imgArrivedLate.tga", false, 32, 32), strTable.GetString1("interface-train-schedule-output3", GetTrainDisplayName()));
        if (timetable.departEarly)
          paramOutput = paramOutput + HTMLWindow.MakeLink("", HTMLWindow.MakeImage("imgDepartEarly.tga", false, 32, 32), strTable.GetString1("interface-train-schedule-output4", GetTrainDisplayName()));
        if (timetable.departOnTime)
          paramOutput = paramOutput + HTMLWindow.MakeLink("", HTMLWindow.MakeImage("imgDepartOnTime.tga", false, 32, 32), strTable.GetString1("interface-train-schedule-output5", GetTrainDisplayName()));
        paramOutput = paramOutput + "</td></tr>";

        // only do this once, then break, as we got the currentitem already ;)
        if (!expandSchedule)
          break;
            
      }

    }
    else
    {
      paramOutput = paramOutput + strTable.GetString1("vehicle_view_schedule", BrowserInterface.Quote(vehicleName));
    }

    paramOutput = paramOutput + "</table></body></html>";

    Asset asset = Constructors.GetTrainzAsset();
    Asset scheduleAsset = asset.FindAsset("schedule-rule");

    // Set if its fixed or resizable
    if (!expandSchedule)
    {
      timeTableInfo.SetWindowSize(460, 285);
      timeTableInfo.SetWindowGrow(460, 285, 460, 285);
    }
    else
      timeTableInfo.SetWindowGrow(460, 285, 460, 685);


    timeTableInfo.LoadHTMLString(scheduleAsset, paramOutput);

    lastVehicleName = vehicleName;

  }


  void UpdateTimetable(Message msg)
  {
    if (timeTableInfo)
      UpdateScheduleWindow(GetTrainDisplayName());
  }



	//
	// Vehicle "View Details" support
	//

	Browser viewDetailsBrowser;
	Vehicle viewDetailsVehicle;


	//! Updates the view details window (created by ViewDetails()) for this train.
	public void UpdateViewDetails(void)
	{
		if (!viewDetailsBrowser)
			return;

    string paramOutput = "<html><body>";
		DriverCharacter driver = GetActiveDriver();
		
		//
		// Driver icon and Train name
		//
		paramOutput = paramOutput + "<table><tr height=32>";
		if (driver)
			paramOutput = paramOutput + "<td><img kuid='" + driver.GetAsset().GetKUID().GetHTMLString() + "' width=32 height=32></td>";
		paramOutput = paramOutput + "<td><b><font size=3 color=#FFFFFF>" + BrowserInterface.Quote(GetTrainDisplayName()) + "</font></b></td>";
		paramOutput = paramOutput + "</tr></table>";
		
		//
    // Total mass of all the vehicles in tow.
		//
    Vehicle[] vehicles = GetVehicles();
    int i;
    float totalMass = 0.0;
    for (i = 0; i < vehicles.size(); i++)
      if (!vehicles[i].isclass(Locomotive))
        totalMass = totalMass + vehicles[i].GetMass();
		
		string weightStr = ((string)(int)(totalMass / 1000)) + " t";
    paramOutput = paramOutput + "<p><font color=#FFFFFF>" + strTable.GetString1("vehicle_view_details1", weightStr) + "</font></p>";

		//
		// Priority on track
		//
		paramOutput = paramOutput + "<p><font color=#FFFFFF>" + strTable.GetString("interface-train-view-details-priority") + "<a href='live://property/priority-number'>" + (string)GetTrainPriorityNumber() + "</a></font></p>";
		

    //
    // Headlight state
    //
		paramOutput = paramOutput + "<p><font color=#FFFFFF>" + strTable.GetString("vehicle_train_headlight") + "<a href='live://property/headlightstate'>";
    if (GetHeadlightState())
      paramOutput = paramOutput + strTable.GetString("bool_str_yesno_true") + "</a></font></p>";
    else
      paramOutput = paramOutput + strTable.GetString("bool_str_yesno_false") + "</a></font></p>";
		

		//
		// Train - Vehicle seperator
		//

		paramOutput = paramOutput + "<br><table bgcolor=#000000D0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table><br>";

		//
		// Vehicle Details
		//
		if (viewDetailsVehicle)
		{
			string quotedName = BrowserInterface.Quote(viewDetailsVehicle.GetLocalisedName());

			//
			// Vehicle icon and name
			//
			KUID kuid = viewDetailsVehicle.GetAsset().GetKUID();
			paramOutput = paramOutput + "<table><tr>";
			paramOutput = paramOutput + "<td><img kuid='" + kuid.GetHTMLString() + "' width=64 height=32></td>";
			paramOutput = paramOutput + "<td><font color=#FFFFFF><b>" + quotedName + "</b></font></td>";
			paramOutput = paramOutput + "</tr></table>";

			if (cast<Locomotive> viewDetailsVehicle)
			{
				paramOutput = paramOutput + "<p><font color=#FFFFFF>" + strTable.GetString("interface-train-view-details-locomotive") + "</font></p>";
				
				int state = GetScheduleState();
				if (state != SS_NONE)
				{
					string historyString = GetScheduleStateString();
					paramOutput = paramOutput + "<p><font color=#FFFFFF><i>" + BrowserInterface.Quote(historyString) + "</i></font></p>";
				}
			}

			//
			// Product Queues
			//
			paramOutput = paramOutput + "<table>";
			
			bool isEmpty = true;
			ProductQueue[] vehicleQueues = viewDetailsVehicle.GetQueues();
			for (i = 0; i < vehicleQueues.size(); i++)
			{
				ProductQueue vehicleQueue = vehicleQueues[i];
				Asset[] products = vehicleQueue.GetProductList();
				int l;
				for (l = 0; l < products.size(); l++)
				{
					paramOutput = paramOutput + HTMLWindow.GetPercentHTMLCode(null, vehicleQueue, products[l]);
					isEmpty = false;
				}
			}

			// Only report an empty queue if all queues are empty.
			if (isEmpty  and  (vehicleQueues.size() > 0))
				paramOutput = paramOutput + strTable.GetString1("vehicle_veiw_details2", quotedName);

			paramOutput = paramOutput + "</table>";
		}


		paramOutput = paramOutput + "</body></html>";
	  viewDetailsBrowser.LoadHTMLString(null, paramOutput);
	}

	//! Called by Vehicle::UpdateViewDetails() when it's load has changed so the train's detail window can be updated.
	//
	// Param:  vehicle  Vehicle that called this method.
	//
	public void UpdateViewDetails(Vehicle vehicle)
	{
		if (viewDetailsVehicle != vehicle)
			return;
		
		UpdateViewDetails();
	}

	// Called to update the view details window when something on the loco has changed like a driver.
	public void UpdateViewDetailsLocomotive(void)
	{
		if (!viewDetailsBrowser)
			return;

		if (!cast<Locomotive> viewDetailsVehicle)
			return;
		
		UpdateViewDetails();
	}


  //! Called by a Vehicle in this consist to display consist details of the entire train in a browser window.
  //
  // This method is called by Vehicle::ViewDetails() when the user has requested to view the details of the
  // consist.  It will create a Browser window listing information about the train including who the driver
  // character is and the loads of all vehicles.
  //
  // Param:  vehicle  Vehicle that called this method.
  //
  public void ViewDetails(Vehicle vehicle)
  {
    if (!viewDetailsBrowser)
    {
      viewDetailsBrowser = Constructors.NewBrowser();
      viewDetailsBrowser.SetWindowRect(100, 100, 360, 325);
      Sniff(viewDetailsBrowser, "Browser", "", true);
      Sniff(viewDetailsBrowser, "Browser-URL", "", true);
    }

    viewDetailsVehicle = vehicle;

    UpdateViewDetails();
  }


  //! Toggles the view details window displayed by ViewDetails().
  //
  // If the view details window is already open/visible, this method will destroy it.  Otherwise if the 
  // view details window is not visible, ViewDetails() is called to re-create it for display.
  //
  public void ToggleViewDetailsWindow(void)
  {
    if (viewDetailsBrowser)
    {
      Sniff(viewDetailsBrowser, "Browser", "", false);
      Sniff(viewDetailsBrowser, "Browser-URL", "", false);
      viewDetailsBrowser = null;
      viewDetailsVehicle = null;
    }
    else
    {
      ViewDetails(null);
    }
  }


  //! Determines if the view details window for this train is visible.
  //
  // Returns:
  //     Returns true if the view details window displayed by ViewDetails() is visible for this train, false otherwise.
  //
  public bool IsViewDetailsVisible(void)
  {
    return (viewDetailsBrowser != null);
  }



  // A message handler, which is called whenever a browser is closed.
  void BrowserClose(Message msg)
  {
    if (msg.src == viewDetailsBrowser)
    {
      Sniff(viewDetailsBrowser, "Browser", "", false);
      Sniff(viewDetailsBrowser, "Browser-URL", "", false);
      viewDetailsBrowser = null;
    }
    else if (msg.src == timeTableInfo)
    {
      Sniff(timeTableInfo, "Browser", "", false);
      Sniff(timeTableInfo, "Browser-URL", "", false);
      timeTableInfo = null;
    }
  }


  void BrowserClick(Message msg)
  {
    if (msg.src == null)
      return;
    
    if (msg.src == timeTableInfo)
    {
      expandSchedule = !expandSchedule;
      UpdateScheduleWindow(GetTrainDisplayName());
    }
		else if (msg.src == viewDetailsBrowser)
		{
			if (msg.minor == "live://property/priority-number")
			{
				SetTrainPriorityNumber( GetTrainPriorityNumber() % 3 + 1 );
				UpdateViewDetails();
			}
			if (msg.minor == "live://property/headlightstate")
			{
				SetHeadlightState( !GetHeadlightState() );
				UpdateViewDetails();
			}
			if (msg.minor == "live://property/highbeams")
			{
				(cast<Vehicle>GetFrontmostLocomotive()).SetHighBeams( !(cast<Vehicle>GetFrontmostLocomotive()).GetHighBeams() );
				UpdateViewDetails();
			}
		}
  }

	public void SetHighBeams(bool tvalue)
	{
		Vehicle[] carz = GetVehicles();
		int i;
		for (i = 0; i<carz.size(); i++)
		{
			carz[i].SetHighBeams(tvalue);
		}
	}

	public bool GetHighBeams()
	{
		return (cast<Vehicle>GetFrontmostLocomotive()).GetHighBeams();
	}
	

  //
  // Called when this Train has no vehicles left.
  // The Train is usually shut down shortly afterwards.
  //
  void TrainCleanup(Message msg)
  {
    if (m_junctionPermits)
      Interface.Log(" " + m_junctionPermits.size() + " junction permits");
    if (m_trackPermits)
      Interface.Log(" " + m_trackPermits.size() + " track permits");
    if (ccjCrossedJunctions)
      Interface.Log(" " + ccjCrossedJunctions.size() + " crossed junction permits");
    if (lastVisitedTrackPermit)
      Interface.Log(" Last visited track permit");
    if (m_schedule)
      Interface.Log(" Schedule");


    //
    // Release pretty much everything.
    // The most important thing is that the permits go away.
    //
    m_schedule = null;
    m_scheduleIndex = 0;
    m_junctionPermits = null;
    m_junctionInner = null;
    m_trackPermits = null;
    lastVisitedTrackPermit = null;
    lastVisitedTrack = null;
    ccjCrossedJunctions = null;
    lastVisitedScenery = null;
    m_lastVisitedSceneryFallback = null;

    // The schedule rule is responsible for cleaning this up;
    // If we remove it here, ClearTrainTimetable() will complain.
    // m_trainTimetable = null;
  }


	
	//
	// HANDLER for signal-passed-at-danger during schedule control.
	//
	void HandleSPAD(Message msg)
	{
		if (!m_schedule)
			// no schedule- nothing to do here
			return;
		
		if (m_schedule.releasePermitsWhenComplete)
			// old style schedule- don't activate this technique
			return;

		if (m_schedule.signalPassedAtDanger)
			// already handling a SPAD- don't recurse
			return;

		if (GetAutopilotMode() != CONTROL_AUTOPILOT)
			// train is not under autopilot control- we're not safe to intervene
			return;
		

		Interface.Log("Train.HandleSPAD> stopping train");
		Interface.Print(strTable.GetString1("interface-train-spad-print-abort", GetTrainDisplayName()));

		m_schedule.signalPassedAtDanger = true;
		PostMessage(me, "Schedule", "Abort", 0.0);
	}
	

	//
	// Called by RunSchedule() after a SPAD.
	// Stops the train and waits 10 seconds.
	//
	void HandleScheduleSPAD(void)
	{
		SetAutopilotMode(CONTROL_SCRIPT);
		SetDCCThrottle(0);

		if (!IsStopped())
		{
			wait()
			{
			on "Train", "StoppedMoving":
				break;

			on "Train", "Cleanup":
				break;
			}
		}

		Interface.Print(strTable.GetString1("interface-train-spad-print-stopped", GetTrainDisplayName()));
		
		//
		// Wait 2 minutes
		//
		Sleep(120.f);
	}
  
  
  // ============================================================================
  // Name: InterruptableLoadingSleep
  // Desc: Called by LoadProduct(), UnloadProduct(), and other parts of the
  //       Industry loading process. Sleeps for the specified number of seconds,
  //       or until a "BaseIndustry", "InterruptIndustryLoad" message is
  //       received on this Train.
  //       Since only a single "InterruptIndustryLoad" is sent, calling this
  //       function again after an interrupted sleep attempt will generally
  //       result in a successful sleep, even though the load was supposedly
  //       interrupted.
  // Parm: durationSec - The number of seconds to sleep for. If less than or
  //       eqaul to zero, this function returns 'true' immediately.
  // Retn: bool - True if the function slept for the specified duration, or false
  //       if the load was interrupted.
  // ============================================================================
  public bool InterruptableLoadingSleep(float durationSec)
  {
    // Interface.Log("Train.InterruptableLoadingSleep> duration=" + durationSec);
    
    bool bWasSuccessfulSleep = true;
    if (durationSec <= 0)
      return bWasSuccessfulSleep;
    
    // Try to avoid using the same message as somebody else, or one of us will be awoken prematurely.
    string loadingSleepMinorMessage = (string)Math.Rand(0, 100000000);
    
    // The current thread may not be on this object, so we'll need to sniff.
    Router.GetCurrentThreadGameObject().Sniff(me, "BaseIndustry", "InterruptIndustryLoad", true);
    Router.GetCurrentThreadGameObject().Sniff(me, "Train.InterruptableLoadingSleep", loadingSleepMinorMessage, true);
    
    //
    PostMessage(me, "Train.InterruptableLoadingSleep", loadingSleepMinorMessage, durationSec);
    Message msg;
    wait()
    {
      on "BaseIndustry", "InterruptIndustryLoad", msg:
        if (msg.dst == me)
        {
          bWasSuccessfulSleep = false;
          break;
        }
        continue;
      
      on "Train.InterruptableLoadingSleep", "", msg:
        if (msg.dst == me  and  msg.minor == loadingSleepMinorMessage)
        {
          break;
        }
        continue;
    }
    
    ClearMessages("Train.InterruptableLoadingSleep", loadingSleepMinorMessage);
    
    // Finish sniffing.
    Router.GetCurrentThreadGameObject().Sniff(me, "BaseIndustry", "InterruptIndustryLoad", false);
    Router.GetCurrentThreadGameObject().Sniff(me, "Train.InterruptableLoadingSleep", loadingSleepMinorMessage, false);
    
    // Interface.Log("Train.InterruptableLoadingSleep> duration=" + durationSec + " bWasSuccessfulSleep=" + bWasSuccessfulSleep);
    return bWasSuccessfulSleep;
  }


};
