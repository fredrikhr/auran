//=============================================================================
// File: InterlockingTower.gs
// Desc: Defines the script class for an Interlocking Tower, along with some
//       small helper structs. See also: InterlockingTowerPath.gs
//=============================================================================
include "MapObject.gs"
include "InterlockingTowerPath.gs"
include "NavPoints.gs"


//=============================================================================
// Name: InterlockingTrainPath
// Desc: Holds data about a train path assignment (or pending assignment). This
//       may be extended by custom tower scripts, but care should be taken when
//       reusing existing variables, as their usage may be extended in future
//       versions.
//=============================================================================
class InterlockingTrainPath
{
  public GameObjectID m_itpSignalID;  // The ID of the entry signal for the path
  public int          m_itpStatus;    // Train status relevant to this signal, see STATE_* defines below.
  public string       m_itpPath;      // The path assigned to or awaiting assignment to this entry signal

  public obsolete Signal m_itpSignal;

  // Possible train states for a path. If any custom states are required when
  // deriving this class, assign them values above STATE_CUSTOM_BEGIN.
  public define int STATE_APPROACH = 0;  // Train is approaching our area 
  public define int STATE_QUEUED   = 1;  // Train is queued for entry
  public define int STATE_ON_PATH  = 2;  // Train is on this path
  public define int STATE_PASSING  = 3;  // Train is passing by and doesn't
                                         // want entry, or has left the path

  // Custom state marker, values less than this are reserved for future extension
  public define int STATE_CUSTOM_BEGIN = 100;

};


//=============================================================================
// Name: InterlockingTrain
// Desc: Holds data about a train which is within the tower's area of relevance
//=============================================================================
class InterlockingTrain
{
  public GameObjectID             m_itTrainID;  // The script ID of the train
  public float                    m_timeStopped;// The time this train last stopped
  public InterlockingTrainPath[]  m_itPaths;    // Path data for all nearby entry signals

  public obsolete Train m_itTrain;

  //=============================================================================
  // Name: GetProperties
  // Desc: Returns a Soup containing save data for this object
  //=============================================================================
  public mandatory Soup GetProperties()
  {
    Soup parentProperties = Constructors.NewSoup();

    int i;
    Soup properties = Constructors.NewSoup();

    properties.SetNamedTag("train-id", m_itTrainID);
    properties.SetNamedTag("time-stopped", m_timeStopped);

    Soup paths = Constructors.NewSoup();
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      Soup pathProperties = Constructors.NewSoup();
      pathProperties.SetNamedTag("signal-id", m_itPaths[i].m_itpSignalID);
      pathProperties.SetNamedTag("status", m_itPaths[i].m_itpStatus);
      pathProperties.SetNamedTag("path", m_itPaths[i].m_itpPath);
      paths.AddUniqueNamedSoup(pathProperties);
    }
    properties.SetNamedSoup("paths", paths);

    // Avoid potential name conflicts with 3rd party scripts by saving all the
    // default internal properties in a sub-soup
    parentProperties.SetNamedSoup("default-properties", properties);

    return parentProperties;
  }

  //=============================================================================
  obsolete GameObjectID LegacyGetGameObjectIDFromName(string name)
  {
    TrainzGameObject obj = cast<TrainzGameObject>(Router.GetGameObject(name));
    if (obj)
      return obj.GetGameObjectID();

    return null;
  }

  //=============================================================================
  obsolete void CacheObsoleteVariables()
  {
    m_itTrain = cast<Train>(World.GetGameObjectByIDIfLoaded(m_itTrainID));

    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
      m_itPaths[i].m_itpSignal = cast<Signal>(World.GetGameObjectByIDIfLoaded(m_itPaths[i].m_itpSignalID));
  }

  //=============================================================================
  // Name: SetProperties
  // Desc: Sets the data members for this object from the Soup passed
  //=============================================================================
  public mandatory void SetProperties(Soup parentProperties)
  {
    int i;

    // Avoid potential name conflicts with 3rd party scripts by saving all the
    // default internal properties in a sub-soup
    Soup properties = parentProperties.GetNamedSoup("default-properties");

    m_itTrainID = properties.GetNamedTagAsGameObjectID("train-id");
    if (!m_itTrainID)
      m_itTrainID = LegacyGetGameObjectIDFromName(properties.GetNamedTag("train"));

    m_timeStopped = properties.GetNamedTagAsFloat("time-stopped", 0);

    Soup paths = properties.GetNamedSoup("paths");
    m_itPaths = new InterlockingTrainPath[paths.CountTags()];
    for (i = 0; i < paths.CountTags(); ++i)
    {
      Soup pathProperties = paths.GetNamedSoup(paths.GetIndexedTagName(i));
      m_itPaths[i] = new InterlockingTrainPath();
      m_itPaths[i].m_itpSignalID = pathProperties.GetNamedTagAsGameObjectID("signal-id");
      if (!m_itPaths[i].m_itpSignalID)
        m_itPaths[i].m_itpSignalID = LegacyGetGameObjectIDFromName(pathProperties.GetNamedTag("signal"));
      m_itPaths[i].m_itpStatus = pathProperties.GetNamedTagAsInt("status", m_itPaths[i].m_itpStatus);
      m_itPaths[i].m_itpPath = pathProperties.GetNamedTag("path");
    }

    // Attempt to set the obsolete train and signal variables
    CacheObsoleteVariables();
  }

};



//=============================================================================
// Name: InterlockingTower
// Desc: Represents an Interlocking Tower game object within Trainz script.
//       Interlocking Towers are used to control configure a pre-defined
//       section of track (an 'interlocking', or 'path'), including the state
//       of signals, junctions, etc. Such configuration is performed by the
//       player using the properties tool on the tower, and is driven in script
//       by the Interlocking Tower Edit Helper in base. Extra properties can be
//       added on custom tower scripts by overriding the Property functions at
//       the end of this class.
//       Also note that all Driver path selection is performed outside of the
//       tower class itself. To add custom path selection (including AI) you
//       should create a new InterlockingTowerManagerListener implementation 
//       (see Interlocking Tower Manager in the base content set) and register
//       it with the manager.
// NOTE: Builtin variable names are prefixed with the reserved namespace "it".
//       If you create are extending this script do NOT use this namespace, as
//       it may cause future code additions to break your tower script.
//=============================================================================
game class InterlockingTower isclass MapObject
{
  Library                   m_itManager;        // The interlocking tower manager library
  SecurityToken             m_itTowerToken;     // The default tower security token,
                                                // used for all ownership and control
  InterlockingTowerPath[]   m_itPaths;          // The paths defined on this tower
  InterlockingTrain[]       m_itTrains;         // The currently monitored trains
  int                       m_itAiState;        // The current tower AI state, one of
                                                // the PATH_ASSIGNMENT_AI_* values
  string[]                  m_itNavPoints;      // Set of signal names for which we
                                                // have active nav point sets (obsolete)
  GameObjectID[]            m_itNavPointIDs;    // Matching set to m_itNavPoints, but for IDs
  int                       m_itDebugLogLevel;  // The severity of messages to add to the log
  int                       m_itPrintLogLevel;  // The severity of messages to print to the UI
  bool                      m_itIsInitialised;  // Set once the tower has initialised all paths

  // Possible tower path assignment options. Do not extend these defines. If
  // you wish to create custom tower AI, do so creating an external library,
  // adding it as an InterlockingTowerManager listener, then setting your tower
  // to EXTERNAL_ONLY or EXTERNAL_THEN_AI.
  //
  //  This tower will never assign paths for trains, it must be done
  //  manually by the player using an external script (e.g. a session rule)
  public define int IT_PATH_ASSIGNMENT_OFF              = 0;
  //
  // Query the tower manager listeners to see if they have a path assignment.
  // If they do not, then assign no path.
  public define int IT_PATH_ASSIGNMENT_EXTERNAL_ONLY    = 1;
  //
  // Query the tower manager listeners to see if they have a path assignment.
  // If they do not, then use the tower manager AI.
  public define int IT_PATH_ASSIGNMENT_EXTERNAL_THEN_AI = 2;
  //
  // Use the tower manager AI to attempt automatic path assignment. If the AI
  // cannot make the decision, assign no path.
  public define int IT_PATH_ASSIGNMENT_AI_ONLY          = 3;
  //
  // Use the tower manager AI to attempt automatic path assignment. If the AI
  // cannot make the decision, query any tower listeners for a path.
  public define int IT_PATH_ASSIGNMENT_AI_THEN_EXTERNAL = 4;    // (DEFAULT)

  
  // The current data version for GetProperties/SetProperties.
  public define int IT_CURRENT_PROPERTIES_VERSION = 1;


  public bool IsInterlockingTowerInitialised() { return m_itIsInitialised; }
  public bool ValidateToken(SecurityToken token, string operation);

  public InterlockingTowerPath CreateNewPath();
  public bool AddPath(InterlockingTowerPath path, int index);
  public bool DeletePath(InterlockingTowerPath path);
  public bool DeleteIndexedPath(int index);
  public InterlockingTowerPath[] GetTowerPaths() { return m_itPaths; }

  public string[] GetLocalisedPathNames();
  public InterlockingTowerPath FindPathByName(string pathName);
  public InterlockingTowerPath[] GetConflictingPaths(InterlockingTowerPath path);
  public bool IsPathEntrySignal(Signal signal);

  public mandatory void SetAIState(int aiState);
  public int GetTowerAIState() { return m_itAiState; }
  public void AssignPathToTrain(Train train, string pathName);
  public void CancelPathForTrain(Train train, string pathName);
  public void SetPanicStateForPath(string pathName);
  public void SetTrainAsPassing(Train train, GameObjectID entrySignalID);
  public void SetTrainAsPassing(Train train, Signal entrySignal) { SetTrainAsPassing(train, entrySignal.GetGameObjectID()); }

  public void SetTowerDebugLogging(int logLevel, int printLevel) { m_itDebugLogLevel = logLevel; m_itPrintLogLevel = printLevel; }


  //=============================================================================
  // Name: Init
  // Desc: Initialises the tower script, setting defaults, adding handlers, etc
  //=============================================================================
  public void Init(Asset asset)
  {
    inherited(asset);

    KUID itManagerKuid = Constructors.GetTrainzAsset().LookupKUIDTable("interlocking-tower-manager");
    m_itManager = TrainzScript.GetLibrary(itManagerKuid);

    string[] rights = new string[8];
    rights[0] = "path-control";
    rights[1] = "signal-owner";
    rights[2] = "signal-state";
    rights[3] = "junction-owner";
    rights[4] = "junction-state";
    rights[5] = "junction-permit";
    rights[6] = "crossing-owner";
    rights[7] = "crossing-state";
    m_itTowerToken = IssueSecurityToken(asset.GetKUID(), rights);

    m_itPaths = new InterlockingTowerPath[0];
    m_itTrains = new InterlockingTrain[0];
    m_itAiState = IT_PATH_ASSIGNMENT_AI_THEN_EXTERNAL;
    m_itNavPoints = new string[0];
    m_itNavPointIDs = new GameObjectID[0];

    m_itIsInitialised = false;

    // Init the logging levels (0=disabled, 1 for errors, 2 for errors and warnings, etc)
    m_itDebugLogLevel = 2;
    m_itPrintLogLevel = 0;

    AddHandler(me, "World", "ModuleInit", "OnModuleInit");
    AddHandler(me, "Signal", "Train Approaching", "OnTrainApproach");
    AddHandler(me, "Signal", "Train Leaving", "OnTrainLeave");
    AddHandler(me, "Schedule", "Blocked", "OnTrainScheduleBlocked");
    AddHandler(me, "Train", "StoppedMoving", "OnTrainStoppedMoving");
    AddHandler(me, "Train", "Cleanup", "OnTrainCleanup");
    AddHandler(me, "nav-point-clicked", "", "OnNavPointClicked");
    Sniff(NavPoints, "nav-point-clicked", "", true);

    AddHandler(me, "InterlockingTowerPath", "Active", "OnPathActivated");
    AddHandler(me, "InterlockingTowerPath", "Cancelled", "OnPathCancelled");
  }


  //=============================================================================
  // Name: DebugLog
  // Desc: Internal function for printing debug logs and easily enabling,
  //       disabling or tweaking the amount of debug logging necessary
  // Parm: logMsg - The message to log
  // Parm: warningLevel - The warning level of this log (should be > 0)
  //=============================================================================
  public void DebugLog(string logMsg, int warningLevel)
  {
    if (warningLevel <= m_itDebugLogLevel)
      Interface.Log(logMsg);

    if (warningLevel <= m_itPrintLogLevel)
      Interface.Print(logMsg);
  }


  //=============================================================================
  // Name: GetTowerToken
  // Desc: Protected function used by native code to verify tower functionality
  //=============================================================================
  SecurityToken GetTowerToken()
  {
    return m_itTowerToken;
  }


  //=============================================================================
  // Name: ValidateToken
  // Desc: Returns whether the token passed allows this object to perform the
  //       operation passed
  //=============================================================================
  public bool ValidateToken(SecurityToken token, string operation)
  {
    if (!token or operation == "")
      return false;

    return Validate(token, me, operation);
  }


  //=============================================================================
  // Name: SetPathObjectsOwned
  // Desc: Tells each configured path to claim or release ownership of objects
  //=============================================================================
  void SetPathObjectsOwned(bool bWantOwnership)
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      m_itPaths[i].SetWantObjectOwnership(m_itTowerToken);
      m_itPaths[i].SetObjectsOwned(m_itTowerToken, bWantOwnership);
    }
  }


  //=============================================================================
  // Name: CreateNewPath
  // Desc: Creates a new blank path for use by this tower. Any script which needs
  //       to create a path should call this function. Any tower which needs to
  //       customise the class can then just override this to create their type.
  //=============================================================================
  public InterlockingTowerPath CreateNewPath()
  {
    InterlockingTowerPath path = new InterlockingTowerPath();
    path.Init(me, m_itTowerToken);
    return path;
  }

  
  //=============================================================================
  // Name: AddPath
  // Desc: Attempts to add a path at the index passed. Path names must be unique,
  //       so this will fail if there is another path with the same name. The
  //       call will also fail if the index specified is out of range.
  // Parm: path - The tower path to add, must have been created by this tower
  // Parm: index - The index at which to insert the path, -1 to add at the end
  // Retn: bool - true if the path was added, false otherwise
  //=============================================================================
  public bool AddPath(InterlockingTowerPath path, int index)
  {
    if (path.GetOwningTower() != me)
      return false;

    if (index > m_itPaths.size())
      return false;

    if (FindPathByName(path.GetPathName()))
      return false;

    // Make room at the index specified
    int i;
    for (i = m_itPaths.size(); i > index; --i)
      m_itPaths[i] = m_itPaths[i - 1];

    m_itPaths[index] = path;
    return true;
  }


  //=============================================================================
  // Name: DeletePath
  // Desc: Attempts to remove the path passed from this tower
  // Retn: bool - true if the path was found and deleted, false otherwise
  //=============================================================================
  public bool DeletePath(InterlockingTowerPath path)
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      if (m_itPaths[i] == path)
      {
        m_itPaths[i, i + 1] = null;
        return true;
      }
    }

    return false;
  }


  //=============================================================================
  // Name: DeleteIndexedPath
  // Desc: Attempts to delete the path at the index passed
  // Retn: bool - true if the path was found and deleted, false otherwise
  //=============================================================================
  public bool DeleteIndexedPath(int index)
  {
    if (index < 0 or index >= m_itPaths.size())
      return false;

    m_itPaths[index, index + 1] = null;
    return true;
  }


  //=============================================================================
  // Name: GetLocalisedPathNames
  // Desc: Returns a list of current localised path names
  //=============================================================================
  public string[] GetLocalisedPathNames()
  {
    string[] names = new string[m_itPaths.size()];

    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
      names[i] = m_itPaths[i].GetLocalisedPathName();

    return names;
  }


  //=============================================================================
  // Name: FindPathByName
  // Desc: Finds and returns an interlocking path by name
  //=============================================================================
  public InterlockingTowerPath FindPathByName(string pathName)
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      if (m_itPaths[i].GetPathName() == pathName)
        return m_itPaths[i];
      if (m_itPaths[i].GetLocalisedPathName() == pathName)
        return m_itPaths[i];
    }

    return null;
  }


  //=============================================================================
  // Name: RebuildConflictingPathCache
  // Desc: Called post-load in Driver to precache the conflicting paths. This is
  //       necessary to avoid script timeouts mid-run.
  //=============================================================================
  thread void PrebuildConflictingPathCache()
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      if (m_itPaths[i].HasConflictingPathsCached())
        continue;

      m_itPaths[i].RebuildConflictingPathCache();

      // This is pretty much guaranteed to time out with any largish number of
      // paths so pause for a frame after each one.
      Sleep(0.001f);
    }
  }


  //=============================================================================
  // Name: CacheConflictingPaths
  // Desc: Clears all cached conflicting paths, forcing a rebuild on next query
  //=============================================================================
  public void ClearConflictingPathCache()
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
      m_itPaths[i].ClearConflictingPathCache(false);
  }


  //=============================================================================
  // Name: GetConflictingPaths
  // Desc: Returns the set of conflicting paths for the path passed
  //=============================================================================
  public InterlockingTowerPath[] GetConflictingPaths(InterlockingTowerPath path)
  {
    return path.GetConflictingPaths();
  }


  //=============================================================================
  // Name: IsPathEntrySignal
  // Desc: Returns whether the signal passed is used as an entry signal for any
  //       path on this tower
  //=============================================================================
  public bool IsPathEntrySignal(Signal signal)
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      GameObjectID entrySignalID = m_itPaths[i].GetIndexedPathDefinitionObjectID(0);
      if (entrySignalID and entrySignalID.DoesMatch(signal))
        return true;
    }

    return false;
  }


  //=============================================================================
  // Name: SetAIState
  // Desc: Alters the current state of the towers automatic processing
  // Parm: aiState - The AI state for the tower, see PATH_ASSIGNMENT_* defines
  //=============================================================================
  public mandatory void SetAIState(int aiState)
  {
    // Validate the AI state. Note that these defines should not be extended and
    // this validation should not be removed or bypassed. Doing so may break tower
    // compatibility in the future (if not immediately).
    if (aiState != IT_PATH_ASSIGNMENT_OFF and
        aiState != IT_PATH_ASSIGNMENT_EXTERNAL_ONLY and
        aiState != IT_PATH_ASSIGNMENT_EXTERNAL_THEN_AI and
        aiState != IT_PATH_ASSIGNMENT_AI_ONLY and
        aiState != IT_PATH_ASSIGNMENT_AI_THEN_EXTERNAL)
    {
      Interface.Exception("InterlockingTower.SetAIState> Invalid AI path assignment state");
      return;
    }

    m_itAiState = aiState;
  }


  //=============================================================================
  // Name: CreatePathRequeryNavPoint
  // Desc: Creates a navigation point set containing a single nav point at the
  //       path entry signal passed. This nav point is clickable by the player to
  //       trigger a requery of the path assignment through the tower manager.
  // Parm: entrySignal - The entry signal to spawn the nav point over.
  // Parm: bIsLegacyLoad - Used when loading legacy save data, skips some steps.
  // Note: This function can be overridden to no-op and prevent the creation of
  //       path requery navpoints, if desired.
  //=============================================================================
  void CreatePathRequeryNavPoint(Signal entrySignal, bool bIsLegacyLoad)
  {
    if (!entrySignal)
      return;

    if (!bIsLegacyLoad)
    {
      // Avoid duplicates, these would generate script exceptions from native
      int i;
      for (i = 0; i < m_itNavPointIDs.size(); ++i)
        if (m_itNavPointIDs[i].DoesMatch(entrySignal))
          return;

      // The signal name is obsolete but grab it anyway in case a 3rd party script
      // needs it. The GameObjectID is also used to retrieve/test the signal later.
      m_itNavPoints[m_itNavPoints.size()] = entrySignal.GetName();
      m_itNavPointIDs[m_itNavPointIDs.size()] = entrySignal.GetGameObjectID();
    }

    // Thankfully, this name does not need to be human readable, so we can make it as unique as we need
    string navPointSetName = GetGameObjectID().SerialiseToString() + "-" + entrySignal.GetGameObjectID().SerialiseToString() + "-Auto-NavPoints";

    // Define our single nav point and then create the set
    NavPoint[] navPoints = new NavPoint[1];
    navPoints[0] = new NavPoint();
    navPoints[0].tMarkID = entrySignal.GetGameObjectID();
    navPoints[0].icon = NavPoints.NAVICON_INT_TOWER;
    navPoints[0].text = "";
    navPoints[0].style = NavPoints.NAVSTLYE_MANUAL;
    navPoints[0].target = NavPoints.NAVTARGET_VEHICLE;

    NavPoints.CreateNavigationPointSet(navPointSetName, NavPoints.NAVMODE_NON_SEQUENTIAL, navPoints);
  }


  //=============================================================================
  // Name: CreatePathRequeryNavPoint
  // Desc: Default parameter specifier, see above.
  //=============================================================================
  void CreatePathRequeryNavPoint(Signal entrySignal) { CreatePathRequeryNavPoint(entrySignal, false); }


  //=============================================================================
  // Name: CheckAndClearPathRequeryNavPoint
  // Desc: Checks for any trains near the entry signal passed and if none are
  //       found, clears any nav point set
  //=============================================================================
  void CheckAndClearPathRequeryNavPoint(Signal entrySignal)
  {
    if (!entrySignal)
      return;

    // Ensure we actually have a nav point set for this signal, to avoid
    // inadvertently clearing some other systems nav points
    int npi;
    for (npi = 0; npi < m_itNavPointIDs.size(); ++npi)
    {
      if (m_itNavPointIDs[npi].DoesMatch(entrySignal))
      {
        bool bTrainsFound = false;

        // Check for any nearby trains, return if one is found
        int ti, pi;
        for (ti = 0; ti < m_itTrains.size(); ++ti)
        {
          for (pi = 0; pi < m_itTrains[ti].m_itPaths.size(); ++pi)
          {
            if (m_itTrains[ti].m_itPaths[pi].m_itpSignalID.DoesMatch(entrySignal))
            {
              // Unless the train's already on the path
              if (m_itTrains[ti].m_itPaths[pi].m_itpStatus == InterlockingTrainPath.STATE_ON_PATH and
                  m_itTrains[ti].m_itPaths[pi].m_itpPath != "")
              {
                InterlockingTowerPath path = FindPathByName(m_itTrains[ti].m_itPaths[pi].m_itpPath);
                if (path and path.IsOccupiedByTrain(m_itTrains[ti].m_itTrainID, true))
                  continue;
              }

              return;
            }
          }
        }

        // No trains found near this entry signal, remove the set
        string navPointSetName = GetGameObjectID().SerialiseToString() + "-" + entrySignal.GetGameObjectID().SerialiseToString() + "-Auto-NavPoints";
        NavPoints.ClearNavigationPointSet(navPointSetName);

        // And remove both the signal name and ID
        m_itNavPoints[npi, npi + 1] = null;
        m_itNavPointIDs[npi, npi + 1] = null;

        return;
      }
    }
  }


  //=============================================================================
  // Name: CheckAndClearPathRequeryNavPoint
  // Desc: Checks for any trains near the entry signal passed and if none are
  //       found, clears any nav point set. This is a 'threaded' variant takes a
  //       GameObjectID rather than the signal itself, then loads it as required.
  //=============================================================================
  thread void CheckAndClearPathRequeryNavPoint(GameObjectID entrySignalID)
  {
    Signal entrySignal = cast<Signal>(World.SynchronouslyLoadGameObjectByID(entrySignalID));
    CheckAndClearPathRequeryNavPoint(entrySignal);
  }


  //=============================================================================
  // Name: BeginMonitoringTrain
  // Desc: Called to begin monitoring a train, either when it enters the area of
  //       an interlocking path entry signal or someone calls to assign it a path
  //=============================================================================
  mandatory InterlockingTrain BeginMonitoringTrain(GameObjectID trainID)
  {
    InterlockingTrain trainData = null;

    // Find any existing train data
    int i;
    for (i = 0; i < m_itTrains.size() and !trainData; ++i)
      if (m_itTrains[i].m_itTrainID.DoesMatch(trainID))
        trainData = m_itTrains[i];

    // Create new train data if none was found
    if (!trainData)
    {
      DebugLog("InterlockingTower.BeginMonitoringTrain> Adding train (" + trainID.GetDebugString() + ")", 4);
      trainData = new InterlockingTrain();
      trainData.m_itTrainID = trainID;
      trainData.m_timeStopped = 0;
      trainData.m_itPaths = new InterlockingTrainPath[0];
      m_itTrains[m_itTrains.size()] = trainData;

      Sniff(trainID, "Train", "StoppedMoving", true);
      Sniff(trainID, "Train", "Cleanup", true);
    }

    return trainData;
  }


  //=============================================================================
  // Name: StopMonitoringTrain
  // Desc: Called to stop monitoring a train and remove it from internal records
  //=============================================================================
  mandatory void StopMonitoringTrain(GameObjectID trainID)
  {
    int ti, pi;
    for (ti = 0; ti < m_itTrains.size(); ++ti)
    {
      if (m_itTrains[ti].m_itTrainID.DoesMatch(trainID))
      {
        for (pi = 0; pi < m_itTrains[ti].m_itPaths.size(); ++pi)
        {
          InterlockingTowerPath path = FindPathByName(m_itTrains[ti].m_itPaths[pi].m_itpPath);
          if (path)
          {
            DebugLog("InterlockingTower.StopMonitoringTrain> Removing train from path (" + trainID.GetDebugString() + ", " + m_itTrains[ti].m_itPaths[pi].m_itpPath + ")", 3);
            path.RemoveTrain(m_itTowerToken, trainID);
            if (!path.IsOccupied())
              path.CancelPath(m_itTowerToken);
          }

          CheckAndClearPathRequeryNavPoint(m_itTrains[ti].m_itPaths[pi].m_itpSignalID);
        }

        DebugLog("InterlockingTower.StopMonitoringTrain> Removing train entry (" + trainID.GetDebugString() + ")", 4);
        m_itTrains[ti, ti + 1] = null;

        Sniff(trainID, "Train", "StoppedMoving", false);
        Sniff(trainID, "Train", "Cleanup", false);
        return;
      }
    }
  }


  //=============================================================================
  // Name: CanActivatePath
  // Desc: Checks path conflicts and returns whether a path can be activated
  //=============================================================================
  public bool CanActivatePath(InterlockingTowerPath path)
  {
    InterlockingTowerPath[] conflicts = path.GetConflictingPaths();
    int i;
    for (i = 0; i < conflicts.size(); ++i)
    {
      if (conflicts[i].GetPathState() == InterlockingTowerPath.ITP_PATH_ACTIVE and !conflicts[i].IsOccupied())
      {
        DebugLog("InterlockingTower.CanActivatePath> Cancelling conflicting path as it is unoccupied: " + conflicts[i].GetPathName(), 2);
        conflicts[i].CancelPath(m_itTowerToken);
      }
      else if (conflicts[i].GetPathState() != InterlockingTowerPath.ITP_PATH_NOT_SET)
      {
        DebugLog("InterlockingTower.CanActivatePath> Delaying path activation as conflicting path is not clear: " + conflicts[i].GetPathDebugString(), 3);
        return false;
      }
    }

    return true;
  }


  //=============================================================================
  // Name: AssignPathToTrain
  // Desc: Requests a specific path for the specified train. This will create a
  //       queue entry for the train if one doesn't already exist, set it's
  //       state to queued and set the path to that requested. The path may not
  //       be prepared immediately, if there are conflicting queued entries.
  //=============================================================================
  public void AssignPathToTrain(Train train, string pathName)
  {
    if (!train)
    {
      // You cannot assign a null train to a path, use CancelPathForTrain instead
      Interface.Exception("InterlockingTower.AssignPathToTrain> Error: Null train passed, path (" + pathName + ") not activated");
      return;
    }

    // Find the path
    InterlockingTowerPath path = FindPathByName(pathName);
    if (!path)
    {
      Interface.Exception("InterlockingTower.AssignPathToTrain> Error: Path '" + pathName + "' not found");
      return;
    }

    GameObjectID entrySignalID = path.GetIndexedPathDefinitionObjectID(0);
    if (!entrySignalID)
    {
      Interface.Exception("InterlockingTower.AssignPathToTrain> Error: Path has no entry signal");
      return;
    }

    InterlockingTrain trainData = BeginMonitoringTrain(train.GetGameObjectID());

    int i;
    InterlockingTrainPath pathData;

    // Attempt to locate an existing path entry for our entry signal
    for (i = 0; i < trainData.m_itPaths.size() and !pathData; ++i)
      if (trainData.m_itPaths[i].m_itpSignalID.DoesMatch(entrySignalID))
        pathData = trainData.m_itPaths[i];

    // If we don't have an existing path entry then create one
    if (!pathData)
    {
      pathData = new InterlockingTrainPath();
      pathData.m_itpSignalID = entrySignalID;
      trainData.m_itPaths[trainData.m_itPaths.size()] = pathData;
    }
    else if (pathData.m_itpStatus == InterlockingTrainPath.STATE_ON_PATH)
    {
      if (pathData.m_itpPath == pathName)
        return;

      InterlockingTowerPath curPath = FindPathByName(pathData.m_itpPath);
      if (!curPath or curPath.IsOccupiedByTrain(train, true))
      {
        Interface.Exception("InterlockingTower.AssignPathToTrain> Error: Train is occupying a conflicting path");
        return;
      }

      DebugLog("InterlockingTower.AssignPathToTrain> Cancelling previous path: " + pathData.m_itpPath, 3);

      // The train's not actually on the path yet, cancel it and queue us for the new one
      curPath.RemoveTrain(m_itTowerToken, train);
      curPath.CancelPath(m_itTowerToken);
    }

    if (pathData.m_itpPath != pathName)
    {
      // Assign the path and set it as queued
      DebugLog("InterlockingTower.AssignPathToTrain> Queueing path (" + train.GetDebugName() + ", " + pathName + ")", 3);
      pathData.m_itpStatus = InterlockingTrainPath.STATE_QUEUED;
      pathData.m_itpPath = pathName;
    }

    // If the path is available attempt to activate it
    if (CanActivatePath(path))
    {
      DebugLog("InterlockingTower.AssignPathToTrain> Attempting path activation (" + train.GetDebugName() + ", " + pathName + ")", 3);
      path.ActivatePath(m_itTowerToken);
    }
  }


  //=============================================================================
  // Name: OnPathActivated
  // Desc: Handler for path activation messages, used to set trains as "on path"
  //=============================================================================
  void OnPathActivated(Message msg)
  {
    InterlockingTowerPath path;

    int i;
    for (i = 0; i < m_itPaths.size() and !path; ++i)
      if (msg.src == m_itPaths[i])
        path = m_itPaths[i];

    if (!path)
      return;

    string pathName = path.GetPathName();

    // Find the train data (if there is any)
    for (i = 0; i < m_itTrains.size(); ++i)
    {
      InterlockingTrain trainData = m_itTrains[i];

      int p;
      for (p = 0; p < trainData.m_itPaths.size(); ++p)
      {
        InterlockingTrainPath pathData = trainData.m_itPaths[p];
        if (pathData.m_itpStatus == InterlockingTrainPath.STATE_QUEUED and pathData.m_itpPath == pathName)
        {
          // Assign this train the path, then return to make sure only one train is assigned
          pathData.m_itpStatus = InterlockingTrainPath.STATE_ON_PATH;
          path.AddTrain(m_itTowerToken, trainData.m_itTrainID);
          return;
        }
      }
    }
  }


  //=============================================================================
  // Name: CancelPathForTrain
  // Desc: Cancels a specific path for the train passed. If the train is not
  //       known, or there is no InterlockingTrainPath entry for this train and
  //       signal, then no action will be taken.
  //=============================================================================
  public void CancelPathForTrain(Train train, string pathName)
  {
    if (!train)
    {
      // Cannot cancel for a null train. Paths start of cancelled/unset, and are
      // then activated for a specific train. They must then be cancelled for that
      // specific train in order to clear path.
      Interface.Exception("InterlockingTower.CancelPathForTrain> Error: Null train passed, path (" + pathName + ") not cancelled");
      return;
    }

    // Find the path
    InterlockingTowerPath path = FindPathByName(pathName);
    if (!path)
    {
      Interface.Exception("InterlockingTower.CancelPathForTrain> Error: Path '" + pathName + "' not found");
      return;
    }

    if (path.IsOccupied())
    {
      DebugLog("InterlockingTower.CancelPathForTrain> Error: Path '" + pathName + "' is occupied, cannot cancel", 1);
      return;
    }

    int i;

    // Find the train data (if there is any)
    InterlockingTrain trainData;
    for (i = 0; i < m_itTrains.size() and !trainData; ++i)
      if (m_itTrains[i].m_itTrainID.DoesMatch(train))
        trainData = m_itTrains[i];

    if (!trainData)
      return;

    // Attempt to locate the path entry
    InterlockingTrainPath pathData;
    for (i = 0; i < trainData.m_itPaths.size() and !pathData; ++i)
      if (trainData.m_itPaths[i].m_itpPath == pathName)
        pathData = trainData.m_itPaths[i];

    if (!pathData)
      return;

    if (pathData.m_itpStatus == InterlockingTrainPath.STATE_ON_PATH)
    {
      path.RemoveTrain(m_itTowerToken, train);
      path.CancelPath(m_itTowerToken);
    }

    pathData.m_itpStatus = InterlockingTrainPath.STATE_PASSING;
    pathData.m_itpPath = "";
  }


  //=============================================================================
  // Name: OnPathCancelled
  // Desc: Handler for path clear messages, used to remove train path entries and
  //       potentially reactivate the path for queued trains
  //=============================================================================
  void OnPathCancelled(Message msg)
  {
    InterlockingTowerPath srcPath = cast<InterlockingTowerPath>(msg.src);
    if (!srcPath)
      return;

    string srcPathName = srcPath.GetPathName();
    string[] queuedPaths = new string[0];
    bool bWantRequeueSamePath = false;

    int ti, pi;
    for (ti = 0; ti < m_itTrains.size(); )
    {
      for (pi = 0; pi < m_itTrains[ti].m_itPaths.size(); )
      {
        if (m_itTrains[ti].m_itPaths[pi].m_itpPath == srcPathName)
        {
          if (m_itTrains[ti].m_itPaths[pi].m_itpStatus == InterlockingTrainPath.STATE_ON_PATH)
          {
            // Train has exited and the path has been cancelled, remove the entry
            srcPath.RemoveTrain(m_itTowerToken, m_itTrains[ti].m_itTrainID);
            m_itTrains[ti].m_itPaths[pi, pi + 1] = null;
            continue;
          }
          else if (m_itTrains[ti].m_itPaths[pi].m_itpStatus == InterlockingTrainPath.STATE_QUEUED)
          {
            // Another train may want to requeue this path but we'll do that at a lower priority
            bWantRequeueSamePath = true;
          }
        }
        else if (m_itTrains[ti].m_itPaths[pi].m_itpStatus == InterlockingTrainPath.STATE_QUEUED)
        {
          // Keep a record of every queued path
          queuedPaths[queuedPaths.size()] = m_itTrains[ti].m_itPaths[pi].m_itpPath;
        }

        ++pi;
      } // for (pi = 0; pi < m_itTrains[ti].m_itPaths.size(); )

      if (m_itTrains[ti].m_itPaths.size() == 0)
      {
        StopMonitoringTrain(m_itTrains[ti].m_itTrainID);
        continue;
      }

      ++ti;
    } // for (ti = 0; ti < m_itTrains.size(); )


    CheckAndClearPathRequeryNavPoint(srcPath.GetIndexedPathDefinitionObjectID(0));


    // Check if it's possible to activate any queued paths
    for (pi = 0; pi < queuedPaths.size(); ++pi)
    {
      InterlockingTowerPath path = FindPathByName(queuedPaths[pi]);
      if (path and path.GetPathState() == InterlockingTowerPath.ITP_PATH_NOT_SET)
      {
        if (CanActivatePath(path))
        {
          DebugLog("InterlockingTower.OnPathCancelled> Attempting path activation (" + queuedPaths[pi] + ")", 4);
          path.ActivatePath(m_itTowerToken);
        }
      }

    } // for (pi = 0; pi < m_itPaths.size(); ++pi)

    if (bWantRequeueSamePath and CanActivatePath(srcPath))
    {
      DebugLog("InterlockingTower.OnPathCancelled> Reactivating path (" + srcPathName + ")", 4);
      srcPath.ActivatePath(m_itTowerToken);
    }
  }


  //=============================================================================
  // Name: SetPanicStateForPath
  // Desc: Sets as specific path to a panic state, dropping all signals
  //=============================================================================
  public void SetPanicStateForPath(string pathName)
  {
    InterlockingTowerPath path = FindPathByName(pathName);
    if (!path)
    {
      Interface.Exception("InterlockingTower.SetPanicStateForPath> Error: Path '" + pathName + "' not found");
      return;
    }

    path.SetPanicState(m_itTowerToken);
  }


  //=============================================================================
  // Name: SetTrainAsPassing
  // Desc: Sets a train's state for a specific entry signal to STATE_PASSING, so
  //       the tower knows the train is not entering the interlocking, and will
  //       ignore it until it leaves the area. If the train is not known, or
  //       there is no InterlockingTrainPath entry for this train and signal,
  //       then no action will be taken.
  //=============================================================================
  public void SetTrainAsPassing(Train train, GameObjectID entrySignalID)
  {
    int i;
    InterlockingTrain trainData = null;

    // Attempt to find the train
    for (i = 0; i < m_itTrains.size() and !trainData; ++i)
    {
      if (m_itTrains[i].m_itTrainID.DoesMatch(train))
        trainData = m_itTrains[i];
    }

    if (!trainData)
      return;

    // Attempt to find the entry signal
    for (i = 0; i < trainData.m_itPaths.size(); ++i)
    {
      if (trainData.m_itPaths[i].m_itpSignalID.DoesMatch(entrySignalID))
      {
        if (trainData.m_itPaths[i].m_itpStatus == InterlockingTrainPath.STATE_ON_PATH)
        {
          InterlockingTowerPath curPath = FindPathByName(trainData.m_itPaths[i].m_itpPath);
          if (curPath and curPath.IsOccupiedByTrain(train, true))
          {
            Interface.Exception("InterlockingTower.SetTrainAsPassing> Error - Train is already on path, cannot change state");
            continue;
          }

          DebugLog("InterlockingTower.SetTrainAsPassing> Cancelling previous path: " + trainData.m_itPaths[i].m_itpPath, 3);
          curPath.RemoveTrain(m_itTowerToken, train);
          curPath.CancelPath(m_itTowerToken);
        }

        DebugLog("InterlockingTower.SetTrainAsPassing> Setting train as passing (" + train.GetDebugName() + ", " + entrySignalID.GetDebugString() + ")", 4);
        trainData.m_itPaths[i].m_itpStatus = InterlockingTrainPath.STATE_PASSING;
        trainData.m_itPaths[i].m_itpPath = "";
      }
    }
  }


  //=============================================================================
  // Name: QueryAutomaticPathAssignment
  // Desc: Queries the tower manager for a path assignment for a train and signal
  //=============================================================================
  thread void QueryAutomaticPathAssignment(GameObjectID trainID, InterlockingTrainPath path)
  {
    Train train = cast<Train>(World.SynchronouslyLoadGameObjectByID(trainID));
    if (!train)
    {
      DebugLog("InterlockingTower.QueryAutomaticPathAssignment> Could not find train (" + trainID.GetDebugString() + ")", 3);
      return;
    }

    int i;
    bool bIsPlayerTrain = train.GetAllowsUserControl();

    // Gather possible path options
    string[] pathOptions = new string[0];
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      if (path.m_itpSignalID.DoesMatch(m_itPaths[i].GetIndexedPathDefinitionObjectID(0)))
      {
        if ((!bIsPlayerTrain and m_itPaths[i].GetCanAutoAssignAI()) or
            (bIsPlayerTrain and m_itPaths[i].GetCanAutoAssignPlayers()))
        {
          pathOptions[pathOptions.size()] = m_itPaths[i].GetPathName();
        }
      }
    }

    if (pathOptions.size())
    {
      GSObject[] objParams = new GSObject[3];
      objParams[0] = me;
      objParams[1] = train;
      objParams[2] = World.GetGameObjectByIDIfLoaded(path.m_itpSignalID);
      objParams[3] = path.m_itpSignalID;

      // We've found new paths associated with this signal, query the manager for entry
      string result = m_itManager.LibraryCall("QueryInterlockingTowerPath", pathOptions, objParams);

      if (result != "true")
      {
        // The tower manager was unable to make or outsource a pathing decision
        SetTrainAsPassing(train, path.m_itpSignalID);
      }
    }
    else
    {
      DebugLog("InterlockingTower.QueryAutomaticPathAssignment> No path options found", 2);
    }
  }


  //=============================================================================
  // Name: QueryAutomaticPathAssignment
  //=============================================================================
  void QueryAutomaticPathAssignment(Train train, InterlockingTrainPath path)
  {
    QueryAutomaticPathAssignment(train.GetGameObjectID(), path);
  }


  //=============================================================================
  // Name: OnTrainApproach
  // Desc: Message handler for the approach of a train to a path entry signal
  //=============================================================================
  void OnTrainApproach(Message msg)
  {
    Train srcTrain = cast<Train>(msg.src);
    Signal dstSignal = cast<Signal>(msg.dst);
    if (!srcTrain or !dstSignal)
      return;

    int i;

    bool bIsEntrySignal = false;
    bool bWantNavPoint = false;

    GameObjectID dstSignalID = dstSignal.GetGameObjectID();

    // Check if this is an entry signal for any path, if it isn't we don't care about it
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      if (dstSignalID.DoesMatch(m_itPaths[i].GetIndexedPathDefinitionObjectID(0)))
      {
        bIsEntrySignal = true;

        // If any form of auto-assignment is possible then create the NavPoint
        if (m_itPaths[i].GetCanAutoAssignAI() or m_itPaths[i].GetCanAutoAssignPlayers())
          bWantNavPoint = true;
      }
    }

    if (!bIsEntrySignal)
      return;

    // Find/create the data for this train
    InterlockingTrain trainData = BeginMonitoringTrain(srcTrain.GetGameObjectID());

    // If we already have an entry for this signal then there's no more processing needed
    for (i = 0; i < trainData.m_itPaths.size(); ++i)
    {
      if (trainData.m_itPaths[i].m_itpSignalID.DoesMatch(dstSignal))
        return;
    }

    // Add a new path entry
    InterlockingTrainPath pathData = new InterlockingTrainPath();
    pathData.m_itpSignalID = dstSignal.GetGameObjectID();
    pathData.m_itpStatus = InterlockingTrainPath.STATE_APPROACH;
    trainData.m_itPaths[trainData.m_itPaths.size()] = pathData;

    DebugLog("InterlockingTower.OnTrainApproach> Added path data for signal (" + srcTrain.GetDebugName() + ", " + dstSignal.GetDebugName() + ")", 4);

    QueryAutomaticPathAssignment(srcTrain, pathData);

    if (bWantNavPoint)
      CreatePathRequeryNavPoint(dstSignal);
  }


  //=============================================================================
  // Name: OnTrainLeave
  // Desc: Message handler for the departure of a train from a path signal
  //=============================================================================
  void OnTrainLeave(Message msg)
  {
    Train srcTrain = cast<Train>(msg.src);
    Signal dstSignal = cast<Signal>(msg.dst);
    if (!srcTrain or !dstSignal)
      return;

    // We should already know about this train, look it up
    InterlockingTrain trainData = null;

    int ti;
    for (ti = 0; ti < m_itTrains.size() and !trainData; ++ti)
    {
      if (m_itTrains[ti].m_itTrainID.DoesMatch(srcTrain))
        trainData = m_itTrains[ti];
    }

    if (!trainData)
      return;

    GameObjectID dstSignalID = dstSignal.GetGameObjectID();

    // See if the message destination is recorded as an entry signal
    int pi;
    for (pi = 0; pi < trainData.m_itPaths.size(); ++pi)
    {
      if (trainData.m_itPaths[pi].m_itpSignalID.DoesMatch(dstSignalID))
      {
        InterlockingTowerPath path = FindPathByName(trainData.m_itPaths[pi].m_itpPath);
        if (trainData.m_itPaths[pi].m_itpStatus == InterlockingTrainPath.STATE_ON_PATH)
        {
          // Train is set as on path, leave it assigned
          DebugLog("InterlockingTower.OnTrainLeave> Train is on path, leaving it assigned (" + srcTrain.GetDebugName() + ", " + dstSignalID.GetDebugString() + ")", 4);
        }
        else
        {
          // Train was approaching, passing by or was queued but has now left, we can remove it
          DebugLog("InterlockingTower.OnTrainLeave> Removing train path entry (" + srcTrain.GetDebugName() + ", " + dstSignalID.GetDebugString() + ")", 3);
          if (path)
          {
            DebugLog("InterlockingTower.OnTrainLeave> Cancelling path for leaving train (" + srcTrain.GetDebugName() + ", " + path.GetPathName() + ")", 3);
            path.RemoveTrain(m_itTowerToken, trainData.m_itTrainID);
            path.CancelPath(m_itTowerToken);
          }
          trainData.m_itPaths[pi, pi + 1] = null;
        }

        CheckAndClearPathRequeryNavPoint(dstSignalID);

        if (trainData.m_itPaths.size() == 0)
          StopMonitoringTrain(trainData.m_itTrainID);

        return;
      }
    }
  }


  //=============================================================================
  // Name: CancelUnoccupiedPathsForTrain
  // Desc: Searches any active InterlockingTrain for any paths this train has
  //       been assigned to but has not yet driven onto, and cancels them
  // Parm: trainData - The train data to check for paths on
  // Parm: newPathStatus - The status to set any found active and unoccupied
  //       paths, or -1 to leave the status unchanged
  //=============================================================================
  void CancelUnoccupiedPathsForTrain(InterlockingTrain trainData, int newPathStatus)
  {
    int i;
    for (i = 0; i < trainData.m_itPaths.size(); ++i)
    {
      // We only care about active paths here
      if (trainData.m_itPaths[i].m_itpStatus != InterlockingTrainPath.STATE_ON_PATH)
        continue;

      InterlockingTowerPath path = FindPathByName(trainData.m_itPaths[i].m_itpPath);
      if (!path.IsOccupiedByTrain(trainData.m_itTrainID, true))
      {
        DebugLog("InterlockingTower.CancelUnoccupiedPathsForTrain> Cancelling " + trainData.m_itPaths[i].m_itpPath, 2);
        path.RemoveTrain(m_itTowerToken, trainData.m_itTrainID);
        path.CancelPath(m_itTowerToken);

        if (newPathStatus != -1 and trainData.m_itPaths[i].m_itpStatus != newPathStatus)
        {
          DebugLog("InterlockingTower.CancelUnoccupiedPathsForTrain> Altering path status to " + newPathStatus, 2);
          trainData.m_itPaths[i].m_itpStatus = newPathStatus;
          if (newPathStatus != InterlockingTrainPath.STATE_QUEUED and newPathStatus != InterlockingTrainPath.STATE_ON_PATH)
            trainData.m_itPaths[i].m_itpPath = "";
        }
      }
    }
  }


  //=============================================================================
  // Name: OnTrainScheduleBlocked
  // Desc: Message handler for train schedule blocked messages
  //=============================================================================
  void OnTrainScheduleBlocked(Message msg)
  {
    Train srcTrain = cast<Train>(msg.src);
    if (!srcTrain)
      return;

    DebugLog("InterlockingTower.OnTrainScheduleBlocked> " + srcTrain.GetTrainDisplayName(), 2);
    int i;

    // Look up the train data
    InterlockingTrain trainData = null;
    for (i = 0; i < m_itTrains.size() and !trainData; ++i)
    {
      if (m_itTrains[i].m_itTrainID.DoesMatch(srcTrain))
        trainData = m_itTrains[i];
    }

    if (!trainData)
    {
      DebugLog("InterlockingTower.OnTrainScheduleBlocked> Unknown train, ignoring (" + srcTrain.GetTrainDisplayName() + ")", 2);
      return;
    }

    // Cancel any paths this train isn't occupying yet, in case there's a conflict.
    // Note that we DO NOT clear the assignment here. We want to cancel the path
    // to attempt to clear any conflicts but this path may have been assigned
    // by a session rule or a player and we don't want to undo that decision.
    // Instead, keep the path set but set the status back to queued.
    CancelUnoccupiedPathsForTrain(trainData, InterlockingTrainPath.STATE_QUEUED);

    // Also check for any stopped trains which have paths set, and do the same
    // thing. This may allow us to reassign their paths to the stuck train.
    for (i = 0; i < m_itTrains.size(); ++i)
    {
      if (m_itTrains[i].m_itTrainID.DoesMatch(srcTrain))
        continue;

      Train train = cast<Train>(World.GetGameObjectByIDIfLoaded(m_itTrains[i].m_itTrainID));
      if (!train)
        continue;

      if (train.IsStopped() and World.GetTimeElapsed() - m_itTrains[i].m_timeStopped > 30.f)
      {
        // Train has been stopped for more than 30 seconds, maybe it doesn't need that path right now
        DebugLog("InterlockingTower.OnTrainScheduleBlocked> Cancelling path for stopped train: " + train.GetDebugName(), 2);
        CancelUnoccupiedPathsForTrain(m_itTrains[i], InterlockingTrainPath.STATE_QUEUED);
      }
    }

    // Recheck all entry signals to see if the train can pick a better path
    for (i = 0; i < trainData.m_itPaths.size(); ++i)
      QueryAutomaticPathAssignment(srcTrain, trainData.m_itPaths[i]);
  }


  //=============================================================================
  // Name: OnTrainStoppedMoving
  // Desc: Message handler for train stopped moving messages
  //=============================================================================
  void OnTrainStoppedMoving(Message msg)
  {
    Train srcTrain = cast<Train>(msg.src);
    if (!srcTrain)
      return;

    // Record the time this train stopped, for conflict/block resolution later
    int i;
    for (i = 0; i < m_itTrains.size(); ++i)
    {
      if (m_itTrains[i].m_itTrainID.DoesMatch(srcTrain))
        m_itTrains[i].m_timeStopped = World.GetTimeElapsed();
    }

    Vehicle frontVehicle = srcTrain.GetVehicles()[0];
    GSTrackSearch sigSearch = frontVehicle.BeginTrackSearch(frontVehicle.GetDirectionRelativeToTrain());

    // If a train stops within 50m of a red signal owned by us, treat it as a
    // blocked condition and attempt to automatically resolve it
    MapObject nextObj;
    while (nextObj = sigSearch.SearchNext())
    {
      Signal signal = cast<Signal>(nextObj);
      if (signal and signal.GetSignalState() == Signal.RED and signal.GetSignalOwner() == me)
      {
        OnTrainScheduleBlocked(msg);
        return;
      }

      if (sigSearch.GetDistance() > 50)
        return;
    }
  }


  //=============================================================================
  // Name: OnTrainCleanup
  // Desc: Train cleanup message handler, removes all train references
  //=============================================================================
  void OnTrainCleanup(Message msg)
  {
    Train srcTrain = cast<Train>(msg.src);
    if (!srcTrain)
      return;

    StopMonitoringTrain(srcTrain.GetGameObjectID());
  }


  //=============================================================================
  // Name: OnNavPointClicked
  // Desc: Message handler for when a player clicks on a nav point
  //=============================================================================
  void OnNavPointClicked(Message msg)
  {
    // Test the name to see if it's one of our nav points
    string towerIDString = GetGameObjectID().SerialiseToString();
    if (!Str.Find(msg.minor, towerIDString, 0) == 0)
      return;

    // Make extra sure it's the correct set by checking the suffix too (note
    // that the "-0" is added by native to indicate the 0 indexed nav point)
    if (!Str.Find(msg.minor, "-Auto-NavPoints-0", 0) == msg.minor.size() - 17)
      return;

    // Extract the signal ID string from the nav point set name
    string signalIDString = msg.minor;
    Str.Mid(signalIDString, towerIDString.size() + 1, signalIDString.size() - towerIDString.size() - 18);

    // Convert the string back into a GameObjectID
    GameObjectID signalID = Router.SerialiseGameObjectIDFromString(signalIDString);

    int npi;
    for (npi = 0; npi < m_itNavPointIDs.size(); ++npi)
    {
      if (m_itNavPointIDs[npi].DoesMatch(signalID))
      {
        // It's one of our nav point sets, search for nearby trains to requery
        int ti, pi;
        for (ti = 0; ti < m_itTrains.size(); ++ti)
        {
          for (pi = 0; pi < m_itTrains[ti].m_itPaths.size(); ++pi)
          {
            if (m_itTrains[ti].m_itPaths[pi].m_itpSignalID.DoesMatch(m_itNavPointIDs[npi]))
              QueryAutomaticPathAssignment(m_itTrains[ti].m_itTrainID, m_itTrains[ti].m_itPaths[pi]);
          }
        }

        return;
      }
    }
  }


  //=============================================================================
  // Name: WaitForObjectOwnershipAndNotifyInitialised
  // Desc: Helper thread used by OnModuleInit to wait for all paths to fully
  //       initialise before we post the tower initialisation message.
  //=============================================================================
  thread void WaitForPathObjectOwnershipAndNotifyInitialised()
  {
    int i;
    for (i = 0; i < m_itPaths.size(); ++i)
    {
      if (!m_itPaths[i].HasTakenOwnershipOfObjects())
      {
        // This path is still initialising, wait for it
        Sniff(m_itPaths[i], "InterlockingTowerPath", "ObjectOwnershipChanged", true);

        Message msg;
        wait ()
        {
          on "InterlockingTowerPath", "ObjectOwnershipChanged", msg:
          if (msg.src == m_itPaths[i] and m_itPaths[i].HasTakenOwnershipOfObjects())
            break;

          continue;
        }
      }

      Sniff(m_itPaths[i], "InterlockingTowerPath", "ObjectOwnershipChanged", false);
    }

    m_itIsInitialised = true;

    DebugLog("InterlockingTower.OnModuleInit> '" + GetDebugName() + "' initialised, notifying observers", 3);
    PostMessage(me, "InterlockingTower", "Initialised", 0.f);
  }


  //=============================================================================
  // Name: OnModuleInit
  // Desc: Module init message handler, used to configure path object ownership
  //=============================================================================
  mandatory void OnModuleInit(Message msg)
  {
    SetPathObjectsOwned(World.GetCurrentModule() == World.DRIVER_MODULE);

    if (World.GetCurrentModule() == World.DRIVER_MODULE)
    {
      // Cache the conflicting paths as soon as we can. Note that this is not
      // immediate. It instead uses a 'thread' to try and avoid script timeouts.
      // Any call to GetConflictingPaths before this completes will cause an
      // immediate 'main thread' rebuild but this case should be rare.
      PrebuildConflictingPathCache();

      WaitForPathObjectOwnershipAndNotifyInitialised();
    }
  }


  //=============================================================================
  // Name: UpdateLegacyNamedNavPointSets
  // Desc: Called following the load of legacy data in order to recreate any path
  //       requery nav point sets to use the non-obsolete naming format.
  //=============================================================================
  thread void UpdateLegacyNamedNavPointSets(int dataVersion)
  {
    if (World.GetCurrentModule() == World.NO_MODULE)
    {
      // Wait for the interface module to load
      wait()
      {
        on "World", "ModuleInit":
          break;
      }
    }

    // Nav points can only be used in Driver, bail if we loaded something else
    if (World.GetCurrentModule() != World.DRIVER_MODULE)
    {
      Interface.Exception("InterlockingTower.UpdateLegacyNamedNavPointSets> Not in Driver, cannot continue");
      return;
    }

    int i;
    for (i = 0; i < m_itNavPoints.size(); ++i)
    {
      // Clear the legacy named nav point set
      string legacyNavPointSetName = GetName() + "-" + m_itNavPoints[i] + "-Auto-NavPoints";
      NavPoints.ClearNavigationPointSet(legacyNavPointSetName);

      // If we found an ID then the signal is loaded, and we can recreate the nav point set
      if (m_itNavPointIDs[i])
        CreatePathRequeryNavPoint(World.GetGameObjectByIDIfLoaded(m_itNavPointIDs[i]), true);
    }
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Generates and returns a Soup defining this towers internal state
  //=============================================================================
  public mandatory Soup GetProperties()
  {
    Soup parentProperties = Constructors.NewSoup();

    int i;
    Soup properties = Constructors.NewSoup();

    properties.SetNamedTag("data-version", IT_CURRENT_PROPERTIES_VERSION);

    properties.SetNamedTag("ai-state", m_itAiState);

    Soup paths = Constructors.NewSoup();
    for (i = 0; i < m_itPaths.size(); ++i)
      paths.AddUniqueNamedSoup(m_itPaths[i].GetProperties(m_itTowerToken));
    properties.SetNamedSoup("paths", paths);

    Soup trains = Constructors.NewSoup();
    for (i = 0; i < m_itTrains.size(); ++i)
      trains.AddUniqueNamedSoup(m_itTrains[i].GetProperties());
    properties.SetNamedSoup("trains", trains);

    Soup navPoints = Constructors.NewSoup();
    for (i = 0; i < m_itNavPoints.size(); ++i)
      navPoints.SetNamedTag(i, m_itNavPoints[i]);
    properties.SetNamedSoup("nav-points", navPoints);

    Soup navPointIDs = Constructors.NewSoup();
    for (i = 0; i < m_itNavPointIDs.size(); ++i)
      navPointIDs.SetNamedTag(i, m_itNavPointIDs[i]);
    properties.SetNamedSoup("nav-point-ids", navPointIDs);

    // Avoid potential name conflicts with 3rd party scripts by saving all the
    // default internal properties in a sub-soup
    parentProperties.SetNamedSoup("default-properties", properties);

    return parentProperties;
  }


  //=============================================================================
  obsolete GameObjectID LegacyGetGameObjectIDFromName(string name)
  {
    TrainzGameObject obj = cast<TrainzGameObject>(Router.GetGameObject(name));
    if (obj)
      return obj.GetGameObjectID();

    return null;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Sets this towers internal state using the Soup passed
  //=============================================================================
  public mandatory void SetProperties(Soup parentProperties)
  {
    // Release ownership of current path objects before we clear the path
    SetPathObjectsOwned(false);

    while (m_itTrains.size() != 0)
      StopMonitoringTrain(m_itTrains[0].m_itTrainID);


    int i;
    Soup properties = parentProperties.GetNamedSoup("default-properties");

    int dataVersion = properties.GetNamedTagAsInt("data-version", 0);

    m_itAiState = properties.GetNamedTagAsInt("ai-state", m_itAiState);

    Soup paths = properties.GetNamedSoup("paths");
    m_itPaths = new InterlockingTowerPath[paths.CountTags()];
    for (i = 0; i < paths.CountTags(); ++i)
    {
      m_itPaths[i] = CreateNewPath();
      m_itPaths[i].SetProperties(m_itTowerToken, paths.GetNamedSoup(paths.GetIndexedTagName(i)));
    }

    Soup trains = properties.GetNamedSoup("trains");
    m_itTrains = new InterlockingTrain[trains.CountTags()];
    for (i = 0; i < trains.CountTags(); ++i)
    {
      m_itTrains[i] = new InterlockingTrain();
      m_itTrains[i].SetProperties(trains.GetNamedSoup(trains.GetIndexedTagName(i)));

      Sniff(m_itTrains[i].m_itTrainID, "Train", "Cleanup", true);
      Sniff(m_itTrains[i].m_itTrainID, "Schedule", "Abort", true);
    }

    Soup navPoints = properties.GetNamedSoup("nav-points");
    for (i = 0; i < navPoints.CountTags(); ++i)
      m_itNavPoints[i] = navPoints.GetNamedTag(navPoints.GetIndexedTagName(i));

    Soup navPointIDs = properties.GetNamedSoup("nav-point-ids");
    for (i = 0; i < navPointIDs.CountTags(); ++i)
      m_itNavPointIDs[i] = navPointIDs.GetNamedTagAsGameObjectID(navPointIDs.GetIndexedTagName(i));

    if (m_itNavPointIDs.size() == 0)
    {
      // Attempt to generate GameObjectIDs from legacy save data
      for (i = 0; i < m_itNavPoints.size(); ++i)
        m_itNavPointIDs[i] = LegacyGetGameObjectIDFromName(m_itNavPoints[i]);
    }

    // Auto-update any legacy named nav point sets
    if (dataVersion == 0 and m_itNavPoints.size() > 0)
      UpdateLegacyNamedNavPointSets(dataVersion);

    // Perform any necessary post-load init
    OnModuleInit(null);
  }


  // Obsolete functions which may be used by a small number of old scripts. Do not add code which calls
  // these functions. Any code which does call them may not work as expected and should be updated if possible.
  mandatory obsolete InterlockingTrain BeginMonitoringTrain(Train train) { return BeginMonitoringTrain(train.GetGameObjectID()); }
  mandatory obsolete void StopMonitoringTrain(Train train) { StopMonitoringTrain(train.GetGameObjectID()); }


  // Public function declarations to give property access to InterlockingTowerEditHelper.
  // Override these if you need to add player configurable options to a custom tower script.
  public string GetPropertyName(string pId) { return inherited(pId); }
  public string GetPropertyDescription(string pId) { return inherited(pId); }
  public string GetPropertyType(string pId) { return inherited(pId); }
  public string GetPropertyValue(string pId) { return inherited(pId); }
  public string[] GetPropertyElementList(string pId) { return inherited(pId); }
  public void SetPropertyValue(string pId, string value) { inherited(pId, value); }
  public void SetPropertyValue(string pId, float value) { inherited(pId, value); }
  public void SetPropertyValue(string pId, int value) { inherited(pId, value); }
  public void SetPropertyValue(string pId, string value, int index) { inherited(pId, value, index); }
  public void LinkPropertyValue(string pId) { inherited(pId); }

};
