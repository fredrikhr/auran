//
// JunctionBase.gs
//
//  Copyright (C) 2002-2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "permit.gs"
include "train.gs"
include "trackside.gs"


//! A top-level junction interface class.
//
// This class is a top level interface for a junction on a route in %Trainz.  The methods provided
// here apply to both junctions created with track splines and levers and fixed track junctions.
//
// Junctions made from track splines and a trackside lever item are represented by the Junction
// class which is derived from this class as well as Trackside.  Hence these spline junctions have
// the JunctionBase interface along with the behaviors of a Trackside object.
//
// Fixed track junctions do not have all the features of a Trackside object and should not be
// expected to.
//
// Messages used by a JunctionBase object are:
//
// {[ Major       | Minor         | Source    | Destination  ]
//  [ "Junction"  | "InnerEnter"  | junction  | train        ]
//  [ "Junction"  | "Enter"       | junction  | train        ]
//  [ "Junction"  | "Stopped"     | junction  | train        ]
//  [ "Junction"  | "InnerLeave"  | junction  | train        ]
//  [ "Junction"  | "Leave"       | junction  | train        ]
//  [ "Junction"  | "Toggled"     | junction  | broadcast    ]
//  [ "Object"    | "InnerEnter"  | train     | junction     ]
//  [ "Object"    | "Enter"       | train     | junction     ]
//  [ "Object"    | "Stopped"     | train     | junction     ]
//  [ "Object"    | "InnerLeave"  | train     | junction     ]
//  [ "Object"    | "Leave"       | train     | junction     ]}
//
// See Also:
//     Junction, JunctionBaseGameObject, SceneryWithTrack::GetAttachedJunctions()
//
game class JunctionBase
{

	//! \name   Junction States
	//  \anchor juncStates
	//@{
	//! Possible states a junction can be switched to.
	//
	// See Also:
	//   JunctionBase::GetDirection(), JunctionBase::GetDirectionToTrain(), JunctionBase::RequestTrackPermit(),
	//   JunctionBase::SetDirection(), JunctionBase::SwitchForTrain(), Navigate::LockJunction()
	//

	public define int DIRECTION_LEFT = 0;       //!< Left junction direction state.
	public define int DIRECTION_FORWARD = 1;    //!< Forward junction direction state.
	public define int DIRECTION_RIGHT = 2;      //!< Right junction direction state.
	public define int DIRECTION_BACKWARD = -1;  //!< Backward junction direction state.
	public define int DIRECTION_NONE = 3;       //!< %Junction not in any state.

	//@}


	//! Sets this junction toward the specified direction.
	//
	// Param:  direction  Direction to set the junction to as seen from the single track end of the
	//                    junction.  Use one of the \ref juncStates "junction state" constants for
	//                    this argument.
	//
	// Note:
	//     This method assumes you already have a <l RequestPermit()  permit>, or don't care about
	//     permits.
	//
	// Returns:
	//     Returns true if successful or false if the junction direction was unchanged or the desired
	//     direction could not be reached (e.g. \ref juncStates "DIRECTION_FORWARD", which is not
	//     supported by all junctions).
	//
	// See Also:
	//     Permit, Navigate::LockJunction(), \ref juncStates "Junction States"
	//
	public native bool SetDirection(int direction);
  
  
  // ============================================================================
  // Name: SetDefaultDirection
  // Desc: Set the direction that this permit is set to while no permits are 
  //       granted. If one or more permits are currently held on this junction,
  //       then this call has no immediate effect but will affect the direction
  //       that this junction reverts to after all permits are released. If no
  //       permits are currently held on this junction, then this call 
  //       immediately modifies the junction's direction. The user may modify
  //       the default direction of this junction manually unless a permit is
  //       held or manual control is disabled.
  // Parm: direction - Direction to set this junction to, as seen from the 
  //       single-track end of this junction. Use one of the "junction states"
  //       constants for this argument.
  // Retn: bool - True if the default direction was changed (whether or not an
  //       immediate junction direction change occurred) or False if the 
  //       requested direction was not valid for this junction.
  // ============================================================================
  public native bool SetDefaultDirection(int direction);


	//! Gets the current direction of this junction.
	//
	// Returns:
	//     Returns the \ref juncStates "direction" of this junction as seen from its single track end.
	//
	// See Also:
	//     \ref juncStates "Junction States"
	//
	public native int GetDirection(void);


	//! Allows/disallows the user from changing this junction's setting by clicking on it.
	//
	// Param:  allow  If true, the user is allowed to change this junction, otherwise false and the
	//                user won't be able to change this junction.
	//
	public native void AllowManualControl(bool allow);


	//! Determines if the user is allowed to change this junction.
	//
	// Returns:
	//     Returns true if manual control of this junction by the user is allowed, false otherwise.
	//
	public native bool GetManualControl();
  
  
  
	// ============================================================================
  // Name: SetAllowsPermitControl
  // Desc: Sets whether this junction will grant permits which represent a
  //       direction change from the 'default' state. By default, junctions 
  //       grant permits as long as there is not a conflicting permit. When 
  //       permit control is disallowed, any such requests are delayed until 
  //       the permit control is lifted. Note that applying permit control 
  //       does not revoke any pre-existing permits.
  // Parm: bShouldAllowPermitControl - True to allow normal permit control.
  // ============================================================================
  public native void SetAllowsPermitControl(bool bShouldAllowPermitControl);
  
  
	// ============================================================================
  // Name: DoesAllowPermitControl
  // Desc: Queries whether this junction will grant permits which represent a
  //       direction change. See SetAllowsPermitControl().
  // Parm: bool - True if normal permit control is allowed.
  // ============================================================================
  public native bool DoesAllowPermitControl(void);
  
  
	

	// OBSOLETE.
	public native Permit RequestPermit(GameObject obj);
	

	//! Request a permit to control this junction.
	//
	// Only one such permit is granted at a time.  See Permit for more details on permits.
	//
	// Param:  obj  Object requesting the permit.
	//
	// Param:  junctionDirection    The direction in which you wish to set the junction (left, forward, right.)
	//
	// Returns:
	//     Returns a Permit for <i obj> to control this junction.  The permit may not necessarily be granted.
	//
	public native Permit RequestPermit(GameObject obj, int junctionDirection);


	//! Request a permit to drive on the track which is in <i direction> from this junction.
	//
	// Note:
	//     Only one such permit is granted at a time.  See Permit for more details on permits.
	//
	// Param:  obj        Object requesting the permit.
	// Param:  direction  Direction from the junction where the track to get a permit for is.  Use
	//                    one of the \ref juncStates "junction state" constants for this argument.
	//
	// Returns:
	//     Returns a Permit for <i obj> to control the specified track.  The permit may not 
	//     necessarily be granted.
	//
	// See Also:
	//     Permit, Track, \ref juncStates "Junction States"
	//
	public native Permit RequestTrackPermit(GameObject obj, int direction);


	//! Changes this junction such that the given train can cross it in the specified direction.
	//
	// Note:
	//     This method assumes you already have a permit, or don't care about permits.
	//
	// Param:  train         Train that is to cross the junction.
	// Param:  dstDirection  Direction from this junction that the train is to travel through to.
	//                       Must be on the opposite side of this junction that the train is.  Use one
	//                       of the \ref juncStates "junction state" constants for this argument.
	//
	// Returns:
	//     Returns true if successful, false otherwise.  Prior to <bi TRS2004>, this method would 
	//     throw an exception on failure instead of returning false.
	//
	// See Also:
	//     \ref juncStates "Junction States"
	//
	public native bool SwitchForTrain(Train train, int dstDirection);


	//! Gets the direction of this junction relative to the given train from the single-track end.
	//
	// Param:  train  Train to get the relative direction of to this junction.  The train must be
	//                within a reasonable range (currently 15 track stretches) of this junction.
	//
	// Returns:
	//     Returns the \ref juncStates "direction" of this junction as seen from its single track
	//     end relative to <i train>.
	//
	// See Also:
	//     \ref juncStates "Junction States"
	//
	public native int GetDirectionToTrain(Train train);


	//! Gets the MapObject associated with this junction.
	//
	// Note:
	//     More than one junction may be associated with the same MapObject.
	//
	// Returns:
	//     Returns the MapObject associated with this junction.  The returned MapObject may not 
	//     necessarily be a Trackside object, so always <l gscLangKeyCast  cast> to be sure.  A null
	//     reference is returned in the case of failure.
	//
	public native MapObject GetMapObject(void);


	//! Gets the GameObject associated with this junction.
	//
	// Note:
	//     The returned GameObject may or may not be equivalent to the MapObject, and may or may not
	//     be equivalent to this JunctionBase.  Always <l gscLangKeyCast  cast> to be sure.
	//
	// Returns:
	//     Returns the GameObject associated with this junction.
	//
	public native GameObject GetGameObject(void);


	//! Gets a string that describes the MapObject associated with this junction.
	//
	// Returns:
	//     Returns a string that contains the node ID and name of the MapObject associated with this
	//     junction.  If successful, the returned string will include the <l GameObject::GetId()  node ID>
	//     and <l GameObject::GetName()  name> of the MapObject.  Otherwise in error string will be 
	//     returned instead.
	//
	public string GetDebugString(void)
	{
	  MapObject mapObject = GetMapObject();
	  
	  if (!mapObject)
	    return "junction<null>";
	  
	  return "junction<" + mapObject.GetId() + ",\"" + mapObject.GetName() + "\">";
	}


	//
	// The following are similar to the Trackside.* methods, but also work on non-Trackside JunctionBase objects.
	//

	//! Sends a new (<m"Junction">, <m "Enter">) message to this junction from the specified train.
	//
	// This method exists so a JunctionBase child class that doesn't inherit from the 
	// Trackside/Junction hierarchy can still have re-enter capabilities.
	//
	// Param:  nodeId  Train's node ID that may be found by using <l GameObject::GetId  GetId>().
	//
	// Returns:
	//     Returns true if the train identified by <i nodeId> is in the junction and the message was
	//     sent, false otherwise.
	//
	// See Also:
	//     Trackside::ReEnter()
	//
	public native bool JunctionReEnter(int nodeId);


	//! Sends a new (<m"Junction">, <m "InnerEnter">) message to this junction from the specified train.
	//
	// This method exists so a JunctionBase child class that doesn't inherit from the 
	// Trackside/Junction hierarchy can still have inner re-enter capabilities.
	//
	// Param:  nodeId  Train's node ID that may be found by using <l GameObject::GetId  GetId>().
	//
	// Returns:
	//     Returns true if the train identified by <i nodeId> is in the junction and the message was
	//     sent, false otherwise.
	//
	// See Also:
	//     Trackside::InnerReEnter()
	//
	public native bool JunctionInnerReEnter(int nodeId);
	


	//! Gets the direction of this junction relative to the given Track from the single-track end.
	//
	// Param:  track  Track to get the relative direction of to this junction.  The Track must be
	//                directly connected to this junction.
	//
	// Returns:
	//     Returns the \ref juncStates "direction" of this junction as seen from its single track
	//     end relative to <i track>.
	//
	// See Also:
	//     \ref juncStates "Junction States"
	//
	public native int GetDirectionToTrack(Track track);
	


	//! Gets the Track connected to this junction in the specified direction.
	//
	// Param:  direction  The \ref juncStates "direction" in which to get the Track.
	//
	// Returns:
	//     Returns the Track attached to this junction in the specified direction.
	//
	// See Also:
	//     \ref juncStates "Junction States"
	//
	public native Track GetTrackInDirection(int direction);
  
  
	// ============================================================================
  // Name: BeginTrackSearch
  // Desc: This method starts a search down the track from this junction in the 
  //       specified direction. An interface is returned allowing the programmer
  //       to search for any trackside objects that exist along the track.
	//       Even though the search crosses track sections and separate splines, 
  //       it will come to end when the line ends or an obstacle is encountered
  //       such as a junction set against the path or a turntable for example.
  //       Unlike Trackside.BeginTrackSearch(), this variant will start from the
  //       exact track junction point and extend out in the specified junction
  //       direction, rather than starting at the Junction trackside object.
	// Parm: direction - Junction direction to perform the search in.
  // Retn: GSTrackSearch - An interface that allows trackside items to be
  //       discovered in the specified direction.
	// ============================================================================
	public native GSTrackSearch BeginTrackSearch(int direction);
	
	
	
	// ============================================================================
  // Name: ToggleJunction
  // Desc: Toggle the junction to its next state. Typically called as the result
  //       of UserRequestToggle(). It is not recommended that other scripts call
  //       this function - if you need a particlar junction direction set,
  //       use the explicit direction set functions.
  // ============================================================================
	public native void ToggleJunction(void);
	
	
	
	// ============================================================================
  // Name: UserRequestToggle
  // Desc: Called from native code when the user wishes to toggle this junction.
  //       Basic permission checks have already been performed at this point-
  //       the user is clear to proceed, so any override here should honor the
  //       request.
  // ============================================================================
	public void UserRequestToggle(void)
	{
	  ToggleJunction();
	}
};


