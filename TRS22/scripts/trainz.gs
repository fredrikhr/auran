//
// trainz.gs
//
// Copyright (C) 2002 Auran Developments Pty Ltd
// All Rights Reserved.
//

//
// include this to include all trainz .gs files.
//

//include "actor.gs"
include "gs.gs"
include "interface.gs"
include "Junction.gs"
include "KUID.gs"
include "Locomotive.gs"
include "Permit.gs"
include "Schedule.gs"
include "Signal.gs"
include "timetable.gs"
include "TrackMark.gs"
include "train.gs"
include "Trigger.gs"
include "vehicle.gs"
include "world.gs"
include "navigate.gs"


//! Static class to provide a version number.
//
// The <m version> member in this class is not public and script programmers won't need to ever use
// this class.
//
static class Trainz 
{
  float version = 1.3f;
};
