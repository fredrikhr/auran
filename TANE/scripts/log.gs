//
// Log.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "interface.gs"


//! An item being logged.
//
// This class defines an item to be logged for the Log class.
//
// See Also:
//     Interface::Log(), Log
//
class LogScope
{
  public string className;     //!< Name of the class being logged.
  public string functionName;  //!< Name of the method/function being logged.
  public int level;            //!< Level of logging.
};



//! Log provides %Trainz scripts with logging capabilities and a scope/stack view.
//
// This class facilitates the logging of information about functions to the <b \Trainz\JetLog.txt>
// file.  It is mainly a utility class that makes logging easier with basic scope/stack support.
//
// Public interface methods provided with this class are:
//  - public void  <b DetailLogEnable>     ()
//  - public void  <b DetailLogDisable>    ()
//  - public bool  <b DetailLogIsEnabled>  ()
//  - public void  <b DetailLogStart>      (string sFunction, string sClass);
//  - public void  <b DetailLog>           (string msg)
//  - public void  <b DetailLogEnd>        ()
//  - public void  <b DetailWatchFunctionStart>  (string sFunction, string sClass);
//  - public void  <b DetailWatchFunctionEnd>    (string sFunction, string sClass);
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class
//     definition and implementation however can be found in the <b \Trainz\scripts\log.gs> script file.
//
// See Also:
//     Interface::Log(), LogScope
//
final static class Log
{
  LogScope[] scope;
  LogScope[] watch;

  bool stdLoggingEnabled = true;

  string sLastFunction;
  string sLastClass;

  // PUBLIC

  public void DetailLogEnable();
  public void DetailLogDisable();
  public bool DetailLogIsEnabled();

  public void DetailLogStart(string sFunction, string sClass);
  public void DetailLog(string msg);
  public void DetailLog(string name, string value);
  public void DetailLogEnd();

  public void DetailWatchFunctionStart(string sFunction, string sClass);
  public void DetailWatchFunctionEnd(string sFunction, string sClass);

  // PRIVATE
  bool IsFunctionUnderWatch(string sFunction, string sClass);


  //
  // IMPLEMENTATION
  //

  string MakeSpacing(string chars, int number)
  {
    int i;
    string spacing = "";
    for (i = 0; i < number; i++)
      spacing = spacing + chars;

    return spacing;
  }

  int GetHighestScopeLevel()
  {
    int i;
    int highestLevel = 0;
    for (i = 0; i < scope.size(); i++)
    {
      if (scope[i].level > highestLevel)
        highestLevel = scope[i].level;
    }

    return highestLevel;
  }

  int GetHighestScopeLevelIndex()
  {
    int i;
    int highestLevel = 0;
    int highestIndex = 0;
    for (i = 0; i < scope.size(); i++)
    {
      if (scope[i].level > highestLevel)
      {
        highestLevel = scope[i].level;
        highestIndex = i;
      }
    }

    return highestIndex;
  }

  LogScope AddNewScope(string functionName, string className)
  {
    // Add another to the end of the chain...
    LogScope newLog = new LogScope();
    newLog.functionName = functionName;
    newLog.className = className;

    sLastFunction = functionName;
    sLastClass = className;

    newLog.level = GetHighestScopeLevel() + 1;
    scope[scope.size()] = newLog;

    return newLog;
  }

  public void DetailLogStart(string sFunction, string sClass)
  {
    if (!scope)
      scope = new LogScope[0];

    LogScope newLog = AddNewScope(sFunction, sClass);

    bool watching = false;
    watching = IsFunctionUnderWatch(sFunction, sClass);
    if (watching)
    {
      Interface.Log(MakeSpacing(" ", newLog.level * 2));
      Interface.Log(MakeSpacing(" ", newLog.level * 2));
      Interface.Log(MakeSpacing(" ", newLog.level * 2));
      Interface.Log(MakeSpacing(" ", newLog.level * 2) + "WATCH::" + sFunction + " Starts below:");
      Interface.Log(MakeSpacing(" ", newLog.level * 2));
    }

    if (stdLoggingEnabled or watching)
    {
      Interface.Log(MakeSpacing(" ", newLog.level * 2));
      Interface.Log(MakeSpacing(" ", newLog.level * 2) + sClass + "::" + sFunction + "()");
      Interface.Log(MakeSpacing(" ", newLog.level * 2) + "{");
    }
  }

  public void DetailLog(string msg)
  {
    int index = GetHighestScopeLevelIndex();

    bool watching = false;
    watching = IsFunctionUnderWatch(sLastFunction, sLastClass);
    
    if (stdLoggingEnabled or watching)
    {
      string spacing = MakeSpacing(" ", (scope[index].level * 2) + 2);
      Interface.Log(spacing + msg);
    }
  }

  public void DetailLog(string name, string value)
  {
    int i;

    DetailLog(name + " = " + value);
  }

  public void DetailLogEnd()
  {
    if (!scope)
      return;
    
    int index = GetHighestScopeLevelIndex();

    // Remove last scope.
    bool watching = false;
    watching = IsFunctionUnderWatch(sLastFunction, sLastClass);
    if (stdLoggingEnabled or watching)
    {
      Interface.Log(MakeSpacing(" ", scope[index].level * 2) + "} // " + scope[index].className + "::" + scope[index].functionName + "()");
      Interface.Log(MakeSpacing(" ", scope[index].level * 2));

      if (IsFunctionUnderWatch(scope[index].functionName, scope[index].className))
      {
        Interface.Log(MakeSpacing(" ", scope[index].level * 2));
        Interface.Log(MakeSpacing(" ", scope[index].level * 2) + "WATCH END::" + scope[index].functionName + " Ends above:");
        Interface.Log(MakeSpacing(" ", scope[index].level * 2));
        Interface.Log(MakeSpacing(" ", scope[index].level * 2));
        Interface.Log(MakeSpacing(" ", scope[index].level * 2));
      }
    }

    scope[index, index + 1] = null;
  }

  public void DetailWatchFunctionStart(string sFunction, string sClass)
  {
    if (!watch)
      watch = new LogScope[0];

    // Ensure the watch does not already exist.
    int i;
    for (i = 0; i < watch.size(); i++)
    {
      if (watch[i].functionName == sFunction and watch[i].className == sClass)
      {
        return;
      }
    }

    LogScope newWatch = new LogScope();

    newWatch.functionName = sFunction;
    newWatch.className = sClass;
    newWatch.level = 0;

    watch[watch.size()] = newWatch;
  }

  public void DetailWatchFunctionEnd(string sFunction, string sClass)
  {
    if (!watch)
      return;

    // Ensure the watch does not already exist.
    int i;
    for (i = 0; i < watch.size(); i++)
    {
      if (watch[i].functionName == sFunction and watch[i].className == sClass)
      {
        watch[i, i+1] = null;
        return;
      }
    }    
  }

  bool IsFunctionUnderWatch(string sFunction, string sClass)
  {
    // Ensure the watch does not already exist.
    if (!watch)
      return false;

    int i;
    for (i = 0; i < watch.size(); i++)
    {
      if (watch[i].functionName == sFunction and watch[i].className == sClass)
      {
        return true;
      }
    }

    return false;
  }

  public void DetailLogEnable()
  {
    stdLoggingEnabled = true;
  }
  
  public void DetailLogDisable()
  {
    stdLoggingEnabled = false;
  }

  public bool DetailLogIsEnabled()
  {
    return stdLoggingEnabled;
  }


};