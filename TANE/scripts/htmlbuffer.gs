// ============================================================================
// File: HTMLBuffer.gs
// Desc: A string buffer optimised for output streaming, with utility functions
//       for HTML support.
// ============================================================================
include "gs.gs"


game class HTMLBuffer isclass GSObject
{
  public native void Clear(void);
  public native bool IsEmpty(void);
  public native string AsString(void);
  
  public native void Print(string s);
  public native void Escape(string s);
};


static class HTMLBufferStatic
{
  public native HTMLBuffer Construct(void);
};

