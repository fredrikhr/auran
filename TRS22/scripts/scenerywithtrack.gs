//=============================================================================
// Name: SceneryWithTrack.gs
// Desc: Defines the base script class for use by scenery objects with attached
//       track and track vertices. This includes stations, crossings, etc.
//=============================================================================
include "gs.gs"
include "MapObject.gs"
include "Train.gs"



//=============================================================================
// Name: SceneryWithTrack
// Desc: Parent class for scenery objects that have track, such as industries
//       and crossings. The track in a scenery object has triggers, but these
//       should not confused with manually placed trackside Triggers. Scenery
//       triggers and their attributes (name, radius etc.) are defined as part
//       of the asset's config file and cannot be altered or moved in Surveyor.
//
// Messages used with a SceneryWithTrack object are:
//
//  Major             | Minor         | Source            | Destination
//  "SceneryTrigger"  | "Enter"       | SceneryWithTrack  | Vehicle
//  "SceneryTrigger"  | "InnerEnter"  | SceneryWithTrack  | Vehicle 
//  "SceneryTrigger"  | "Stopped"     | SceneryWithTrack  | Vehicle
//  "SceneryTrigger"  | "InnerLeave"  | SceneryWithTrack  | Vehicle
//  "SceneryTrigger"  | "Leave"       | SceneryWithTrack  | Vehicle
//  "Object"          | "Enter"       | Vehicle           | SceneryWithTrack
//  "Object"          | "InnerEnter"  | Vehicle           | SceneryWithTrack
//  "Object"          | "Stopped"     | Vehicle           | SceneryWithTrack
//  "Object"          | "InnerLeave"  | Vehicle           | SceneryWithTrack
//  "Object"          | "Leave"       | Vehicle           | SceneryWithTrack
//
//=============================================================================
game class SceneryWithTrack isclass MapObject
{
  //=============================================================================
  // Name: InnerReEnter
  // Desc: Causes an "Object","Enter" message to be re-sent to this object, from
  //       the script node passed. The referenced node must actually be inside
  //       the inner radius of a trigger attached to this object, or no messages
  //       will be sent.
  //=============================================================================
  public native bool ReEnter(GameObjectID nodeId);

  // Obsolete, do not use
  public obsolete bool ReEnter(int id) { return ReEnter(Router.GetGameObject(id).GetGameObjectID()); }


  //=============================================================================
  // Name: InnerReEnter
  // Desc: Causes an "Object","InnerEnter" message to be re-sent to this object,
  //       from the script node passed. The referenced node must actually be
  //       inside the inner trigger radius of a trigger attached to this object,
  //       or no messages will be sent.
  //=============================================================================
  public native bool InnerReEnter(GameObjectID nodeId);

  // Obsolete, do not use
  public obsolete bool InnerReEnter(int id)
  {
    GameObject obj = Router.GetGameObject(id);
    if (!obj)
      return false;
    
    return InnerReEnter(obj.GetGameObjectID());
  }


  //=============================================================================
  // Name: FindTriggerContainingNode
  // Desc: Finds the name of the trigger that has the specified object in it.
  // Parm: nodeId - GameObjectID of object to find (a vehicle for example). Use
  //       GetGameObjectID() on the object to get its ID.
  // Parm: onlyInnerTrigger - If true, the trigger name is returned only if the
  //       object is in the inner area of the trigger, otherwise the trigger name
  //       will be returned if the object is within 50 meters of the trigger.
  //=============================================================================
  public native string FindTriggerContainingNode(GameObjectID nodeId, bool onlyInnerTrigger);

  // Obsolete, do not use
  public obsolete string FindTriggerContainingNode(int id, bool onlyInnerTrigger) { return FindTriggerContainingNode(Router.GetGameObject(id).GetGameObjectID(), onlyInnerTrigger); }


  //=============================================================================
  // Name: GetDistanceBetweenTriggerAndVehicle
  // Desc: Returns the distance between the named trigger and the specified
  //       GameObject node. Distance is line of sight and not signed.
  // Parm: triggerName - the string name of the trigger to measure from
  // Parm: trainVehicle - the vehicle to measure to
  // Retn: float - distance between trigger and node, or -1 if trigger not found.
  //=============================================================================
  public native float GetDistanceBetweenTriggerAndVehicle(string triggerName, Vehicle trainVehicle);


  //=============================================================================
  // Name: GetTriggerTrack
  // Desc: Gets the track segment that the named scenery trigger is on.
  // Note: An exception will be thrown if the named scenery trigger is not found.
  //=============================================================================
  public native Track GetTriggerTrack(string triggerName);


  //=============================================================================
  // Name: GetAttachedTrack
  // Desc:  Gets the named track segment from this scenery object.
  //=============================================================================
  public native Track GetAttachedTrack(string trackName);


  //=============================================================================
  // Name: GetAttachedJunctions
  // Desc: Returns a list of junctions that are attached to this scenery item.
  //=============================================================================
  public native JunctionBase[] GetAttachedJunctions(void);


  //=============================================================================
  // Name: GetAttachedTracks
  // Desc: Returns a list of all Tracks that are attacked to this scenery item.
  //=============================================================================
  public native Track[] GetAttachedTracks(void);


  //=============================================================================
  // Name: InnerReEnterTrain
  // Desc: Calls InnerReEnter() on all of the vehicles in the given train.
  //=============================================================================
  public void InnerReEnterTrain(Train train)
  {
    int i;

    Vehicle[] vehicles = train.GetVehicles();
    for (i = 0; i < vehicles.size(); ++i)
      InnerReEnter(vehicles[i].GetGameObjectID());
  }


  //=============================================================================
  // Name: IsTrainInTriggers
  // Desc: Determines if any part of the given train is within any of this
  //       scenery item's triggers.
  // Parm: train - The train to search for
  // Parm: onlyCheckInnerRadius - If true, the train will only be checked for on
  //       the inner areas of the triggers, as defined by the trigger's radius.
  //       Otherwise the outer region of the triggers is used, which is defined
  //       by a radius of 150 meters.
  //=============================================================================
  public native bool IsTrainInTriggers(Train train, bool onlyCheckInnerRadius);


  //=============================================================================
  // Name: IsTrainOnTrack
  // Desc: Determines if any part of a train is on an attached track stretch.
  // Parm: train - The train to search for, or null to check for any train.
  // Parm: trackName - The named track stretch to check, or empty to check every
  //       attached track stretch.
  //=============================================================================
  public native bool IsTrainOnTrack(Train train, string trackName);


  //=============================================================================
  // Name: NotifyTrackGraphObservers
  // Desc: Notifies observers that the state of this object has changed. Signals
  //       are observers of nearby objects, so calling this will cause nearby
  //       signals to update.
  //=============================================================================
  public native void NotifyTrackGraphObservers(void);


  //=============================================================================
  // Name: UserRequestToggle
  // Desc: Called from native code when the user wishes to toggle this junction.
  //       Basic permission checks have already been performed at this point-
  //       the user is clear to proceed, so any override here should honor the
  //       request.
  // Parm: attachedJunction - Which junction is to be toggled.
  //=============================================================================
  public void UserRequestToggle(JunctionBase attachedJunction)
  {
    // By default, we just go ahead and toggle the junction.
    attachedJunction.ToggleJunction(null);
  }

};

