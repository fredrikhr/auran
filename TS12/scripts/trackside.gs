//
// trackside.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "permit.gs"
include "MapObject.gs"
include "GSTrackSearch.gs"


//! A track side item such as a junction, signal, track mark, trigger or vehicle.
//
// This class is a parent class for trackside items.  Junction, Signal, TrackMark, Trigger and
// Vehicle are all child classes of Trackside.  Functionality generic to all trackside items 
// including methods to obtain Permits are provided in this class.
//
// Although more specialised trackside items like signals and junctions are catered for with 
// appropriate child classes, there is no child class for speed board items.  GetSpeedLimit() can
// be used to determine weather a Trackside object is a speed board or not.
//
// Trackside items may be placed in Surveyor and retrieved in script code.  To retrieve a 
// trackside item, use <l Router::GetGameObject  Router::GetGameObject>("itemName") and 
// <l gscLangKeyCast  cast> the returned reference to Trackside.
//
// See Also:
//     Junction, Signal, TrackMark, Trigger, Vehicle, MapObject, GSTrackSearch, Permit, 
//     SceneryWithTrack, Track
//
game class Trackside isclass MapObject
{
	//! Gets a permit for the track segment on which this trackside item lies.
	//
	// Param:  dir    Direction required by the permit.
	// Param:  owner  Object which 'owns' the permit, and which is sent any relevant messages.
	//
	// Returns:
	//     Returns a Permit object, which may or may not be granted.  Currently, a null result may 
	//     occur if the trackside object is not on a track.
	//
	public native Permit RequestTrackPermit(bool dir, GameObject owner);

	//! Gets a permit for the track segment on which this trackside item lies.
	//
	// Param:  dir  Direction required by the permit.
	//
	// Returns:
	//     Returns a Permit object, which may or may not be granted.
	//
	public Permit RequestTrackPermit(bool dir)
	{
		return RequestTrackPermit(dir, me);
	}


	//! Sends a new (<m"Object">, <m "Enter">) message to this trackside object from the specified train.
	//
	// Param:  nodeId  Train's node ID that may be found by using <l GameObject::GetId()  GetId>().
	//
	// Returns:
	//     Returns true if the train identified by <i nodeId> is in the trigger and the message was
	//     sent, false otherwise.
	//
	public native bool ReEnter(int nodeId);

	//! Sends a new (<m"Object">, <m "InnerEnter">) message to this trackside object from the specified train.
	//
	// Param:  nodeId  Train's node ID that may be found by using <l GameObject::GetId()  GetId>().
	//
	// Returns:
	//     Returns true if the train identified by <i nodeId> is in the trigger and the message was
	//     sent, false otherwise.
	//
	public native bool InnerReEnter(int nodeId);


	//! Gets the current color state of a signal.
	//
	// Returns:
	//     Returns either \ref sigStates "GREEN", \ref sigStates "YELLOW" or \ref sigStates "RED".
	//     This method will not return \ref sigStates "AUTOMATIC".
	//
	// See Also:
	//     Signal::SetSignalState(), Signal::SetSignalStateEx()
	//
	public native int GetSignalState(void);


	//! Gets the extended state of a signal.
	//
	// See the \ref extSigStates "Extended Signal States" section in Signal for details on the various
	// extended signal states.
	//
	// Returns:
	//     Returns the extended signal state for this signal.
	//
	// See Also:
	//     Signal::SetSignalState(), Signal::SetSignalStateEx()
	//
	public native int GetSignalStateEx(void);


	//! Gets the Track segment that this trackside item is located on.
	//
	// Returns:
	//     Returns the track segment that this trackside item is located on.
	//
	public native Track GetTrack(void);


	//! Gets the speed limit associated with this trackside object.
	//
	// If this trackside item is a speed board, the speed limit of it will be returned.
	//
	// Returns:
	//     Returns the speed limit of this trackside item in MPS (metres per second) if it is a valid
	//     speed board.  If this trackside item is not a speed board, a value less than or equal to 
	//     0.0 is returned.
	//
	public native float GetSpeedLimit(void);

	//! Sets the speed limit associated with this trackside object.
	//
	// This method allows the speed limit of a trackside item that is a speed board to be changed.
	// Using this method for a variable speed limit sign is not fully supported and we don't guarantee
	// its behavior. It is generally best not to use or rely on this method.
	//
	// Param:  limit  Speed limit value expressed in MPS (meters per second).  Use a value <= 0 if
	//                you don't want this trackside item to impose a speed limit.
	//
	public native void SetSpeedLimit(float limit);


	//! Begins a track search in the specified direction from this trackside object.
	//
	// This method starts a search down the track from this trackside item in the specified direction.
	// An interface is returned allowing the programmer to search for any trackside objects that exist
	// along the track.
	//
	// Even though the search crosses track sections and separate splines, it will come to end when
	// the line ends or an obstacle is encountered such as a junction set against the route or a 
	// turntable for example.
	//
	// Param:  direction  Direction to perform the search in.  This direction value is based on the
	//                    facing direction of this trackside item (which is relative to the direction
	//                    of the Track section it is located on).  Use true to search in the facing
	//                    direction of this trackside item, false to search in the opposite direction.
	//
	// Returns:
	//     Returns a GSTrackSearch object which is an interface that allows further trackside items to
	//     be discovered in the specified direction.
	//
	public native GSTrackSearch BeginTrackSearch(bool direction);

	//! Finds out whether this object is an AI Direction Marker.
	//
	// Returns:
	//     Returns true if the object is an AI Direction Marker, false otherwise.
	//
	public native bool GetIsSearchLimit(void);
	
	//! Notifies observers that the state of this object has changed.
	//
	// Signals are observers of nearby objects, so calling this will cause nearby signals to update.
	//
	public native void NotifyTrackGraphObservers(void);
};

