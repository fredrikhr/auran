//
// trigger.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "trackside.gs"


//! Trigger is a track side object that sends a message to a train every time a train enters, stops within or leaves a trigger. 
//
// Triggers placed in Surveyor can be accessed in script code by calling
// <l Router::GetGameObject  Router::GetGameObject>("triggerName") and <l gscLangKeyCast  casting>
// the returned reference to Trigger.
//
// Note:
//     There are no methods in this class. See the parent Trackside class for details of supported
//     methods that can be used with a Trigger.
//
// Messages used by a Trigger object are:
//
// {[ Major      | Minor      | Source   | Destination  ]
//  [ "Trigger"  | "Enter"    | trigger  | train        ]
//  [ "Trigger"  | "Stopped"  | trigger  | train        ]
//  [ "Trigger"  | "Leave"    | trigger  | train        ]
//  [ "Object"   | "Enter"    | train    | trigger      ]
//  [ "Object"   | "Stopped"  | train    | trigger      ]
//  [ "Object"   | "Leave"    | train    | trigger      ]}
//
// See Also:
//     Junction, Signal, TrackMark, Trackside, Vehicle, Navigate::OnTrigger()
//
game class Trigger isclass Trackside
{
  // This is now inherited from the Trackside parent class.
//  Trigger.ReEnter()
};

