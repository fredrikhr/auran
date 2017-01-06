//
// world1.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "train.gs"
include "kuid.gs"


//! World1 is an extension of the functionality provided in the original World class.
//
// This class was originally made separate from World because in earlier versions of %Trainz, it was
// not possible to modify a <n .gs> file without breaking compatibility.  Even though <b TRS2004> 
// and onwards don't have this problem, scenarios written for earlier versions of %Trainz 
// (<b SP3> or <b UTC>) would still expect to find certain methods in World1, so World1 is provided
// to maintain backward compatibility.
//
// See Also:
//     TrainUtil, World
//
final static class World1
{
  //! Sets the Driver interface to DCC or %Cabin control mode.
  //
  // Param:  useDCCMode  Driver interface to set.  DCC (true) or %Cabin (false) control mode.
  //
  public native void SetDCCMode(bool useDCCMode);

  //! Sets the derail level of the current %Trainz environment.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  derailLevel  Derail level setting in range of [0 - 2].
  //
  public native void SetDerailLevel(int derailLevel);
};

