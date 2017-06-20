//=============================================================================
// File: Turntable.gs
// Desc: Defines the default script class used by turntables on the route.
//=============================================================================
include "SceneryWithTrack.gs"



//=============================================================================
// Name: Turntable
// Desc: The base script class for assets of kind 'turntable'.
//=============================================================================
game class Turntable isclass SceneryWithTrack
{

  //=============================================================================
  // Name: IsMoving
  // Desc: Returns true if this turntable is currently moving, false otherwise.
  //=============================================================================
  public native bool IsMoving(void);


  //=============================================================================
  // Name: GetStopPosition
  // Desc: Returns the current indexed position of this turntable. If the
  //       turntable is moving this will return the currently targeted stop.
  //=============================================================================
  public native int GetStopPosition(void);


  //=============================================================================
  // Name: MoveToNextStop
  // Desc: Moves the turntable to its 'next' stop position.
  //=============================================================================
  public native void MoveToNextStop(void);


  //=============================================================================
  // Name: MoveToNextStop
  // Desc: Moves the turntable to its 'previous' stop position.
  //=============================================================================
  public native void MoveToPrevStop(void);


  //=============================================================================
  // Name: MoveToStop
  // Desc: Moves the turntable to the indexed stop position. If an invalid index
  //       is provided an exception will be thrown.
  //=============================================================================
  public native void MoveToStop(int stopIndex);


  //=============================================================================
  // Name: CanMoveToNextStop
  // Desc: Returns whether the turntable can move to a 'next' position. This is
  //       used for "keyframes" style non-looping/circular turntables.
  //=============================================================================
  public native bool CanMoveToNextStop(void);


  //=============================================================================
  // Name: CanMoveToNextStop
  // Desc: Returns whether the turntable can move to a 'next' position. This is
  //       used for "keyframes" style non-looping/circular turntables.
  //=============================================================================
  public native bool CanMoveToPrevStop(void);

};

