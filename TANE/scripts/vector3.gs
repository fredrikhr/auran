//
// Vector3.gs
//
//  Copyright (C) 2014 Typhoon Systems PTY LTD
//  All Rights Reserved.
//
include "gs.gs"


// Close-range relative position; not used for absolute positioning.
final class Vector3
{
  public float x;
  public float y;
  public float z;
  
  public float GetMagnitude(void)
  {
    return Math.Sqrt(x*x + y*y + z*z);
  }
};



