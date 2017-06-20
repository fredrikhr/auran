//=============================================================================
// File: Vehicle.gs
// Desc: 
//=============================================================================
include "Train.gs"
include "TrackMark.gs"
include "gs.gs"
include "ProductQueue.gs"
include "LoadingReport.gs"
include "Industry.gs"
include "MeshObject.gs"
include "Common.gs"
include "TrainTimetable.gs"
include "GenericIndustry.gs"
include "common.gs"
include "Bogey.gs"
include "Cabin.gs"
include "library.gs"
include "HTMLBuffer.gs"



//=============================================================================
// Name: Vehicle
// Desc: The base script class for train vehicles (rolling stock and locos).
//       A Vehicle is *always* part of a Train. If a vehicle is decoupled and
//       left alone Trainz native code will automatically create a new Train
//       instance for it.
// Messages posted by Vehicle:
//       [ Major        | Minor           | Source          | Destination     ]
//       [====================================================================]
//       [ Vehicle      | Derailed        | Vehicle         | Vehicle         ]
//       [ Vehicle      | Coupled         | Vehicle         | Vehicle (other) ]
//       [ Vehicle      | Decoupled       | Vehicle         | Vehicle (other) ]
//       [ Vehicle      | BadCouple       | Vehicle         | Vehicle (other) ]
//       [ Vehicle      | Collided        | Vehicle         | Vehicle (other) ]
// Note: Coupling related messages are sent to both vehicles involved in the
//       couple. Use Message.src to get the other vehicle involved.
// Legacy messages, which will be phased out and should not be used:
//       [ Vehicle      | Derailed        | Vehicle         | Broadcast       ]
//       [ Vehicle      | Coupled         | Vehicle         | Broadcast       ]
//       [ Vehicle      | Decoupled       | Vehicle         | Broadcast       ]
//       [ Vehicle      | BadCouple       | Vehicle         | Broadcast       ]
//       [ Vehicle      | Collided        | Vehicle         | Broadcast       ]
//
// See also: Train.gs, Locomotive.gs, Trackside.gs
//=============================================================================
game class Vehicle isclass Trackside
{
	LinkedList linkedList = new LinkedList();

	//! \name   Coupler Flags
	//  \anchor coupFlags
	//@{
	//! Flags used for couplers.
	//
	// These flags are used to specify couplers on a vehicle and can be used to specify which couplers
	// in a vehicle to disable coupling or decoupling operations on.  They can refer to none, the front
	// coupler, the back coupler or both.
	//
	// Note:
	//     These flags are relative to the facing direction of the vehicle, <bi not> that of the Train.
	//
	// See Also:
	//     Vehicle::SetCouplingMask(), Vehicle::SetDecouplingMask(), Vehicle::Reposition(Vehicle,int,int),
	//     Vehicle::Reposition(Train,int,int), Train::SetCouplingMask(), Train::SetDecouplingMask()
	//

	public define int COUPLE_NONE = 0;    //!< Neither couplers.
	public define int COUPLE_FRONT = 1;   //!< Front coupler.
	public define int COUPLE_BACK = 2;    //!< Rear coupler.

	//! Both couplers.
	public define int COUPLE_BOTH = COUPLE_FRONT | COUPLE_BACK;

	//@}


	//! \name   Direction Relationships
	//  \anchor directRel
	//@{
	//! Used for describing relationships between entities.
	//
	// Note that <b DIRECTION_FORWARD> is guaranteed to be the negative of <b DIRECTION_BACKWARD>.
	//
	// See Also:
	//     Vehicle::GetCouplingDirection(), Vehicle::GetRelationToTrack()
	//

	public define int DIRECTION_NONE = 0;       //!< No known relationship between entities
	public define int DIRECTION_FORWARD = 1;    //!< Forward (same facing)
	public define int DIRECTION_BACKWARD = -1;  //!< Backward (opposite facing)

	//@}


	//! \name   Engine Types
	//  \anchor engineType
	//@{
	//! Constants that define the engine types a vehicle can be.
	//
	// See Also:
	//     Vehicle::GetEngineType()
	//

	public define int ENGINE_NONE = 0;      //!< Not a powered vehicle.
	public define int ENGINE_STANDARD = 1;  //!< Is a diesel, diesel-electric or electric powered engine.
	public define int ENGINE_STEAM = 2;     //!< Steam engine.

	//@}


	//! \name   Vehicle Types
	//  \anchor vehicleType
	//@{
	//! Vehicle type flags.
	//
	// These flags are returned by calling Vehicle::GetVehicleTypeFlags() and give information about
	// what the vehicle actually is.
	//
	// See Also:
	//     Vehicle::GetVehicleTypeFlags()
	//

	public define int TYPE_LOCOMOTIVE = 1;    //!< Vehicle is a powered engine.
	public define int TYPE_TENDER = 2;        //!< Vehicle carries fuel for a locomotive (i.e. a tender attached to a steam locomotive).
	public define int TYPE_HAS_INTERIOR = 4;  //!< Vehicle has interior.  Note that a vehicle does not have to be a Locomotive to have an interior.

	//@}

  StringTable strTable;

  Library     m_DAULib;

  bool        m_bIsPropertyEditInProgress = false;

  //! Information object that allows tracking of products and associated assets, queues etc.
  public IndustryProductInfoCollection vehicleProductInfoCollection = new IndustryProductInfoCollection();




  //! Called by %Trainz to initialize this Vehicle.
  //
  // This method is implemented in Vehicle so the following message handlers are setup:
  //  - ViewDetails() is called on the (<m"%MapObject">, <m "ViewDetails">) message.
  //  - UpdateViewDetails() is called on the (<m"Vehicle">, <m "LoadComplete">) message.
  //  - ViewSchedule() is called on a (<m"%MapObject">, <m "View-%Schedule">) message.
  //
  // Note:
  //     If overriding this method to perform your own custom vehicle initialization, <bi always> 
  //     call back to this parent method via the <l gscLangKeyInherit  inherited> keyword.
  //
  public void Init(void) 
  {      
    AddHandler(me, "MapObject", "View-Details", "ViewDetails");
    AddHandler(me, "Vehicle", "LoadComplete", "UpdateViewDetails");
    AddHandler(me, "MapObject", "View-Schedule", "ViewSchedule");
    AddHandler(me, "SceneryTrigger", "Enter", "SceneryTriggerEnter");

    AddHandler(me, "PropertyObject", "BeginEdit", "OnPropertyEditBegin");
    AddHandler(me, "PropertyObject", "EndEdit", "OnPropertyEditEnd");

    strTable = Constructors.GetTrainzStrings();

    vehicleProductInfoCollection.Init(me);
    
    Asset coreStringsAsset = Constructors.GetTrainzAsset();
    m_DAULib = TrainzScript.GetLibrary(coreStringsAsset.LookupKUIDTable("driver-achievements-updater-library"));
  }


	//! Gets the Train this vehicle belongs to.
	//
	// Note:
	//     All vehicles belong to a Train consist, even if a vehicle is solo without being coupled to
	//     any other vehicles, it is still a member of a consist (a consist with one vehicle though).
	//
	// Returns:
	//     Returns the Train consist this vehicle currently belongs to.
	//
	// See Also:
	//     Train::GetVehicles()
	//
	public native Train GetMyTrain(void);


	//! Get the forward direction of this vehicle relative to its Train.
	//
	// Returns:
	//     Returns true if the vehicle faces the same way as the Train, false otherwise.
	//
	public native bool GetDirectionRelativeToTrain(void);


	//! <bi BUGGY FUNCTION. OBSOLETE. DO NOT USE!>
	//
	// As an alternative, use GetDirectionRelativeToTrain() instead.  This function is only retained
	// for scenario backward compatibility reasons.
	//
	public obsolete bool GetFacingRelativeToTrain(void)
	{
		Interface.WarnObsolete("Vehicle.GetFacingRelativeToTrain> do not use this function");
		return !GetDirectionRelativeToTrain();
	}


	//! Gets the mass of this vehicle in kilograms.
	//
	// Returns:
	//     Returns the mass of this vehicle in kilograms.
	//
	public native float GetMass(void);

	

	
	public native bool GetDrainCocks(void);
		
	public native void ToggleDrainCocks(void);

	
	public native void SetDrainCocks(bool Ison);



  //! Gets the length of this vehicle.
  //
  // Returns:
  //     Returns the length of this vehicle in meters.
  //
  // See Also:
  //     \ref measureConv "Measurement Conversion Multipliers"
  //
  public native float GetLength(void);

  //! Gets the velocity of this vehicle in MPS (meters per second).
  //
  // This function provides the instantaneous velocity for this vehicle, which is good for physics
  // calculations but not good for human-readable display. If you want human-readable display, use
  // Train::GetSmoothedVelocity() instead.
  //
  // Note:
  //     For conversion formulas, see the \ref measureConv "Measurement Conversion Multipliers"
  //     constants.
  //
  // Returns:
  //     Returns the velocity of this vehicle.  A positive value means the vehicle is going forward
  //     while a negative value means the vehicle is going backward.
  //
  public native float GetVelocity(void);


  // ============================================================================
  // Name: GetOdometerDistance
  // Desc: Returns the total distance that this Vehicle has moved. No
  //       assumptions should be made regarding the starting value of the 
  //       odometer as this may change between vehicles, sessions, or Trainz 
  //       versions. This value is continuous under normal operation, however
  //       calls to SetOdometerDistance() may arbitrarily adjust the current
  //       value.
  // Retn: float - The number of meters that this Vehicle has moved.
  // ============================================================================
  public native float GetOdometerDistance(void);

  // ============================================================================
  // Name: SetOdometerDistance
  // Desc: Modify the odometer distance value as returned by 
  //       GetOdometerDistance(). This should typically be called only during 
  //       initial configuration of the Vehicle as changes during gameplay would 
  //       render the odometer value meaningless. This value is incremented by 
  //       native code as the Vehicle moves.
  // Parm: distance - The number of meters that this Vehicle has moved.
  // Note: During multiplayer games this function will only succeed on the server
  // ============================================================================
  public native void SetOdometerDistance(float distance);


  // ============================================================================
  // Name: GetTripMeterDistance
  // Desc: Returns the total distance that this Vehicle has moved during the
  //       current trip.
  // Retn: float - The number of meters that this Vehicle has moved.
  // ============================================================================
  public native float GetTripMeterDistance(void);

  // ============================================================================
  // Name: SetTripMeterDistance
  // Desc: Sets the total distance that this Vehicle has moved during the
  //       current trip. This value is incremented by native code as the
  //       Vehicle moves.
  // Parm: distance - The number of meters that this Vehicle has moved.
  // Note: During multiplayer games this function will only succeed on the server
  //       and owning clients
  // ============================================================================
  public native void SetTripMeterDistance(float distance);


  //! Sets the broken state of this vehicle's brakes.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  broken  Broken state to set the working state of this vehicle's brakes to.  If true,
  //                 brakes are broken, false for unbroken brakes.
  //
  public native void SetBrokenBrakes(bool broken);

  //! Sets the brake pipe efficiency of this vehicle.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  efficiency  Normalized value in the range of [0.0 - 1.0] where the lower the value,
  //                     less efficient the brake pipe is.
  //
  public native void SetBrakePipeEfficiency(float efficiency);


  //=============================================================================
  // Name: SetRunningNumber
  // Desc: Sets the running number of this vehicle
  // Parm: rn - The new vehicle running number (must be numeric)
  // Note: In multiplayer this will only succeed on the server and owning clients
  //=============================================================================
  public native void SetRunningNumber(string rn);

  //=============================================================================
  // Name: GetRunningNumber
  // Desc: Gets the running number of this vehicle
  //=============================================================================
  public native string GetRunningNumber();

  //=============================================================================
  // Name: HasRandomAutomaticRunningNumberSupport
  // Desc: Returns whether this traincars spec support the automatic generation
  //       random valid running numbers
  //=============================================================================
  public native bool HasRandomAutomaticRunningNumberSupport();

  //=============================================================================
  // Name: HasAutomaticRunningNumber
  // Desc: Returns whether this traincar has an automatic running number set
  // Retn: bool - true if the running number has been automatically set by native
  //       code, false if it's not set or has been set by the player/script
  //=============================================================================
  public native bool HasAutomaticRunningNumber();

  //=============================================================================
  // Name: SetRandomAutomaticRunningNumber
  // Desc: Generates an automatic running number for this traincar, if it's
  //       supported by the asset spec.
  // Note: Automatic running numbers are already generated in native when
  //       required. So this should only be called if requested directly by the 
  //       player (in the Surveyor traincar properties dialog for example). 
  //=============================================================================
  public native void SetRandomAutomaticRunningNumber();


	//! Sets the headlight color of this vehicle.
	//
	// This method controls the color of spotlight with the given RGB color components.  It does not 
	// affect the color of the headlight coronas.  This should method <bi never> be used to 
	// "turn off" the headlight, as even a black light will chew CPU time with lighting calculations.
	//
	// Param:  red    Red component value of headlight color.  Must be a normalized value in the range of [0.0 - 1.0].
	// Param:  green  Green component value of headlight color.  Must be in the range of [0.0 - 1.0].
	// Param:  blue   Blue component value of headlight color.  Must be in the range of [0.0 - 1.0].
	//
	public native void SetHeadlightColor(float red, float green, float blue);
	
	//! Sets the highbeams on/off for this vehicle.
	//
	// This method controls the highbeams of the headlight with the given bool.  
	//
	// Param:  HighBeamsOn    True if high Beams are to be turn on else false.
	//
	public native void SetHighBeams(bool HighBeamsOn);
	
	//! Gets wether the highbeams are on/off for this vehicle.
	//
	// This method returns the highbeams of the headlight state.  
	//
	// Returns:  bool    True if high Beams are on else false.
	//
	public native bool GetHighBeams();
	
	//! Sets the Ditch Flashing on/off for this vehicle.
	//
	// This method controls the flashing of the ditchlights with the given bool.  
	//
	// Param:  HighBeamsOn    True if flashing is to be turn on else false.
	//
	public native void SetIsDitchFlashing(bool IsFlashing);
	
	//! Gets wether the ditch flashing are on/off for this vehicle.
	//
	// This method returns weather there is flashing of the ditchlights.  
	//
	// Returns:  bool    True if flashing else false.
	//
	public native bool GetIsDitchFlashing();

	//! Repairs the front or back coupler depending on the value passed in.
	//
	// This method controls the Repairing the front or back coupler depending on the value passed in. 
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  isFront    True if the front coupler is to be repaired.
	//
	public native void RepairCoupler(bool isFront);

	//! Gets the automatic fireman state for this vehicle.
	//
	// Only makes sense for a steam loco (will return false in all other cases).
	//
	// Returns:  bool    True if automatic fireman is enabled, false otherwise.
	//
	public native bool GetAutomaticFiremanState();

	//! Sets the automatic fireman state for this vehicle.
	//
	// Only makes sense for a steam loco (will do nothing in all other cases).
	//
	// Param:  AutomaticFiremanEnabled    True if automatic fireman to be enabled, false otherwise.
	//
	public native void SetAutomaticFiremanState(bool AutomaticFiremanEnabled);

  //=============================================================================
  // Name: HasInteriorLight
  // Desc: Returns whether this vehicle has an interior light
  //=============================================================================
  public native bool HasInteriorLight();

  //=============================================================================
  // Name: GetInteriorLightState
  // Desc: Returns whether this vehicle's interior lights are on. If the vehicle
  //       does not have an interior light, this will return false.
  //=============================================================================
  public native bool GetInteriorLightState();

  //=============================================================================
  // Name: SetInteriorLightState
  // Desc: Sets whether this vehicle's interior lights are on. Interior lights
  //       are always on by default (if supported by the vehicle).
  // Note: In multiplayer this will only succeed on the server and owning clients
  //=============================================================================
  public native void SetInteriorLightState(bool interiorLightsOn);
  
  
  //=============================================================================
  // Name: GetBellState
  // Desc: Gets the state of the bell for this vehicle.
  // Retn: Returns true if the bell is ringing, false otherwise. Always returns
  //       false if no bell (horn sound) is specified for this vehicle. Note that
  //       a "silent" bell sound is considered a valid bell.
  //=============================================================================
  public native bool GetBellState(void);
  
  
  //=============================================================================
  // Name: SetBellState
  // Desc: Sets the state of the bell for this vehicle, activating sounds and
  //       effects as appropriate. This function will have no effect if this
  //       Vehicle has no bell (horn sound) specified.
  // Parm: bIsBellOn - True to ring bell, or false to silence bell.
  //=============================================================================
  public native void SetBellState(bool bIsBellOn);
  
  
  //=============================================================================
  // Name: HasBell
  // Desc: Returns true if a bell (horn sound) is specified for this vehicle.
  //       Note that a "silent" bell sound is considered a valid bell.
  //=============================================================================
  public native bool HasBell();
  
  

	//! Uncouple this vehicle from other given vehicle.
	//
	// Param:  other  Neighboring vehicle to uncouple from.  This will cause another Train object to
	//                be created (i.e. a new consist).  The current train object will remain on the
	//                section of train with the most drivers declared.
	//
	public native void Uncouple(Vehicle other);

	//! Uncouples this vehicle from another.
	//
	// Param:  direction   Is the direction of the neighboring vehicle to uncouple from.  This will
	//                     cause another Train object to be created.  The current Train object will
	//                     remain on the section of train with the most drivers declared.
	//
	public native void Uncouple(int direction);

	//! Gets the coupling direction of the given neighboring vehicle.
	//
	// Param:  other  Neighboring vehicle to get the coupling direction of.
	//
	// Returns:
	//     Returns the coupling direction of vehicle (in relation to this one).
	//
	public native int GetCouplingDirection(Vehicle other);

	//! Sets the coupling mask for this vehicle.
	//
	// Masking the coupling flags of a vehicle prevents the user from coupling to the masked
	// couplers.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  couplingMask  Coupling mask setting for this vehicle.  Can be any one of the 
	//                       \ref coupFlags "Coupler Flags" values.
	//
	// See Also:
	//     Train::SetCouplingMask(), \ref coupFlags "Coupler Flags"
	//
	public native void SetCouplingMask(int couplingMask);

	//! Stops the player being able to decouple consists.
	//
	// Masking the decoupling flags of a vehicle prevents the user from decoupling the masked
	// couplers.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Note:
	//     See the \ref coupFlags "Coupling Flags" section for details on how coupling and
	//     decoupling masks work.
	//
	// Param:  couplingMask  Decoupling mask setting for this vehicle.  Can be any one of the 
	//                       \ref coupFlags "Coupler Flags" values.
	//
	// See Also:
	//     Train::SetDecouplingMask(), \ref coupFlags "Coupler Flags"
	//
	public native void SetDecouplingMask(int couplingMask);


	//! Couples this vehicle to the given vehicle that is already adjacent to it.
	//
	// When a vehicle is decoupled from another, the couplers are left in an unlocked state, even 
	// though the vehicles are flush against each other.  This state will remain until the vehicles
	// move a small distance apart.  Sometimes you may wish to cause them to couple again which is
	// what this method is for.
	//
	// This method will cause this vehicle to couple to <i other> if they are already flush against
	// each other.  If they are not that close to each other, this method will have no effect.
	//
	// Param:  other  Adjacent vehicle to couple with this one.
	//
	// Returns:
	//     Returns true if the two vehicles were coupled successfully, or false otherwise.
	//
	public native bool Couple(Vehicle other);


	//! Take this vehicle out of its current train and create it as a new train at the given track mark.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  mark       Destination track mark.
	// Param:  direction  Desired direction relative to the track mark.  Use true to have the vehicle
	//                    face the same direction as the track mark, false to have the vehicle facing
	//                    the opposite way.
	//  
	// Returns:
	//     Returns true if successful, false otherwise.
	//
	public native bool Reposition(TrackMark mark, bool direction);

	//! Attaches this vehicle to the given vehicle at the specified couplers.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// For example, consider <m vehicle1> and <m vehicle2>:
	//
	//<code>
	//  //# couple vehicle1 to vehicle2, back to back. vehicle1 will be repositioned.
	//  vehicle1.Reposition(vehicle2, Vehicle.COUPLE_BACK, Vehicle.COUPLE_BACK);
	//</code>
	// 
	// This above code examples results in <m vehicle1> being repositioned and coupled up from rear
	// its rear to the back of <m vehicle2>.
	//
	// Param:  other                 Other vehicle to attach to.
	// Param:  myCoupleDirection     End of this vehicle that will be coupled to <i other> (use either
	//                               \ref coupFlags "COUPLE_FRONT" or \ref coupFlags "COUPLE_BACK").
	// Param:  otherCoupleDirection  End of <i other> that will be coupled to this vehicle (use either
	//                               \ref coupFlags "COUPLE_FRONT" or \ref coupFlags "COUPLE_BACK").
	//
	// Returns:
	//     Returns true if successful, false otherwise.
	//
	// See Also:
	//     \ref coupFlags "Coupler Flags"
	//
	public native bool Reposition(Vehicle other, int myCoupleDirection, int otherCoupleDirection);

	//! Attaches this vehicle to the given train at the specified couplers.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// For example, consider <m vehicle1> and <m train1>:
	//
	//<code>
	//  //# couple vehicle1 to vehicle2, back to back. vehicle1 will be repositioned.
	//  vehicle1.Reposition(vehicle2, Vehicle.COUPLE_BACK, Vehicle.COUPLE_BACK);
	//</code>
	// 
	// The above code example results in <m vehicle1> to be repositioned and coupled up from its rear
	// coupler to the back of <m train1>.
	//
	// Param:  train                 Other train to reposition this vehicle to attach to.
	// Param:  myCoupleDirection     End of this vehicle that will be coupled to <i train> (use either
	//                               \ref coupFlags "COUPLE_FRONT" or \ref coupFlags "COUPLE_BACK").
	// Param:  otherCoupleDirection  End of <i train> that will be coupled to this vehicle (use either
	//                               \ref coupFlags "COUPLE_FRONT" or \ref coupFlags "COUPLE_BACK").
	//
	// Returns:
	//     Returns true if successful, false otherwise.
	//
	// See Also:
	//     \ref coupFlags "Coupler Flags"
	//
	public native bool Reposition(Train train, int myCoupleDirection, int otherCoupleDirection);

	//! Reverses the direction of this vehicle in relation to its consist.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Returns:
	//     Returns true if successful, false otherwise.
	//
	public native bool Reverse();

	//! Gets the current brake cylinder pressure of this vehicle.
	//
	// Returns:
	//     Returns the brake cylinder pressure of this vehicle.
	//
	public native float GetBrakeCylinderPressure(void);

	//! Gets the current auxiliary reservoir pressure of this vehicle.
	//
	// Returns:
	//     Returns the current auxiliary reservoir pressure of this vehicle.
	//    
	public native float GetAuxReservoirPressure(void);

	//! Gets the current brake pipe pressure of this vehicle.
	//    
	// Returns:
	//     Returns the brake pipe pressure of this vehicle.
	//
	public native float GetBrakePipePressure(void);

	//! Enables/disables the pitch of this vehicle to be based on the track.
	// 
	// Param:  pitchBasedOnTrack  If true, pitch of this vehicle (up/down) will be based on the
	//                            track.  Default is false.
	//    
	public native void SetPitchBasedOnTrack(bool pitchBasedOnTrack);

	//! Sets the pitch of this vehicle based on its speed.
	//
	// Param:  multiplier   Value which will cause the vehicle to pitch based on its velocity.
	//
	public native void SetPitchBasedOnSpeed(float multiplier);

	//! Sets the roll of this vehicle based on the track.
	//
	// Param:  multiplier  Value which will cause the vehicle to roll based on track curve.
	//
	public native void SetRollBasedOnTrack(float multiplier);

	//! Sets the handbrake state for this vehicle.
	//
	// The handbrake should be used when leaving rolling stock (no locos) on slopes.
	//
	// Param:  applied  Handbrake state.  If true, the handbrake is applied, use false to release it.
	//
	public native void SetHandBrake(bool applied);

	// defunct; you can do this yourself if you really need to.
	// don't rely on a vehicle's queue(s) being called "load"
	//public ProductQueue GetProductQueue(void) { return GetQueue("load"); }

	//! Determines if this vehicle is in a tunnel.
	//
	// Returns:
	//     Returns true if this vehicle is in a tunnel, false otherwise.
	//
	public native bool IsInTunnel(void);

	//! Determines if this vehicle is on a bridge.
	//
	// Returns:
	//     Returns true if this vehicle is on a bridge, false otherwise.
	//
	public native bool IsOnBridge(void);

	//! Determines if this vehicle has derailed.
	//
	// Returns:
	//     Returns true if this vehicle has deraield, false otherwise.
	//
	public native bool IsDerailed(void);


	//! Gets the \ref engineType "engine type" of this vehicle.
	//
	// Returns:
	//     Returns one of the \ref engineType "engine type constants" indicating the engine type of
	//     this vehicle.
	//
	// See Also:
	//     \ref engineType "Engine Types"
	//
	public native int GetEngineType(void);

	//! Gets a flag set that define what type of vehicle this vehicle actually is.
	//
	// Returns:
	//     Returns a flag set as defined by the \ref vehicleType "Vehicle Types" that tells us what type
	//     of vehicle we have here.
	//
	public native int GetVehicleTypeFlags(void);

	//! Gets the gradient of the track this vehicle is currently on.
	//
	// Note:
	//     The vehicle's direction however may vary from the train's so the value returned here may 
	//     not necessarily match that of the train.  GetDirectionRelativeToTrain() can determine this
	//     for you.
	//
	// Returns:
	//     Returns the gradient of the track as a percentage.  The signs of the gradient is determined
	//     by the direction of this vehicle relative to the gradient.  A negative sign indicates that 
	//     the vehicle is facing down a gradient while a positive sign indicates the vehicle is facing
	//     up a gradient.
	//
	public native float GetTrackGradient(void);


	//! Gets the direction of this vehicle in relation to a track in a game object.
	//
	// The relation of a vehicle to the track is based on the vehicle's direction.  For example, if
	// the vehicle's forward direction is facing towards the track, then the vehicle is considered to
	// be forward relative to that track, hence \ref directRel "DIRECTION_FORWARD" will be returned.
	//
	// This method will work if the vehicle is on the track as specified by the arguments or on a
	// directly neighboring track, otherwise \ref directRel "DIRECTION_NONE" will be returned.
	//
	// Param:  obj        Object where <i trackName> can be found (e.g. an Industry).
	// Param:  trackName  Name of track section in <i obj> (an industry track for example).
	//
	// Returns:
	//     Returns either \ref directRel "DIRECTION_FORWARD" or \ref directRel "DIRECTION_BACKWARD" to
	//     indicate the relation between this vehicle and the track.  \ref directRel "DIRECTION_NONE"
	//     is returned if this vehicle is not located on <i trackName> or a directly neighboring track.
	//
	public native int GetRelationToTrack(Buildable obj, string trackName);


	//! Loads products into this vehicle as defined by the given report.
	//
	// This method works by attempting to transfer products to this vehicle's queues if possible from
	// the industry queue specified in <i report>.  The sequence of events for a loading operation as
	// performed by this method are:
	//  - Verify that an loading operation is possible with this vehicle by calling 
	//    CanLoadProductFromQueue().
	//  - BeginLoad() on this vehicle as well as Industry::BeginLoad() on the industry specified in 
	//    <i report> are called to perform any pre-loading events like animation or particles on the
	//    vehicle and industry respectively.  Both of these methods return the amount of time required
	//    for a load operation and this LoadProduct() method <l GameObject::Sleep  sleeps> for which
	//    ever of these returned time lengths is the longest.
	//  - The actual product transfer from the industry to the vehicle is performed by calling
	//    ProductQueue::TransferProductFrom() on this vehicle's queue(s).
	//  - GetLoadTime() on this vehicle as well as Industry::GetLoadTime() on the industry are called.
	//    Again, LoadProduct() <l GameObject::Sleep  sleeps> for which ever is the longest returned
	//    length of time.
	//  - EndLoad() on this vehicle and Industry::EndLoad() on the industry are called to perform any
	//    post-loading events.  As before, LoadProduct() <l GameObject::Sleep  sleeps> for which ever
	//    is the longest returned length of time.
	//
	// Param:  report  LoadReport defining the destination queue in an Industry to load from well as
	//                 the type and quantity of product to load.
	//
	// Returns:
	//     Returns true if this vehicle was successfully loaded with one or more products, false 
	//     otherwise.
	//
	// See Also:
	//     Industry::BeginLoad(), Industry::GetLoadTime(), Industry::EndLoad(), 
	//     LoadingReport::GetSrcIndustry(), ProductQueue::TransferProductFrom()
	//
	public bool LoadProduct(LoadingReport report);


	//! Unloads products from this vehicle as defined by the given report.
	//
	// This method works by attempting to transfer products from this vehicle's queues to the industry
	// queue specified in <i report> if possible.  The sequence of events for an unloading operation
	// as performed by this method are:
	//  - Verify that an actual unloading operation is possible with this vehicle by calling 
	//    CanUnloadProductToQueue().
	//  - BeginUnload() on this vehicle as well as Industry::BeginUnload() on the industry specified
	//    in <i report> are called to perform any pre-unloading events like animation or particles on
	//    the vehicle and industry respectively.  Both of these methods return the amount of time 
	//    required for an unload operation and this UnloadProduct() method <l GameObject::Sleep  sleeps> 
	//    for which ever of these returned time lengths is the longest.
	//  - The product transfer from the vehicle to the industry is performed by calling
	//    ProductQueue::TransferProductFrom() on this industry's destination queue.
	//  - GetUnloadTime() on this vehicle as well as Industry::GetUnloadTime() on the industry are
	//    called.  Again, UnloadProduct() <l GameObject::Sleep  sleeps> for which ever is the longest
	//    returned length of time.
	//  - EndUnload() on this vehicle and Industry::EndUnload() on the industry are called to perform
	//    any post-unloading events.  As before, UnloadProduct() <l GameObject::Sleep  sleeps> for
	//    which ever is the longest returned length of time.
	//
	// Param:  report  LoadReport defining the destination queue in an Industry to unload to as well
	//                 as the type and quantity of product to unload.
	//
	// Returns:
	//     Returns true if this vehicle has successfully unloaded one or more products, false otherwise.
	//
	// See Also:
	//     Industry::BeginUnload(), Industry::GetUnloadTime(), Industry::EndUnload(), 
	//     LoadingReport::GetDstIndustry(), ProductQueue::TransferProductFrom()
	//
	public bool UnloadProduct(LoadingReport report);


  //! Returns whether this vehicle has been loaded/unloaded since it last stopped
  //
  // Returns:
  //     bool - true if the train has been loaded/unloaded since it last "stopped", false otherwise
  //
  public native bool HasLoadedThisStop();
  public native bool HasUnloadedThisStop();


  //! Sets whether this vehicle has been loaded/unloaded since it last stopped
  //
  // Param:
  //     bool - true if the train has been loaded/unloaded since it last "stopped", false otherwise
  //
  native void SetHasLoadedThisStop(bool hasLoaded);
  native void SetHasUnloadedThisStop(bool hasUnloaded);


	//! Gets the maximum tractive effort of this vehicle in Newtons (N).
	//
	// Note:
	//     See the SetMaximumTractiveEffort() method for details on the maximum tractive effort of a vehicle.
	//
	// Returns:
	//     Returns the current maximum tractive effort of this vehicle in Newtons (N).
	//
	public native float GetMaximumTractiveEffort(void);

	//! Sets the maximum tractive effort of this vehicle in Newtons (N).
	//
	// The maximum tractive effort of a vehicle refers to its maximum traction or pulling power that 
	// it is capable of in Newtons (N).  This value is initially defined in the configuration of
	// a vehicle asset but can be altered with this method.  Generally, only locomotives will have 
	// tractive effort.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  maxTE   Maximum tractive effort of this vehicle in expressed in Netwons (N).
	//
	public native void SetMaximumTractiveEffort(float maxTE);

	//! Gets the default maximum tractive effort of this vehicle from its configuration in Newtons (N).
	//
	// Note:
	//     See the SetMaximumTractiveEffort() method for details on the maximum tractive effort of a vehicle.
	//
	// Returns:
	//     Returns the default maximum tractive effort of this vehicle as defined in its configuration
	//     in Newtons (N).  This returned value will refer to the asset's configuration and will
	//     be unaffected by the any changes applied to this particular vehicle object via 
	//     SetMaximumTractiveEffort().
	//
	public native float GetDefaultMaximumTractiveEffort(void);

	//! Gets the wheelslip traction multiplier value.
	//
	// Note:
	//     See the SetWheelslipTractionMultiplier() method for details on the wheelslip traction 
	//     multiplier value.
	//
	// Returns:
	//     Returns the wheelslip traction multiplier value that will be in the range of [0.0 - 1.0].
	//
	public native float GetWheelslipTractionMultiplier(void);

	//! Sets the wheelslip traction multiplier value of this vehicle.
	//
	// The wheelslip traction multiplier value refers to how much the occurrence of wheelslip affects
	// this vehicle's traction.  It is a scalar value that reduces this vehicle's tractive effort when
	// experiencing wheelslip.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  multiplier  Factor to modify the traction of this vehicle when experiencing wheelslip.
	//                     Must be in the range of [0.0 - 1.0].
	//
	public native void SetWheelslipTractionMultiplier(float multiplier);
	
	//! Gets the wheelslip momentum multiplier value.
	//
	// Note:
	//     See the SetWheelslipMomentumMultiplier() method for details on the wheelslip momentum 
	//     multiplier value.
	//
	// Returns:
	//     Returns the wheelslip traction multiplier value that will be in the range of [0.0 - 1.0].
	//
	public native float GetWheelslipMomentumMultiplier(void);

	//! Sets the wheelslip momentum multiplier value of this vehicle.
	//
	// The wheelslip momentum multiplier value refers to how much the occurrence of wheelslip affects
	// this vehicle's momentum.  If set to 0.3 then 30% of the force generated will help the loco still 
	// move forward.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  multiplier  Factor to modify the momentum of this vehicle when experiencing wheelslip.
	//                     Must be greater then 0.
	//
	public native void SetWheelslipMomentumMultiplier(float multiplier);

	//! Gets the sanding traction multiplier value.
	//
	// Note:
	//     See the SetSandingTractionMultiplier() method for details on the sanding traction multiplier value.
	//
	// Returns:
	//     Returns the wheelslip traction multiplier value which will be greater than or equal to 1.0.
	//
	public native float GetSandingTractionMultiplier(void);

	//! Sets the sanding traction multiplier.
	//
	// The sanding traction multiplier value refers to how much switching on sanding affects this 
	// vehicle's tractive effort.  It is a scalar value that increases this vehicle's tractive effort
	// when sanding has been switched on.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  multiplier  Multiplier value to increase vehicle traction with when sanding is turned on.
	//                     Must be >= to 1.0.
	//
	public native void SetSandingTractionMultiplier(float multiplier);

	//! Gets the traction multiplier value.
	//
	// Note:
	//     See the SetTractionMultiplier() method for details on the traction multiplier value.
	//
	// Returns:
	//     Returns the traction multiplier value which will be greater than 0.0.
	//
	public native float GetTractionMultiplier(void);

	//! Sets the traction multiplier.
	//
	// The traction multiplier value refers to how much when running normally affects this 
	// vehicle's tractive effort.  It is a scalar value that increases this vehicle's tractive effort
	// when sanding has been switched off.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  multiplier  Multiplier value to increase vehicle traction with when sanding is turned on.
	//                     Must be > to 0.0.
	//
	public native void SetTractionMultiplier(float multiplier);

	//! Gets the maximum coupler compression stress value for this vehicle.
	//
	// Note:
	//     See the SetMaximumCouplerCompressionStress() method for a description of what this vehicle 
	//     parameter is about.
	//
	// Returns:
	//     Returns the maximum coupler compression stress value for this vehicle in Newtons (N).
	//     A value of 0.0 indicates that there is no coupler breakage on this vehicle.
	//
	public native float GetMaximumCouplerCompressionStress(void);

	//! Sets the maximum coupler compression stress value for this vehicle.
	//
	// This value refers to the maximum compression stress in Newtons (N) this vehicle's couplers
	// need to experience before they break.  This is effectively incoming force a coupler can 
	// withstand before it breaks.  As a point of reference, a typical modern knuckle-type coupler can
	// handle approximately 2500 kN of force before breaking
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  maxCouplerCompressionStress  Maximum stress compression stress in Newtons (N).
	//                                      Use 0.0 for no breakage.
	//
	public native void SetMaximumCouplerCompressionStress(float maxCouplerCompressionStress);

	//! Gets the default maximum coupler compression stress value for this vehicle.
	//
	// Note:
	//     See the SetMaximumCouplerCompressionStress() method for a description of what this vehicle
	//     parameter is about.
	//
	// Returns:
	//     Returns the maximum coupler compression stress value for this vehicle.  This returned value
	//     will refer to the asset's configuration and will be unaffected by the any changes applied 
	//     to this particular vehicle object via SetMaximumCouplerCompressionStress().
	//
	public native float GetDefaultMaximumCouplerCompressionStress(void);

	//! Gets the maximum coupler expansion stress value for this vehicle in Newtons (N).
	//
	// Note:
	//     See the SetMaximumCouplerExpansionStress() method for a description of what this vehicle
	//     parameter is about.
	//
	// Returns:
	//     Returns the maximum expansion stress in Newtons (N), or 0.0 for no breakage.
	//
	public native float GetMaximumCouplerExpansionStress(void);

	//! Sets the maximum coupler expansion stress value for this vehicle.
	//
	// The maximum coupler expansion stress value defines the maximum stress in Newtons (N)
	// requried for the couplers to break when being pulled on.  A typical modern knuckle-type coupler
	// can handle approximately 2500 kN of force before breaking (which is the default setting used by
	// the <l astSrcRuleVehicPhys  Vehicle Physics> rule.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  maxCouplerExpansionStress  Maximum expansion stress value in Newtons (N).
	//
	public native void SetMaximumCouplerExpansionStress(float maxCouplerExpansionStress);

	//! Gets the default maximum coupler expansion stress value for this vehicle in Newtons (N).
	//
	// Note:
	//     See the SetMaximumCouplerExpansionStress() method for a description of what this vehicle 
	//     parameter is about.
	//
	// Returns:
	//     Returns the default maximum coupler expansion stress value for this vehicle in Newtons (N).
	//     This returned value will refer to the asset's configuration and will be unaffected by the any
	//     changes applied to this particular vehicle object via SetMaximumCouplerExpansionStress().
	//
	public native float GetDefaultMaximumCouplerExpansionStress(void);


	//! Gets the maximum velocity at which this vehicle can be coupled to without breaking a coupler.
	//
	// Note:
	//     See the SetMaximumCoupleVelocity() method for details on what this parameter is about.
	//
	// Returns:
	//     Returns the maximum delta velocity in meters/sec, or 0.0 for no coupler breakage above a 
	//     certain velocity.
	//
	public native float GetMaximumCoupleVelocity(void);

	//! Sets the maximum speed at which this vehicle can be coupled to without breaking a coupler.
	//
	// This value refers to the maximum speed this vehicle can be coupled at without breaking a 
	// coupler.  When an attempt to couple with this vehicle at a velocity greater than 
	// <i maxCoupleVelocity> is made, the (<m"Vehicle">, <m "BadCouple">) broadcast message is 
	// generated.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Param:  maxCoupleVelocity  Maximum delta velocity in \ref measureConv "meters per second".  Use
	//                            0.0 for no <m"BadCouple"> messages.
	//
	public native void SetMaximumCoupleVelocity(float maxCoupleVelocity);

	//! Gets the default maximum speed at which this vehicle can be coupled to without breaking the coupler.
	//
	// Note:
	//     See SetMaximumCoupleVelocity() for further details on what this value means.
	//
	// Returns:
	//     Returns the default maximum coupler velocity value for this vehicle in MPS (meters per 
	//     second).  This setting is part of the vehicle's configuration and can't be changed via 
	//     SetMaximumCoupleVelocity().
	//
	public native float GetDefaultMaximumCoupleVelocity(void);

	//! Gets the coupling stress between this vehicle and another vehicle.
	//
	// Param:  toVehicle  Other vehicle in the same consist as this vehicle to calculate the coupling
	//                    stress load between.
	//
	// Returns:
	//     Returns the coupling stress between this vehicle and <i toVehicle> in Newtons (N).
	//     
	// See Also:
	//     Train::GetMaximumCouplingStressVehicle()
	//
	public native float GetCouplingStress(Vehicle toVehicle);

	//! Enables/disables coupler breaking on this vehicle.
	//
	// This method allows coupler breakage to be either be switched on or off.
  //
  // Note: During multiplayer games this function will only succeed on the server and owning clients
	//
	// Note:
	//     Once you break a coupler, you can't repair it.
	//
	// Param:  enabled  Coupler breakage enabled state.  If true, this vehicle well have coupler breakage
	//                  false for no coupler breakage.
	//
	public native void SetCouplerBreakageEnabled(bool enabled);

	//! Determines of coupler breakage is enabled on this vehicle.
	//
	// Returns:
	//     Returns true if coupler breakage is enabled on this vehicle, false otherwise.
	//
	public native bool GetCouplerBreakageEnabled(void);

	//! Sets the cabin sway level for this vehicle.
	//
	// This method controls the amplitude of the cabin sway effect as seen from the internal cabin 
	// view.  It will not affect the vehicle from any other views.
	//
  // Param:  amount  Level of cabin sway to apply to this vehicle that is >= 0.0.  A value of 0.0
	//                 means no cabin sway.  The cabin sway will increase with higher positive values.
	//
	// Note:
	//     It is probably a waste of time using this method for vehicles without cabins or interiors.
	//
	public native void SetCabinSwayAmount(float amount);

	//! Gets the cabin sway amount for this vehicle.
	//
	// Note:
	//     See the SetCabinSwayAmount() method for details on cabin sway.
	//
	// Returns:
	//     Returns the cabin sway amount for this vehicle.  Higher positive values indicate higher 
	//     levels of cabin sway while a 0.0 indicates no cabin sway.
	//
	public native float GetCabinSwayAmount(void);

	//! Gets the default cabin sway factor for this vehicle.
	//
	// Note:
	//     See the SetCabinSwayAmount() method for details on cabin sway.
	//
	// Returns:
	//     Returns the default cabin sway factor for this vehicle as defined in its configuration.
	//     Higher positive values indicate higher levels of cabin sway while 0.0 indicates no cabin
	//     sway be default.
	//
	public native float GetDefaultCabinSwayAmount(void);


  //=============================================================================
  // Name: GetEngineAsset
  // Desc: Returns an engine asset for this Vehicle
  //=============================================================================
  public native Asset GetEngineAsset();


  //=============================================================================
  // Name: GetDefaultEngineAsset
  // Desc: Returns the default engine for this specific Vehicle as specified by
  //       the asset config.txt file. If the asset doesn't specify an engine
  //       (e.g. unpowered rolling stock) a default builtin Asset is returned.
  //=============================================================================
  public native Asset GetDefaultEngineAsset();


  //=============================================================================
  // Name: SetEngineAsset
  // Desc: Sets the engine asset for this Vehicle. This will cause much of the
  //       vehicle physics to be reinitialised, and should thus be avoided at
  //       times when the Vehicle may be in motion (i.e. only in Surveyor or the
  //       Vehicle.Init() function).
  //=============================================================================
  public native void SetEngineAsset(Asset newEngineAsset);


	//! Gets the value of the named engine parameter.
	//
	// Engine parameter strings you can use with this method are:
	//  - <m"brake-cylinder-pressure">
	//  - <m"brake-pipe-pressure">
	//  - <m"coal-mass">
	//  - <m"current-drawn">
	//  - <m"equaliser-pressure">
	//  - <m"fire-temperature">
	//  - <m"flow">
	//  - <m"horn">
	//  - <m"main-reservoir-pressure">
	//  - <m"max-coal-mass">
	//  - <m"max-fire-temperature">
	//  - <m"no3-pipe-pressure">
	//  - <m"steam-boiler-liquid-percent">
	//  - <m"steam-boiler-pressure">
	//  - <m"steam-piston-cycle">
	//  - <m"wheelslip">
	//  - <m"engine-force">
	//  - <m"applied-force">
	//  - <m"max-te">
	//
	// These strings correspond to engine properties as described elsewhere in documents such as
	// the Content Creation Guide (CCG).  Some apply to steam locomotives only.
	//
	// Param:  p_paramName  Name of the parameter to get the value of.
	//
	// Returns:
	//     Returns the value of <i p_paramName> if possible.
	//
	public native float GetEngineParam(string p_paramName);

	//! Gets a list of all the bogeys this vehicle has.
	//
	// Returns:
	//     Returns the bogeys this vehicle has in an array.  This array contains references to each
	//     Bogey instance this vehicle has.
	//
	public native Bogey[] GetBogeyList(void);


	//! Call-back method to perform custom activities before this vehicle is unloaded.
	//
	// This method is called by UnloadProduct() to perform any custom activities required before
	// unloading such as activating particles or starting animation.  Implementing this method in
	// a vehicle script is not compulsory, but is essential if such custom activity is desired.
	//
	// Param:  report  Report on the current state of the unloading operation.
	//
	// Returns:
	//     The amount of time needed in seconds for how long this custom activity runs for should be
	//     returned.  For example, the length of an audio file or animation that may have been played
	//     would be an appropriate return value.
	//
	// See Also:
	//     UnloadProduct(), Industry::BeginUnload()
	//
	float BeginUnload(LoadingReport report)
	{
		// override this to provide customised animation support

    //SetMeshAnimationState("left-door", true);
    //SetMeshAnimationState("right-door", true);

		return 0.0;
	}

	//! Call-back method to perform custom activities after this vehicle is unloaded.
	//
	// This method is called by UnloadProduct() to perform any custom activities required after
	// unloading such as activating particles or starting animation.  Implementing this method in a
	// vehicle script is not compulsory, but is essential if such custom activity is desired.
	//
	// Param:  report  Report on the current state of the unloading operation.
	//
	// Returns:
	//     The amount of time needed in seconds for how long this custom activity runs for should be
	//     returned.  For example, the length of an audio file or animation that may have been played
	//     would be an appropriate return value.
	//
	// See Also:
	//     UnloadProduct(), Industry::EndUnload()
	//
	float EndUnload(LoadingReport report)
	{
		// override this to provide customised animation support

    //SetMeshAnimationState("left-door", false);
    //SetMeshAnimationState("right-door", false);

		return 0.0;
	}

	//! Gets the amount of time needed to unload this vehicle.
	//
	// This method is called by UnloadProduct() to determine how long the unloading operation should
	// take in seconds.  Custom events like animation and particles could also be handled in an 
	// overridden implementation.
	//
	// Param:  report  Report on the current state of the unloading operation.
	//
	// Returns:
	//     Returns the amount of needed for the unloading operation in seconds.
	//
	// See Also:
	//     UnloadProduct(), Industry::GetUnloadTime()
	//
	float GetUnloadTime(LoadingReport report)
	{
		// default- unload for at least 1 second
		return 1.0;
	}


	//! Call-back method to perform custom activities before this vehicle is loaded.
	//
	// This method is called by LoadProduct() to perform any custom activities required before loading
	// such as activating particles or starting animation.  Implementing this method in a vehicle 
	// script is not compulsory, but is essential if such custom activity is desired.
	//
	// Param:  report  Report on the current state of the loading operation.
	//
	// Returns:
	//     The amount of time needed in seconds for how long this custom activity runs for should be
	//     returned.  For example, the length of an audio file or animation that may have been played
	//     would be an appropriate return value.
	//
	// See Also:
	//     LoadProduct(), Industry::BeginLoad()
	//
	float BeginLoad(LoadingReport report)
	{
		// override this to provide customised animation support
		// often loading can be left to the industry
		
		return 0.0;
	}

	//! Call-back method to perform custom activities after this vehicle is loaded.
	//
	// This method is called by LoadProduct() to perform any custom activities required after loading 
	// such as deactivating particles or stopping animation.  Implementing this method in a vehicle
	// script is not compulsory, but is essential if such custom activity is desired.
	//
	// Param:  report  Report on the current state of the loading operation.
	//
	// Returns:
	//     The amount of time needed in seconds for how long this custom activity runs for should be
	//     returned.  For example, the length of an audio file or animation that may have been played
	//     would be an appropriate return value.
	//
	// See Also:
	//     LoadProduct(), Industry::EndLoad()
	//
	float EndLoad(LoadingReport report)
	{
		// override this to provide customised animation support
		// often loading can be left to the industry
		
		return 0.0;
	}

	//! Gets the amount of time needed to load this vehicle.
	//
	// This method is called by LoadProduct() to determine how long the loading operation should take
	// in seconds.  Custom events like animation and particles could also be handled in an overridden
	// implementation.
	//
	// Param:  report  Report on the current state of the loading operation.
	//
	// Returns:
	//     Returns the amount of needed for the loading operation in seconds.
	//
	// See Also:
	//     LoadProduct(), Industry::GetLoadTime()
	//
	float GetLoadTime(LoadingReport report)
	{
		// default- load for at least 1 second
		return 1.0;
	}


  //! Protected member to set the product filter.
  //
  // See Also:
  //     ProductFilter
  //
  native void SetProductRestrictionFilter(ProductFilter filter);


  //! Restricts this vehicle to only allow the given product.
  //
  // When a product restriction is in effect, only that product may be either 
  // <l LoadProduct()  loaded> or <l UnloadProduct()  unloaded>.
  //
  // Note:
  //     This method overrides any previous call to SetProductDisabled().
  //
  // Param:  product  Product to restrict this vehicle's load to.  If null, any product compatible
  //                  with this vehicle can be loaded/unloaded.  If it is a product that is not
  //                  compatible with this vehicle, no restriction is set and false will be 
  //                  returned.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  // See Also:
  //     ProductFilter
  //
  public bool SetProductRestriction(Asset product)
  {
    if (!product)
    {
      SetProductRestrictionFilter(null);
      return true;
    }

    //
    // Check validity
    //
    bool valid = false;
    ProductQueue[] vehicleQueues = GetQueues();
    int i;
    for (i = 0; i < vehicleQueues.size(); i++)
    {
      ProductQueue vehicleQueue = vehicleQueues[i];
      ProductFilter filter = vehicleQueue.GetProductFilter();

      if (filter.DoesAcceptProduct(product))
        valid = true;
    }

    if (!valid)
      return false;

    //
    // Set restriction
    //
    ProductFilter filter = Constructors.NewProductFilter();
    filter.AddProduct(product);
    SetProductRestrictionFilter(filter);

    return true;
  }


  //! Disabled this vehicle from the <l LoadProduct() loading> and <l UnloadProduct() unloading> of all products.
  //
  // Note:
  //     This function overrides any previous call to SetProductRestriction().
  //
  // See Also:
  //     ProductFilter
  //
  public void SetProductDisabled(void)
  {
  	SetProductRestrictionFilter(Constructors.NewProductFilter());
  }


  //! Gets the current product restriction filter of this vehicle.
  //
  // Returns:
  //     Returns the current product restriction filter if any, null otherwise if there is no
  //     restriction in effect.
  //
  // See Also:
  //     ProductFilter
  //
  native public ProductFilter GetProductRestriction(void);
  
  
	//! Determines if the given queue can be used to load this vehicle.
	//
	// Param:  queue  Queue to test for loading compatibility.
	//
	// Returns:
	//    Returns true if <i queue> can be used to load to this vehicle, false otherwise.
	//
	public bool CanLoadProductFromQueue(ProductQueue queue)
	{
    ProductFilter filter = GetProductRestriction();
		ProductQueue[] vehicleQueues = GetQueues();
		int i;

		for (i = 0; i < vehicleQueues.size(); i++)
		{
			ProductQueue vehicleQueue = vehicleQueues[i];
			if (vehicleQueue.TransferProductFrom(queue, filter, 1, false))
				return true;
		}
		
		return false;
	}

  
  // ============================================================================
  // Name: LoadProduct
  // Desc: Attempts to load the product as specified in the report parameter.
  // Parm: report - A LoadingReport describing the load operation.
  // Retn: bool - True if the operator completed, or false if it was interrupted.
  // ============================================================================
  public bool LoadProduct(LoadingReport report)
  {
    report.dst = me;
		Industry industry = report.GetSrcIndustry();
		

		// Test if the loading operation would achieve anything.
		// (We do this because we don't want to start particle effects, etc, if there is no loading happening.)
		if (!CanLoadProductFromQueue(report.srcQueue))
			return false;
    
    
    // Begin monitoring for a load cancellation.
    bool bHasInterruptedLoad = false;


		//
		// perform the loading operation
		//
		float vehicleMinTime, industryMinTime;

		//
		// Begin Loading
		//
		vehicleMinTime = BeginLoad(report);
		industryMinTime = industry.BeginLoad(report);
		bHasInterruptedLoad = !GetMyTrain().InterruptableLoadingSleep(Math.Fmax(vehicleMinTime, industryMinTime));
      
    
    //
    // Load
    //
    int amountLoaded = 0;
    if (!bHasInterruptedLoad)
    {
      ProductFilter filter = GetProductRestriction();

      ProductQueue[] vehicleQueues = GetQueues();
      int i;
      for (i = 0; i < vehicleQueues.size(); i++)
      {
        ProductQueue vehicleQueue = vehicleQueues[i];
        amountLoaded = amountLoaded + vehicleQueue.TransferProductFrom(report.srcQueue, filter, report.desiredAmount - amountLoaded, true);
      }
      report.amount = amountLoaded;

      vehicleMinTime = GetLoadTime(report);
      industryMinTime = industry.GetLoadTime(report);
      bHasInterruptedLoad = !GetMyTrain().InterruptableLoadingSleep(Math.Fmax(vehicleMinTime, industryMinTime));
    }
    
		
    //
    // End Loading
    //
		vehicleMinTime = EndLoad(report);
		industryMinTime = industry.EndLoad(report);
    if (!bHasInterruptedLoad)
      bHasInterruptedLoad = !GetMyTrain().InterruptableLoadingSleep(Math.Fmax(vehicleMinTime, industryMinTime));
    
    
    
    //
		if (amountLoaded > 0)
    {
      PostMessage(me, "Vehicle", "LoadComplete", 0.0f);
      
      // record a successful vehicle load into the achievements system now
      if(m_DAULib)
      {
        GSObject[] GSObjectArray = new GSObject[0];
        GSObjectArray[0] = report;
        m_DAULib.LibraryCall("recordIndustryLoadUnload", null, GSObjectArray);
      }
    }

    SetHasLoadedThisStop(true);
    return !bHasInterruptedLoad;//amountLoaded > 0;
  }


  //! Determines if the given queue can be used to unload from vehicle.
  //
  // Param:  queue  Queue to test for unloading compatibility.
  //
  // Returns:
  //     Returns true if <i queue> can be used to unload from this vehicle, false otherwise.
  //
  public bool CanUnloadProductToQueue(ProductQueue queue)
  {
    ProductQueue[] vehicleQueues = GetQueues();
    int i;

    ProductFilter filter = GetProductRestriction();
    for (i = 0; i < vehicleQueues.size(); i++)
    {
      ProductQueue vehicleQueue = vehicleQueues[i];
      if (queue.TransferProductFrom(vehicleQueue, filter, 1, false))
        return true;
    }

    return false;
  }
  
  // ============================================================================
  // Name: UnloadProduct
  // Desc: Attempts to unload the product as specified in the report parameter.
  // Parm: report - A LoadingReport describing the unload operation.
  // Retn: bool - True if the operator completed, or false if it was interrupted.
  // ============================================================================
  public bool UnloadProduct(LoadingReport report)
  {
    report.src = me;
    Industry industry = report.GetDstIndustry();
    
    Interface.Log("Vehicle.UnloadProduct");



    // Test if the unloading operation would acheive anything.
    // (We do this because we dont want to start particle effects, etc, if there is no unloading happening.)
    if (!CanUnloadProductToQueue(report.dstQueue))
    {
      Interface.Log("Vehicle.UnloadProduct> !CanUnloadProductToQueue");
      return true;
    }
    
    
    // Begin monitoring for a load cancellation.
    bool bHasInterruptedLoad = false;


    //
    // perform the unloading operation
    //
    float vehicleMinTime, industryMinTime;

    //
    // Begin Unloading
    //
    vehicleMinTime = BeginUnload(report);
    industryMinTime = industry.BeginUnload(report);
    bHasInterruptedLoad = !GetMyTrain().InterruptableLoadingSleep(Math.Fmax(vehicleMinTime, industryMinTime));

    
    //
    // Unload
    //
    int amountUnloaded = 0;
    if (!bHasInterruptedLoad)
    {
      ProductFilter filter = GetProductRestriction();
      ProductQueue[] vehicleQueues = GetQueues();
      int i;
      for (i = 0; i < vehicleQueues.size(); i++)
      {
        ProductQueue vehicleQueue = vehicleQueues[i];
        amountUnloaded = amountUnloaded + report.dstQueue.TransferProductFrom(vehicleQueue, filter, report.desiredAmount - amountUnloaded, true);
      }
      report.amount = amountUnloaded;
      
      Interface.Log("Vehicle.UnloadProduct> desired: " + report.desiredAmount + "; unloaded: " + amountUnloaded);

      vehicleMinTime = GetUnloadTime(report);
      industryMinTime = industry.GetUnloadTime(report);
      bHasInterruptedLoad = !GetMyTrain().InterruptableLoadingSleep(Math.Fmax(vehicleMinTime, industryMinTime));
    }


    //
    // End Unloading
    //
    vehicleMinTime = EndUnload(report);
    industryMinTime = industry.EndUnload(report);
    if (!bHasInterruptedLoad)
      bHasInterruptedLoad = !GetMyTrain().InterruptableLoadingSleep(Math.Fmax(vehicleMinTime, industryMinTime));
    


    //
    if (amountUnloaded > 0)
    {
      PostMessage(me, "Vehicle", "LoadComplete", 0.0f);
      
      // record a successful vehicle unload into the achievements system now
      if(m_DAULib)
      {
        GSObject[] GSObjectArray = new GSObject[0];
        GSObjectArray[0] = report;
        m_DAULib.LibraryCall("recordIndustryLoadUnload", null, GSObjectArray);
      }
    }


    SetHasUnloadedThisStop(true);
    return !bHasInterruptedLoad;//amountUnloaded > 0;
  }


  //
  // GetQueueForProductAsset:
  //
  // Returns a product queue on this vehicle which is currently available for holding
  // the specified product type.
  // Returns <null> if no queue is available.
  // The returned product queue may be full.
  //
  // Repeated calls (with different product types) may return the same queue, if it is empty.
  // Make sure to begin filling the queue in question before calling this function again
  // for a different product type.
  //
  // In the future vehicles may have more than one ProductQueue.  This function will be updated
  // to handle this situation appropriately.  For this reason, the use of this function is preferred
  // over the GetProductQueue() native function.
  //
  // p_loadAmountHint allows the caller to provide a hint for the intended usage of the requested queue.
  // +ve values indicate an amount to be placed in the queue.
  // -ve values indicate an amount to be removed from the queue.
  // zero value provides default behavior.
  // The hint is not currently used, but its values should be set correctly as it may have an effect
  // in future updates.
  //
  /*ProductQueue GetQueueForProductAsset(Asset p_productType, int p_loadAmountHint)
  {
    ProductQueue vehicleQueue = GetProductQueue();

		if (!vehicleQueue)
			return null;
    
    // if we have an empty queue, we can use it
    if (vehicleQueue.GetQueueCount() <= 0)
    {
      
      // TODO: check whether the queue is compatible with this product type

      vehicleQueue.SetQueueProduct(p_productType);
      return vehicleQueue;
    }
    
    // or, if we have a queue which matches the product, we can use that too..
    if (vehicleQueue.GetQueueProduct() == p_productType)
      return vehicleQueue;
    
    // but that's all, for now..
    return null;
  }*/


  //
  // SetDoorAnimationState:
  //
  // This is a crafty way of getting a hook on the door animation for scripted passenger doors.
  // Hint: Feel free to override it ;¬) ...
  //
  public void SetDoorAnimationState(string p_meshName, bool p_state)
  {
    SetMeshAnimationState(p_meshName, p_state);
  }


  //=============================================================================
  // Name: OnPropertyEditBegin/OnPropertyEditEnd
  // Desc: Notifications from native code that the player has started/finished
  //       editing the properties of this train vehicle
  //=============================================================================
  void OnPropertyEditBegin(Message msg) { m_bIsPropertyEditInProgress = true; }
  void OnPropertyEditEnd(Message msg) { m_bIsPropertyEditInProgress = false; }


  //
  // Property Object methods to set and retrieve standard vehicle properties.
  //

  //! Initializes this vehicle's product queues from the given Soup database.
  //
  // The Vehicle implementation of this method is used to initialize this vehicle's queues with
  // products, thus allowing a vehicle's load to be saved and loaded specifically for a session.
  //
  // Note:
  //     If overriding this method to handle your own custom vehicle properties, <bi always> call
  //     back to this parent method via the <l gscLangKeyInherit  inherited> keyword.  Otherwise you
  //     run the risk of your vehicle <bi not behaving> correctly and even <bi becoming incompatible>
  //     with future versions of %Trainz.
  //
  // Param:  soup  Properties soup to initialize this vehicle from.
  //
  public void SetProperties(Soup soup)
  {
    inherited(soup);

    int k;
    int i;
    // read the initial settings from the config file
    ProductQueue[] queues = GetQueues();

    // Loop through the queues, and add these products, along with the queue values
    for (i = 0; i < queues.size(); i++)
    {
      ProductFilter pf = queues[i].GetProductFilter();
      Asset[] products = pf.GetProducts();
      for (k = 0; k < products.size(); k++)
      {
        vehicleProductInfoCollection.AddQueueToProduct(products[k], queues[i]);
      }
    }

    Soup restrictionSoup = soup.GetNamedSoup("Vehicle.ProductRestriction");
    if (restrictionSoup.CountTags())
    {
      ProductFilter filter = Constructors.NewProductFilter();
      filter.AddSoup(restrictionSoup);
      SetProductRestrictionFilter(filter);
    }

    if (m_bIsPropertyEditInProgress)
    {
      // These properties are all saved in native so we don't need them here for
      // route/session save/load. However, all changes made in the Surveyor property
      // edit dialog are applied immediately, so we need to save these options here
      // to ensure that cancellation works.
      KUID engineKuid = soup.GetNamedTagAsKUID("Vehicle.EngineAsset");
      if (engineKuid)
      {
        Asset engineAsset = World.FindAsset(engineKuid);
        if (engineAsset)
          SetEngineAsset(engineAsset);
      }
      SetRunningNumber(soup.GetNamedTag("Vehicle.RunningNumber"));

      Train train = GetMyTrain();
      if (train.GetFrontmostLocomotive())
      {
        train.SetTrainPriorityNumber(soup.GetNamedTagAsInt("Train.PriorityNumber", train.GetTrainPriorityNumber()));
        train.SetHeadlightState(soup.GetNamedTagAsBool("Train.HeadlightState", train.GetHeadlightState()));
        train.SetHighBeams(soup.GetNamedTagAsBool("Train.HighbeamState", train.GetHighBeams()));
        train.SetClassificationSignal(soup.GetNamedTagAsInt("Train.Classification", train.GetClassificationSignal()));
      }
    }
  }

  //! Saves the state of this vehicle's product filter in a Soup database.
  //
  // Note:
  //     If overriding this method to handle your own custom vehicle properties, <bi always> call
  //     back to this parent method via the <l gscLangKeyInherit  inherited> keyword.  Otherwise you
  //     run the risk of your vehicle <bi not behaving> correctly and even <bi becoming incompatible>
  //     with future versions of %Trainz.
  //
  // Returns:
  //     Returns the properties of this vehicle in a Soup to be saved.
  //
  public Soup GetProperties(void)
  {
    Soup soup = inherited();

    ProductFilter filter = GetProductRestriction();
    if (filter)
    {
      Soup restrictionSoup = filter.GetAsSoup();
      soup.SetNamedSoup("Vehicle.ProductRestriction", restrictionSoup);
    }

    {
      // These properties are all saved in native so we don't need them here for
      // route/session save/load. However, all changes made in the Surveyor property
      // edit dialog are applied immediately, so we need to save these options here
      // to ensure that cancellation works.
      Asset engineAsset = GetEngineAsset();
      if (engineAsset and engineAsset != GetDefaultEngineAsset())
        soup.SetNamedTag("Vehicle.EngineAsset", engineAsset.GetKUID());
      soup.SetNamedTag("Vehicle.RunningNumber", GetRunningNumber());

      Train train = GetMyTrain();
      if (GetMyTrain().GetFrontmostLocomotive())
      {
        soup.SetNamedTag("Train.PriorityNumber", train.GetTrainPriorityNumber());
        soup.SetNamedTag("Train.HeadlightState", train.GetHeadlightState());
        soup.SetNamedTag("Train.HighbeamState", train.GetHighBeams());
        soup.SetNamedTag("Train.Classification", train.GetClassificationSignal());
      }
    }

    return soup;
  }


  //
  // Gets this vehicle's properties as HTML code for user display.
  //
  public string GetDescriptionHTML(void)
  {
    Asset core = Constructors.GetTrainzAsset();
    Train myTrain = GetMyTrain();
    int i, l, k;


    // Get engine asset name
    string engineName = strTable.GetString("vehicle_property_engine_override_def");
    Asset engineAsset = GetEngineAsset();
    if (engineAsset != GetDefaultEngineAsset())
      engineName = engineAsset.GetLocalisedName();

    // Get running number
    string runningNumber = GetRunningNumber();
    if (runningNumber.size() == 0)
      runningNumber = strTable.GetString("vehicle_no_running_number");

    // sanitise the running number for a html link
    int len = runningNumber.size();
    for (i = len - 1; i >= 0; i--)
      if (runningNumber[i] == ' ')
        runningNumber[i, i+1] = "&nbsp;";


    string imgToTrainString = core.LookupKUIDTable("DuplicateToTrain").GetHTMLString();

    HTMLBuffer buffer = HTMLBufferStatic.Construct();

    //
    // Train-wide settings
    buffer.Print("<b>" + strTable.GetString("vehicle_prop_heading_train") + "</b><br>");

    // Train priority on track
    buffer.Print(strTable.GetString("vehicle_train_priority") + ": <a href='live://property/priority-number'>" + (string)myTrain.GetTrainPriorityNumber() + "</a><br>");


    if (GetMyTrain().GetFrontmostLocomotive())
    {
      // Train headlight state
      buffer.Print(strTable.GetString("vehicle_train_headlight") + "<a href='live://property/headlightstate'>" +  (string)myTrain.GetHeadlightState() + "</a><br>");

      // Vechicle highbeam state
      buffer.Print(strTable.GetString("vehicle_train_highbeam") + "<a href='live://property/highbeamstate'>" +  (string)myTrain.GetHighBeams() + "</a><br>");

      // Train classification signal state
      int classification = myTrain.GetClassificationSignal();
      string classificationStr;
      if (classification == Train.CLASSIFICATION_TIMETABLED)
        classificationStr = strTable.GetString("vehicle_train_classification_timetabled");
      else if (classification == Train.CLASSIFICATION_EXTRA)
        classificationStr = strTable.GetString("vehicle_train_classification_extra");
      else if (classification == Train.CLASSIFICATION_FOLLOWING)
        classificationStr = strTable.GetString("vehicle_train_classification_following");

      buffer.Print(strTable.GetString("vehicle_train_classification") + "<a href='live://property/classification'>" +  classificationStr + "</a><br>");
    }


    //
    // Vehicle settings
    buffer.Print("<br><b>" + strTable.GetString("vehicle_prop_heading_vehicle") + "</b><br>");

    // EngineSpec override
    buffer.Print(strTable.GetString("vehicle_property_engine_override") + ": <a href=live://property/engine>");
    buffer.Escape(engineName);
    buffer.Print("</a><br>");

    // Running number
    buffer.Print(strTable.GetString("vehicle_propery_name") + ": <a href=live://property/runningnumber>");
    buffer.Escape(runningNumber);
    buffer.Print("</a>  (<a href=live://property/auto-runningnumber>");
    if (HasAutomaticRunningNumber())
      buffer.Print(strTable.GetString("vehicle_running_number_auto"));
    else
      buffer.Print(strTable.GetString("vehicle_running_number_user"));
    buffer.Print("</a>)<br>");

    // Automatic fireman
    if (GetEngineType() == ENGINE_STEAM)
      buffer.Print(strTable.GetString("vehicle_train_automatic_fireman") + "<a href='live://property/automatic-fireman'>" + (string)GetAutomaticFiremanState() + "</a><br>");

    // Vehicle interior lights
    if (HasInteriorLight())
      buffer.Print(strTable.GetString("vehicle_interior_light") + "<a href='live://property/interior-light'>" + (string)GetInteriorLightState() + "</a><br>");

    // Check for compatibility of 'copy to compatible vehicles' command
    ProductQueue[] refQueues = GetQueues();
    if (refQueues.size() > 0)
    {
      Vehicle[] vehicles = myTrain.GetVehicles();
      for (i = 0; i < vehicles.size(); i++)
      {
        Vehicle curVehicle = vehicles[i];
        ProductQueue[] curQueues = curVehicle.GetQueues();
        if (curVehicle != me and GetAsset() == curVehicle.GetAsset() and curQueues.size() == refQueues.size())
        {
          // Found a matching vehicle, add the copy command
          buffer.Print(HTMLWindow.MakeLink("live://property/CopyToTrain/", HTMLWindow.MakeImage(imgToTrainString, true, 64, 64), strTable.GetString("vehicle_copy_to")) + "<br>");
          break;
        }
      }
    }

    buffer.Print("<br>");

    // Print queue properties
    ProductQueue[] queues = GetQueues();
    for (i = 0; i < queues.size(); i++)
    {
      ProductFilter pf = queues[i].GetProductFilter();
      Asset[] products = pf.GetProducts();
      string productList = HTMLWindow.StartTable();
      productList = productList + HTMLWindow.StartRow();

      //Interface.Log("Current Queue: " + queues[i].GetQueueName());
      for (l = 0; l < products.size(); l++)
      {
        //Interface.Log("Has Asset: " + products[l].GetLocalisedName());
        Asset asset = products[l];
        KUID kuid = asset.GetKUID();
        string icon = kuid.GetHTMLString();

        for (k = 0; k < vehicleProductInfoCollection.ipicCollection.size(); k++)
        {
          if (vehicleProductInfoCollection.ipicCollection[k].GetProduct() == products[l])
          {
            int queueIndex = vehicleProductInfoCollection.GetQueueIndex(k, queues[i]);
            if (queueIndex > -1)
            {
              string link = HTMLWindow.MakeLink("live://property/ToggleQueueDisplay/" + (string)k + "/" + (string)queueIndex, HTMLWindow.MakeImage(icon, true, 32, 32));
              productList = productList + HTMLWindow.MakeCell(link);
              break;
            }
          }
        }
      }

      ///////////////////
      // Add item...
      KUID kuidImgAdd = core.LookupKUIDTable("imgAdd");
      string imgAddString = kuidImgAdd.GetHTMLString();
      productList = productList + HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/AddQueueProduct/" + (string)i, HTMLWindow.MakeImage(imgAddString, true, 32, 32)));

      productList = productList + HTMLWindow.EndRow();
      productList = productList + HTMLWindow.StartRow();

      for (l = 0; l < products.size(); l++)
      {
        Asset asset = products[l];
        KUID kuid = asset.GetKUID();
        string icon = kuid.GetHTMLString();

        // Now dump the pct bars
        for (k = 0; k < vehicleProductInfoCollection.ipicCollection.size(); k++)
        {
          if (vehicleProductInfoCollection.ipicCollection[k].GetProduct() == products[l])
          {
            int queueIndex = vehicleProductInfoCollection.GetQueueIndex(k, queues[i]);
            if (queueIndex > -1)
            {
              productList = productList + HTMLWindow.MakeCell(HTMLWindow.GetPercentBarCode(32, 4, HTMLWindow.GetQueueRoundedPercent(queues[i], asset)));
              break;
            }
          }
        }
      } //  for (l = 0; l < products.size(); l++)

      // Bottom half of the add button
      productList = productList + HTMLWindow.MakeCell("");
      
      productList = productList + HTMLWindow.EndRow();
      productList = productList + HTMLWindow.EndTable();

      KUID kuidImgRemove = core.LookupKUIDTable("imgRemove");
      string kuidImgRemoveString = kuidImgRemove.GetHTMLString();

      // Find each product that contains this queue.
      string openProducts = "";
      string unitsStr = strTable.GetString("vehicle_units");
      for (k = 0; k < vehicleProductInfoCollection.ipicCollection.size(); k++)
      {
        int queueIndex = vehicleProductInfoCollection.GetQueueIndex(k, queues[i]);
        if (queueIndex > -1)
        {
          if (vehicleProductInfoCollection.ipicCollection[k].queues[queueIndex].uiIsExpanded)
          {
            Asset productAsset = vehicleProductInfoCollection.ipicCollection[k].GetProduct();

            ProductFilter pf = Constructors.NewProductFilter();
            pf.AddProduct(vehicleProductInfoCollection.ipicCollection[k].GetProduct());
            int count = queues[i].CountProductMatching(pf);

            string setCountLink = HTMLWindow.MakeLink("live://property/SetQueueProductCount/" + (string)k + "/" + (string)queueIndex, (string)count);
            string removeLink = HTMLWindow.MakeLink("live://property/RemoveQueueProduct/" + (string)k + "/" + (string)i, HTMLWindow.MakeImage(kuidImgRemoveString, true, 32, 32));

            string cell1 = HTMLWindow.MakeCell(HTMLWindow.MakeImage(productAsset.GetKUID().GetHTMLString(), true, 64, 64), "width=64");
            string cell2 = HTMLWindow.MakeCell("<b>" + productAsset.GetLocalisedName() + "</b><BR><i>" + unitsStr + ": </i>" + setCountLink + "<BR>" + removeLink);
            openProducts = openProducts + HTMLWindow.MakeTable(HTMLWindow.MakeRow(cell1 + cell2), "bgcolor=#FFAD0059 width=400 bordercolor=#00000059");
            break;
          }
        }
      }

      string imgArrowRightString = core.LookupKUIDTable("imgArrowRight").GetHTMLString();
      string cellImgArrowRight = HTMLWindow.MakeCell(HTMLWindow.MakeImage(imgArrowRightString, true, 16, 16) + " " + queues[i].GetQueueName(), "width=190");

      // Find each product that contains this queue.
      for (k = 0; k < vehicleProductInfoCollection.ipicCollection.size(); k++)
      {
        int queueIndex = vehicleProductInfoCollection.GetQueueIndex(k, queues[i]);
        if (queueIndex > -1)
        {
          // Found a product in this queue, print properties
          string cellMaxLoad = HTMLWindow.MakeCell(HTMLWindow.MakeItalic(strTable.GetString("vehicle_max_load")) + (string)queues[i].GetQueueSize(), "width=80");

          buffer.Print(HTMLWindow.MakeTable(HTMLWindow.MakeRow( cellImgArrowRight + cellMaxLoad, "bgcolor=#C9880059") + 
                                                                HTMLWindow.MakeRow(HTMLWindow.MakeCell(productList, "colspan=4")) +
                                                                HTMLWindow.MakeRow(HTMLWindow.MakeCell(openProducts + "<BR>", "colspan=4")),
                                                                "bgcolor=#FFAD0059 width=100% bordercolor=#00000059"));
          buffer.Print(HTMLWindow.MakeTable(HTMLWindow.MakeRow(HTMLWindow.MakeCell( "" )), "height=4"));
          break;
        }
      }

      if (k >= vehicleProductInfoCollection.ipicCollection.size())
      {
        // The product wasn't found, print alternative properties
        string cellMaxLoad = HTMLWindow.MakeCell(HTMLWindow.MakeItalic(strTable.GetString("vehicle_max_load")) + HTMLWindow.MakeLink("live://property/SetQueueSize/" + (string)i, (string)queues[i].GetQueueSize()), "width=80");

        buffer.Print(HTMLWindow.MakeTable(HTMLWindow.MakeRow( cellImgArrowRight + cellMaxLoad, "bgcolor=#C9880059") + 
                                                              HTMLWindow.MakeRow(HTMLWindow.MakeCell(productList, "colspan=3")),
                                                              "bgcolor=#FFAD0059 width=100% bordercolor=#00000059"));
        buffer.Print(HTMLWindow.MakeTable(HTMLWindow.MakeRow(HTMLWindow.MakeCell("")), "height=4"));
      }

    } //  for (i = 0; i < queues.size(); i++)


    buffer.Print("</font>");
    return buffer.AsString();
  }


  //
  // Gets the type of the named property.
  //
  public string GetPropertyType(string propertyID)
  {
    if (propertyID == "engine")
      return "asset-list,ESPC";

    if (propertyID == "runningnumber")
      return "string,0,8";

    if (propertyID == "auto-runningnumber")
      return "link";

    if (propertyID[0, 16] == "AddQueueProduct/")
      return "asset-list,PROD";

    if (propertyID[0, 19] == "RemoveQueueProduct/")
      return "link";

    if (propertyID[0, 21] == "SetQueueProductCount/")
      return "int,0,999999999,10000";

    if (propertyID[0, 13] == "SetQueueSize/")
      return "int,0,999999999,10000";

    if (propertyID[0, 19] == "ToggleQueueDisplay/")
      return "link";

    if (propertyID[0, 12] == "CopyToTrain/")
      return "link";
    
    if (propertyID == "priority-number")
      return "link";

    if (propertyID == "headlightstate")
      return "link";

    if (propertyID == "highbeamstate")
      return "link";

    if (propertyID == "classification")
      return "link";

    if (propertyID == "automatic-fireman")
      return "link";

    if (propertyID == "interior-light")
      return "link";

    return "string";
  }


  //
  // Gets a reabable name for the given property.
  //
  public string GetPropertyName(string propertyID)
  {
    if (propertyID == "engine")
      return strTable.GetString("vehicle_property_engine_override");

    if (propertyID == "runningnumber")
      return strTable.GetString("vehicle_propery_name");

    if (propertyID[0, 21] == "SetQueueProductCount/")
      return strTable.GetString("vehicle_set_initial_load");

    if (propertyID[0, 13] == "SetQueueSize/")
      return strTable.GetString("set_maximum_load_amount");

    if (TrainUtil.HasPrefix(propertyID, "AddQueueProduct/"))
      return strTable.GetString("vehicle_property_name_add_product");

    return "";
  }

  //
  // Gets a description of the named property.
  //
  public string GetPropertyDescription(string p_propertyID)
  {
    if (p_propertyID == "engine")
      return strTable.GetString("vehicle_property_engine_override_desc");

    if (p_propertyID == "runningnumber")
      return strTable.GetString("vehicle_propery_desc");

    if (TrainUtil.HasPrefix(p_propertyID, "AddQueueProduct/"))
      return strTable.GetString("vehicle_property_desc_add_product");

    return "";
  }

  //! Allows the running number of this vehicle to be obtained when the <n "runningnumber"> property is requested.
  //
  // Param:  p_propertyID  Name of the property to get the value of.
  //
  // Returns:
  //     Returns the <l GetRunningNumber()  running number> of this vehicle if <i p_propertyID> is
  //     equal to <m "runningnumber">, an empty string otherwise.
  //
  public string GetPropertyValue(string p_propertyID)
  {
    if (p_propertyID == "engine")
    {
      Asset engineAsset = GetEngineAsset();

      // Test if the default engine is loaded and return "Default" if so
      if (engineAsset == GetDefaultEngineAsset())
        return strTable.GetString("vehicle_property_engine_override_def");

      return engineAsset.GetLocalisedName();
    }

    if (p_propertyID == "runningnumber")
      return GetRunningNumber();

    return "";
  }

  //! Allows the <l GetRunningNumber()  running number> of this vehicle to be set through the <n "runningnumber"> property.
  //
  // Param:  p_propertyID  Name of the property to set.  Must be equal to <m "runningnumber"> or
  //                       the <l GetRunningNumber()  running number> of this vehicle won't be set.
  // Param:  p_value       Value to set the <n"runningnumber"> property to.
  //
  void SetPropertyValue(string p_propertyID, string p_value)
  {
    if (p_propertyID == "runningnumber")
    {
      SetRunningNumber(p_value);
    }
  }

  //
  // Sets the value of an integer property for this vehicle.  Support is included for queue sizes
  // and queue product levels.
  //
  void SetPropertyValue(string propertyID, int value)
  {
    if (propertyID[0, 13] == "SetQueueSize/")
    {
      propertyID[0, 13] = null;

      ProductQueue[] queues;
      queues = GetQueues();

      ProductQueue queue = queues[Str.ToInt(propertyID)];
      
      // If the queue has more items than this, then delete them.
      if (queue.GetQueueCount() > value)
        queue.DestroyAllProducts();

      queue.SetQueueSize(value);
    }

    if (propertyID[0, 21] == "SetQueueProductCount/")
    {
      propertyID[0, 21] = null;

      int productIndex = -1;
      // Find the separating slash.
      int i;
      for (i = 0; i < propertyID.size(); i++)
      {
        if (propertyID[i] == '/')
        {
          productIndex = Str.ToInt(propertyID[0, i]);
          propertyID[0, i + 1] = null;
          break;
        }
      }
      int queueIndex = Str.ToInt(propertyID);

      IndustryProductInfoComplete ipic = vehicleProductInfoCollection.ipicCollection[productIndex];
      IndustryProductInfoQueues ipiq = ipic.queues[queueIndex];

      ProductQueue queue = ipiq.GetProductQueue();

      ProductFilter pf = Constructors.NewProductFilter();
      pf.AddProduct(ipic.GetProduct());
      int existingCount = queue.CountProductMatching(pf);

      if (existingCount > value)
      {
        //Interface.Log("DestroyProductMatching called from Vehicle.SetPropertyValue!");
        queue.DestroyProductMatching(pf, existingCount - value);
      }
      else if (existingCount < value)
      {
        //Interface.Log("CreateProduct called from Vehicle.SetPropertyValue!");
        queue.CreateProduct(ipic.GetProduct(), value - existingCount);
      }
      // else do nothing - we already have the right number.
    }

  }

  //! View details window for this vehicle (uses the Train's output though).
  //
  // This method is setup by Init() as a <l AddHandler()  handler> method for when a message of type
  // (<m"%MapObject">, <m "ViewDetails">) is received by this vehicle object.  Such a message 
  // indicates that the user has opened the right-click menu of the vehicle and selected the 
  // <b "View Details"> menu item.
  //
  // This method will call the <l Train::ViewDetails()  ViewDetails>() method of this vehicle's 
  // <l GetMyTrain() train> so that a Browser window describing the entire train can be displayed
  // to the user.
  //
  // Param:  msg  Source object of message.
  //
  // See Also:
  //     Train::ViewDetails()
  //
  void ViewDetails(Message msg)
  {
    if (msg.dst != me)
      return;
    
    Train train = GetMyTrain();
    train.ViewDetails(me);
  }

  //! Update the view details window for this vehicle (form the train).
  //
  // This method is setup by Init() as a <l AddHandler()  handler> method for when a message of type
  // (<m"Vehicle">, <m "LoadComplete">) is received by this vehicle object.  Such a message indicates
  // that the load/queue of the vehicle has changed and the view details window of the 
  // <l GetMyTrain()  train> (if visible) will need to be updated, so this method calls through to
  // Train::UpdateViewDetails().
  //
  // Param:  msg  Source object of message.
  //
  // See Also:
  //     Train::UpdateViewDetails()
  //
  void UpdateViewDetails(Message msg)
  {
    if (msg.dst != me)
      return;
    
    Train train = GetMyTrain();
    train.UpdateViewDetails(me);
  }

  //! View the schedule window for this vehicle (from the train).
  //
  // This method is setup by Init() as a <l AddHandler()  handler> method for when a message of type
  // (<m"%MapObject">, <m "View-%Schedule">) is received by this vehicle object.  Such a message 
  // indicates that the schedule of the vehicle/train is to be displayed for the user.  This method
  // calls through to Train::UpdateScheduleWindow().
  //
  // Param:  msg  Source object of message.
  //
  // See Also:
  //     Train::UpdateScheduleWindow()
  //
  void ViewSchedule(Message msg)
  {
    if (msg.dst != me)
      return;
    
    Train train = GetMyTrain();
    train.UpdateScheduleWindow(GetLocalisedName());
  }
  
  
  // Notify our Train of any "SceneryTrigger", "Enter" messages.
	void SceneryTriggerEnter(Message msg)
	{
		Buildable scenery = cast<Buildable>(msg.src);
		
		if (scenery)
      GetMyTrain().SetLastVisitedBuildableFallback(scenery);
	}


  void HideAllQueueItems(int productIndex, ProductQueue foundQueue)
  {
    int k;
    for (k = 0; k < vehicleProductInfoCollection.ipicCollection.size(); ++k)
    {
      if (k != productIndex)
      {
        int foundIndex = vehicleProductInfoCollection.GetQueueIndex(k, foundQueue);
        if (foundIndex > -1)
          vehicleProductInfoCollection.ipicCollection[k].queues[foundIndex].uiIsExpanded = false;
      }
    }
  }


  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames)
  {
    if (propertyID == "engine")
    {
      // Always have 'default' as the first option
      GSObject[] hackObj = new GSObject[1];
      hackObj[0] = GetDefaultEngineAsset();
      listObjects[0, 1] = hackObj;
      
      string[] hackName = new string[1];
      hackName[0] = strTable.GetString("vehicle_property_engine_override_def");
      listNames[0, 1] = hackName;

      return true;
    }

    if (propertyID[0, 16] == "AddQueueProduct/")
    {
      bool bAnyChanges = false;
      propertyID[0, 16] = null;

      ProductQueue queue = GetQueues()[Str.ToInt(propertyID)];
      ProductFilter productFilter = queue.GetProductFilter();

      int i = 0;
      while (i < listObjects.size())
      {
        Asset curAsset = cast<Asset>(listObjects[i]);

        // Remove any already accepted products from the list to avoid duplicates
        if (productFilter.DoesAcceptProduct(curAsset))
        {
          listObjects[i, i + 1] = null;
          listNames[i, i + 1] = null;
          bAnyChanges = true;
        }
        else
        {
          ++i;
        }
      }

      return bAnyChanges;
    }

    return false;
  }

  void SetPropertyValue(string propertyID, GSObject value, string readableName)
  {
    Interface.Log("Vehicle.SetPropertyValue> " + propertyID + ", " + readableName);

    if (propertyID == "engine")
    {
      Asset newEngineAsset = cast<Asset>(value);
      SetEngineAsset(newEngineAsset);
    }
    else if (propertyID[0, 16] == "AddQueueProduct/")
    {
      propertyID[0, 16] = null;
      ProductQueue queue = GetQueues()[Str.ToInt(propertyID)];

      Asset newProductAsset = cast<Asset>(value);

      // Update the industryProductInfoCollection (which will update the queue)
      vehicleProductInfoCollection.AddQueueToProduct(newProductAsset, queue);

      int productIndex = vehicleProductInfoCollection.GetProductIndex(newProductAsset);
      if (productIndex > -1)
      {
        int queueIndex = vehicleProductInfoCollection.GetQueueIndex(productIndex, queue);
        if (queueIndex > -1)
        {
          vehicleProductInfoCollection.ipicCollection[productIndex].queues[queueIndex].uiIsExpanded = true;

          HideAllQueueItems(productIndex, queue);
        }
      }
    }
  }


  void LinkPropertyValue(string propertyID)
  {
    if (propertyID[0, 12] == "CopyToTrain/")
    {
      propertyID[0, 12] = null;
      // Copy the settings from this vehicle to the other ones.
      Train myTrain = GetMyTrain();
      Vehicle[] vehicles = myTrain.GetVehicles();
      Vehicle vehicleRef = me;
      ProductQueue[] refQueues = GetQueues();

      int i;
      for (i = 0; i < vehicles.size(); i++)
      {
        Vehicle curVehicle = vehicles[i];
        ProductQueue[] curQueues = curVehicle.GetQueues();
        if (vehicleRef != curVehicle and vehicleRef.GetAsset() == curVehicle.GetAsset() and curQueues.size() == refQueues.size())
        {
          // Same vehicle, copy queues values over.
          int k;
          for (k = 0; k < refQueues.size(); k++)
          {
            curQueues[k].DestroyAllProducts();

            ProductFilter newFilter = Constructors.NewProductFilter();
            newFilter.CopyFilter(refQueues[k].GetProductFilter());
            curQueues[k].SetProductFilter(newFilter);

            // Ensure its clear...
            curQueues[k].DestroyAllProducts();
            curQueues[k].SetProductFilter(newFilter);

            int queueSize = refQueues[k].GetQueueSize();
            curQueues[k].SetQueueSize(queueSize);

            // Create the products...
            Asset[] products = refQueues[k].GetProductList();
            int j;
            for (j = 0; j < products.size(); j++)
            {
              Asset product = products[j];
              ProductFilter pf = Constructors.NewProductFilter();
              pf.AddProduct(product);
              int productCount = refQueues[k].CountProductMatching(pf);
              if (productCount > 0)
              {
                //Interface.Log("CreateProduct called from Vehicle.LinkPropertyValue!");
                curQueues[k].CreateProduct(product, productCount);
              }
            }
          }

        }
      }
    } // if (propertyID[0, 12] == "CopyToTrain/")

    if (propertyID[0, 19] == "RemoveQueueProduct/")
    {
      propertyID[0, 19] = null;

      int productIndex = -1;
      // Find the separating slash.
      int i;
      for (i = 0; i < propertyID.size(); i++)
      {
        if (propertyID[i] == '/')
        {
          productIndex = Str.ToInt(propertyID[0, i]);
          propertyID[0, i + 1] = null;
          break;
        }
      }
      int queueIndex = Str.ToInt(propertyID);

      ProductQueue[] queues;
      queues = GetQueues();
      ProductFilter pf = queues[queueIndex].GetProductFilter();
      Asset[] products = pf.GetProducts();

      vehicleProductInfoCollection.RemoveQueueFromProduct(vehicleProductInfoCollection.ipicCollection[productIndex].GetProduct(), queues[queueIndex]);
    }

    if (propertyID[0, 19] == "ToggleQueueDisplay/")
    {
      propertyID[0, 19] = null;

      int productIndex = -1;
      // Find the separating slash.
      int i;
      for (i = 0; i < propertyID.size(); i++)
      {
        if (propertyID[i] == '/')
        {
          productIndex = Str.ToInt(propertyID[0, i]);
          propertyID[0, i + 1] = null;
          break;
        }
      }
      int queueIndex = Str.ToInt(propertyID);

      vehicleProductInfoCollection.ipicCollection[productIndex].queues[queueIndex].uiIsExpanded = !vehicleProductInfoCollection.ipicCollection[productIndex].queues[queueIndex].uiIsExpanded;
      ProductQueue foundQueue = vehicleProductInfoCollection.ipicCollection[productIndex].queues[queueIndex].GetProductQueue();

      HideAllQueueItems(productIndex, foundQueue);
    }


    if (propertyID == "priority-number")
      GetMyTrain().SetTrainPriorityNumber(GetMyTrain().GetTrainPriorityNumber() % 3 + 1);

    if (propertyID == "headlightstate")
      GetMyTrain().SetHeadlightState(!GetMyTrain().GetHeadlightState());

    if (propertyID == "highbeamstate")
      GetMyTrain().SetHighBeams(!GetHighBeams());

    if (propertyID == "classification")
    {
      // Just cycle through the valid classification signal states
      int state = GetMyTrain().GetClassificationSignal();
      if (state == Train.CLASSIFICATION_TIMETABLED)
        GetMyTrain().SetClassificationSignal(Train.CLASSIFICATION_EXTRA);
      else if (state == Train.CLASSIFICATION_EXTRA)
        GetMyTrain().SetClassificationSignal(Train.CLASSIFICATION_FOLLOWING);
      else if (state == Train.CLASSIFICATION_FOLLOWING)
        GetMyTrain().SetClassificationSignal(Train.CLASSIFICATION_TIMETABLED);
    }

    if (propertyID == "automatic-fireman")
      SetAutomaticFiremanState(!GetAutomaticFiremanState());

    if (propertyID == "interior-light")
      SetInteriorLightState(!GetInteriorLightState());

    if (propertyID == "auto-runningnumber")
      SetRandomAutomaticRunningNumber();
  }


  //! Fills the given queue with a set amount of products.
  //
  // This method sets the amount of products in the given queue.  It is a utility method that works
  // on the given queue which need not be a queue from this vehicle.  The 
  // <l ProductQueue::GetProductFilter()  product filter> provided with <i queue> will be used to 
  // check if the queue can take products of type <i asset>.  If it can't, the filter will be modified
  // so it can as this method is forceful in that regard.
  //
  // Param:  queue     Queue to put products in.  Existing products in this queue will be destroyed.
  // Param:  asset     Type of product to put in <i queue>.
  // Param:  newValue  Amount of products of type <i asset> to place in <i queue>.
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

    ProductFilter pf2 = Constructors.NewProductFilter();
    pf2.AddProduct(asset);

    int existingCount = queue.CountProductMatching(pf2);
    if (existingCount > newValue)
    {
      // remove surplus product
      queue.DestroyProductMatching(pf2, existingCount - newValue);
    }
    else if (existingCount < newValue)
    {
      // Create additional product
      queue.CreateProduct(asset, newValue - existingCount);
    }
    // else do nothing - we already have the correct value.
  }

	
	
  // ============================================================================
  // Name: NotifyTrainChanged
  // Desc: Called when this Vehicle is added to a Train, removed from its Train,
  //       or moved from one Train to another.
  // Parm: prevTrain - The train to which this Vehicle was previously attached.
  // Parm: nextTrain - The train to which this Vehicle is now attached.
  // ============================================================================
	public mandatory void NotifyTrainChanged(Train prevTrain, Train nextTrain)
  {
    // Override this function as required, but don't forget to call the
    // inherited version in case it does something in the future.
    
    // Attempting to manipulate the makeup or positioning of any Train from
    // within this function is illegal behavior. If you need to do that,
    // trigger a delayed action using a message or a thread.
  }

};


