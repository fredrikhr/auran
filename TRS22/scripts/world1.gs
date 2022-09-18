// ============================================================================
// File: world1.gs
// Copy: Copyright (C) 2002-2018 N3V Games Pty Ltd. All Rights Reserved.
// ============================================================================
include "train.gs"
include "kuid.gs"


// ============================================================================
// Name: World1
// Desc: World1 is an extension of the functionality provided in the original
//       World class. This class was originally made separate from World
//       because in earlier versions of Trainz, it was not possible to modify
//       a .gs file without breaking compatibility. Even though TRS2004 and
//       onwards don't have this problem, scenarios written for earlier
//       versions of Trainz (eg. SP3 or UTC) would still expect to find certain
//       methods in World1, so World1 is provided to maintain backward
//       compatibility.
// ============================================================================
final static class World1 isclass GameObject
{
  // ============================================================================
  // Name: SetDCCMode
  // Desc: Sets the Driver interface to DCC or Cabin control mode. This is
  //       intended for use during session startup to configure the default
  //       starting mode for a session.
  //       Note that the behaviour of this function differs a little between
  //       TANE and TRS19, due to changes in the user interface. While the
  //       outcomes are typically similar, subtle behavioural differences can
  //       result.
  //       This function is typically called from the QuickDrive rule on startup
  //       and should probably not be called from other locations. Since the
  //       behaviour of this function is strongly tied to the user interface,
  //       future changes to the Driver UI may cause this function's behaviour to
  //       change in subtle ways, or may even cause this function to be a no-op.
  // Parm: useDCCMode - Driver interface to set.  DCC (true) or Cabin (false)
  //       control mode.
  // ============================================================================
  public native void SetDCCMode(bool useDCCMode);
  
  // ============================================================================
  // Name: SetControlModeLocked
  // Desc: Locks the Driver user interface control mode, preventing the user
  //       from making changes. This has no effect when called in TANE as that
  //       user interface is always locked and requires script intervention
  //       (typically via the QuickDrive rule) to change modes.
  //       This function is typically called from the QuickDrive rule on startup
  //       and should probably not be called from other locations. Since the
  //       behaviour of this function is strongly tied to the user interface,
  //       future changes to the Driver UI may cause this function's behaviour to
  //       change in subtle ways, or may even cause this function to be a no-op.
  // ============================================================================
  public native void SetControlModeLocked(bool bIsControlModeLocked);

  // ============================================================================
  // Name: SetDerailLevel
  // Desc: Sets the derail level of the current Trainz environment.
  // Note: During multiplayer games this function will only succeed on the
  //       server.
  // Parm: derailLevel - Derail level setting in range of [0 - 2].
  // ============================================================================
  public native void SetDerailLevel(int derailLevel);
};

