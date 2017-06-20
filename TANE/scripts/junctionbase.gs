//=============================================================================
// File: JunctionBase.gs
// Desc: Defines the top-level JunctionBase class.
//=============================================================================
include "gs.gs"
include "permit.gs"
include "train.gs"
include "trackside.gs"


//=============================================================================
// Name: JunctionBase
// Desc: A top level interface for a junction in Trainz. The methods provided
//       here apply to junctions created with trackside objects and fixed track
//       junctions.
//       Junctions made from trackside levers are represented by the Junction
//       class which inherits from this class as well as Trackside.
//       Fixed track junctions do not have all the features of a Trackside
//       object (and should not be expected to).
// 
// The messages used by a JunctionBase object are:
//
//  Major             | Minor           | Source            | Destination
//--------------------|-----------------|-------------------|----------------
//  JunctionBase      | Enter           | JunctionBase      | Train
//  JunctionBase      | InnerEnter      | JunctionBase      | Train
//  JunctionBase      | Stopped         | JunctionBase      | Train
//  JunctionBase      | Leave           | JunctionBase      | Train
//  JunctionBase      | InnerLeave      | JunctionBase      | Train
//  JunctionBase      | Toggled         | JunctionBase      | Broadcast
//  Object            | Enter           | Train             | JunctionBase
//  Object            | InnerEnter      | Train             | JunctionBase
//  Object            | Stopped         | Train             | JunctionBase
//  Object            | Leave           | Train             | JunctionBase
//  Object            | InnerLeave      | Train             | JunctionBase
//
// 
// See Also: Junction.gs, JunctionBaseGameObject.gs, SceneryWithTrack.gs
//
//=============================================================================
game class JunctionBase
{

  //=============================================================================
  // Desc: Possible states a junction can be switched to
  //=============================================================================
  public define int DIRECTION_LEFT      = 0;    //!< Left junction direction state.
  public define int DIRECTION_FORWARD   = 1;    //!< Forward junction direction state.
  public define int DIRECTION_RIGHT     = 2;    //!< Right junction direction state.
  public define int DIRECTION_BACKWARD  = -1;   //!< Backward junction direction state.
  public define int DIRECTION_NONE      = 3;    //!< %Junction not in any state.


  //=============================================================================
  // Name: SetJunctionOwner
  // Desc: Modifies the junction owner object if possible. If the junction is
  //       already owned this call will only succeed if the token is valid for
  //       the current owner
  // Parm: token - A token for the junction owner (new and current, if
  //       applicable) with rights "junction-owner"
  // Parm: owner - The new desired junction owner, or null to switch to unowned
  // Retn: bool - Whether the call succeeded, and the junction owner was changed
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native bool SetJunctionOwner(SecurityToken token, TrainzGameObject owner);

  //=============================================================================
  // Name: GetJunctionOwner
  // Desc: Returns the current junction owner object, if any
  //=============================================================================
  public native TrainzGameObject GetJunctionOwner();


  //=============================================================================
  // Name: GetMapObject
  // Desc: Gets the MapObject associated with this junction. Note that more than
  //       one junction may be associated with the same MapObject.
  //=============================================================================
  public native MapObject GetMapObject(void);


  //=============================================================================
  // Name: GetGameObject
  // Desc: Gets the GameObject associated with this junction. This GameObject may
  //       or may not be equivalent to the MapObject, and may or may not be
  //       equivalent to this JunctionBase.
  //=============================================================================
  public native GameObject GetGameObject(void);


  //=============================================================================
  // Name: SetDirection
  // Desc: Sets the direction for this junction, if possible. If this junction is
  //       owned and a null token is passed the call will fail and throw a script
  //       exception.
  // Parm: token - A token for the junction owner with rights "junction-dir"
  // Parm: direction - The desired junction direction, see DIRECTION_*
  // Retn: bool - Whether the call succeeded, and the direction was changed
  //=============================================================================
  public native bool SetDirection(SecurityToken token, int direction);

  //=============================================================================
  // Name: SetDirection
  // Desc: Obsolete. This function will fail if the junction is owned.
  //=============================================================================
  public obsolete bool SetDirection(int dir) { return SetDirection(null, dir); }


  //=============================================================================
  // Name: SetDefaultDirection
  // Desc: Sets the direction that this junction is reverts to when all permits
  //       are released. If no permits are currently held on this junction, then
  //       the junction direction will change immediately. If this junction is
  //       owned and a null token is passed the call will fail and throw a script
  //       exception.
  // Parm: token - A token for the junction owner with rights "junction-dir"
  // Parm: direction - The desired junction direction, see DIRECTION_*
  // Retn: bool - Whether the call succeeded, and the direction was changed
  //=============================================================================
  public native bool SetDefaultDirection(SecurityToken token, int direction);

  //=============================================================================
  // Name: SetDefaultDirection
  // Desc: Obsolete. This function will fail if the junction is owned.
  //=============================================================================
  public obsolete bool SetDefaultDirection(int direction)
  {
    return SetDefaultDirection(null, direction);
  }


  //=============================================================================
  // Name: GetDirection
  // Desc: Gets the current direction of this junction.
  // Retn: One of the DIRECTION_* defines representing the currently configured
  //       direction of this junction.
  //=============================================================================
	public native int GetDirection(void);


  //=============================================================================
  // Name: GetLocalisedJunctionDirectionName
  // Desc: Returns a human readable localised name for a junction direction.
  // Parm: junctionDirection - One of the DIRECTION_* defines.
  //=============================================================================
	public native string GetLocalisedJunctionDirectionName(int junctionDirection);


  //=============================================================================
  // Name: AllowManualControl
  // Desc: Sets whether to allow players to change this junctions direction.
  //=============================================================================
	public native void AllowManualControl(bool allow);


  //=============================================================================
  // Name: GetManualControl
  // Desc: Returns whether this junction currently allows players to change it.
  //=============================================================================
	public native bool GetManualControl();



  //=============================================================================
  // Name: SetAllowsPermitControl
  // Desc: Sets whether this junction will grant permits which represent a
  //       direction change from the default state (enabled by default). Note
  //       that applying permit control does not revoke any pre-existing permits.
  //       If this junction is owned and a null token is passed the call will
  //       fail and throw a script exception.
  // Parm: token - A token for the junction owner with rights "junction-permit"
  // Parm: bAllow - Whether to grant permits to change the junction direction
  // Retn: bool - Whether the call succeeded, and the permit control was changed
  //=============================================================================
  public native bool SetAllowsPermitControl(SecurityToken token, bool bAllow);

  //=============================================================================
  // Name: SetAllowsPermitControl
  // Desc: Obsolete. This function will fail if the junction is owned.
  //=============================================================================
  public obsolete void SetAllowsPermitControl(bool bAllow)
  {
    SetAllowsPermitControl(null, bAllow);
  }

  // ============================================================================
  // Name: DoesAllowPermitControl
  // Desc: Queries whether this junction will grant permits which represent a
  //       direction change. See SetAllowsPermitControl().
  // Parm: bool - True if normal permit control is allowed.
  // ============================================================================
  public native bool DoesAllowPermitControl(void);


  //=============================================================================
  // Name: RequestPermit
  // Desc: Requests a permit to control this junction. If this junction is owned
  //       and a null token is passed the call will fail and throw an exception
  //       unless no change in junction direction is needed.
  // Parm: token - A token for the junction owner with rights "junction-permit"
  // Parm: obj - The object requesting the permit
  // Parm: dir - The direction the caller wishes to set the junction to
  //=============================================================================
  public native Permit RequestPermit(SecurityToken token, GameObject obj, int dir);

  //=============================================================================
  // Name: RequestPermit
  // Desc: Obsolete. This function may fail if the junction is owned
  //=============================================================================
  public obsolete Permit RequestPermit(GameObject obj, int dir)
  {
    return RequestPermit(null, obj, dir);
  }

  // Obsolete, do not use
  public obsolete native Permit RequestPermit(GameObject obj);


  //=============================================================================
  // Name: RequestTrackPermit
  // Desc: Requests a permit to drive on the track which is attached to this
  //       junction, in the direction specified. If this junction is owned
  //       and a null token is passed the call will fail and throw an exception
  //       unless no change in junction direction is needed.
  // Parm: token - A token for the junction owner with rights "junction-permit"
  // Parm: obj - The object requesting the permit
  // Parm: dir - The direction of the target track stretch
  //=============================================================================
  public native Permit RequestTrackPermit(SecurityToken token, GameObject obj, int dir);

  //=============================================================================
  // Name: RequestTrackPermit
  // Desc: Obsolete. This function may fail if the junction is owned.
  //=============================================================================
  public obsolete Permit RequestTrackPermit(GameObject obj, int dir)
  {
    return RequestTrackPermit(null, obj, dir);
  }


  //=============================================================================
  // Name: SwitchForTrain
  // Desc: Changes this junction so that the given train can cross it in the
  //       specified direction. If this junction is owned and a null token is
  //       passed the call will fail and throw an exception unless no change in
  //       junction direction is needed.
  // Parm: token - A token for the junction owner with rights "junction-dir"
  // Parm: train - The train which wants to cross the junction
  // Parm: dir - Direction from this junction that the train is to travel through
  //       to. Must be on the opposite side of this junction that the train is.
  // Retn: bool - Whether the call succeeded, and the junction was changed
  //=============================================================================
  public native bool SwitchForTrain(SecurityToken token, Train train, int dir);

  //=============================================================================
  // Name: SwitchForTrain
  // Desc: Obsolete. This function may fail if the junction is owned.
  //=============================================================================
  public obsolete bool SwitchForTrain(Train train, int dir)
  {
    return SwitchForTrain(null, train, dir);
  }


  //=============================================================================
  // Name: GetDirectionToTrain
  // Desc: Gets the direction of this junction relative to the given train from
  //       the single-track end.
  // Parm: train - Train to get search for. The train must be within a reasonable
  //       range of this junction (currently 15 track stretches).
  //=============================================================================
  public native int GetDirectionToTrain(Train train);


  //=============================================================================
  // Name: GetDirectionToTrack
  // Desc: Gets the direction of this junction relative to the given Track from
  //       the single-track end.
  // Parm: track - Track to get the relative direction of to this junction. The
  //       Track must be directly connected to this junction.
  //=============================================================================
  public native int GetDirectionToTrack(Track track);


  //=============================================================================
  // Name: GetTrackInDirection
  // Desc: Gets the Track connected to this junction in the specified direction.
  // Parm: direction - The DIRECTION_* define of the direction to get track in.
  //=============================================================================
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


  //=============================================================================
  // Name: JunctionReEnter
  // Desc: Resends "Junction","Enter" messages for the train specified by the
  //       GameObjectID passed. The train must already be inside the trigger.
  // Parm: nodeId - The GameObjectID for the train to resend messages for.
  // Retn: bool - Whether the train was found and messages were resent.
  //=============================================================================
  public native bool JunctionReEnter(GameObjectID nodeId);

  // Obsolete, do not use
  public obsolete bool JunctionReEnter(int id) { return JunctionReEnter(Router.GetGameObject(id).GetGameObjectID()); }


  //=============================================================================
  // Name: JunctionInnerReEnter
  // Desc: Resends "Junction","InnerEnter" messages for the train specified by
  //       the GameObjectID passed. The train must already be inside the trigger.
  // Parm: nodeId - The GameObjectID for the train to resend messages for.
  // Retn: bool - Whether the train was found and messages were resent.
  //=============================================================================
  public native bool JunctionInnerReEnter(GameObjectID nodeId);

  // Obsolete, do not use
  public obsolete bool JunctionInnerReEnter(int id) { return JunctionInnerReEnter(Router.GetGameObject(id).GetGameObjectID()); }


  //=============================================================================
  // Name: ToggleJunction
  // Desc: Toggles the junction to the next possible state. If this junction is
  //       owned and no token is passed the call will fail and throw an exception
  // Parm: token - A token for the junction owner with rights "junction-dir"
  // Retn: bool - Whether the call succeeded, and the junction was changed
  //=============================================================================
  public native bool ToggleJunction(SecurityToken token);

  //=============================================================================
  // Name: ToggleJunction
  // Desc: Obsolete. This function will fail if the junction is owned.
  //=============================================================================
  public obsolete void ToggleJunction() { ToggleJunction(null); }


  // ============================================================================
  // Name: UserRequestToggle
  // Desc: Called from native code when the user wishes to toggle this junction.
  //       Basic permission checks have already been performed at this point-
  //       the user is clear to proceed, so any override here should honor the
  //       request.
  // ============================================================================
  public void UserRequestToggle(void)
  {
    if (GetJunctionOwner())
      return;

    ToggleJunction(null);
  }


  //=============================================================================
  // Name: GetDebugString
  // Desc: Returns a debug string that describes the MapObject and GameObject
  //       associated with this junction. For debugging/logging purposes only.
  //=============================================================================
  public string GetDebugString(void)
  {
    string debugString;

    // First part, map object info
    MapObject mapObject = GetMapObject();
    if (mapObject)
      debugString = "junction<\"" + mapObject.GetDebugName() + "\", ";
    else
      debugString = "junction<{null}, ";

    // Second part, game object info
    GameObject gameObject = GetGameObject();
    if (gameObject)
      debugString = debugString + "\"" + gameObject.GetDebugName() + "\">";
    else
      debugString = debugString + "{null}>";

    return debugString;
  }


};


