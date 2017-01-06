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
// {[ Major    | Minor   | Source   | Destination | Description ]
//  [ "Object" | "Enter" | crossing | crossing    | Train has entered this crossing's activation area.      ]
//  [ "Object" | "Leave" | crossing | crossing    | Train has left this crossing (i.e. last vehicle has exited activation area). ]}
//
// See Also:
//     Industry, SceneryWithTrack, Turntable, Train
//
game class Crossing isclass SceneryWithTrack
{
  //! \name   Crossing States
  //  \anchor crossingStates
  //@{
  //! Different states a Crossing can be in.
  //
  // The two main states a crossing can be in are <b CROSSING_STATE_OPEN> and <b CROSSING_STATE_CLOSED>.
  // <b CROSSING_STATE_CLOSING> and <b CROSSING_STATE_OPENING> are temporary transitional states used to 
  // indicate the crossing is switching between the two main states.
  //
  // See Also:
  //     Crossing::GetCrossingState(), Crossing::SetCrossingState()
  //

  public define int CROSSING_STATE_OPEN			= 0;  //!< Crossing is open, Carz are free to travel across this crossing.
  public define int CROSSING_STATE_CLOSING	= 1;  //!< Crossing closing, Carz will not enter this crossing.
  public define int CROSSING_STATE_CLOSED		= 2;  //!< Crossing is closed, Carz will not enter this crossing.
  public define int CROSSING_STATE_OPENING	= 3;  //!< Crossing in process of opening up, Carz will not enter this crossing until it is open.

  // Note: all further positive integers reserved for future expansion

  //@}


  //! Sets the state of this crossing.
  //
  // This method allows the crossing's current state to be explicitly changed via a script.  Before
  // setting the state of a crossing manually with this method, the automatic mode of the crossing
  // needs to set to false via SetCrossingAutomatic().
  //
  // Param:  crossingState  State to set the crossing to.  Use one of the \ref crossingStates "crossing states"
  //                        values for this parameter.
  //
  // See Also:
  //      \ref crossingStates "Crossing States"
  //
  public native void SetCrossingState(int crossingState);

  //! Gets the current state of this crossing.
  //
  // Note that if this crossing is in <l SetCrossingAutomatic()  automatic mode>, its state can change
  // after this method has been called.
  //
  // Returns:
  //     Returns the current \ref crossingStates "state" of this crossing.
  //
  public native int GetCrossingState(void);

  //! Sets whether this crossing will change states automatically in response to trains.
  //
  // Param:  automatic  Use true to make this crossing behave automatically, false to disregard
  //                    trains and be controlled by script code (i.e. using SetCrossingState()
  //                    to change the state of the crossing manually).
  //
  public native void SetCrossingAutomatic(bool automatic);

  //! Determines if this crossing is being automatically run by %Trainz or under manual script control.
  //
  // Returns:
  //     Returns true if this crossing is operating in an automatic, game controlled mode, false otherwise.
  //
  public native bool GetCrossingAutomatic(void);


  //! Determines if there are any trains nearby and within range of this crossing.
  //
  // Returns:
  //     Returns true if a Train is nearby to this crossing.
  //
  public native bool GetCrossingHasNearbyTrain(void);

};

