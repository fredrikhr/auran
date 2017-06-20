//
// Track.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "Permit.gs"
include "Train.gs"


//! Track defines an uninterrupted stretch of rail between two objects of interest (e.g. <l Junction  junctions>, <l Industry  industries> etc.).
//
// This class is used to control the flow of <l Train  trains> from a scripting perspective.  While
// somewhat analogous to the signaling system, the Track Graph is currently a completely distinct
// entity.  The graph provides basic path finding and clear-route enforcement through the Permit 
// system.  The graph is currently used solely from the game scripts, primarily when a Train is
// running a Schedule.  The game engine's autopilot functionality uses the signaling system only.
//
// Tracks are not currently named; the only reliable way to obtain a Track reference is to be given
// it by the game engine during Schedule construction (see DriverCharacter) or from the 
// <l Message::src  source> of a (<m"%Train">, <m"EnterTrack">) message (which is sent to the Train
// concerned).
//
// Messages that a Track object sends are:
//
// {[ Major    | Minor              | Source  | Destination  ]
//  [ "Train"  | "EnterTrack"       | track   | train        ]
//  [ "Train"  | "InnerEnterTrack"  | track   | train        ]
//  [ "Train"  | "InnerLeaveTrack"  | track   | train        ]
//  [ "Train"  | "LeaveTrack"       | track   | train        ]}
//
// All track sections and trains have a priority value in the range of [1 - 3] with the default 
// value being 2.  The priority value for tracks and trains is not a numerical scale of precedence,
// but rather a value to user for matching by the AI driver.  This means the driver will try and
// take the train along track sections that have a priority equal to that of the train.
//
// For example, a driver in control of a train that has a priority of 1 will try and take the train
// along track sections with a priority of 1 whenever possible.  As the priorities don't work on a
// precedence basis, the driver in this example will not favor a track section with a priority of 2
// over one with 3 and vice-versa.
//
// Priority values are not a mechanism for specifying an explicit route for a driver to take and
// should not be thought of in that way.  Rather, it is about being able to specify preferences
// that the driver will follow when possible.
//
// See Also:
//     DriverCharacter, GameObject, Junction, Permit, Schedule, Trackside, Train,
//     Train::SetTrainPriorityNumber(), SceneryWithTrack, GSTrackSearch
//
final game class Track isclass GameObject
{
  // TrackGraphLines have a conceptual forward and backward direction for 
  // navigation purposes. This is arbitrary but constant. It's safe to use
  // these defines as a bitfield.
	public define int DIRECTION_NONE = 0;       //!< Null.
	public define int DIRECTION_NEXT = 1;       //!< Next, Forward, True direction.
	public define int DIRECTION_PREV = 2;       //!< Previous, Backward, False direction.
	public define int DIRECTION_BOTH = 3;       //!< Both next and previous - a loop?
	
	
	//! Request a permit for the given train to drive on this stretch of track.
	//
	// Param:  train  Train to get the permit for.
	//
	// Returns:
	//     Returns a permit for train to run on this track.  Note that the permit may not be
	//     granted, so <i train> isn't guaranteed a permit.
	//
	// See Also:
	//     Permit::IsGranted(), \ref permitStates "Permit States"
	//
	public native Permit RequestPermitForTrain(Train train);


	//! Request a directional permit for the given object on this track.
	//
	// Note:
	//     The direction refers to the track's own direction, not that of a train or vehicle.
	//
	// Param:  obj        Object to get the permit for.  Can be a Train or Vehicle for example.
	// Param:  direction  Direction along this track that the permit for.  Use true to request a 
	//                    permit in direction of the track, false for a permit in the direction
	//                    opposite to that of the track.
	//
	// Returns:
	//     Returns a permit for <i obj> to run in the specified direction on this track.  Note that 
	//     the permit may not be granted.
	//
	// See Also:
	//     Permit::IsGranted(), \ref permitStates "Permit States"
	//
	public native Permit RequestPermit(GameObject obj, bool direction);


	//! Request an exclusive permit for the given object on this track.
	//
	// Param:  obj  Object to get the permit for.  Can be a Train or Vehicle for example.
	//
	// Returns:
	//     Returns a permit for train to run on this track.  Note that the permit may not be granted.
	//
	// See Also:
	//     Permit::IsGranted(), \ref permitStates "Permit States"
	//
	public native Permit RequestPermit(GameObject obj);


	//! Gets the priority of this section of track.
	//
	// Returns:
	//     Returns the priority number of this section of track.  This value will be either 1, 2 or 3.
	//
	// See Also:
	//     Train::GetTrainPriorityNumber()
	//
	public native int GetTrackPriorityNumber(void);


	//! Sets the priority of this section of track.
	//
	// Note:
	//     Changing the priority of the track won't affect existing trains under driver control 
	//     immediately.  It will only take affect when the driver restarts a new schedule.
	//
	// Param:  i  Priority value to assign to this track.  Must be either 1, 2 or 3.
	//
	// See Also:
	//     Train::SetTrainPriorityNumber()
	//
	public native void SetTrackPriorityNumber(int i);
	
	
	//! Begins a track search in the specified direction from this track stretch.
	//
	// This method starts a search down the track from the beginning of this track stretch.
	// An interface is returned allowing the programmer to search for any trackside objects
	// that exist along the track.
	//
	// Even though the search crosses track sections and separate splines, it will come to end when
	// the line ends or an obstacle is encountered such as a junction set against the route or a 
	// turntable for example.
	//
	// Param:  direction  Direction to perform the search in. The search will include the
  //         entirety of this stretch regardless of which direction you search in.
  //         ie. true will search from the beginning of the track stretch toward the end,
  //         false will search from the end of the track stretch toward the beginning.
	//
	// Returns:
	//     Returns a GSTrackSearch object which is an interface that allows further trackside items to
	//     be discovered in the specified direction.
	//
	public native GSTrackSearch BeginTrackSearchInDirection(bool direction);
  
  // Obsolete, buggy version. Do not use.
	public native GSTrackSearch BeginTrackSearch(bool direction);
	
	
	//! Determines whether this track is directly connected to the specified other, and in which 
	//  direction (in terms of this object's TrackGraph orientation.)
	// 
	// Returns:
	//     Returns a valid direction if the tracks are directly connected (eg. share an end 
	//     vertex) in such a way that a physical flow across the shared vertex is possible 
	//     (ie. they're not on the same side of a junction or etc.) Returns DIRECTION_NONE if
	//     the tracks are not directly connected in this way.
	//
	public native int GetDirectionToTrack(Track other);
	
};


