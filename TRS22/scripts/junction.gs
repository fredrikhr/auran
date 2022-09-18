//=============================================================================
// File: Junction.gs
// Desc: 
//=============================================================================
include "JunctionBase.gs"
include "Trackside.gs"


//=============================================================================
// Name: Junction
// Desc: The default script class for trackside junctions. All functionality is
//       either on class Trackside, or JunctionBase (which is shared with
//       scenerywith-track attached junctions.
// Note: Messages related to junctions are:
//     [ Major          | Minor             | Source        | Destination    ]
//     [ "Junction"     | "Toggled"         | junction      | junction       ]
//     [ "Junction"     | "InnerEnter"      | junction      | train          ]
//     [ "Junction"     | "Enter"           | junction      | train          ]
//     [ "Junction"     | "Stopped"         | junction      | train          ]
//     [ "Junction"     | "InnerLeave"      | junction      | train          ]
//     [ "Junction"     | "Leave"           | junction      | train          ]
//     [ "Object"       | "InnerEnter"      | train         | junction       ]
//     [ "Object"       | "Enter"           | train         | junction       ]
//     [ "Object"       | "Stopped"         | train         | junction       ]
//     [ "Object"       | "InnerLeave"      | train         | junction       ]
//     [ "Object"       | "Leave"           | train         | junction       ]
//       Legacy messages, which will be phased out and should not be used:
//     [ "Junction"     | "Toggled"         | junction      | broadcast      ]
//=============================================================================
game class Junction isclass Trackside, JunctionBase
{
};



