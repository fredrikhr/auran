//
// Buildable.gs
//
//  Copyright (C) 2003-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "SceneryWithTrack.gs"
include "Train.gs"


//! %Interface for an object that is buildable with building states and progress level.
//
// At this stage in %Trainz, the building states are not really used.  This class is mainly a parent
// class for Industry.
//
// Messages used with a Buildable object are:
// {[ Major    | Minor        | Source  | Destination       ]
//  [ "Build"  | "Started"    | --      | buildable object  ]
//  [ "Build"  | "Cancelled"  | --      | buildable object  ]
//  [ "Build"  | "Completed"  | --      | buildable object  ]}
//
// See Also:
//     Industry, SceneryWithTrack, Train::GetLastVisitedBuildable(), Crossing, Turntable
//
game class Buildable isclass SceneryWithTrack
{
	//! \name   Buildable Object States
	//  \anchor buildState
	//@{
	//! Different states a buildable object can be in.
	//
	// See Also:
	//     Buildable::GetBuildingState(), Buildable::SetBuildingState()
	//

	public define int STATE_POTENTIAL = 0;  //!< Object has potential to build.
	public define int STATE_BUILDING = 1;   //!< Object is currently in a building (in progress) state.
	public define int STATE_COMPLETE = 2;   //!< Building is complete.

	//@}


	//! Gets the current state of this buildable object.
	//
	// Returns:
	//    Returns the current built state of this game object.  See the \ref buildState "Buildable Object States"
	//    section for details.
	//
	public native int GetBuildingState(void);

	//! Gets the current progress of this buildable object.
	//
	// Returns:
	//     Returns the current progress of the building.
	//
	public native float GetBuildingProgress(void);

	//! Sets the state of this buildable object.
	//
	// Param:  state  Building state to set this object to.  See the \ref buildState "Buildable Object States"
	//                section for details.
	//
	public native void SetBuildingState(int state);

	//! Sets the progress rate of this building
	//
	// Param:  progress   Rate of progress of the building.
	//
	public native void SetBuildingProgress(float progress);

	//! Sets the paused state of this building.
	//
	// Param:  paused  If true, the building process will be paused, false to unpause.
	//
	public native void SetBuildingPaused(bool paused);

	//! Start building.
	//
	// Returns:
	//     Returns true if build was started, false otherwise.
	//
	public native bool StartBuild(void);

	//! Cancel building.
	//
	// Returns:
	//     Returns true if the build was cancelled, false otherwise.
	//
	public native bool CancelBuild(void);

	//! Allow/disallow the user to start the building process.
	//
	// Param:  enable  If true, the user will be able to start the build, false to deny starting by
	//                 the user.
	//
	public native void EnableUserStartBuild(bool enable);

	//! Allow/disallow the user to cancel the building process.
	//
	// Param:  enable  If true, the user will be able to cancel the build, false to deny cancellation
	//                  by the user.
	//
	public native void EnableUserCancelBuild(bool enable);
};

