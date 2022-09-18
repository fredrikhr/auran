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

  // Possible permit states
  public define int STATE_REQUESTING  = 0;  // Permit has yet to be granted.
  public define int STATE_GRANTED     = 1;  // Permit has been granted.
  public define int STATE_RELEASED    = 2;  // Permit has been released.


  //=============================================================================
  // Name: GetState
  // Desc: Returns one of the STATE_* defines above for the state of this permit
  //=============================================================================
  public native int GetState(void);



  //=============================================================================
  // Name: Release
  // Desc: Releases this permit If this permit has not yet been granted, then the
  //       request it made will be cancelled.
  //=============================================================================
  public native void Release(void);


  //=============================================================================
  // Name: IsGranted
  // Desc: Returns whether the permit is currently granted.
  //=============================================================================
  public bool IsGranted(void) { return GetState() == STATE_GRANTED; }


  //=============================================================================
  // Name: WasGranted
  // Desc: Returns true if the permit is currently granted or has been released
  //       (even if it was never granted but has a released state)
  //=============================================================================
  public bool WasGranted(void) { return GetState() != STATE_REQUESTING; }


  //=============================================================================
  // Name: IsReleased
  // Desc: Returns whether the permit is currently released.
  //=============================================================================
  public bool IsReleased(void)
  {
    return GetState() == STATE_RELEASED;
  }

  //=============================================================================
  // Name: IsForSameObjectAs
  // Desc: Determines if the given permit and this permit are both after
  //       permission for the same GameObject.
  //=============================================================================
  public native bool IsForSameObjectAs(Permit other);


  //=============================================================================
  // Name: HasSamePermissionsAs
  // Desc: Determines if the given permit has the same permissions and host
  //       object as this one does.
  //=============================================================================
  public native bool HasSamePermissionsAs(Permit other);


  //=============================================================================
  // Name: GetObjectBase
  // Desc: Gets the object that this permit is after permission for.
  //=============================================================================
  public native object GetObjectBase(void);


  //=============================================================================
  // Name: GetObject
  // Desc: Gets the GameObject that this permit is after permission for.
  //=============================================================================
  public GameObject GetObject(void)
  {
    object obj = GetObjectBase();
    return cast<GameObject>(obj);
  }


  //=============================================================================
  // Name: SetOwnerObject
  // Desc: Changes the permit owner object to the specified game object. If this
  //       permit is already granted, another (Permit,Granted) message will be
  //       sent to the new owner.
  //=============================================================================
  public native void SetOwnerObject(GameObject obj);


  //=============================================================================
  // Name: GetDebugString
  // Desc: Returns a debug string that describes the GameObject and state for
  //       this permit. For debugging/logging purposes only.
  //=============================================================================
  public string GetDebugString(void)
  {
    GameObject obj = GetObject();
    if (obj)
      return "permit<" + obj.GetDebugName() + ":" + GetState() + ">";

    return "permit<unknown:" + GetState() + ">";
  }

};
