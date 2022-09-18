//=============================================================================
// File: AsyncObjectSearch.gs
// Desc: 
//=============================================================================
include "AsyncQueryHelper.gs"
include "World.gs"



//=============================================================================
// Name: NamedObjectInfo
// Desc: The result type used by AsyncObjectSearchResult, see below for more.
//=============================================================================
final class NamedObjectInfo
{
  public GameObject   objectRef;          // A reference to the object, if it's loaded
  public GameObjectID objectId;           // The unique ID of the object
  public string       localisedUsername;  // The display name for the object, in the current language
  public string       categoryString;     // The category code string for the object
};



//=============================================================================
// Name: AsyncObjectSearchResult
// Desc: Stores search parameters and results for an asynchronous asset search.
//       See World.GetNamedObjectList() for more information about searches.
//
// Mesg: "ObjectSearch", "AsyncResult" - Indicates that the search is complete,
//       and that GetResults() can safely be called.
// Mesg: "ObjectSearch", "Failure" - Indicates that the search has failed for
//       some reason. Call GetSearchErrorCode() for more information.
// Mesh: "ObjectSearch", "AsyncLoadComplete" - Posted when a requested object
//       load is complete. See World.GetGameObjectByID() for more info.
// Mesg: "ObjectSearch", "Expired" - Indicates that new search results are
//       available, and that this object has expired. This is not posted by
//       default, and must be requested at search time if you require it.
//
//=============================================================================
final class AsyncObjectSearchResult isclass AsyncQueryHelper
{
  //===========================================================================
  // Name: GetResults
  // Desc: Returns the results of the search. If the search is not yet complete
  //       calling this will throw an exception.
  //===========================================================================
  public native NamedObjectInfo[] GetResults();


  //=============================================================================
  // Name: GetSearchErrorCode
  // Desc: Returns any relevant error or warning code for this search.
  // Retn: int - An integer error/warning code (as defined on AsyncQueryHelper).
  //=============================================================================
  public native int GetSearchErrorCode();
  public int GetQueryErrorCode() { return GetSearchErrorCode(); }


  //=============================================================================
  // Name: GetMessageMajor
  // Desc: Returns the custom message major param used by this class. Exists for
  //       compatibility support only, since this class was originally added
  //       before the AsyncQueryHelper base class (then merged for code reuse).
  //=============================================================================
  public string GetMessageMajor() { return "ObjectSearch"; }

};



//=============================================================================
// Desc: Private class for use by AsyncObjectSearchMonitor. This interface may
//       change without notice, and should not be used externally.
//=============================================================================
final class AOSM_MessageSubscription
{
  public string                       m_msgMajor;
  public string                       m_msgMinor;
};


//=============================================================================
// Desc: Private class for use by AsyncObjectSearchMonitor. This interface may
//       change without notice, and should not be used externally.
//=============================================================================
final class AOSM_MessageSubscriber
{
  public GameObject                   m_subscriber;
  public AOSM_MessageSubscription[]   m_subscriptions;
};


//=============================================================================
// Name: AsyncObjectSearchMonitor_ResultListener
// Desc: A simple listener class for observing search result changes from
//       AsyncObjectSearchMonitor instances (defined below). Inherit from this
//       class, implement the listener function, and call AddSearchListener()
//       on a search monitor to use. Listeners may observe multiple search
//       monitors and can use the source param to differentiate between them.
// Note: Always make sure you remove search listeners before dereferencing any
//       search monitors. Failure to do so may result in search monitors
//       persisting beyond their intended lifetime, and continuing to notify of
//       new search changes.
//=============================================================================
class AsyncObjectSearchMonitor_ResultListener
{
  //=============================================================================
  // Name: OnNewAsyncObjectSearchMonitorResults
  // Desc: Notification from a search monitor that there are new/removed results.
  //       This interface is not compulsory, but is provided for those uses that
  //       require specific details of search changes (added/removed entries).
  // Parm: source - The source of this notification (i.e, the search monitor).
  // Parm: added - The added/new search results.
  // Parm: removed - Any removed search results.
  //=============================================================================
  public void OnNewAsyncObjectSearchMonitorResults(GameObject source, NamedObjectInfo[] added, NamedObjectInfo[] removed) { }
};


//=============================================================================
// Name: AsyncObjectSearchMonitor
// Desc: A helper class used to search for named objects, and listen for
//       specific messages posted to those objects. Automatically handles
//       the process of searching for objects, monitoring for search expiry,
//       and sniffing/unsniffing search results as they are added/removed.
//
// Mesg: "AsyncObjectSearchMonitor", "NewResults" - Indicates that the internal
//       search is complete, and new results exist which the caller/owner may
//       be interested in. (Posted *after* message subscriptions are updated.)
//
//=============================================================================
final class AsyncObjectSearchMonitor isclass GameObject
{
  string                    m_customDebugName = "";
  AsyncObjectSearchResult   m_searchObject;
  string                    m_categoryFilter;
  string                    m_nameFilter;
  float                     m_expiryCooldown = 5.f;

  NamedObjectInfo[]         m_currentResults = null;
  int                       m_threadUpdateSearchResultsState = 0;
  AOSM_MessageSubscriber[]  m_objectMsgSubscriptions = new AOSM_MessageSubscriber[0];
  AsyncObjectSearchMonitor_ResultListener[] m_searchObservers = new AsyncObjectSearchMonitor_ResultListener[0];


  public void InitSearch(string categoryFilter, string nameFilter);
  public void SetDebugName(string name) { m_customDebugName = name; }
  public string GetDebugName();
  public void SetExpiryCooldown(float cooldown) { m_expiryCooldown = cooldown; }

  public void SubscribeToObjectMessages(GameObject subscriber, string major, string minor);
  public void UnsubscribeFromObjectMessages(GameObject subscriber, string major, string minor);
  thread void ThreadUpdateSearchResults();

  public void AddSearchListener(AsyncObjectSearchMonitor_ResultListener listener);
  public void RemoveSearchListener(AsyncObjectSearchMonitor_ResultListener listener);
  public NamedObjectInfo[] GetCopyOfCurrentResultSet();



  //=============================================================================
  // Name: InitSearch
  // Desc: Initialises this object, including starting the object search, all
  //       expiry monitoring and all object message monitoring. Ideally, this
  //       should be called as the last action of initialising this object (i.e,
  //       after the debug name is set, and after any object message
  //       subscriptions are added).
  // Parm: categoryFilter - A category filter to search for. Optional, provided
  //       a nameFilter param is specified. Category codes specify the type of
  //       objects to search for, via their asset config data. A category code
  //       reference can be found in asset.gs, or on the wiki.
  // Parm: nameFilter - A partial localised object name to search for. Optional,
  //       provided a categoryFilter is specified.
  //=============================================================================
  public void InitSearch(string categoryFilter, string nameFilter)
  {
    if (m_searchObject)
    {
      // It's simpler and more robust for everyone involved if the caller just
      // makes a new search object, rather than trying to reuse this one.
      Exception("AsyncObjectSearchMonitor.InitSearch> Search object already initialised");
      return;
    }

    // Initialise our message handlers
    AddHandler(me, "ObjectSearch", "AsyncResult", "OnObjectSearchResult");
    AddHandler(me, "ObjectSearch", "Failure", "OnObjectSearchResult");
    AddHandler(me, "ObjectSearch", "Expired", "OnObjectSearchExpired");
    AddHandler(me, "AsyncObjectSearchMonitor", "SearchExpiryCooldown", "OnObjectSearchExpiredCooldown");

    m_categoryFilter = categoryFilter;
    m_nameFilter = nameFilter;

    // Create and subscribe to the search object
    m_searchObject = World.GetNamedObjectList(m_categoryFilter, m_nameFilter, true);
    Sniff(m_searchObject, "ObjectSearch", "", true);

  }


  //=============================================================================
  // Name: GetDebugName
  // Desc: Returns a debug name for this object, which will be used in any error
  //       or warning logs it produces so that the source of any errors can be
  //       easily determined. See also: SetDebugName().
  // Retn: string - Any manually set debug name, or an auto-generated one if the
  //       object creator has been lazy.
  //=============================================================================
  public string GetDebugName()
  {
    if (m_customDebugName)
      return m_customDebugName;

    return "AsyncObjectSearchMonitor_'" + m_categoryFilter + "'_'" + m_nameFilter + "'";
  }


  //=============================================================================
  // Name: FindMessageSubscriberData
  // Desc: Internal function to find data about a particular object message
  //       subscriber, automatically adding it if desired.
  //=============================================================================
  AOSM_MessageSubscriber FindMessageSubscriberData(GameObject subscriber, bool bCreateIfNotFound)
  {
    if (!subscriber)
      return null;

    int i;
    for (i = 0; i < m_objectMsgSubscriptions.size(); ++i)
    {
      if (m_objectMsgSubscriptions[i].m_subscriber == subscriber)
        return m_objectMsgSubscriptions[i];
    }

    if (!bCreateIfNotFound)
      return null;

    AOSM_MessageSubscriber newSubscriber = new AOSM_MessageSubscriber();
    newSubscriber.m_subscriber = subscriber;
    newSubscriber.m_subscriptions = new AOSM_MessageSubscription[0];
    m_objectMsgSubscriptions[m_objectMsgSubscriptions.size()] = newSubscriber;

    return newSubscriber;
  }



  //=============================================================================
  // Name: SubscribeToObjectMessages
  // Desc: Subscribes a GameObject to receive messages posted to objects in the
  //       search result set. May be called before or after the search is run. 
  //       This object will automatically handle the process of sniffing the
  //       search results internally, all the owner needs to do is call this, and
  //       add a message handler on the subscriber object.
  // Note: Always make sure you call the UnsubscribeFromObjectMessages() function
  //       when/if you want to stop receiving messages. It is *not* sufficient to
  //       dereference this object.
  // Parm: subscriber - The object you wish to receive the messages, i.e. the
  //       object you have called AddHandler on. In most cases this will be the
  //       same object calling this function (i.e. 'me').
  // Parm: major - The major message type to subscribe to.
  // Parm: minor - The minor message type to subscribe to. May be empty/null to
  //       subscribe to any/all messages of the specified major type.
  //=============================================================================
  public void SubscribeToObjectMessages(GameObject subscriber, string major, string minor)
  {
    AOSM_MessageSubscriber subscriberData = FindMessageSubscriberData(subscriber, true);
    if (!subscriberData or major == "")
      return;

    // Return if an entry already exists for this specific message type.
    int i;
    for (i = 0; i < subscriberData.m_subscriptions.size(); ++i)
    {
      if (subscriberData.m_subscriptions[i].m_msgMajor == major and subscriberData.m_subscriptions[i].m_msgMinor == minor)
        return;
    }

    // TODO: Do we want to handle empty minor types here (i.e, merge entries)

    // Create and add the subscription details.
    AOSM_MessageSubscription subscriptionData = new AOSM_MessageSubscription();
    subscriptionData.m_msgMajor = major;
    subscriptionData.m_msgMinor = minor;
    subscriberData.m_subscriptions[subscriberData.m_subscriptions.size()] = subscriptionData;

    // Iterate and use the subscriber to sniff each object in the result set
    if (m_searchObject and !m_searchObject.IsErrorCode(m_searchObject.GetSearchErrorCode()))
    {
      NamedObjectInfo[] results = m_searchObject.GetResults();
      for (i = 0; i < results.size(); ++i)
        subscriber.Sniff(results[i].objectId, major, minor, true);
    }

  }


  //=============================================================================
  // Name: UnsubscribeFromObjectMessages
  // Desc: Unsubscribes a GameObject from receiving messages posted to objects in
  //       the search result set. This should be called for any objects which
  //       have previously called SubscribeToObjectMessages() on this object,
  //       either when they no longer want to receive those messages or when they
  //       clear their reference(s) to this object.
  // Note: Failure to call this will result in the subscriber continuing to be
  //       forwarded messages from the subscribed objects, even if this search
  //       monitor is destroyed.
  // Note: This function will only unsniff messages for which there is a previous
  //       matching call to SubscribeToObjectMessages(), and will only unsniff
  //       objects which it has previously sniffed.
  // Parm: major - The major message type to subscribe to. May be empty/null to
  //       remove subscriptions of any major type (for this subscriber).
  // Parm: minor - The minor message type to subscribe to. May be empty/null to
  //       unsubscribe all messages of the specified major type.
  //=============================================================================
  public void UnsubscribeFromObjectMessages(GameObject subscriber, string major, string minor)
  {
    AOSM_MessageSubscriber subscriberData = FindMessageSubscriberData(subscriber, true);
    if (!subscriberData)
      return;

    int matchingSubs = 0;

    // Search for and remove any entries matching this subscription.
    int i;
    for (i = 0; i < subscriberData.m_subscriptions.size(); )
    {
      AOSM_MessageSubscription subscriptionData = subscriberData.m_subscriptions[i];

      // Note that the wildcard handling here does NOT match the standard wildcard
      // handling for Sniff/PostMessage/etc. This is intentional to allow the caller
      // to more easily unsubscribe from all message types.
      if ((major == "" or subscriptionData.m_msgMajor == major) and (minor == "" or subscriptionData.m_msgMinor == minor))
      {
        if (m_currentResults)
        {
          // It's a match, iterate and unsniff each object in any current result set.
          int j;
          for (j = 0; j < m_currentResults.size(); ++j)
            subscriber.Sniff(m_currentResults[j].objectId, subscriptionData.m_msgMajor, subscriptionData.m_msgMinor, false);
        }

        // Remove the subscription entry.
        subscriberData.m_subscriptions[i,i+1] = null;
        ++matchingSubs;
      }
      else
      {
        // Not a match, check the next one.
        ++i;
      }

    } // for (i = 0; i < subscriberData.m_subscriptions.size(); )

    // Calls to this function *should* be rare, and bug with message subscription
    // may be hard to diagnose, so always add a results log.
    ScriptLog.Log("AsyncObjectSearchMonitor.UnsubscribeFromObjectMessages> '" + GetDebugName() + "' " +
                  matchingSubs + " message subscriptions removed for '" + subscriber.GetDebugName() + "'. " +
                  subscriberData.m_subscriptions.size() + " more remain.");

  }


  //=============================================================================
  // Name: OnObjectSearchResult
  // Desc: Internal function to handle completion/failure of an object search.
  //=============================================================================
  void OnObjectSearchResult(Message msg)
  {
    // Silently ignore messages from unknown sources (we shouldn't be getting any,
    // but it's also harmless if we do, provided we correctly ignore them).
    if (!m_searchObject or msg.src != m_searchObject)
      return;

    // Check the search result.
    int searchResult = m_searchObject.GetSearchErrorCode();
    if (m_searchObject.IsErrorCode(searchResult))
    {
      // The caller is probably relying on us to produce a valid result set, and
      // our search has just failed for some reason, so report it.
      Exception("AsyncObjectSearchMonitor.OnObjectSearchResult> '" + GetDebugName() + "' failed with error " + searchResult);

      // TODO: We could retry here, but there's not much point currently
      return;
    }

    if (m_searchObject.IsWarningCode(searchResult))
      ScriptLog.Log("AsyncObjectSearchMonitor.OnObjectSearchResult> WARNING: '" + GetDebugName() + "' produced warning " + searchResult);

    // Determine the changes in the result set (this might be slow, so at this
    // point we'll move to a thread)
    ThreadUpdateSearchResults();
  }


  //=============================================================================
  // Name: ThreadUpdateSearchResults
  // Desc: Internal function to update the message subscription handling on the
  //       searched objects. Called from OnObjectSearchResult() above, both for
  //       the initial search result, and any future searches which occur after
  //       search expiry. This runs as a script 'thread' because it may have to
  //       deal with large numbers of objects, and we don't want it to time out.
  // Note: A message of type "AsyncObjectSearchMonitor","NewResults" will be
  //       posted to this object when this function completes.
  //=============================================================================
  thread void ThreadUpdateSearchResults()
  {
    if (m_threadUpdateSearchResultsState != 0)
    {
      // This thread is already running. We don't allow multiples, but the work
      // it's currently doing is also already out of date, so signal it to restart.
      if (m_threadUpdateSearchResultsState == 1)
        ++m_threadUpdateSearchResultsState;
      ScriptLog.Log("AsyncObjectSearchMonitor.ThreadUpdateSearchResults> WARNING: '" + GetDebugName() + "' already parsing results, consider using a longer expiry cooldown");
      return;
    }
    ++m_threadUpdateSearchResultsState;

    // Before we do anything, take a local reference to the search object we're
    // parsing (to avoid errors caused by it changing outside of this thread).
    AsyncObjectSearchResult parsedSearch = m_searchObject;

    NamedObjectInfo[] addedEntries = new NamedObjectInfo[0];
    NamedObjectInfo[] removedEntries = new NamedObjectInfo[0];

    // Unlike the search itself, m_currentResults should never be modified
    // outside of this thread function, so we're safe to reference the member.
    if (m_currentResults)
    {
      // We have an existing result set, so we'll need to parse the two for differences.
      NamedObjectInfo[] newResults = parsedSearch.GetResults();

      // We need to sleep every so often to avoid timeouts if there's several hundred results.
      int loopCount = 0;

      // First, check the old set for removals.
      int i;
      for (i = 0; i < m_currentResults.size(); ++i)
      {
        int j;
        for (j = 0; j < newResults.size(); ++j)
        {
          if (newResults[j].objectId.DoesMatch(m_currentResults[i].objectId))
            break;

          if ((++loopCount) % 5000 == 0)
            Sleep(0.01);
        }
        if (j == newResults.size())
          removedEntries[removedEntries.size()] = m_currentResults[i];
      }

      // Next, check the other way for added entries.
      for (i = 0; i < newResults.size(); ++i)
      {
        int j;
        for (j = 0; j < m_currentResults.size(); ++j)
        {
          if (m_currentResults[j].objectId.DoesMatch(newResults[i].objectId))
            break;

          if ((++loopCount) % 5000 == 0)
            Sleep(0.01);
        }
        if (j == m_currentResults.size())
          addedEntries[addedEntries.size()] = newResults[i];
      }
    }
    else
    {
      // No existing results, meaning all the results are added.
      addedEntries = parsedSearch.GetResults();
    }

    ScriptLog.Log("AsyncObjectSearchMonitor.ThreadUpdateSearchResults> '" + GetDebugName() + "' found " +
                  addedEntries.size() + " new entries, and " + removedEntries.size() + " removed entries");

    Sleep(0.01);

    // We now have 2 arrays containing the removed and added results. These will
    // need to be looped over to update any object message subscriptions.
    if (m_objectMsgSubscriptions.size() > 0 and (addedEntries.size() or removedEntries.size()))
    {
      ScriptLog.Log("AsyncObjectSearchMonitor.ThreadUpdateSearchResults> '" + GetDebugName() + "' updating message subscriptions for " +
                    m_objectMsgSubscriptions.size() + " subscribers");

      // Note that we run this without sleeping because we don't want to allow
      // subscriptions to be added/removed while we're half way through, but if
      // we start seeing timeouts here we'll need to take copies etc.
      int i;
      for (i = 0; i < m_objectMsgSubscriptions.size(); ++i)
      {
        AOSM_MessageSubscriber subscriber = m_objectMsgSubscriptions[i];
        int j;
        for (j = 0; j < subscriber.m_subscriptions.size(); ++j)
        {
          AOSM_MessageSubscription subscription = subscriber.m_subscriptions[j];
          int k;

          for (k = 0; k < removedEntries.size(); ++k)
            subscriber.m_subscriber.Sniff(removedEntries[k].objectId, subscription.m_msgMajor, subscription.m_msgMinor, false);
          for (k = 0; k < addedEntries.size(); ++k)
            subscriber.m_subscriber.Sniff(addedEntries[k].objectId, subscription.m_msgMajor, subscription.m_msgMinor, true);
        }
      }
    }

    // Set the new current results.
    m_currentResults = parsedSearch.GetResults();

    if (--m_threadUpdateSearchResultsState != 0)
    {
      // Dammit, the results are already out of date. Run again.
      ThreadUpdateSearchResults();
    }
    else
    {
      if (m_searchObservers.size() > 0 and (addedEntries.size() > 0 or removedEntries.size() > 0))
      {
        // Notify any registered observers of specific search changes.
        int i;
        for (i = 0; i < m_searchObservers.size(); ++i)
          m_searchObservers[i].OnNewAsyncObjectSearchMonitorResults(me, addedEntries, removedEntries);
      }

      // Also post a general message notifying that the result set has changed.
      PostMessage(me, "AsyncObjectSearchMonitor", "NewResults", 0.f);
    }

  }


  //=============================================================================
  // Name: OnObjectSearchExpired
  // Desc: Internal function to handle the expiry of the internal object search.
  //=============================================================================
  void OnObjectSearchExpired(Message msg)
  {
    if (!m_searchObject or msg.src != m_searchObject)
      return;

    // Post a message to redo the search after the currently configured cooldown.
    PostMessage(me, "AsyncObjectSearchMonitor", "SearchExpiryCooldown", m_expiryCooldown);
  }


  //=============================================================================
  // Name: OnObjectSearchExpiredCooldown
  // Desc: Internal function to handle the lapsing of the search expiry cooldown.
  //=============================================================================
  void OnObjectSearchExpiredCooldown(Message msg)
  {
    if (msg.src != me)
      return;

    ClearMessages("AsyncObjectSearchMonitor", "SearchExpiryCooldown");

    // Unsniff the old search object, we're not interested in it any more.
    Sniff(m_searchObject, "ObjectSearch", "", false);
    m_searchObject = null;

    // Run a new search, being sure to sniff it for the result messages.
    m_searchObject = World.GetNamedObjectList(m_categoryFilter, m_nameFilter, true);
    Sniff(m_searchObject, "ObjectSearch", "", true);
  }


  //=============================================================================
  // Name: AddSearchListener
  // Desc: Adds a search listener to this monitor. This is not compulsory. Search
  //       listeners may be used for cases that benefit from being told about
  //       every change in the search results.
  // Parm: listener - The search listener to add.
  // NOTE: If you add a search listener via this function, always make sure you
  //       remove it again when you are done with the search monitor. Failure to
  //       do so may result in search monitors persisting beyond their intended
  //       lifetime, and continuing to notify of new search changes.
  //=============================================================================
  public void AddSearchListener(AsyncObjectSearchMonitor_ResultListener listener)
  {
    // Sanity check that this listener isn't already added.
    int i;
    for (i = 0; i < m_searchObservers.size(); ++i)
    {
      if (m_searchObservers[i] == listener)
        return;
    }

    m_searchObservers[m_searchObservers.size()] = listener;
  }


  //=============================================================================
  // Name: RemoveSearchListener
  // Desc: Removes a previously added search monitor listener.
  // Parm: listener - The search listener to remov.
  //=============================================================================
  public void RemoveSearchListener(AsyncObjectSearchMonitor_ResultListener listener)
  {
    int i;
    for (i = 0; i < m_searchObservers.size(); ++i)
    {
      if (m_searchObservers[i] == listener)
      {
        m_searchObservers[i,i+1] = null;
        return;
      }
    }
  }


  //=============================================================================
  // Name: GetCopyOfCurrentResultSet
  // Desc: Builds and returns a copy of the current result set. This should be
  //       avoided, because it's slow, but it's provided because there are cases
  //       where it's likely essential.
  // Note: This copies the entire result set as it is currently. The returned
  //       array is not referenced by this object and may be freely modified etc.
  //       This also means that it will not be automatically updated if the
  //       search result changes.
  //=============================================================================
  public NamedObjectInfo[] GetCopyOfCurrentResultSet()
  {
    NamedObjectInfo[] resultCopy = new NamedObjectInfo[m_currentResults.size()];
    int i;
    for (i = 0; i < m_currentResults.size(); ++i)
      resultCopy[i] = m_currentResults[i];

    return resultCopy;
  }


  // TODO: Save/Load support? No cases have come up for it yet, but that doesn't mean there are none.

};

