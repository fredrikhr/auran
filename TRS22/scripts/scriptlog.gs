//=============================================================================
// File: ScriptLog.gs
// Desc: Defines some basic logging functionality for use by core game scripts.
//       This abstraction layer exists to allow logging functionality to be
//       added very early in the core script include order. Do not add extra
//       includes/dependencies here.
//=============================================================================
include "gs.gs"


//=============================================================================
// Name: ScriptLogBase
// Desc: Adds basic logging functionality for a couple of core game classes.
//       Not callable directly, use the static ScriptLog class (below) to add
//       log messages. e.g. ScriptLog.Log("My message");
//=============================================================================
class ScriptLogBase
{
  //=============================================================================
  // Name: Log
  // Desc: Prints a line of text to the log window/file. Script logging must be
  //       enabled in the game settings at the time the log is generated.
  // Parm: msg - The text to print.
  //=============================================================================
  public native void Log(string msg);


  //=============================================================================
  // Name: LogCallStack
  // Desc: Generates a log of the current call stack and prints it to the log
  //       window/file.  Script logging must be enabled in the game settings at
  //       the time the log is generated.
  // Parm: msg - A message to be included with the call stack log.
  //=============================================================================
  public native void LogCallStack(string msg);

};



//=============================================================================
// Name: ScriptLog
// Desc: A static implementation of ScriptLogBase, usable to add log messages.
//=============================================================================
final static class ScriptLog isclass ScriptLogBase
{
};

