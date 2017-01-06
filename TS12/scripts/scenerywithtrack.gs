//
// SceneryWithTrack.gs
//
//  Copyright (C) 2003-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "MapObject.gs"
include "Train.gs"


//! Parent class for scenery objects that have track such as industries and crossings.
//
// Note:
//     The track in a scenery object as triggers, but these are not to be confused with regular
//     <l Trigger  trackside triggers>.  Scenery triggers and their attributes (name, radius etc.) 
//     are defined as part of the asset's configuration and <bi cannot> be altered or moved in 
//     Surveyor.
//
// Messages used with a SceneryWithTrack object are:
//
// {[ Major             | Minor         | Source              | Destination         ]
//  [ "SceneryTrigger"  | "Enter"       | scenery with track  | vehicle             ]
//  [ "SceneryTrigger"  | "InnerEnter"  | scenery with track  | vehicle             ]
//  [ "SceneryTrigger"  | "Stopped"     | scenery with track  | vehicle             ]
//  [ "SceneryTrigger"  | "InnerLeave"  | scenery with track  | vehicle             ]
//  [ "SceneryTrigger"  | "Leave"       | scenery with track  | vehicle             ]
//  [ "Object"          | "Enter"       | vehicle             | scenery with track  ]
//  [ "Object"          | "InnerEnter"  | vehicle             | scenery with track  ]
//  [ "Object"          | "Stopped"     | vehicle             | scenery with track  ]
//  [ "Object"          | "InnerLeave"  | vehicle             | scenery with track  ]
//  [ "Object"          | "Leave"       | vehicle             | scenery with track  ]}
//
// See Also:
//     Buildable, Crossing, Turntable, Industry, MapObject, JunctionBase
//
game class SceneryWithTrack isclass MapObject
{
	//! Causes the specified node to re-enter this scenery object.
	//
	// Even if the object that <i nodeId> represents is already in this scenery object, it will still
	// be re-entered.  As a result, a message of type (<m"Object">, <m"Enter">) will be sent to
	// this object from the <i nodeId> object.
	//
	// Param:  nodeId  Node ID of object that re-enters this scenery object (usually a Vehicle).
	//                 Use <l GameObject::GetId  GetId>() on the object to get its node ID.
	//
	public native bool ReEnter(int nodeId);



	//! Causes the specified node to inner re-enter this scenery object.
	//
	// Even if the object that <i nodeId> represents is already in this scenery object, it will still
	// be inner re-entered (i.e. not the default region defined by a 150 meter radius).  As a result,
	// a message of type (<m"Object">, <m"InnerEnter">) will be sent to this object from the 
	// <i nodeId> object.
	//
	// Param:  nodeId  Node ID of object that re-enters this scenery object (usually a Vehicle).
	//                 Use <l GameObject::GetId  GetId>() on the object to get its node ID.
	//
	public native bool InnerReEnter(int nodeId);



	//! Finds the name of the scenery trigger that has the specified object in it.
	//
	// Param:  nodeId            Node ID of object to find (a vehicle for example).  Use 
	//                           <l GameObject::GetId  GetId>() on the object to get its node ID.
	// Param:  onlyInnerTrigger  If true, the trigger name is returned only if the object is in the
	//                           inner area of the trigger, otherwise the trigger name will be 
	//                           returned if the object is within 50 meters of the trigger.
	//
	// Returns:
	//     Returns the name of the scenery trigger the object specified by <i nodeId> is within.
	//     Note that this is a scenery trigger, <bi not> a trackside Trigger.
	//
	public native string FindTriggerContainingNode(int nodeId, bool onlyInnerTrigger);


  // ============================================================================
  // Name: GetDistanceBetweenTriggerAndVehicle
  // Desc: Returns the distance between the named trigger and the specified 
  //       GameObject node. Distance is line of sight and not signed.
  // Parm: triggerName - the string name of the trigger to measure from
  // Parm: trainVehicle - the vehicle to measure to
  // Retn: float - distance between trigger and node. 
  // ============================================================================
	public native float GetDistanceBetweenTriggerAndVehicle(string triggerName, Vehicle trainVehicle);


	//! Gets the track segment that the named scenery trigger is on.
	//
	// Note:
	//     A script exception will be thrown if a scenery trigger by the name of <i triggerName> is not
	//     present in this scenery item.
	//
	// Param:  triggerName  Name of the trigger to get the track of.
	//
	// Returns:
	//     Returns the Track which has been specified for the named trigger.  If <i triggerName> does
	//     not specify a track, null is returned.
	//
	public native Track GetTriggerTrack(string triggerName);



	//! Gets the named track segment from this scenery object.
	//
	// Param: trackName  Name of the track segment to get.
	//
	// Returns:
	//     Returns a Track object if the one specified by <i trackName> exists, null otherwise.
	//
	public native Track GetAttachedTrack(string trackName);



	//! Gets the junctions attached to this scenery item.
	//
	// Returns:
	//     Returns a list of junctions that are attached to this scenery item.
	//
	public native JunctionBase[] GetAttachedJunctions(void);
	
	
	
	//! Gets all tracks attached to this scenery item.
	//
	// Returns:
	//     Returns a list of all Tracks that are attacked to this scenery item.
	//
	public native Track[] GetAttachedTracks(void);



	//! Calls InnerReEnter() on all of the vehicles in the given train.
	//
	// Param:  train  Train to inner re-enter all the vehicles of.
	//
	public void InnerReEnterTrain(Train train)
	{
		int i;
		Vehicle[] vehicles = train.GetVehicles();

		for (i = 0; i < vehicles.size(); i++)
			InnerReEnter(vehicles[i].GetId());
	}
	
	

	//! Determines if any part of the given train is within any of this scenery item's triggers.
	//
	// Param:  train                 Train to check presence of.
	// Param:  onlyCheckInnerRadius  If true, <i train> will only be checked for on the inner areas
	//                               of the triggers, as defined by the trigger's radius.  Otherwise
	//                               false and the outer region of the triggers is used, which is 
	//                               defined by a radius of 150 meters.
	//
	// Returns:
	//     Returns true if <i train> is on any of this scenery object's triggers, false otherwise.
	//
	public native bool IsTrainInTriggers(Train train, bool onlyCheckInnerRadius);
	
	
	
	//! Notifies observers that the state of this object has changed.
	//
	// Signals are observers of nearby objects, so calling this will cause nearby signals to update.
	//
	public native void NotifyTrackGraphObservers(void);
	
	
	
	// ============================================================================
  // Name: UserRequestToggle
  // Desc: Called from native code when the user wishes to toggle this junction.
  //       Basic permission checks have already been performed at this point-
  //       the user is clear to proceed, so any override here should honor the
  //       request.
  // Parm: attachedJunction - Which junction is to be toggled.
  // ============================================================================
	public void UserRequestToggle(JunctionBase attachedJunction)
	{
	  // By default, we just go ahead and toggle the junction.
	  attachedJunction.ToggleJunction();
	}

};

