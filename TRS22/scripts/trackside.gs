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


  //=============================================================================
  // Name: ReEnter
  // Desc: Resends "Object","Enter" messages for the train specified by the
  //       GameObjectID passed. The train must already be inside the trigger.
  // Parm: nodeId - The GameObjectID for the train to resend messages for.
  // Retn: bool - Whether the train was found and messages were resent.
  //=============================================================================
  public native bool ReEnter(GameObjectID nodeId);

  // Obsolete, do not use
  public obsolete bool ReEnter(int id) { return ReEnter(Router.GetGameObject(id).GetGameObjectID()); }


  //=============================================================================
  // Name: InnerReEnter
  // Desc: Resends "Object","InnerEnter" messages for the train specified by the
  //       GameObjectID passed. The train must already be inside the trigger.
  // Parm: nodeId - The GameObjectID for the train to resend messages for.
  // Retn: bool - Whether the train was found and messages were resent.
  //=============================================================================
  public native bool InnerReEnter(GameObjectID nodeId);

  // Obsolete, do not use
  public obsolete bool InnerReEnter(int id) { return InnerReEnter(Router.GetGameObject(id).GetGameObjectID()); }


  //=============================================================================
  // Name: IsNodeInsideTrigger
  // Desc: Determines whether the train specified is inside this objects trigger
  //       radius (or inner trigger radius).
  // Parm: nodeId - The GameObjectID for the train to search for.
  // Parm: onlyInnerTrigger - If true, true returned only if the object is in the
  //       inner area of the trigger.
  // Retn: bool - Whether the train was found.
  //=============================================================================
  public native bool IsNodeInsideTrigger(GameObjectID nodeId, bool onlyInnerTrigger);


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


  //! Gets the human readable name for one of the extended signal state defines.
  //
  // See Also:
  //     Trackside::GetSignalStateEx()
  //
  public native string GetLocalisedSignalStateName(int signalState);


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


  //===========================================================================
  // Name: GetTrackBumpPitchAngle/GetTrackBumpRollAngle
  // Desc: Gets the pitch/roll angle imparted when travelling over this object
  // Retn: float - Returns the relevent angle in degrees
  //===========================================================================
  public native float GetTrackBumpPitchAngle();
  public native float GetTrackBumpRollAngle();

  //=============================================================================
  // Name: SetTrackBumpAngles
  // Desc: Overrides the trackside pitch/roll values set in the config file
  //=============================================================================
  public native void SetTrackBumpAngles(float pitchInDegrees, float rollInDegrees);


  //===========================================================================
  // Name: GetDescriptionHTML
  // Desc: Generates HTML used when configuring this object in Surveyor
  //===========================================================================
  public string GetDescriptionHTML()
  {
    string htmlString = inherited();

    // If the object has a 'track bump' then allow the session creator to tweak it
    if (GetTrackBumpPitchAngle() != 0.0f or GetTrackBumpRollAngle() != 0.0f)
    {
      StringTable strTable = Constructors.GetTrainzStrings();

      htmlString = htmlString + "<b>" + strTable.GetString("trackside_prop_heading") + "</b><br>";

      htmlString = htmlString + "<table>";
      htmlString = htmlString + "<tr><td>" + strTable.GetString("trackside_prop_bump_pitch") + ":</td><td><a href='live://property/bump-pitch'>";
      htmlString = htmlString + TrainUtil.FormatFloatAsString(GetTrackBumpPitchAngle(), 2, true) + "</a></td></tr>";
      htmlString = htmlString + "<tr><td>" + strTable.GetString("trackside_prop_bump_roll") + ":</td><td><a href='live://property/bump-roll'>";
      htmlString = htmlString + TrainUtil.FormatFloatAsString(GetTrackBumpRollAngle(), 2, true) + "</a></td></tr>";
      htmlString = htmlString + "</table>";
    }

    return htmlString;
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the 'type' of an object property
  //=============================================================================
  public string GetPropertyType(string propertyId)
  {
    if (propertyId == "bump-pitch" or propertyId == "bump-roll")
      return "float,-90,90,0.1";

    return inherited(propertyId);
  }


  //=============================================================================
  // Name: GetPropertyName
  // Desc: Gets a human reabable name for an object property
  //=============================================================================
  public string GetPropertyName(string propertyId)
  {
    if (propertyId == "bump-pitch")
      return Constructors.GetTrainzStrings().GetString("trackside_prop_bump_pitch");
    if (propertyId == "bump-roll")
      return Constructors.GetTrainzStrings().GetString("trackside_prop_bump_roll");

    return inherited(propertyId);
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Gets a human reabable description for an object property
  //=============================================================================
  public string GetPropertyDescription(string propertyId)
  {
    if (propertyId == "bump-pitch" or propertyId == "bump-roll")
      return GetPropertyName(propertyId);

    return inherited(propertyId);
  }


  //=============================================================================
  // Name: GetPropertyValue
  // Desc: Gets the value of an object property
  //=============================================================================
  public string GetPropertyValue(string propertyId)
  {
    if (propertyId == "bump-pitch")
      return (string)GetTrackBumpPitchAngle();
    if (propertyId == "bump-roll")
      return (string)GetTrackBumpRollAngle();

    return inherited(propertyId);
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of a 'float' object property
  //=============================================================================
  void SetPropertyValue(string propertyId, float value)
  {
    if (propertyId == "bump-pitch")
      SetTrackBumpAngles(value, GetTrackBumpRollAngle());
    else if (propertyId == "bump-roll")
      SetTrackBumpAngles(GetTrackBumpPitchAngle(), value);

    inherited(propertyId, value);
  }

};

