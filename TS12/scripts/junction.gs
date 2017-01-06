//
// Junction.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "permit.gs"
include "train.gs"
include "trackside.gs"
include "JunctionBase.gs"


//! Junction class provides control over the Junction map objects.
//
// Junctions placed in Surveyor can be accessed in script code by calling
// <l Router::GetGameObject  Router::GetGameObject>("junctionName") and <l gscLangKeyCast  casting>
// the returned reference to Junction.
//
// This interface methods to control and obtain information about the status of a Junction can be
// found in the JunctionBase parent class.  Other functionality generic to trackside items can be 
// found in the Trackside class, which Junction also inherits from.
//
// Messages used by a Junction object are:
//
// {[ Major       | Minor         | Source    | Destination  ]
//  [ "Junction"  | "Toggled"     | junction  | broadcast    ]
//  [ "Junction"  | "InnerEnter"  | junction  | train        ]
//  [ "Junction"  | "Enter"       | junction  | train        ]
//  [ "Junction"  | "Stopped"     | junction  | train        ]
//  [ "Junction"  | "InnerLeave"  | junction  | train        ]
//  [ "Junction"  | "Leave"       | junction  | train        ]
//  [ "Object"    | "InnerEnter"  | train     | junction     ]
//  [ "Object"    | "Enter"       | train     | junction     ]
//  [ "Object"    | "Stopped"     | train     | junction     ]
//  [ "Object"    | "InnerLeave"  | train     | junction     ]
//  [ "Object"    | "Leave"       | train     | junction     ]}
//
// See Also:
//     Signal, Track, TrackMark, Trackside, Trigger, Navigate::LockJunction()
//
game class Junction isclass Trackside, JunctionBase
{
};



