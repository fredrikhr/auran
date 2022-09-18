// ============================================================================
// File: worldcoordinate.gs
// Desc: A data record which describes the absolute position of an object in 3D
//       space.
// ============================================================================
include "gs.gs"



final class WorldCoordinate
{
  // Baseboard coordinates are in integer baseboards.
  
  public int baseboardX;
  public int baseboardY;
  
  
  // Floating point coordinates (meters) relative to the top-left corner of 
  // the specified baseboard. There is no strict limit on the range of these
  // values, but floating-point accuracy declines as the values increase.
  
  public float x;
  public float y;
  public float z;
};



