//
// Permit.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"


//! Permit provides a way of requesting control of a game object resource such as a Track or Junction.
//
// Permits are acquired by requesting them from various game objects.  Some objects may only give
// out one permit at a time, others may give multiple permits with certain conditions.  For example,
// a track could permit several trains travelling in the same direction.
//
// Permits are used to stop scripts from 'fighting' over resources in situations such as:
//  - Two trains want to go opposite directions down a single line; or
//  - Two trains want to go through the same junction.
//
// When a request is made, a permit is always returned, however it is not automatically granted.
// Instead, you have to wait for the permit to reach a 'granted' state.  You can determine when a
// permit has been granted by:
//
//  -# Performing a <l gscLangKeyWait  wait()> on a message of type (<m"Permit">, <m "Granted">).
//     Just make sure you check that it is <bi YOUR> permit that was granted.  You can do this by
//     just calling WasGranted() on your permit after receiving the message.  The message is sent
//     to the GameObject passed in to the <b RequestPermit> methods such as 
//     Junction::RequestPermit() or Track::RequestPermitForTrain().
//
//  -# Regularly checking IsGranted() which will return true after the Permit is Granted.
//     <bi DO NOT> use IsGranted() continuously to wait because it just wastes CPU time - but there
//     may be other uses for this method, such as if we want to request a permit now for use in the
//     future, and don't want to have to listen to the (<m"Permit">, <m "Granted">) message all the
//     time.
//
// Permits are released automatically.  When no more references to a particular Permit remain, it
// is automatically released.  So you generally don't need to call Release().
//
// Permits can be in one of three states:
//  -# \ref permitStates "REQUESTING"
//  -# \ref permitStates "GRANTED"
//  -# \ref permitStates "RELEASED"
//
// A permit is initially in the \ref permitStates "REQUESTING" state.  When the permit is granted,
// it moves to the \ref permitStates "GRANTED" state.  When Release() is called, or the permit is
// revoked, the permit moves to the \ref permitStates "RELEASED" state (A permit can be forced 
// directly to a \ref permitStates "RELEASED" state from \ref permitStates "REQUESTING".)  A permit
// can never be re-requested, you must obtain a new permit.  Permits are only revoked in exceptional
// circumstances, but you don't normally need to deal with this.
//
// See Also:
//     GameObject, Junction::RequestTrackPermit(), Track::RequestPermitForTrain(),
//     Trackside::RequestTrackPermit(), Train
//
final game class Permit isclass GSObject
{

	//! \name   Permit States
	//  \anchor permitStates
	//@{
	//! States that a permit can be in.
	//
	// See Also:
	//     Permit::IsGranted(), Permit::IsReleased(), Permit::WasGranted()
	//

	public define int STATE_REQUESTING = 0;  //!< Permit has yet to be granted.
	public define int STATE_GRANTED = 1;     //!< Permit has been granted.
	public define int STATE_RELEASED = 2;    //!< Permit has been released.

	//@}


	//! Gets the current state of this permit.
	//
	// Returns:
	//     Returns one of the \ref permitStates "permit states" constants indicating the current state
	//     of this permit.
	//
	public native int GetState(void);

	//! Releases this permit.
	// 
	// If this permit has not yet been granted, than the request it made will be cancelled.
	//
	public native void Release(void);

	//! Determines if this permit is currently granted.
	//
	// Returns:
	//     Returns true if the permit is currently granted.  Otherwise false if it hasn't been granted
	//     or has been released.
	//
	public bool IsGranted(void)
	{
		return GetState() == STATE_GRANTED;
	}

	//! Determines if this permit is granted or has been released.
	//
	// Returns:
	//     Returns true if the permit is currently granted or has been released (even if it was never
	//     granted but has a released state).  Otherwise false if it has not been granted or released.
	//
	public bool WasGranted(void)
	{
		return GetState() != STATE_REQUESTING;
	}

	//! Determines if this permit has been released.
	//
	// Returns:
	//     Returns true if this permit has been released, false otherwise.
	//
	public bool IsReleased(void)
	{
		return GetState() == STATE_RELEASED;
	}

	//! Determines if the given permit and this permit are both after permission for the same GameObject.
	//
	// This method allows the detection of cases where two permits are requested/held which would
	// cause a deadlock situation.
	//
	// Param:  other  Other object to check for conflict with.
	//
	// Returns:
	//     Returns true if this permit and other are both for the same game object (i.e. a track block
	//     or a junction), false otherwise.
	//
	public native bool IsForSameObjectAs(Permit other);

	//! Determines if the given permit has the same permissions and host object as this one does.
	//
	// Param:  other  Other permit to compare against this one.
	//
	// Returns:
	//     Returns true if this permit has the same permissions as <i other>.  Otherwise false is
	//     returned if this permit is not for the same object as <i other> or any other reason.
	//
	public native bool HasSamePermissionsAs(Permit other);


	//! Gets the object that this permit is after permission for.
	//
	// Returns:
	//     Returns the object to which this permit corresponds to if successful, null otherwise.  As 
	//     this method's return type is <l gscLangKeyObject  object> which doesn't refer to a 
	//     particular class, it must be <l gscLangKeyCast  cast> and verified before further usage.
	//
	public native object GetObjectBase(void);

	//! Gets the GameObject that this permit is after permission for.
	//
	// Returns:
	//     Returns the GameObject to which this permit corresponds to if successful, otherwise null if
	//     this permit doesn't correspond to a current GameObject.
	//
	public GameObject GetObject(void)
	{
	  object obj = GetObjectBase();
	  return cast<GameObject>(obj);
	}

	//! Gets a debug string containing the <l GameObject::GetId node ID> of the object that this permit is for.
	//
	// Returns:
	//     If this permit currently corresponds to an existing GameObject, the ID of the object will 
	//     be returned in a string that takes the form of <m "&lt;gameobject:ID&gt;">.  Otherwise, the
	//     string <m "&lt;unknown&gt;"> will be returned.
	//
	public string GetDebugString(void)
	{
	  GameObject obj = GetObject();
	  
	  if (obj)
	    return "<gameobject:" + obj.GetId() + ">";
	  
	  return "<unknown>";
	}

	//! Sets the owner of this permit to the given game object.
	//
	// Changes the owner object to the specified game object.  If this permit is already granted, 
	// another (<m"Permit">, <m "Granted">).message is sent to the new owner of <i obj>.
	//
	// Param:  obj  Object to assign this permit to.
	//
	public native void SetOwnerObject(GameObject obj);

};
