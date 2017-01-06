//
// Turntable.gs
//
//  Copyright (C) 2002-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "SceneryWithTrack.gs"


//! Turntable class.  An interface to operate a turntable is provided.
//
// To get a reference to a turntable item on the map, use Router::GetGameObject(string) and
// <l gscLangKeyCast  cast> to this class.
//
// See Also:
//     Router::GetGameObject(string), Track, Trackside
//
game class Turntable isclass SceneryWithTrack
{
	//! Determines if this turntable is currently moving.
	//
	// Returns:
	//     Returns true if this turntable is currently moving, false otherwise.
	//
	public native bool IsMoving(void);

	//! Gets the current position of this turntable.
	//
	// Returns:
	//     Returns the position of this turntable.
	//
	public native int GetStopPosition(void);

	//! Moves the turntable to its next stop position.
	public native void MoveToNextStop(void);

	//! Moves the turntable to its previous stop position.
	public native void MoveToPrevStop(void);

	//! Moves the turntable to the given stop position.
	//
	// Param:  stopIndex  Position to move the turntable to.
	//
	public native void MoveToStop(int stopIndex);

	//! Determines if this turntable can move to the next stop position.
	//
	// Returns:
	//     Returns true if this turntable can move to the next stop position, false otherwise.
	//
	public native bool CanMoveToNextStop(void);

	//! Determines if this turntable can move to the previous stop position.
	//
	// Returns:
	//     Returns true if this turntable can move to the previous stop position, false otherwise.
	//
	public native bool CanMoveToPrevStop(void);

};

