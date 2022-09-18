//=============================================================================
// File: AsyncQueryHelper.gs
// Desc: Defines the base AsyncQueryHelper class, as described below.
//=============================================================================
include "gs.gs"
include "ScriptLog.gs"



//=============================================================================
// Name: AsyncQueryHelper
// Desc: An generic base class for use by asynchronous (i.e. non-blocking)
//       queries. This class may be used as-is, or may be extended/customised
//       with extra/different result codes, messages, etc.
//       All implementations should stick to a few basic rules though:
//       1. Always post the default "AsyncResult" and "Failure" messages to
//        signify query completion/failure (though extra messages may also be
//        posted if necessary, e.g. for multi-stage queries).
//       2. Always implement GetQueryErrorCode() as noted on the function
//        comments. Failure to implement this correctly will result in invalid
//        or undefined behaviour of this classes base functions.
//
// Mesg: "AsyncQuery", "AsyncResult" - Indicates that the query is complete,
//       and that any results can be safely queried.
// Mesg: "AsyncQuery", "Failure" - Indicates that the search has failed for
//       some reason. Call GetQueryErrorCode() for more information.
//
// Note: The 'major' param of the above messages may be customised by the
//       inheriting class, via the GetMessageMajor() function, however this
//       should be avoided unless it is absolutely necessary (e.g. for legacy
//       support, compatibility etc).
// Note: For example implementations/uses see TrainzAssetSearch.gs, the named
//       object search functions in World.gs, or Asset.CacheConfigSoup().
//
//=============================================================================
class AsyncQueryHelper isclass GameObject
{
  //===========================================================================
  public define int ERROR_NONE          = 0;    // Query completed without error
  public define int ERROR_FLOOD         = 1;    // System is flooded, search was not run
  public define int ERROR_INVALID_STATE = 2;    // Invalid state for query
  public define int ERROR_NOT_COMPLETE  = 3;    // Search is still running

  public define int WARNINGS_START      = 100;  // Marker only, not a valid result
  public define int WARN_MORE_RESULTS   = 101;  // Aborted early because result limit was hit

  // Custom error/warning range start. If extending this class add any custom
  // result codes *after* these values. For example:
  //  public define int MY_ERROR = AsyncQueryHelper.CUSTOM_ERROR_START + 1;
  public define int CUSTOM_ERROR_START  = 1000;
  public define int CUSTOM_WARN_START   = 2000;
  //===========================================================================

  int   m_queryResult = ERROR_INVALID_STATE;


  //=============================================================================
  // Name: GetQueryErrorCode
  // Desc: Returns any relevant error or warning code for this query. Custom
  //       implementations may override this, or can use SetQueryErrorCode to
  //       set the result on query completion.
  // Retn: int - An integer error/warning code (as defined above).
  //=============================================================================
  public int GetQueryErrorCode() { return m_queryResult; }


  //=============================================================================
  // Name: SetQueryErrorCode
  // Desc: Sets the internal query result code and posts the relevant completion
  //       message. Custom implementations may override this to post extra
  //       messages or add additional behaviour, but the base script messages
  //       should *always* be posted if bIsQueryComplete is true.
  // Parm: result - The new result code to set
  // Parm: bIsQueryComplete - Whether the query is complete, and the completion
  //       (or failure) message(s) should be posted.
  //=============================================================================
  public void SetQueryErrorCode(int result, bool bIsQueryComplete);


  //=============================================================================
  // Name: IsErrorCode
  // Desc: Returns whether a specific result code (from this object) is an error.
  //       Any error result code indicates that the last run search produced an
  //       entirely invalid result set, and should be ignored.
  //=============================================================================
  public bool IsErrorCode(int result) { return (result > ERROR_NONE and result < WARNINGS_START) or (result > CUSTOM_ERROR_START and result < CUSTOM_WARN_START); }


  //=============================================================================
  // Name: IsWarningCode
  // Desc: Returns whether a specific result code (from this object) is a warning
  //       result. Warnings indicate that the result set is valid, but may be
  //       incomplete, out of date, etc. Warnings may be handled on a case by
  //       case basis but should also generally be safe to ignore.
  //=============================================================================
  public bool IsWarningCode(int result) { return result != ERROR_NONE and !IsErrorCode(result); }


  //=============================================================================
  // Name: GetMessageMajor
  // Desc: Returns the 'major' param that will be used for messages posted by
  //       this result class. This allows custom implementations to override the
  //       default msg param but is mostly intended for compatibility support.
  //=============================================================================
  public string GetMessageMajor() { return "AsyncQuery"; }


  //=============================================================================
  // Name: SynchronouslyWaitForResults
  // Desc: Synchronously waits for this object query to complete. This function
  //       is usable only by script 'thread' functions and will throw exceptions
  //       if called incorrectly.
  // Parm: resultMsgMinor - The 'minor' param of the query completion message to
  //       wait for. Optional, defaults to "AsyncResult" (see below).
  //=============================================================================
  public bool SynchronouslyWaitForResults(string resultMsgMinor);
  public bool SynchronouslyWaitForResults() { return SynchronouslyWaitForResults("AsyncResult"); }



  //=============================================================================
  public void SetQueryErrorCode(int result, bool bIsQueryComplete)
  {
    m_queryResult = result;

    if (bIsQueryComplete)
    {
      // Query is complete, post relevant message for any listeners
      if ((result > ERROR_NONE and result < WARNINGS_START) or (result > CUSTOM_ERROR_START and result < CUSTOM_WARN_START))
        PostMessage(me, GetMessageMajor(), "Failure", 0.f);
      else
        PostMessage(me, GetMessageMajor(), "AsyncResult", 0.f);
    }
  }


  //=============================================================================
  public bool SynchronouslyWaitForResults(string resultMsgMinor)
  {
    GameObject callingThread = Router.GetCurrentThreadGameObject();
    if (!callingThread)
    {
      Exception("AsyncQueryHelper.SynchronouslyWaitForResults> No active thread");
      return false;
    }

    // Sniff for the internal message major type. This type SHOULD NOT be used
    // anywhere except within the functions on this class.
    callingThread.Sniff(me, "AsyncQueryHelper_Internal", "", true);


    // Add message translators from the custom/default type to the internal type.
    AddHandler(me, GetMessageMajor(), "Failure", "SynchronouslyWaitForResults_OnMessageTranslate");
    AddHandler(me, GetMessageMajor(), resultMsgMinor, "SynchronouslyWaitForResults_OnMessageTranslate");

    // Handle the possibility that this is called after the query's completed
    // (and the messages were posted before our handlers were added etc).
    int errCode = GetQueryErrorCode();
    if (errCode == ERROR_NOT_COMPLETE)
    {
      // Search is still running, wait for completion or failure.
      Message msg;
      wait()
      {
        on "AsyncQueryHelper_Internal", "SynchronouslyWaitForResults_Failure", msg:
          if (msg.src == me)
            break;
          continue;

        on "AsyncQueryHelper_Internal", "SynchronouslyWaitForResults_AsyncResult", msg:
          if (msg.src == me)
            break;
          continue;
      };
    }

    callingThread.Sniff(me, "AsyncQueryHelper_Internal", "", false);


    // Query complete, check the result.
    errCode = GetQueryErrorCode();
    if ((errCode > ERROR_NONE and errCode < WARNINGS_START) or
        (errCode > CUSTOM_ERROR_START and errCode < CUSTOM_WARN_START))
    {
      // Result is within error range, log an error and return false.
      ScriptLog.Log("AsyncQueryHelper.SynchronouslyWaitForResults> ERROR: Returned " + errCode + " on " + callingThread.GetDebugName());
      return false;
    }

    if ((errCode > WARNINGS_START and errCode < CUSTOM_ERROR_START) or errCode > CUSTOM_WARN_START)
    {
      // Result is within warning range, log a warning.
      ScriptLog.Log("AsyncQueryHelper.SynchronouslyWaitForResults> Warning: Returned " + errCode + " on " + callingThread.GetDebugName());
    }

    return true;
  }


  //=============================================================================
  // Name: SynchronouslyWaitForResults_OnMessageTranslate
  // Desc: Helper function for SynchronouslyWaitForResults. Translates posted
  //       messages into the type used internally. This is required to avoid the
  //       possibility of intercepting the wrong messages. As such, the major
  //       type (AsyncQueryHelper_Internal) SHOULD NOT be used anywhere outside
  //       this class, and the minor types SHOULD NOT be used in other functions.
  //=============================================================================
  void SynchronouslyWaitForResults_OnMessageTranslate(Message msg)
  {
    GameObject srcObj = cast<GameObject>(msg.src);
    if (msg.minor == "Failure")
      srcObj.PostMessage(me, "AsyncQueryHelper_Internal", "SynchronouslyWaitForResults_Failure", 0.f);
    else
      srcObj.PostMessage(me, "AsyncQueryHelper_Internal", "SynchronouslyWaitForResults_AsyncResult", 0.f);
  }

};

