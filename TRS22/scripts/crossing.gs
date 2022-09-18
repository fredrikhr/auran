//
// Crossing.gs
//
//  Copyright (C) 2004-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "SceneryWithTrack.gs"


//! Crossing class.  An interface to operate a crossing is provided.
//
// By default a crossing is automatically controlled by %Trainz.  When a Train is within 200 meters
// of the crossing, it will be closed and the Carz won't cross the track.  The crossing will go back
// to an open state where the Carz can cross the track once there are no trains within 200 meters of
// any of the crossing.
//
// This class allows a crossing asset with custom scripted behavior to be created so the default 
// behavior described above can be disabled and a script can take control the crossing as the 
// programmer desires.  For example, triggers at varying distances could be used to activate the
// crossing so you can get around the default 200 meter boundary.  This does however mean that you
// will need to find a way to get your crossing configured to monitor the desired triggers and react
// to trains accordingly.
//
// To get a reference to a crossing item on the map, use Router::GetGameObject(string) and
// <l gscLangKeyCast  cast> to this class.  Make sure it has been named in Surveyor first.
//
// Not all of the messages SceneryWithTrack supports apply to crossings.  Messages supported by this
// class are:
//
// {[ Major       | Minor           | Source   | Destination | Description ]
//  [ "Object"    | "Enter"         | crossing | crossing    | Train has entered this crossing's activation area. ]
//  [ "Object"    | "Leave"         | crossing | crossing    | Train has left this crossing (i.e. last vehicle has exited activation area). ]}
//  [ "Crossing"  | "StateChanged"  | crossing | crossing    | Crossing state has changed. ]}
//
// See Also:
//     Industry, SceneryWithTrack, Turntable, Train
//
game class Crossing isclass SceneryWithTrack
{

  //=============================================================================
  // Name: CROSSING_STATE_*
  // Desc: Different states a Crossing can be in.
  // Note: All further positive integers reserved for future expansion
  //=============================================================================
  public define int CROSSING_STATE_OPEN     = 0;  //!< Crossing is open, Carz are free to travel across this crossing.
  public define int CROSSING_STATE_CLOSING  = 1;  //!< Crossing closing, Carz will not enter this crossing.
  public define int CROSSING_STATE_CLOSED   = 2;  //!< Crossing is closed, Carz will not enter this crossing.
  public define int CROSSING_STATE_OPENING  = 3;  //!< Crossing in process of opening up, Carz will not enter this crossing until it is open.


  //=============================================================================
  // Name: SetCrossingOwner
  // Desc: Modifies the crossing owner object if possible. If the crossing is
  //       already owned this call will only succeed if the token is valid for
  //       the current owner.
  // Parm: token - A token for the crossing owner (new and current, if
  //       applicable) with rights "crossing-owner"
  // Parm: owner - The new desired crossing owner, or null to switch to unowned
  // Retn: bool - Whether the call succeeded, and the crossing owner was changed
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native bool SetCrossingOwner(SecurityToken token, TrainzGameObject owner);

  //=============================================================================
  // Name: GetCrossingOwner
  // Desc: Returns the current crossing owner object, if any
  //=============================================================================
  public native TrainzGameObject GetCrossingOwner();


  //=============================================================================
  // Name: SetCrossingState
  // Desc: Manually sets the state of the crossing. Before calling this function
  //       automatic mode must be explicitly disabled using SetCrossingAutomatic.
  //       If this crossing is owned and a null token is passed, the call will
  //       fail and return false.
  // Parm: token - A token for the crossing owner with rights "crossing-state"
  // Parm: state - The state to change to, see CROSSING_STATE_*
  // Retn: bool - Whether the call succeeded, and the crossing was changed
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native bool SetCrossingState(SecurityToken token, int state);

  //=============================================================================
  // Name: SetCrossingState
  // Desc: Obsolete. This function will fail if the crossing is owned.
  //=============================================================================
  public obsolete void SetCrossingState(int state) { SetCrossingState(null, state); }


  //=============================================================================
  // Name: GetCrossingState
  // Desc: Returns the current state for this crossing.
  //=============================================================================
  public native int GetCrossingState(void);


  //=============================================================================
  // Name: GetLocalisedCrossingStateName
  // Desc: Gets the human readable name for a crossing state define
  // Parm: crossingState - The crossing state to get the name of, or -1 for the
  //       name of the 'automatic' state
  //=============================================================================
  public native string GetLocalisedCrossingStateName(int crossingState);


  //=============================================================================
  // Name: SetCrossingAutomatic
  // Desc: Sets whether the crossing will change states in response to trains.
  //       If this crossing is owned and a null token is passed, the call will
  //       fail and return false.
  // Parm: token - A token for the crossing owner with rights "crossing-state"
  // Parm: bAutomatic - true to enable automatic functionality in response to
  //       trains, false to require manual operation using SetCrossingState.
  // Retn: bool - Whether the call succeeded, and the state was changed
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native bool SetCrossingAutomatic(SecurityToken token, bool bAutomatic);

  //=============================================================================
  // Name: SetCrossingAutomatic
  // Desc: Obsolete. This function will fail if the crossing is owned.
  //=============================================================================
  public obsolete void SetCrossingAutomatic(bool bAutomatic)
  {
    SetCrossingAutomatic(null, bAutomatic);
  }

  //=============================================================================
  // Name: GetCrossingAutomatic
  // Desc: Returns whether this crossing is being automatically run by Trainz or
  //       is under manual script control.
  //=============================================================================
  public native bool GetCrossingAutomatic(void);


  //=============================================================================
  // Name: GetCrossingHasNearbyTrain
  // Desc: Determines if there are any trains within range of this crossing
  //=============================================================================
  public native bool GetCrossingHasNearbyTrain(void);

};

