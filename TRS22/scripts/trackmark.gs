//
// TrackMark.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "permit.gs"
include "trackside.gs"


//! Directional location marker placed on track in Surveyor used to position objects like Train consists on the track.
//
// Track marks placed in Surveyor can be accessed in script code by calling
// <l Router::GetGameObject  Router::GetGameObject>("trackmarkName") and <l gscLangKeyCast  casting>
// the returned reference to TrackMark.
//
// Note:
//     There are no methods in this class. See the parent Trackside class for details of supported
//     methods that can be used with a TrackMark.
//
// Messages used by a TrackMark object are:
//
// {[ Major       | Minor     | Source     | Destination ]
//  [ "TrackMark" | "Enter"   | track mark | train       ]
//  [ "TrackMark" | "Stopped" | track mark | train       ]
//  [ "TrackMark" | "Leave"   | track mark | train       ]
//  [ "Object"    | "Enter"   | train      | track mark  ]
//  [ "Object"    | "Stopped" | train      | track mark  ]
//  [ "Object"    | "Leave"   | train      | track mark  ]}
//
// See Also:
//     Junction, Signal, Trackside, Trigger, Vehicle, World::CreateTrain(KUID[],TrackMark,bool)
//
game class TrackMark isclass Trackside
{
  // This is now inherited from the Trackside parent class.
//  TrackMark.RequestTrackPermit()
};

