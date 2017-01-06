// ============================================================================
// File: orientation.gs
// Desc: A data record which describes the orientation of an object in 3D 
//       space.
// ============================================================================
include "gs.gs"



final class Orientation
{
  // An orientation is expressed as a series of rotations.
  
  public float rx;    // Rotation about the x-axis, in radians.
  
  public float ry;    // Rotation about the y-axis, in radians.
  
  public float rz;    // Rotation about the z-axis, in radians.
};



