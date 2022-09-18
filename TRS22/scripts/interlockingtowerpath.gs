//=============================================================================
// File: InterlockingTowerPath.gs
// Desc: Defines the script class used to represent a path/interlocking within
//       an Interlocking Tower, along with a few small helper structs
//=============================================================================
include "InterlockingTower.gs"
include "Signal.gs"
include "Junction.gs"
include "Crossing.gs"
include "TrackCircuitBlock.gs"
include "TrackPathDisplay.gs"


//=============================================================================
// Name: InterlockingObject
// Desc: Small helper class used by InterlockingTowerPath to define the state
//       of a controlled object relevant to this path. This may be extended by
//       custom tower scripts, but care should be taken when reusing existing
//       variables, as their usage may be extended in future versions.
//=============================================================================
class InterlockingObject
{
  public GameObjectID m_objectID;         // The ID of the object
  public string       m_objectName;       // A cached localised display name for the object
  public MapObject    m_object;           // The tower controlled object (may be null)
  public int          m_childIndex = -1;  // Index to a child object (e.g. attached junction)
  public int          m_state = -1;       // The state to set this object to when the
                                          // path is activated (type dependent)
  public int          m_rtnState = -1;    // The state to return the object to when the
                                          // path is cleared/cancelled. Set when the path
                                          // is activated, unless returning from panic

  public GameObjectID GetObjectID() { return m_objectID; }
  public obsolete string GetObjectName() { return m_objectName; }

  public string GetObjectDisplayName()
  {
    // Make sure the cached name is up to date, then return it
    if (m_object)
    {
      if (!Router.DoesGameObjectStillExist(m_object))
        m_object = null;
      else
        m_objectName = m_object.GetLocalisedName();
    }

    return m_objectName;
  }

  public MapObject GetMapObject(GameObject callingThread)
  {
    if (callingThread and callingThread != Router.GetCurrentThreadGameObject())
    {
      // We don't actually need/use the calling thread parameter, but an invalid
      // value is likely to indicate flaws in the calling code.
      Interface.Exception("InterlockingObject.GetMapObject> Invalid calling thread specified");
      return null;
    }

    if (!m_object and callingThread)
      m_object = cast<MapObject>(World.SynchronouslyLoadGameObjectByID(m_objectID));
    else if (!m_object)
      m_object = cast<MapObject>(World.GetGameObjectByIDIfLoaded(m_objectID));

    return m_object;
  }

  public mandatory InterlockingObject GetCopy()
  {
    // Create and return a copy of this object
    InterlockingObject rtn = new InterlockingObject();
    rtn.m_objectID = m_objectID;
    rtn.m_objectName = m_objectName;
    rtn.m_object = m_object;
    rtn.m_childIndex = m_childIndex;
    rtn.m_state = m_state;
    rtn.m_rtnState = m_rtnState;

    return rtn;
  }

  public bool DoesMatchObject(InterlockingObject other)
  {
    // Return whether 'other' references the same object as this.
    if (!other)
      return false;
    if (!m_objectID)
      return other.m_objectID == null;
    if (!m_objectID.DoesMatch(other.m_objectID))
      return false;
    if (m_childIndex != other.m_childIndex)
      return false;

    return true;
  }

  public string GetObjectDebugString()
  {
    string debugStr;
    if (m_objectID)
      debugStr = m_objectID.GetDebugString() + ", " + m_objectName + ", " + m_childIndex + ", " + m_state;
    else
      debugStr = "null, " + m_objectName + ", " + m_childIndex + ", " + m_state;
    if (m_object)
      return debugStr + ", loaded";
    return debugStr + ", not loaded";
  }

};


//=============================================================================
// Name: InterlockingPathTrain
// Desc: Smaller helper class to hold data about a train on this path
//=============================================================================
class InterlockingPathTrain
{
  public GameObjectID   m_trainID;
  public obsolete Train m_train;
  public bool           m_bIsCurrentlyOnPath = false;
};


//=============================================================================
// Name: InterlockingTowerPath
// Desc: Used to define a 'path' for an Interlocking Tower game object. A path
//       in this context is an section of track bound by two signals, including
//       any number of junctions, level crossings, and intermediate signals.
//       Paths may also include 'external' object references which are not
//       directly on the track within the path. This is used to protect diamond
//       crossings, etc.
//
// NOTE: Builtin variable names are prefixed with the reserved namespace "itp".
//       If you create are extending this script do NOT use this namespace, as
//       it may cause future code additions to break your tower script.
//
// NOTE: A number of functions on this class and InterlockingTower take a
//       callingThread parameter which is used to perform blocking object loads
//       if provided. A null value may be passed to any of these functions but
//       in doing so the function may fail or return an incomplete result set.
//       If the value is passed the function *must* be called from a script 
//       thread and the value *must* be the object on which that thread is 
//       running (most likely the InterlockingTower). Failure to follow these
//       rules will result in script exceptions or infinite function stalls.
//
//=============================================================================
class InterlockingTowerPath isclass GameObject
{

  InterlockingTower     m_itpParentTower;         // The tower that created this path
  SecurityToken         m_itpOwnerToken;          // A security token from the owning tower,
                                                  // used for caller authentication on functions
  string                m_itpPathName;            // The identifying name of this path
  string                m_itpPathNameLoc;         // A localised version of the path name
  bool                  m_itpHasCustomName;       // A flag to indicate the path has a custom name
  string                m_itpSignalStateReason;   // A localised string for signal state 'reason'
  string                m_itpSignalStateReasonPanic; // Signal state reason for when the path is in 'panic'
  int                   m_itpPathState;           // ITP_PATH_* define relevant to the paths state
  InterlockingObject[]  m_itpPathDefinition;      // Ordered array of objects that define the path
  InterlockingObject[]  m_itpExternalRequirements;// Array of controlled objects not on the path
  float                 m_itpTransitionTime;      // Seconds it takes to set/cancel the path
  float                 m_itpPathTransitionTimer; // The time that we can complete path transition
  int                   m_itpPathTransitionStage; // The current 'stage' of the transition
  bool                  m_itpAutoAssignAI;        // Whether we can auto-assign AI to this path
  bool                  m_itpAutoAssignPlrs;      // Whether we can auto-assign players this path
  int                   m_itpClearMethod;         // Defines when path objects will be returned
                                                  // to their original state, see CLEAR_*
  InterlockingTowerPath[] m_itpConflictingPaths;  // Cached set of conflicting paths
  InterlockingPathTrain[] m_itpTrains;            // Set of trains that have been added to this path
  TrackPathDisplay[]    m_itpVisualisations;      // A set of active path displays
  bool                  m_itpWantObjectOwnership; // Flag set by the owning tower
  bool                  m_itpHasPathRtnState;     // Whether we've recorded m_rtnState on each object


  // Possible path states. If any custom states are required when deriving
  // this class, assign them values above ITP_PATH_CUSTOM_BEGIN.
  public define int ITP_PATH_NOT_SET        = 0;  // Path is not set
  public define int ITP_PATH_ACTIVATING     = 1;  // Path is being set
  public define int ITP_PATH_ACTIVE         = 2;  // Path is set
  public define int ITP_PATH_CANCELLING     = 3;  // Path is being cancelled
  public define int ITP_PATH_PANIC          = 4;  // Path is in an emergency lockdown

  // Custom state marker, values less than this are reserved for future extension
  public define int ITP_PATH_CUSTOM_BEGIN   = 100;

  // Possible path clearing methods, do not extend these defines
  public define int ITP_CLEAR_NONE          = 0;  // No automatic clearing
  public define int ITP_CLEAR_ON_CANCEL     = 1;  // Clear path on cancel/finish (default)
  public define int ITP_CLEAR_ON_DRIVE      = 2;  // Clear path as it's driven


  public mandatory void Init(InterlockingTower tower, SecurityToken token);

  public InterlockingTower GetOwningTower() { return m_itpParentTower; }

  public void SetWantObjectOwnership(SecurityToken token);
  public thread void SetObjectsOwned(SecurityToken token, bool bTakeOwnership);
  public bool HasTakenOwnershipOfObjects() { return m_itpHasPathRtnState; }

  public legacy_compatibility void SetPathName(string pathName);
  public string GetPathName() { return m_itpPathName; }
  public string GetLocalisedPathName() { return m_itpPathNameLoc; }
  public string GetPathDebugString();
  public bool HasCustomName() { return m_itpHasCustomName; }
  public void SetHasCustomName(bool customName) { m_itpHasCustomName = customName; }

  InterlockingObject[] CopyPathDefinition(InterlockingObject[] path);

  public int GetPathDefinitionObjectCount() { return m_itpPathDefinition.size(); }
  public GameObjectID GetIndexedPathDefinitionObjectID(int index);
  public MapObject GetIndexedPathDefinitionMapObject(GameObject callingThread, int index);
  public string GetIndexedPathDefinitionObjectDisplayName(int index);
  public int GetIndexedPathDefinitionChildIndex(int index, int failureCode);
  public int GetIndexedPathDefinitionState(int index, int failureCode);
  public InterlockingObject[] GetPathDefinitionCopy() { return CopyPathDefinition(m_itpPathDefinition); }
  public void SetPathDefinition(InterlockingObject[] path);

  public int GetExternalRequirementsCount() { return m_itpExternalRequirements.size(); }
  public GameObjectID GetIndexedExternalRequirementObjectID(int index);
  public MapObject GetIndexedExternalRequirementMapObject(GameObject callingThread, int index);
  public string GetIndexedExternalRequirementDisplayName(int index);
  public int GetIndexedExternalRequirementState(int index, int failureCode);
  public InterlockingObject[] GetExternalRequirementsCopy() { return CopyPathDefinition(m_itpExternalRequirements); }
  public void SetExternalRequirements(InterlockingObject[] req);
  public void AddExternalRequirement(MapObject obj, int childIndex, int state);

  public bool IsObjectInPathDefinition(MapObject obj, int childIndex, bool bIncludeExternalRequirements);
  public float IsObjectOnPath(GameObject callingThread, MapObject obj);
  public float IsObjectOnOrBeyondPath(GameObject callingThread, MapObject obj);

  public Signal GetPathEntrySignal(GameObject callingThread);
  public Signal GetPathExitSignal(GameObject callingThread);

  public float GetPathTransitionTime() { return m_itpTransitionTime; }
  public void SetPathTransitionTime(float seconds) { m_itpTransitionTime = seconds; }

  public bool GetCanAutoAssignAI() { return m_itpAutoAssignAI; }
  public void SetCanAutoAssignAI(bool autoAssign) { m_itpAutoAssignAI = autoAssign; }
  public bool GetCanAutoAssignPlayers() { return m_itpAutoAssignPlrs; }
  public void SetCanAutoAssignPlayers(bool autoAssign) { m_itpAutoAssignPlrs = autoAssign; }

  public int GetPathClearMethod() { return m_itpClearMethod; }
  public void SetPathClearMethod(int clearMethod);

  bool SetObjectStateForActivation(GameObject callingThread, InterlockingObject obj);
  bool SetObjectStateForCancellation(GameObject callingThread, InterlockingObject obj);

  public void ActivatePath(SecurityToken token);
  public void CancelPath(SecurityToken token);
  public void SetPanicState(SecurityToken token);
  public int GetPathState() { return m_itpPathState; }
  public bool IsPanicState() { return m_itpPathState == ITP_PATH_PANIC; }

  public void AddTrain(SecurityToken token, GameObjectID trainID);
  public void AddTrain(SecurityToken token, Train train) { if (train) AddTrain(token, train.GetGameObjectID()); }
  public void RemoveTrain(SecurityToken token, GameObjectID trainID);
  public void RemoveTrain(SecurityToken token, Train train) { if (train) RemoveTrain(token, train.GetGameObjectID()); }
  public bool IsOccupiedByTrain(GameObjectID trainID, bool bRequireHasClearedEntrySignal);
  public bool IsOccupiedByTrain(GameObjectID trainID) { return IsOccupiedByTrain(trainID, false); }
  public bool IsOccupiedByTrain(Train train, bool bRequireHasClearedEntrySignal);
  public bool IsOccupiedByTrain(Train train) { return IsOccupiedByTrain(train, false); }
  public bool IsOccupied(bool bRequireHasClearedEntrySignal);
  public bool IsOccupied() { return IsOccupied(false); }

  public InterlockingTowerPath[] GetConflictingPaths();
  public bool HasConflictingPathsCached() { return m_itpConflictingPaths != null; }
  public void RebuildConflictingPathCache();
  public void ClearConflictingPathCache(bool bPropagateToTower);

  public TrackCircuitBlock[] ListOccupiedTrackCircuitBlocks(GameObject callingThread, bool bIncludeExternalRequirements);
  public void EnablePathVisualisation(bool enable, bool bShouldIncludeAllTCBs);
  public void EnablePathVisualisation(bool enable);

  public mandatory Soup GetProperties(SecurityToken token);
  public legacy_compatibility mandatory void SetProperties(SecurityToken token, Soup properties);



  //=============================================================================
  // Name: Init
  // Desc: Initialises the path with the params defined, if possible. Will throw
  //       an exception and return false if the request is invalid.
  // Parm: tower - The calling tower
  // Parm: token - A SecurityToken from the owning InterlockingTower, with
  //       sufficient rights to activate the path.
  //=============================================================================
  public mandatory void Init(InterlockingTower tower, SecurityToken token)
  {
    if (m_itpParentTower or m_itpOwnerToken)
    {
      Interface.Exception("InterlockingTowerPath.Init> Already initialised");
      return;
    }

    m_itpParentTower = tower;
    m_itpOwnerToken = token;

    m_itpHasCustomName = false;

    StringTable coreStrings = Constructors.GetTrainzAsset().GetStringTableCached();
    m_itpSignalStateReason = coreStrings.GetString1("interlocking_tower_sig_reason", tower.GetLocalisedName());
    m_itpSignalStateReasonPanic = coreStrings.GetString1("interlocking_tower_sig_reason_panic", tower.GetLocalisedName());

    m_itpPathDefinition = new InterlockingObject[0];
    m_itpExternalRequirements = new InterlockingObject[0];

    m_itpPathState = ITP_PATH_NOT_SET;
    m_itpTransitionTime = 5.f;
    m_itpPathTransitionTimer = 0;
    m_itpPathTransitionStage = 0;
    m_itpAutoAssignAI = true;
    m_itpAutoAssignPlrs = true;
    m_itpClearMethod = ITP_CLEAR_ON_CANCEL;

    m_itpConflictingPaths = null;

    m_itpTrains = new InterlockingPathTrain[0];
    m_itpVisualisations = new TrackPathDisplay[0];

    m_itpWantObjectOwnership = false;
    m_itpHasPathRtnState = false;

    if (m_itpOwnerToken)
    {
      AddHandler(me, "InterlockingTowerPath", "UpdatePathState", "UpdatePathState");
      AddHandler(me, "Object", "Leave", "UpdatePathState");
      AddHandler(me, "Train", "LeaveTrack", "UpdatePathState");
      AddHandler(me, "Train", "Entered signal", "UpdatePathState");
      AddHandler(me, "Signal", "Train Leaving", "UpdatePathState");

      AddHandler(me, "Vehicle", "Decoupled", "OnVehicleDecoupled");
    }
  }


  //=============================================================================
  // Name: DebugLog
  // Desc: Internal function for printing debug logs, and easily enabling,
  //       disabling or tweaking the amount of debug logging necessary
  // Parm: logMsg - The message to log
  // Parm: warningLevel - The warning level of this log (should be > 0)
  //=============================================================================
  void DebugLog(string logMsg, int warningLevel)
  {
    if (m_itpParentTower)
      m_itpParentTower.DebugLog(logMsg, warningLevel);
    else if (warningLevel <= 2)
      Interface.Log(logMsg);
  }


  //=============================================================================
  // Name: SetWantObjectOwnership
  // Desc: Called by the owning tower to flag this path as wanting ownership of
  //       its objects. This should only ever be called on real tower paths, not
  //       edit helpers or similar.
  //=============================================================================
  public void SetWantObjectOwnership(SecurityToken token)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.SetWantObjectOwnership> Unauthorised source");
      return;
    }

    m_itpWantObjectOwnership = true;
  }


  //=============================================================================
  // Name: SetObjectOwned
  // Desc: Internal function used to claim/release ownership of the object passed
  //=============================================================================
  void SetObjectOwned(InterlockingObject obj, bool bTakeOwnership)
  {
    MapObject mapObject = obj.GetMapObject(me);
    if (!mapObject)
    {
      DebugLog("InterlockingTowerPath.SetObjectOwned> Object not found, cannot take ownership", 1);
      return;
    }

    // Signal objects
    Signal signal = cast<Signal>(mapObject);
    if (signal)
    {
      if (bTakeOwnership)
      {
        if (signal.GetSignalOwner() != m_itpParentTower)
        {
          signal.SetSignalOwner(m_itpOwnerToken, m_itpParentTower);
          if (signal.IsSignalStateAutomatic())
            obj.m_rtnState = Signal.AUTOMATIC;
          else
            obj.m_rtnState = signal.GetSignalStateEx();

          if (m_itpParentTower.IsPathEntrySignal(signal) and m_itpPathState != ITP_PATH_ACTIVE)
            signal.SetSignalStateEx(m_itpOwnerToken, Signal.EX_STOP, m_itpSignalStateReason);
        }

        if (m_itpPathState == ITP_PATH_ACTIVE)
          SetObjectStateForActivation(me, obj);
      }
      else if (signal.GetSignalOwner() == m_itpParentTower)
      {
        if (obj.m_rtnState == Signal.AUTOMATIC)
          signal.SetSignalState(m_itpOwnerToken, Signal.AUTOMATIC, "");
        else
          signal.SetSignalStateEx(m_itpOwnerToken, obj.m_rtnState, "");
        signal.SetSignalOwner(m_itpOwnerToken, null);
      }

      m_itpParentTower.Sniff(signal, "Signal", "Train Approaching", bTakeOwnership);
      m_itpParentTower.Sniff(signal, "Signal", "Train Leaving", bTakeOwnership);
      Sniff(signal, "Signal", "Train Leaving", bTakeOwnership);
      return;
    }

    // Junction map objects
    Junction junction = cast<Junction>(mapObject);
    if (junction)
    {
      if (bTakeOwnership)
      {
        if (!m_itpHasPathRtnState)
          obj.m_rtnState = junction.GetDirection();

        junction.SetJunctionOwner(m_itpOwnerToken, m_itpParentTower);

        if (m_itpPathState == ITP_PATH_ACTIVE)
          SetObjectStateForActivation(me, obj);
      }
      else if (junction.GetJunctionOwner() == m_itpParentTower)
      {
        junction.SetDirection(m_itpOwnerToken, obj.m_rtnState);
        junction.SetJunctionOwner(m_itpOwnerToken, null);
      }

      Sniff(junction, "Object", "Leave", bTakeOwnership);
      return;
    }

    // SceneryWithTrack objects (and attached junctions)
    SceneryWithTrack swt = cast<SceneryWithTrack>(mapObject);
    if (swt and obj.m_childIndex != -1)
    {
      if (obj.m_childIndex < 0 or obj.m_childIndex >= swt.GetAttachedJunctions().size())
      {
        Interface.Exception("InterlockingTowerPath.SetObjectOwned> Invalid SceneryWithTrack junction");
        return;
      }

      JunctionBase swtJunction = swt.GetAttachedJunctions()[obj.m_childIndex];

      if (bTakeOwnership)
      {
        obj.m_rtnState = swtJunction.GetDirection();
        swtJunction.SetJunctionOwner(m_itpOwnerToken, m_itpParentTower);
        if (m_itpPathState == ITP_PATH_ACTIVE)
          SetObjectStateForActivation(me, obj);
      }
      else if (swtJunction.GetJunctionOwner() == m_itpParentTower)
      {
        swtJunction.SetDirection(m_itpOwnerToken, obj.m_rtnState);
        swtJunction.SetJunctionOwner(m_itpOwnerToken, null);
      }

      // Note that we have the potential to do incorrect things here, but currently
      // path objects will either be all owned or all unowned, so we should be safe
      Sniff(swt, "Object", "Leave", bTakeOwnership);
      return;
    }

    // Crossing objects
    Crossing crossing = cast<Crossing>(mapObject);
    if (crossing)
    {
      if (bTakeOwnership and crossing.GetCrossingOwner() != m_itpParentTower)
      {
        if (crossing.GetCrossingAutomatic())
          obj.m_rtnState = -1;
        else
          obj.m_rtnState = crossing.GetCrossingState();
        crossing.SetCrossingOwner(m_itpOwnerToken, m_itpParentTower);
        if (m_itpPathState == ITP_PATH_ACTIVE)
        {
          SetObjectStateForActivation(me, obj);
        }
        else
        {
          crossing.SetCrossingAutomatic(m_itpOwnerToken, false);
          crossing.SetCrossingState(m_itpOwnerToken, Crossing.CROSSING_STATE_OPEN);
        }
      }
      else if (!bTakeOwnership and crossing.GetCrossingOwner() == m_itpParentTower)
      {
        if (obj.m_rtnState == -1)
          crossing.SetCrossingAutomatic(m_itpOwnerToken, true);
        else
          crossing.SetCrossingState(m_itpOwnerToken, obj.m_rtnState);
        crossing.SetCrossingOwner(m_itpOwnerToken, null);
      }

      Sniff(crossing, "Object", "Leave", bTakeOwnership);
      return;
    }

    // Unknown object, if this gets hit often we should add some name info
    Interface.Exception("InterlockingTowerPath.SetObjectOwned> Unknown/invalid object type (" + obj.m_objectID.GetDebugString() + ")");
  }


  //=============================================================================
  // Name: SetObjectsOwned
  // Desc: Claims or releases ownership of all objects used by to this path. Note
  //       that while this is done on the path the actual owner will be the
  //       parent tower, as otherwise we're restricted on having the same entry
  //       signal define multiple paths (for example).
  // NOTE: We perform no reference counting on owners, so care must be taken not
  //       to release ownership on an object just because you wish to release it
  //       on one path. i.e. If you're going to call this, you probably want to
  //       call it on every path.
  //=============================================================================
  public thread void SetObjectsOwned(SecurityToken token, bool bTakeOwnership)
  {
    if (bTakeOwnership and !m_itpWantObjectOwnership)
      return;

    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.SetWantObjectOwnership> Unauthorised source");
      return;
    }

    if (bTakeOwnership)
      DebugLog("InterlockingTowerPath.SetObjectsOwned> Taking ownership of objects for path: " + m_itpPathName, 5);
    else
      DebugLog("InterlockingTowerPath.SetObjectsOwned> Releasing ownership of objects for path: " + m_itpPathName, 5);

    int i;

    for (i = 0; i < m_itpPathDefinition.size(); ++i)
      SetObjectOwned(m_itpPathDefinition[i], bTakeOwnership);

    for (i = 0; i < m_itpExternalRequirements.size(); ++i)
      SetObjectOwned(m_itpExternalRequirements[i], bTakeOwnership);

    if (bTakeOwnership and !m_itpHasPathRtnState)
      m_itpHasPathRtnState = true;

    PostMessage(me, "InterlockingTowerPath", "ObjectOwnershipChanged", 0.f);
  }


  //=============================================================================
  // Name: SetPathName
  // Desc: Sets the identifying name of the path (not necessarily human readable)
  // Parm: pathName - The tower-unique identifying name of this path
  //=============================================================================
  public legacy_compatibility void SetPathName(string pathName)
  {
    // TODO: should not be 'legacy_compatibility'!
    Interface.Log("InterlockingTowerPath.SetPathName> reimplement me");
    
    m_itpPathName = pathName;

    string localeToken = m_itpParentTower.GetName() + "_" + pathName;
    localeToken = TrainUtil.StrSubst(localeToken, " ", "_");
    Str.ToLower(localeToken);
    m_itpPathNameLoc = World.GetStringTable().GetString(localeToken);
    if (m_itpPathNameLoc == "")
      m_itpPathNameLoc = m_itpPathName;
  }


  //=============================================================================
  // Name: GetPathDebugString
  //=============================================================================
  public string GetPathDebugString()
  {
    string debugInfo = "[" + m_itpPathName + "]-[" + m_itpPathState + "]";
    if (m_itpTrains.size())
    {
      int i;
      for (i = 0; i < m_itpTrains.size(); ++i)
        debugInfo = debugInfo + "-[" + m_itpTrains[i].m_trainID.GetDebugString() + "]-[" + m_itpTrains[i].m_bIsCurrentlyOnPath + "]";
    }
    else
    {
      debugInfo = debugInfo + "-[unoccupied]";
    }

    return debugInfo;
  }


  //=============================================================================
  // Name: GetIndexedPathDefinitionObjectID
  //=============================================================================
  public GameObjectID GetIndexedPathDefinitionObjectID(int index)
  {
    if (index < 0 or index >= m_itpPathDefinition.size())
      return null;

    return m_itpPathDefinition[index].GetObjectID();
  }


  //=============================================================================
  // Name: GetIndexedPathDefinitionMapObject
  // Desc: Returns the MapObject for the indexed path definition object, loading
  //       it if requested or returning null if not.
  // Parm: index - The index of the object within our path definition
  // Parm: callingThread - The calling thread on which to block loads, or null
  //=============================================================================
  public MapObject GetIndexedPathDefinitionMapObject(GameObject callingThread, int index)
  {
    if (index < 0 or index >= m_itpPathDefinition.size())
      return null;

    return m_itpPathDefinition[index].GetMapObject(callingThread);
  }


  //=============================================================================
  // Name: GetIndexedPathDefinitionObjectDisplayName
  // Desc: Returns the display name for the indexed path definition object
  // Parm: index - The index of the object within our path definition
  //=============================================================================
  public string GetIndexedPathDefinitionObjectDisplayName(int index)
  {
    if (index < 0 or index >= m_itpPathDefinition.size())
      return "";

    return m_itpPathDefinition[index].GetObjectDisplayName();
  }


  //=============================================================================
  // Name: GetIndexedPathDefinitionChildIndex
  //=============================================================================
  public int GetIndexedPathDefinitionChildIndex(int index, int failureCode)
  {
    if (index < 0 or index >= m_itpPathDefinition.size())
      return failureCode;

    return m_itpPathDefinition[index].m_childIndex;
  }


  //=============================================================================
  // Name: GetIndexedPathDefinitionState
  //=============================================================================
  public int GetIndexedPathDefinitionState(int index, int failureCode)
  {
    if (index < 0 or index >= m_itpPathDefinition.size())
      return failureCode;

    return m_itpPathDefinition[index].m_state;
  }


  //=============================================================================
  // Name: CopyPathDefinition
  // Desc: Creates and returns a copy of this paths definition. This is used to
  //       allow editing, etc without returning the actual path reference (which
  //       could then be modified/broken/etc).
  //=============================================================================
  InterlockingObject[] CopyPathDefinition(InterlockingObject[] pathDef)
  {
    InterlockingObject[] pathDefCopy = new InterlockingObject[pathDef.size()];

    int i;
    for (i = 0; i < pathDefCopy.size(); ++i)
      pathDefCopy[i] = pathDef[i].GetCopy();

    return pathDefCopy;
  }


  //=============================================================================
  // Name: SetPathDefinition
  // Desc: Sets the path definition, completely replacing any previous definition
  //=============================================================================
  public void SetPathDefinition(InterlockingObject[] pathDef)
  {
    m_itpPathDefinition = pathDef;

    ClearConflictingPathCache(true);

    EnablePathVisualisation(m_itpVisualisations.size() > 0, m_itpVisualisations.size() > 1);
  }


  //=============================================================================
  // Name: GetIndexedExternalRequirementObjectID
  //=============================================================================
  public GameObjectID GetIndexedExternalRequirementObjectID(int index)
  {
    if (index < 0 or index >= m_itpPathDefinition.size())
      return null;

    return m_itpExternalRequirements[index].GetObjectID();
  }


  //=============================================================================
  // Name: GetIndexedExternalRequirementMapObject
  // Desc: Returns the MapObject for the indexed external requirement, loading it
  //       if requested or returning null if not.
  // Parm: index - The index of the object within our path definition
  // Parm: callingThread - The calling thread on which to block loads, or null
  //=============================================================================
  public MapObject GetIndexedExternalRequirementMapObject(GameObject callingThread, int index)
  {
    if (index < 0 or index >= m_itpExternalRequirements.size())
      return null;

    return m_itpExternalRequirements[index].GetMapObject(callingThread);
  }


  //=============================================================================
  // Name: GetIndexedExternalRequirementDisplayName
  // Desc: Returns the display name for the indexed path definition object
  // Parm: index - The index of the object within our path definition
  //=============================================================================
  public string GetIndexedExternalRequirementDisplayName(int index)
  {
    if (index < 0 or index >= m_itpExternalRequirements.size())
      return "";

    return m_itpExternalRequirements[index].GetObjectDisplayName();
  }


  //=============================================================================
  // Name: GetIndexedExternalRequirementChildIndex
  //=============================================================================
  public int GetIndexedExternalRequirementChildIndex(int index, int failureCode)
  {
    if (index < 0 or index >= m_itpExternalRequirements.size())
      return failureCode;

    return m_itpExternalRequirements[index].m_childIndex;
  }


  //=============================================================================
  // Name: GetIndexedExternalRequirementState
  //=============================================================================
  public int GetIndexedExternalRequirementState(int index, int failureCode)
  {
    if (index < 0 or index >= m_itpExternalRequirements.size())
      return failureCode;

    return m_itpExternalRequirements[index].m_state;
  }


  //=============================================================================
  // Name: SetExternalRequirements
  // Desc: Sets the external requirement list, completely replacing any previous
  //       external requirements list
  //=============================================================================
  public void SetExternalRequirements(InterlockingObject[] req)
  {
    m_itpExternalRequirements = req;

    ClearConflictingPathCache(true);
  }


  //=============================================================================
  // Name: AddExternalRequirement
  // Desc: Adds a single external requirement to this path
  //=============================================================================
  public void AddExternalRequirement(MapObject obj, int childIndex, int state)
  {
    int i;
    for (i = 0; i < m_itpExternalRequirements.size(); ++i)
      if (m_itpExternalRequirements[i].m_objectID.DoesMatch(obj.GetGameObjectID()) and m_itpExternalRequirements[i].m_childIndex == childIndex)
        return;

    InterlockingObject extReq = new InterlockingObject();
    extReq.m_objectID = obj.GetGameObjectID();
    extReq.m_objectName = obj.GetLocalisedName();
    extReq.m_childIndex = childIndex;
    extReq.m_object = obj;
    extReq.m_state = state;
    m_itpExternalRequirements[m_itpExternalRequirements.size()] = extReq;
  }


  //=============================================================================
  // Name: IsObjectInPathDefinition
  // Desc: Returns whether a given object is part of the definition of this path
  // Parm: obj - The path object to search for
  // Parm: childIndex - The index of a child object, or -1 for the object itself
  // Parm: bIncludeExternalRequirements - Whether to also check the external list
  //=============================================================================
  public bool IsObjectInPathDefinition(MapObject obj, int childIndex, bool bIncludeExternalRequirements)
  {
    int i;

    for (i = 0; i < m_itpPathDefinition.size(); ++i)
      if (m_itpPathDefinition[i].m_objectID.DoesMatch(obj.GetGameObjectID()) and m_itpPathDefinition[i].m_childIndex == childIndex)
        return true;

    if (!bIncludeExternalRequirements)
      return false;

    for (i = 0; i < m_itpExternalRequirements.size(); ++i)
      if (m_itpExternalRequirements[i].m_objectID.DoesMatch(obj.GetGameObjectID()) and m_itpExternalRequirements[i].m_childIndex == childIndex)
        return true;

    return false;
  }


  //=============================================================================
  // Name: IsObjectOnPathInternal
  // Desc: Internal helper function to search for a particular object on this
  //       path. This function performs an actual path search and may include
  //       objects not within the actual definition. It will also never return
  //       true for external requirements (unless they are actually on the path,
  //       which would generally be considered an invalid state).
  // Parm: callingThread - The calling thread on which to block loads, or null
  // Parm: obj - The path object to search for
  // Parm: childIndex - The index of a child object, or -1 for the object itself
  // Parm: bAllowSearchBeyondPath - Whether to continue searching even once the
  //       track search has passed the exit signal. This is used for AI path
  //       selection so that the tower manager can determine which path will get
  //       a train to it's destination.
  // Retn: float - The distance to the object, -1 if object is not on the path
  //=============================================================================
  float IsObjectOnPathInternal(GameObject callingThread, MapObject obj, int childIndex, bool bAllowSearchBeyondPath)
  {
    Signal entrySignal = GetPathEntrySignal(callingThread);
    if (!entrySignal or m_itpPathDefinition.size() < 2)
      return -1.f;

    MapObject finalObject;
    if (!bAllowSearchBeyondPath)
    {
      // Get the last valid object in the path that isn't the entry signal
      int i;
      for (i = m_itpPathDefinition.size() - 1; i > 0 and !finalObject; --i)
        finalObject = m_itpPathDefinition[i].GetMapObject(callingThread);

      // If we can't find something then this path is too faulty to search
      if (!finalObject)
        return -1.f;
    }

    // Check if it's a supported type
    Trackside tSide = cast<Trackside>(obj);
    SceneryWithTrack swt = cast<SceneryWithTrack>(obj);
    if (!tSide and !swt)
      return -1.f;

    // Begin track search
    bool objectFound = false;
    GSTrackSearch pathSearch = entrySignal.BeginTrackSearch(true);

    int pathDefIndex = 1;
    InterlockingObject[] junctionStates = new InterlockingObject[0];

    MapObject nextObj;
    while (nextObj = pathSearch.SearchNext())
    {
      if (nextObj == tSide or nextObj == swt)
      {
        objectFound = true;
        break;
      }

      if (nextObj == finalObject)
        break;

      if (pathDefIndex < m_itpPathDefinition.size())
      {
        // Set junctions to allow path traversal
        Junction junction = cast<Junction>(nextObj);
        if (junction and junction.GetGameObjectID().DoesMatch(m_itpPathDefinition[pathDefIndex].m_objectID))
        {
          // Avoid the effort if the junction's already set the way we want
          if (junction.GetDirection() != m_itpPathDefinition[pathDefIndex].m_state)
          {
            InterlockingObject newEntry = new InterlockingObject();
            newEntry.m_objectID = junction.GetGameObjectID();
            newEntry.m_object = junction;
            newEntry.m_rtnState = junction.GetDirection();
            junctionStates[junctionStates.size()] = newEntry;

            int dir = junction.GetDirectionToTrack(pathSearch.GetTrack());
            if (dir == Junction.DIRECTION_BACKWARD or dir == Junction.DIRECTION_NONE)
            {
              junction.SetDirection(m_itpOwnerToken, m_itpPathDefinition[pathDefIndex].m_state);
            }
            else
            {
              // Junction is backward facing, force our way past it
              junction.SetDirection(m_itpOwnerToken, m_itpPathDefinition[pathDefIndex].m_state);
              pathSearch = entrySignal.BeginTrackSearch(true);
              for (nextObj = pathSearch.SearchNext(); nextObj != junction; nextObj = pathSearch.SearchNext())
                ;
            }
          }
        }

        // Configure scenery with track attached junctions too
        SceneryWithTrack swt = cast<SceneryWithTrack>(nextObj);
        if (swt and swt.GetGameObjectID().DoesMatch(m_itpPathDefinition[pathDefIndex].m_objectID))
        {
          while (true)
          {
            int childIndex = m_itpPathDefinition[pathDefIndex].m_childIndex;
            if (childIndex >= 0 and childIndex < swt.GetAttachedJunctions().size())
            {
              JunctionBase swtJunction = swt.GetAttachedJunctions()[childIndex];

              // Avoid the effort if the junction's already set the way we want
              if (swtJunction.GetDirection() != m_itpPathDefinition[pathDefIndex].m_state)
              {
                InterlockingObject newEntry = new InterlockingObject();
                newEntry.m_objectID = swt.GetGameObjectID();
                newEntry.m_object = swt;
                newEntry.m_childIndex = childIndex;
                newEntry.m_rtnState = swtJunction.GetDirection();
                junctionStates[junctionStates.size()] = newEntry;

                // Set junction state to allow traversal
                swtJunction.SetDirection(m_itpOwnerToken, m_itpPathDefinition[pathDefIndex].m_state);
              }
            }

            // Loop through and set every junction for this SceneryWithTrack before continuing
            if (pathDefIndex + 1 < m_itpPathDefinition.size() and swt.GetGameObjectID().DoesMatch(m_itpPathDefinition[pathDefIndex + 1].m_objectID))
              ++pathDefIndex;
            else
              break;
          }
        }
      }

      if (pathDefIndex < m_itpPathDefinition.size() and nextObj.GetGameObjectID().DoesMatch(m_itpPathDefinition[pathDefIndex].m_objectID))
        ++pathDefIndex;
    }

    // Restore path state
    int i;
    for (i = 0; i < junctionStates.size(); ++i)
    {
      MapObject mapObj = junctionStates[i].GetMapObject(callingThread);

      JunctionBase junction = cast<Junction>(mapObj);
      if (!junction)
      {
        SceneryWithTrack swt = cast<SceneryWithTrack>(mapObj);
        junction = swt.GetAttachedJunctions()[junctionStates[i].m_childIndex];
      }

      junction.SetDirection(m_itpOwnerToken, junctionStates[i].m_rtnState);
    }

    if (!objectFound)
      return -1.f;

    return pathSearch.GetDistance();
  }


  //=============================================================================
  // Name: IsObjectOnPath
  // Desc: Returns whether a given object is on this path somewhere
  // Parm: obj - The path object to search for
  // Retn: float - The distance to the object, -1 if object is not on the path
  //=============================================================================
  public float IsObjectOnPath(GameObject callingThread, MapObject obj)
  {
    return IsObjectOnPathInternal(callingThread, obj, -1, false);
  }


  //=============================================================================
  // Name: IsObjectOnOrBeyondPath
  // Desc: Returns whether a given object is on this path, or lies on the track
  //       beyond the exit signal. Note that searching beyond the path will
  //       follow the currently set junction directions.
  // Parm: obj - The path object to search for
  // Retn: float - The distance to the object, -1 if object is not on the path
  //=============================================================================
  public float IsObjectOnOrBeyondPath(GameObject callingThread, MapObject obj)
  {
    return IsObjectOnPathInternal(callingThread, obj, -1, true);
  }


  //=============================================================================
  // Name: GetPathEntrySignal
  //=============================================================================
  public Signal GetPathEntrySignal(GameObject callingThread)
  {
    if (m_itpPathDefinition.size() < 1)
      return null;

    return cast<Signal>(m_itpPathDefinition[0].GetMapObject(callingThread));
  }


  //=============================================================================
  // Name: GetPathExitSignal
  //=============================================================================
  public Signal GetPathExitSignal(GameObject callingThread)
  {
    if (m_itpPathDefinition.size() < 1)
      return null;

    return cast<Signal>(m_itpPathDefinition[m_itpPathDefinition.size() - 1].GetMapObject(callingThread));
  }


  //=============================================================================
  // Name: SetPathClearMethod
  //=============================================================================
  public void SetPathClearMethod(int clearMethod)
  {
    if (clearMethod != ITP_CLEAR_NONE and clearMethod != ITP_CLEAR_ON_CANCEL and clearMethod != ITP_CLEAR_ON_DRIVE)
      return;

    m_itpClearMethod = clearMethod;
  }


  //=============================================================================
  // Name: CanTransitionPathToState
  // Desc: Returns whether this path is in a state where it's possible to begin
  //       to transition to the state passed. When creating a custom tower script
  //       this is an ideal place to perform extra checks for path state changes.
  // Parm: state - The state we want to transition to
  //=============================================================================
  bool CanTransitionPathToState(int state)
  {
    if (!m_itpHasPathRtnState)
    {
      // Path transitions should never be possible if we haven't taken ownership
      // and saved the path return state
      DebugLog("InterlockingTowerPath.CanTransitionPathToState> Cannot transition, object return state is not saved", 1);
      return false;
    }

    switch (state)
    {
    case ITP_PATH_NOT_SET:
      return m_itpPathState == ITP_PATH_CANCELLING;

    case ITP_PATH_ACTIVATING:
      return m_itpPathState == ITP_PATH_NOT_SET or m_itpPathState == ITP_PATH_CANCELLING or m_itpPathState == ITP_PATH_PANIC;

    case ITP_PATH_ACTIVE:
      return m_itpPathState == ITP_PATH_ACTIVATING;

    case ITP_PATH_CANCELLING:
      return m_itpPathState == ITP_PATH_ACTIVATING or m_itpPathState == ITP_PATH_ACTIVE or m_itpPathState == ITP_PATH_PANIC;

    case ITP_PATH_PANIC:
      // We can always transition to a panic/emergency state
      return true;

    default:
      break;
    }

    return false;
  }


  //=============================================================================
  // Name: SetObjectStateForActivation
  // Desc: Performs the intricacies of path activation for a particular object
  // Parm: obj - The interlocking object to set
  // Parm: bIsFirstPass - Whether this is the first pass at setting the path
  //=============================================================================
  bool SetObjectStateForActivation(GameObject callingThread, InterlockingObject obj)
  {
    MapObject mapObject = obj.GetMapObject(callingThread);
    if (!mapObject)
    {
      Interface.Exception("InterlockingTowerPath.SetObjectStateForActivation> Object not found, cannot activate");
      return false;
    }

    // Abort if state is incorrect (we're on a thread, so this can happen under normal conditions)
    if (m_itpPathState != ITP_PATH_ACTIVATING)
      return false;

    Signal signal = cast<Signal>(mapObject);
    if (signal)
    {
      // We want all junctions and crossings set before we alter any signals
      if (m_itpPathTransitionStage == 0)
        return true;

      // Special case: If the exit signal is used as the entry signal to another path
      // then do not alter it's state, but return true to allow this path to activate.
      if (signal == GetPathExitSignal(callingThread) and m_itpParentTower.IsPathEntrySignal(signal))
        return true;

      if (obj.m_state == Signal.AUTOMATIC)
        return signal.SetSignalState(m_itpOwnerToken, obj.m_state, m_itpSignalStateReason);
      return signal.SetSignalStateEx(m_itpOwnerToken, obj.m_state, m_itpSignalStateReason);
    }

    // In theory if m_itpPathTransitionStage > 0 then all junctions and crossings are
    // already set, but for safety/sanity reasons we ignore this and test them anyway

    Junction junction = cast<Junction>(mapObject);
    if (junction)
      return junction.SetDirection(m_itpOwnerToken, obj.m_state);

    SceneryWithTrack swt = cast<SceneryWithTrack>(mapObject);
    if (swt and obj.m_childIndex >= 0 and obj.m_childIndex < swt.GetAttachedJunctions().size())
      return swt.GetAttachedJunctions()[obj.m_childIndex].SetDirection(m_itpOwnerToken, obj.m_state);

    Crossing crossing = cast<Crossing>(mapObject);
    if (crossing)
    {
      if (obj.m_state == -1)
      {
        crossing.SetCrossingAutomatic(m_itpOwnerToken, true);
        return true;
      }

      crossing.SetCrossingAutomatic(m_itpOwnerToken, false);
      crossing.SetCrossingState(m_itpOwnerToken, obj.m_state);
      return crossing.GetCrossingState() == obj.m_state;
    }

    Interface.Exception("InterlockingTowerPath.SetObjectStateForActivation> Unknown/invalid object type");
    return false;
  }


  //=============================================================================
  // Name: AttemptPathActivation
  // Desc: Performs the intricacies of path activation, i.e. setting object state
  //=============================================================================
  thread void AttemptPathActivation()
  {
    if (m_itpPathState != InterlockingTowerPath.ITP_PATH_ACTIVATING)
    {
      DebugLog("InterlockingTowerPath.AttemptPathActivation> Invalid state (" + m_itpPathState + ")", 1);
      return;
    }

    int i;
    bool isPathSet = true;

    // Note that "i = 1" is intentional, as we want to set the entry signal last
    for (i = 1; i < m_itpPathDefinition.size(); ++i)
    {
      if (!SetObjectStateForActivation(me, m_itpPathDefinition[i]))
      {
        DebugLog("InterlockingTowerPath.AttemptPathActivation> Failed to set path object: " + m_itpPathDefinition[i].m_objectID.GetDebugString(), 4);
        isPathSet = false;
      }
    }

    for (i = 0; i < m_itpExternalRequirements.size(); ++i)
    {
      if (!SetObjectStateForActivation(me, m_itpExternalRequirements[i]))
      {
        DebugLog("InterlockingTowerPath.AttemptPathActivation> Failed to set external requirement: " + m_itpExternalRequirements[i].m_objectID.GetDebugString(), 4);
        isPathSet = false;
      }
    }

    if (isPathSet)
    {
      if (m_itpPathTransitionStage == 0 and m_itpTransitionTime == 0)
      {
        // If the transition time is instant then we skip straight to stage 2
        ++m_itpPathTransitionStage;
        AttemptPathActivation();
      }
      else if (m_itpPathTransitionStage == 0)
      {
        // All junctions and crossings set, give them some time and then start setting signals
        ++m_itpPathTransitionStage;
        PostMessage(me, "InterlockingTowerPath", "UpdatePathState", (m_itpPathTransitionTimer - World.GetTimeElapsed()) / 2.f);
      }
      else if (!CanTransitionPathToState(ITP_PATH_ACTIVE))
      {
        // Cannot transition to active yet. This test is provided to allow 3rd party tower
        // implementations to perform their own transition checks before we allow activation.
      }
      else if (World.GetTimeElapsed() >= m_itpPathTransitionTimer)
      {
        // Set the state for the entry signal last
        if (SetObjectStateForActivation(me, m_itpPathDefinition[0]))
        {
          m_itpPathState = ITP_PATH_ACTIVE;
          PostMessage(m_itpParentTower, "InterlockingTowerPath", "Active", 0.f);
        }
      }
      else
      {
        // Path was set but we're under the transition timer, post a message to set it again later
        PostMessage(me, "InterlockingTowerPath", "UpdatePathState", m_itpPathTransitionTimer - World.GetTimeElapsed());
      }
    }
  }


  //=============================================================================
  // Name: ActivatePath
  // Desc: Begins activating the path. Will post a message to the owner of type
  //       "InterlockingTowerPath","Active" when the path is set.
  // Parm: token - A token from the owning tower with rights "path-control"
  //============================================================================ 
  public void ActivatePath(SecurityToken token)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.ActivatePath> Unauthorised source");
      return;
    }

    if (!CanTransitionPathToState(ITP_PATH_ACTIVATING))
      return;

    m_itpPathState = ITP_PATH_ACTIVATING;
    m_itpPathTransitionStage = 0;
    m_itpPathTransitionTimer = World.GetTimeElapsed() + m_itpTransitionTime;
    AttemptPathActivation();
  }


  //=============================================================================
  // Name: SetObjectStateForCancellation
  // Desc: Performs the intricacies of path cancellation for a particular object
  //=============================================================================
  bool SetObjectStateForCancellation(GameObject callingThread, InterlockingObject obj)
  {
    MapObject mapObject = obj.GetMapObject(callingThread);
    if (!mapObject)
    {
      Interface.Exception("InterlockingTowerPath.SetObjectStateForCancellation> Object not found, cannot cancel");
      return false;
    }

    if (m_itpClearMethod == ITP_CLEAR_NONE)
    {
      // No automatic object reset, we're done
      return true;
    }

    Signal signal = cast<Signal>(mapObject);
    if (signal)
    {
      if (signal == GetPathEntrySignal(callingThread))
        return signal.SetSignalStateEx(m_itpOwnerToken, Signal.EX_STOP, m_itpSignalStateReason);
      else if (signal == GetPathExitSignal(callingThread) and m_itpParentTower.IsPathEntrySignal(signal))
        return true;
      else if (obj.m_rtnState == Signal.AUTOMATIC)
        return signal.SetSignalState(m_itpOwnerToken, Signal.AUTOMATIC, m_itpSignalStateReason);
      else
        return signal.SetSignalStateEx(m_itpOwnerToken, obj.m_rtnState, m_itpSignalStateReason);
    }

    Junction junction = cast<Junction>(mapObject);
    if (junction)
      return junction.SetDirection(m_itpOwnerToken, obj.m_rtnState);

    SceneryWithTrack swt = cast<SceneryWithTrack>(mapObject);
    if (swt and obj.m_childIndex >= 0 and obj.m_childIndex < swt.GetAttachedJunctions().size())
    {
      JunctionBase junction = swt.GetAttachedJunctions()[obj.m_childIndex];
      return junction.SetDirection(m_itpOwnerToken, obj.m_rtnState);
    }

    Crossing crossing = cast<Crossing>(mapObject);
    if (crossing)
    {
      crossing.SetCrossingAutomatic(m_itpOwnerToken, false);
      crossing.SetCrossingState(m_itpOwnerToken, Crossing.CROSSING_STATE_OPEN);
      return crossing.GetCrossingState() == Crossing.CROSSING_STATE_OPEN;
    }

    Interface.Exception("InterlockingTowerPath.SetObjectStateForCancellation> Unknown/invalid object type");
    return false;
  }


  //=============================================================================
  // Name: AttemptPathCancellation
  // Desc: Performs the intricacies of path cancellation
  //=============================================================================
  thread void AttemptPathCancellation()
  {
    DebugLog("InterlockingTowerPath.AttemptPathCancellation> Retrying path cancellation " + GetPathName(), 4);

    if (m_itpPathState != InterlockingTowerPath.ITP_PATH_CANCELLING)
    {
      DebugLog("InterlockingTowerPath.AttemptPathCancellation> Invalid state", 1);
      return;
    }

    // Cannot cancel the path while occupied
    if (IsOccupied())
    {
      Interface.Exception("InterlockingTowerPath.AttemptPathCancellation> Cannot cancel path while it's occupied");
      return;
    }

    // Always attempt to clear the entry signal first
    Signal entrySignal = GetPathEntrySignal(me);
    if (!entrySignal or !entrySignal.SetSignalStateEx(m_itpOwnerToken, Signal.EX_STOP, m_itpSignalStateReason))
    {
      DebugLog("InterlockingTowerPath.AttemptPathCancellation> Cannot set entry signal state", 1);
      return;
    }

    int i;
    bool isPathClear = true;

    // Note that "i = 1" is intentional, as we always to set the entry signal first
    for (i = 1; i < m_itpPathDefinition.size(); ++i)
    {
      // Abort if state is incorrect (we're on a thread, so this can happen under normal conditions)
      if (m_itpPathState != ITP_PATH_CANCELLING)
        return;

      if (!SetObjectStateForCancellation(me, m_itpPathDefinition[i]))
      {
        DebugLog("InterlockingTowerPath.AttemptPathCancellation> Failed to clear path object: " + m_itpPathDefinition[i].m_objectID.GetDebugString(), 4);
        isPathClear = false;
      }
    }

    for (i = 0; i < m_itpExternalRequirements.size(); ++i)
    {
      // Abort if state is incorrect (we're on a thread, so this can happen under normal conditions)
      if (m_itpPathState != ITP_PATH_CANCELLING)
        return;

      if (!SetObjectStateForCancellation(me, m_itpExternalRequirements[i]))
      {
        DebugLog("InterlockingTowerPath.AttemptPathCancellation> Failed to clear external requirement " + m_itpPathDefinition[i].m_objectID.GetDebugString(), 4);
        isPathClear = false;
      }
    }

    if (isPathClear)
    {
      if (!CanTransitionPathToState(ITP_PATH_NOT_SET))
      {
        // Cannot transition to clear yet. This test is provided to allow 3rd party tower
        // implementations to perform their own transition checks before we finalise.
        DebugLog("InterlockingTowerPath.AttemptPathCancellation> Cannot transition", 2);
      }
      else if (World.GetTimeElapsed() >= m_itpPathTransitionTimer)
      {
        m_itpPathState = ITP_PATH_NOT_SET;
        PostMessage(m_itpParentTower, "InterlockingTowerPath", "Cancelled", 0.f);
        DebugLog("InterlockingTowerPath.AttemptPathCancellation> Cancelled path " + GetPathName(), 4);
      }
      else
      {
        // Path was cancelled but we're under the transition timer, post a message to set it again later
        PostMessage(me, "InterlockingTowerPath", "UpdatePathState", m_itpPathTransitionTimer - World.GetTimeElapsed());
        DebugLog("InterlockingTowerPath.AttemptPathCancellation> Awaiting path transition (" + (m_itpPathTransitionTimer - World.GetTimeElapsed()) + ") " + GetPathName(), 4);
      }
    }
  }


  //=============================================================================
  // Name: CancelPath
  // Desc: Begins cancelling the path. Will post a message to the owner of type
  //       "InterlockingTowerPath","Cancelled" when the path is cancelled. This
  //       will return all controlled objects to their original state if
  //       appropriate, based on m_clearState.
  // Parm: token - A token from the owning tower with rights "path-control"
  //============================================================================ 
  public void CancelPath(SecurityToken token)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.CancelPath> Unauthorised source");
      return;
    }

    if (!CanTransitionPathToState(ITP_PATH_CANCELLING))
      return;

    m_itpPathState = ITP_PATH_CANCELLING;
    m_itpPathTransitionStage = 0;
    m_itpPathTransitionTimer = World.GetTimeElapsed() + m_itpTransitionTime;
    AttemptPathCancellation();
  }


  //=============================================================================
  // Name: AttemptPathObjectClear
  // Desc: Attempts path clearing logic for a specific object
  //=============================================================================
  thread void AttemptPathObjectClear(Message msg, InterlockingObject obj)
  {
    MapObject mapObject = obj.GetMapObject(me);
    if (!mapObject)
    {
      // If the object is missing it can never clear, and the path is probably
      // stuck active. That's severe enough to warrant an exception.
      Interface.Exception("InterlockingTowerPath.AttemptPathObjectClear> Failed to load object: " + obj.m_objectID.GetDebugString());
      return;
    }

    bool bWasCleared = false;

    if (msg.minor == "Entered signal")
    {
      // Filter out messages from irrelevant trains
      if (!IsOccupiedByTrain(cast<Train>(msg.dst)))
        return;

      // If the train has entered a path signal then try and clear it
      if (msg.src == mapObject)
        bWasCleared = SetObjectStateForCancellation(me, obj);
    }
    else if (msg.minor == "Leave" or msg.minor == "Train Leaving")
    {
      // Filter out messages from irrelevant trains
      if (!IsOccupiedByTrain(cast<Train>(msg.src)))
        return;

      // If the train has left an objects perimiter then try and clear it
      if (msg.src == mapObject or msg.dst == mapObject)
        bWasCleared = SetObjectStateForCancellation(me, obj);
    }
    else if (msg.minor == "LeaveTrack")
    {
      // Filter out messages from irrelevant trains
      if (!IsOccupiedByTrain(cast<Train>(msg.dst)))
        return;

      // If the train has left a path objects track then try and clear it
      Trackside tObj = cast<Trackside>(mapObject);
      if (tObj and msg.src == tObj.GetTrack())
        bWasCleared = SetObjectStateForCancellation(me, obj);

      // Note that we intentionally don't check the track for SceneryWithTrack
      // here as just because the train has cleared one of them, doesn't mean it's
      // cleared them all. Instead we rely solely on "Object","Leave" messages for
      // detecting SceneryWithTrack clearance.
    }

    if (bWasCleared and mapObject == GetPathEntrySignal(me))
    {
      // The train has cleared the entry signal, flag it as on the path
      int i;
      for (i = 0; i < m_itpTrains.size(); ++i)
        if (m_itpTrains[i].m_trainID.DoesMatch(cast<Train>(msg.src)))
          m_itpTrains[i].m_bIsCurrentlyOnPath = true;
    }
    else if ((bWasCleared and mapObject == GetPathExitSignal(me) and msg.minor == "Train Leaving") or m_itpPathState == ITP_PATH_CANCELLING)
    {
      // Attempt/Continue automatic train removal and path cancellation if:
      //    a) A train has entirely cleared the exit signal; OR
      //    b) We're in the middle of cancellation already
      RemoveTrain(m_itpOwnerToken, cast<Train>(msg.src));
      RemoveTrain(m_itpOwnerToken, cast<Train>(msg.dst));
      CancelPath(m_itpOwnerToken);
    }
  }


  //=============================================================================
  // Name: AttemptPathObjectClear
  // Desc: Attempts path clearing logic based on the message passed
  // Parm: msg - The message tha triggered this path clear attempt
  //=============================================================================
  void AttemptPathObjectClear(Message msg)
  {
    if (m_itpClearMethod == ITP_CLEAR_NONE or m_itpClearMethod == ITP_CLEAR_ON_CANCEL)
    {
      // Check if we've cleared the entry signal
      AttemptPathObjectClear(msg, m_itpPathDefinition[0]);
    }

    if (m_itpClearMethod == ITP_CLEAR_ON_CANCEL)
    {
      // Check if we've cleared the exit signal
      AttemptPathObjectClear(msg, m_itpPathDefinition[m_itpPathDefinition.size() - 1]);
    }
    else if (m_itpClearMethod == ITP_CLEAR_ON_DRIVE)
    {
      int i;
      for (i = 0; i < m_itpPathDefinition.size(); ++i)
        AttemptPathObjectClear(msg, m_itpPathDefinition[i]);
    }
  }


  //=============================================================================
  // Name: UpdatePathState
  // Desc: Updates the state of the path following a state change on some other
  //       object (e.g. a junctions, trains, etc)
  //=============================================================================
  void UpdatePathState(Message msg)
  {
    if (m_itpPathState == ITP_PATH_ACTIVATING)
    {
      // If we've been trying to activate the path, try again
      AttemptPathActivation();
    }
    else if (m_itpPathState == ITP_PATH_ACTIVE)
    {
      // If the path is active, check if objects can clear
      AttemptPathObjectClear(msg);
    }
    else if (m_itpPathState == ITP_PATH_CANCELLING)
    {
      // If we've been trying to cancel the path, try again
      AttemptPathCancellation();
    }
  }


  //=============================================================================
  // Name: SetPathPanicState
  // Desc: Internal function called by SetPanicState to actually set the signals.
  //=============================================================================
  thread void SetPathPanicState()
  {
    if (m_itpPathState != ITP_PATH_PANIC)
    {
      DebugLog("InterlockingTowerPath.SetPathPanicState> Invalid state", 1);
      return;
    }

    int i;
    for (i = 0; i < m_itpPathDefinition.size(); ++i)
    {
      Signal signal = cast<Signal>(m_itpPathDefinition[i].GetMapObject(me));

      // Abort if we've been switched out of panic mode already
      if (m_itpPathState != ITP_PATH_PANIC)
        break;

      if (signal)
        signal.SetSignalStateEx(m_itpOwnerToken, Signal.EX_STOP, m_itpSignalStateReasonPanic);
    }
  }


  //=============================================================================
  // Name: SetPanicState
  // Desc: Instantly drops all controlled signals along this path. Does not
  //       change junction or crossing state. Used to simulate an emergency
  //       situation of some kind. To transition out of a panic state call
  //       either ActivatePath or CancelPath.
  // Parm: token - A token from the owning tower with rights "path-control"
  //============================================================================ 
  public void SetPanicState(SecurityToken token)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.CancelPath> Unauthorised source");
      return;
    }

    // This should probably never return false, but just in case
    if (!CanTransitionPathToState(ITP_PATH_PANIC))
      return;

    // We treat panic as active immediately, even though the thread may take a
    // moment to actually set the signal states (especially if signals aren't
    // currently loaded).
    m_itpPathState = ITP_PATH_PANIC;

    SetPathPanicState();
  }


  //=============================================================================
  // Name: AddTrain
  // Desc: Adds the train passed to this path. Does not perform any validation
  //       on this operation and will warrant all requests from a valid source.
  // Parm: token - A token from the owning tower with rights "path-control"
  // Parm: trainID - The ID of the train to remove from this path
  //=============================================================================
  public void AddTrain(SecurityToken token, GameObjectID trainID)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.AddTrain> Unauthorised source");
      return;
    }

    // Prevent duplicate entries
    if (IsOccupiedByTrain(trainID))
      return;

    DebugLog("InterlockingTowerPath.AddTrain> Adding train '" + trainID.GetDebugString() + "' to path: " + GetPathName(), 4);

    InterlockingPathTrain trainData = new InterlockingPathTrain();
    trainData.m_trainID = trainID;
    m_itpTrains[m_itpTrains.size()] = trainData;

    Sniff(trainID, "Train", "LeaveTrack", true);
    Sniff(trainID, "Train", "Entered signal", true);

    PostMessage(m_itpParentTower, "InterlockingTowerPath", "AddedTrain", 0.f);
  }


  //=============================================================================
  // Name: RemoveTrain
  // Desc: Removed the train passed from this path. Performs no validation on
  //       the operation and will warrant all requests from a valid source.
  // Parm: token - A token from the owning tower with rights "path-control"
  // Parm: trainID - The ID of the train to remove from this path
  //=============================================================================
  public void RemoveTrain(SecurityToken token, GameObjectID trainID)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.RemoveTrain> Unauthorised source");
      return;
    }

    int i;
    for (i = 0; i < m_itpTrains.size(); ++i)
    {
      if (m_itpTrains[i].m_trainID.DoesMatch(trainID))
      {
        DebugLog("InterlockingTowerPath.RemoveTrain> Removing train '" + trainID.GetDebugString() + "' from path: " + GetPathName(), 4);

        Sniff(trainID, "Train", "LeaveTrack", false);
        Sniff(trainID, "Train", "Entered signal", false);

        PostMessage(m_itpParentTower, "InterlockingTowerPath", "RemovedTrain", 0.f);

        m_itpTrains[i, i + 1] = null;

        break;
      }
    }
  }


  //=============================================================================
  // Name: HandleVehicleDecoupled
  // Desc: Small worker thread spawned from OnVehicleDecoupled() so that we can
  //       check if the vehicle is on this path (as we may need to load objects).
  //=============================================================================
  thread void HandleVehicleDecoupled(Vehicle vehicle)
  {
    if (IsObjectOnPath(me, vehicle) < 0)
    {
      // Vehicles is not on this path, ignore it
      return;
    }

    Train train = vehicle.GetMyTrain();

    DebugLog("InterlockingTowerPath.HandleVehicleDecoupled> Adding train (" + train.GetDebugName() + ", " + GetPathName() + ")", 3);
    AddTrain(m_itpOwnerToken, train);
  }


  //=============================================================================
  // Name: OnVehicleDecoupled
  // Desc: Message handler for vehicle decouple messages
  //=============================================================================
  void OnVehicleDecoupled(Message msg)
  {
    Vehicle srcVehicle = cast<Vehicle>(msg.src);
    if (!srcVehicle)
      return;

    // We don't want decoupled stationary rolling stock to prevent path clearing
    Train srcTrain = srcVehicle.GetMyTrain();
    if (srcTrain.IsStopped() and !srcTrain.GetActiveDriver())
    {
      DebugLog("InterlockingTowerPath.OnVehicleDecoupled> Ignoring stopped and driverless train (" + srcVehicle.GetDebugName() + ", " + GetPathName() + ")", 2);
      return;
    }

    // Couple/decouple messages are broadcast so we're going to get these for every
    // vehicle in existance. In other words, we need to check if it's on the path,
    // and to do that we'll need to spawn a new worker thread.
    HandleVehicleDecoupled(srcVehicle);
  }


  //=============================================================================
  // Name: IsOccupiedByTrain
  // Desc: Returns whether the path is known to be occupied by a specific train.
  //       Does not perform any track searching and is reliant on the owning
  //       tower correctly calling AddTrain/RemoveTrain.
  // Parm: trainID - The ID of the train to test for
  // Parm: bRequireHasClearedEntrySignal - If true, return true only if the train
  //       has cleared the entry signal and is occupying the path, otherwise it's
  //       sufficient that the tower has merely 'added' the train.
  //=============================================================================
  public bool IsOccupiedByTrain(GameObjectID trainID, bool bRequireHasClearedEntrySignal)
  {
    int i;
    for (i = 0; i < m_itpTrains.size(); ++i)
      if (trainID.DoesMatch(m_itpTrains[i].m_trainID))
        return !bRequireHasClearedEntrySignal or m_itpTrains[i].m_bIsCurrentlyOnPath;

    return false;
  }


  //=============================================================================
  // Name: IsOccupiedByTrain
  //=============================================================================
  public bool IsOccupiedByTrain(Train train, bool bRequireHasClearedEntrySignal)
  {
    if (!train)
      return false;

    return IsOccupiedByTrain(train.GetGameObjectID(), bRequireHasClearedEntrySignal);
  }


  //=============================================================================
  // Name: IsOccupied
  // Desc: Returns whether the path is known to be occupied. Does not perform any
  //       track searching and is reliant on the owning tower correctly calling
  //       AddTrain/RemoveTrain.
  // Parm: bRequireHasClearedEntrySignal - If true, return true only if the train
  //       has cleared the entry signal and is occupying the path, otherwise it's
  //       sufficient that the tower has merely 'added' the train.
  //=============================================================================
  public bool IsOccupied(bool bRequireHasClearedEntrySignal)
  {
    if (!bRequireHasClearedEntrySignal)
      return m_itpTrains.size() > 0;

    int i;
    for (i = 0; i < m_itpTrains.size(); ++i)
      if (m_itpTrains[i].m_bIsCurrentlyOnPath)
        return true;

    return false;
  }


  //=============================================================================
  // Name: GetConflictingPaths
  // Desc: Returns the array of paths that conflict with this one, calculating it
  //       if necessary.
  //=============================================================================
  public InterlockingTowerPath[] GetConflictingPaths()
  {
    if (!m_itpConflictingPaths)
    {
      DebugLog("InterlockingTowerPath.GetConflictingPaths> Warning: Path conflicts not yet cached", 2);
      RebuildConflictingPathCache();
    }

    return m_itpConflictingPaths;
  }

  
  //=============================================================================
  // Name: ClearConflictingPathCache
  // Desc: Clears the conflict cache, either on the whole tower or just this path
  //=============================================================================
  public void ClearConflictingPathCache(bool bPropagateToTower)
  {
    if (bPropagateToTower and m_itpParentTower)
      m_itpParentTower.ClearConflictingPathCache();
    else
      m_itpConflictingPaths = null;
  }


  //=============================================================================
  // Name: RebuildConflictingPathCache
  // Desc: Caches the array of tower paths which have conflicts with this path.
  //       This will include any other path which shares an object.
  //=============================================================================
  public void RebuildConflictingPathCache()
  {
    m_itpConflictingPaths = new InterlockingTowerPath[0];

    int objCount = m_itpPathDefinition.size();
    int extCount = m_itpExternalRequirements.size();

    InterlockingTowerPath[] towerPaths = m_itpParentTower.GetTowerPaths();

    int i, j, k;
    for (i = 0; i < towerPaths.size(); ++i)
    {
      // Don't include the passed path in the result set
      if (towerPaths[i] == me)
        continue;

      bool bHasConflict = false;

      int objCount2 = towerPaths[i].GetPathDefinitionObjectCount();
      int extCount2 = towerPaths[i].GetExternalRequirementsCount();

      // Check each path definition object against the indexed paths path def and externeral requirements
      for (j = 0; j < objCount and !bHasConflict; ++j)
      {
        for (k = 0; k < objCount2 and !bHasConflict; ++k)
        {
          if (m_itpPathDefinition[j].m_objectID.DoesMatch(towerPaths[i].GetIndexedPathDefinitionObjectID(k)))
          {
            if (m_itpPathDefinition[j].m_state != towerPaths[i].GetIndexedPathDefinitionState(k, -99))
            {
              // Special case: A path exit signal can be used as an entry signal to another path
              if ((j == objCount - 1 and k == 0) or (j == 0 and k == objCount2 - 1))
                continue;

              bHasConflict = true;
            }
          }
        }

        for (k = 0; k < extCount2 and !bHasConflict; ++k)
          if (m_itpPathDefinition[j].m_objectID.DoesMatch(towerPaths[i].GetIndexedExternalRequirementObjectID(k)))
            if (m_itpPathDefinition[j].m_state != towerPaths[i].GetIndexedExternalRequirementState(k, -99))
              bHasConflict = true;
      }

      // Check each external requirement against the indexed paths path def and external requirements
      for (j = 0; j < extCount and !bHasConflict; ++j)
      {
        for (k = 0; k < objCount2 and !bHasConflict; ++k)
          if (m_itpExternalRequirements[j].m_objectID.DoesMatch(towerPaths[i].GetIndexedPathDefinitionObjectID(k)))
            if (m_itpExternalRequirements[j].m_state != towerPaths[i].GetIndexedPathDefinitionState(k, -99))
              bHasConflict = true;

        for (k = 0; k < extCount2 and !bHasConflict; ++k)
          if (m_itpExternalRequirements[j].m_objectID.DoesMatch(towerPaths[i].GetIndexedExternalRequirementObjectID(k)))
            if (m_itpExternalRequirements[j].m_state != towerPaths[i].GetIndexedExternalRequirementState(k, -99))
              bHasConflict = true;
      }

      if (bHasConflict)
        m_itpConflictingPaths[m_itpConflictingPaths.size()] = towerPaths[i];

    } // for (i = 0; i < towerPaths.size(); ++i)
  }

  
  //=============================================================================
  // Name: ListOccupiedTrackCircuitBlocksHelper
  // Desc: Helper function for ListOccupiedTrackCircuitBlocks
  //=============================================================================
  void ListOccupiedTrackCircuitBlocksHelper(GameObject callingThread, TrackCircuitBlock[] io_circuitBlocks, InterlockingObject[] pathDef)
  {
    int pi, bi, ci;
    for (pi = 0; pi < pathDef.size(); ++pi)
    {
      MapObject mapObject = pathDef[pi].GetMapObject(callingThread);
      if (!mapObject)
        continue;

      TrackCircuitBlock[] blocks = mapObject.GetOccupiedTrackCircuitBlocks();
      for (bi = 0; bi < blocks.size(); ++bi)
      {
        // Avoid duplicates
        bool bFound = false;
        for (ci = 0; ci < io_circuitBlocks.size() and !bFound; ++ci)
          if (io_circuitBlocks[ci] == blocks[bi])
            bFound = true;

        if (!bFound)
          io_circuitBlocks[io_circuitBlocks.size()] = blocks[bi];
      }
    }
  }


  //=============================================================================
  // Name: ListOccupiedTrackCircuitBlocks
  // Desc: Calculates and returns the full list of TrackCicuitBlocks that this
  //       path overlaps. Do not call this often as it may get slow.
  //=============================================================================
  public TrackCircuitBlock[] ListOccupiedTrackCircuitBlocks(GameObject callingThread, bool bIncludeExternalRequirements)
  {
    TrackCircuitBlock[] circuitBlocks = new TrackCircuitBlock[0];

    ListOccupiedTrackCircuitBlocksHelper(callingThread, circuitBlocks, m_itpPathDefinition);
    if (bIncludeExternalRequirements)
      ListOccupiedTrackCircuitBlocksHelper(callingThread, circuitBlocks, m_itpExternalRequirements);

    return circuitBlocks;
  }


  //=============================================================================
  // Name: EnablePathVisualisation
  // Desc: Enables/disables visualisation of this path in the game world
  // Parm: enable - Whether to enable or disable the visualisation
  // Parm: bShouldIncludeAllTCBs - If true, all TrackCircuitBlocks that this path
  //       overlaps will also be visualised in the game world
  //=============================================================================
  public void EnablePathVisualisation(bool enable, bool bShouldIncludeAllTCBs)
  {
    if ((!enable and m_itpVisualisations.size() == 0) or
        (enable and !bShouldIncludeAllTCBs and m_itpVisualisations.size() == 1) or
        (enable and bShouldIncludeAllTCBs and m_itpVisualisations.size() > 1))
    {
      // No changes necessary
      return;
    }

    if (enable and GetPathEntrySignal(null) and GetPathExitSignal(null))
    {
      Asset splineAsset;
      if (World.GetCurrentModule() == World.SURVEYOR_MODULE)
        splineAsset = World.FindAsset(Constructors.GetTrainzAsset().LookupKUIDTable("tower-path-spline-edit"));
      else if (IsOccupied(true))
        splineAsset = World.FindAsset(Constructors.GetTrainzAsset().LookupKUIDTable("tower-path-spline-occupied"));
      else
        splineAsset = World.FindAsset(Constructors.GetTrainzAsset().LookupKUIDTable("tower-path-spline-clear"));
      if (!splineAsset)
        return;

      TrackPathDisplay tpd = Constructors.NewTrackPathDisplay();
      tpd.SetDisplaySpline(splineAsset);
      tpd.InitFromInterlockingTowerPath(me);

      // TODO: Add point of interest markers for objects on and off the path?

      m_itpVisualisations = new TrackPathDisplay[0];
      m_itpVisualisations[0] = tpd;

      if (bShouldIncludeAllTCBs)
      {
        TrackCircuitBlock[] tcbs = ListOccupiedTrackCircuitBlocks(null, true);

        splineAsset = World.FindAsset(Constructors.GetTrainzAsset().LookupKUIDTable("tower-path-spline-tcbs"));
        if (!splineAsset)
          return;

        int i;
        for (i = 0; i < tcbs.size(); ++i)
        {
          TrackPathDisplay tpd = Constructors.NewTrackPathDisplay();
          tpd.SetDisplaySpline(splineAsset);
          tpd.InitFromTrackCircuitBlock(tcbs[i].GetTCBName());
          m_itpVisualisations[m_itpVisualisations.size()] = tpd;
        }
      }
    }
    else
    {
      // Clear the array, removing all path references and causing their destruction
      m_itpVisualisations = new TrackPathDisplay[0];
    }
  }


  //=============================================================================
  // Name: EnablePathVisualisation
  // Desc: Enables/disables visualisation of this path in the game world
  //=============================================================================
  public void EnablePathVisualisation(bool enable)
  {
    EnablePathVisualisation(enable, false);
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Generates and returns a Soup defining this path's internal state.
  // Parm: token - A token from the owning tower with rights "path-control"
  //=============================================================================
  public mandatory Soup GetProperties(SecurityToken token)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.GetProperties> Unauthorised source");
      return null;
    }

    Soup parentProperties = Constructors.NewSoup();

    int i;
    Soup properties = Constructors.NewSoup();

    properties.SetNamedTag("name", m_itpPathName);
    properties.SetNamedTag("custom-name", m_itpHasCustomName);
    properties.SetNamedTag("state", m_itpPathState);

    Soup pathProperties = Constructors.NewSoup();
    for (i = 0; i < m_itpPathDefinition.size(); ++i)
    {
      Soup objProperties = Constructors.NewSoup();
      objProperties.SetNamedTag("object-id", m_itpPathDefinition[i].GetObjectID());
      objProperties.SetNamedTag("object-name", m_itpPathDefinition[i].GetObjectDisplayName());
      objProperties.SetNamedTag("child", m_itpPathDefinition[i].m_childIndex);
      objProperties.SetNamedTag("state", m_itpPathDefinition[i].m_state);
      objProperties.SetNamedTag("rtn-state", m_itpPathDefinition[i].m_rtnState);

      pathProperties.AddUniqueNamedSoup(objProperties);

      DebugLog("InterlockingTowerPath.GetProperties> " + i + ": " + m_itpPathDefinition[i].GetObjectDebugString(), 5);
    }
    properties.SetNamedSoup("path-def", pathProperties);

    Soup extReqProperties = Constructors.NewSoup();
    for (i = 0; i < m_itpExternalRequirements.size(); ++i)
    {
      Soup objProperties = Constructors.NewSoup();
      objProperties.SetNamedTag("object-id", m_itpExternalRequirements[i].GetObjectID());
      objProperties.SetNamedTag("object-name", m_itpExternalRequirements[i].GetObjectDisplayName());
      objProperties.SetNamedTag("child", m_itpExternalRequirements[i].m_childIndex);
      objProperties.SetNamedTag("state", m_itpExternalRequirements[i].m_state);
      objProperties.SetNamedTag("rtn-state", m_itpExternalRequirements[i].m_rtnState);

      extReqProperties.AddUniqueNamedSoup(objProperties);

      DebugLog("InterlockingTowerPath.GetProperties> ext-" + i + ": " + m_itpExternalRequirements[i].GetObjectDebugString(), 5);
    }
    properties.SetNamedSoup("path-ext", extReqProperties);

    properties.SetNamedTag("transition-time", m_itpTransitionTime);
    properties.SetNamedTag("transition-timer", m_itpPathTransitionTimer);
    properties.SetNamedTag("transition-stage", m_itpPathTransitionStage);
    properties.SetNamedTag("auto-assign-ai", m_itpAutoAssignAI);
    properties.SetNamedTag("auto-assign-players", m_itpAutoAssignPlrs);
    properties.SetNamedTag("clear-method", m_itpClearMethod);

    Soup trainProperties = Constructors.NewSoup();
    for (i = 0; i < m_itpTrains.size(); ++i)
    {
      Soup trainData = Constructors.NewSoup();
      trainData.SetNamedTag("train-id", m_itpTrains[i].m_trainID);
      trainData.SetNamedTag("on-path", m_itpTrains[i].m_bIsCurrentlyOnPath);
      trainProperties.SetNamedSoup((string)i, trainData);
    }
    properties.SetNamedSoup("trains", trainProperties);

    properties.SetNamedTag("has-rtn-state", m_itpHasPathRtnState);
    properties.SetNamedTag("visualisations", m_itpVisualisations.size());


    // Avoid potential name conflicts with 3rd party scripts by saving all the
    // default internal properties in a sub-soup
    parentProperties.SetNamedSoup("default-properties", properties);

    return parentProperties;
  }


  //=============================================================================
  obsolete GameObject LegacyLoadGameObjectFromName(string name)
  {
    if (name == "")
      return null;

    return Router.GetGameObject(name);
  }


  //=============================================================================
  legacy_compatibility void LegacyLoadPathObjectFromName(InterlockingObject pathObject, string name)
  {
    if (pathObject.m_objectID)
      return;

    pathObject.m_object = cast<MapObject>(LegacyLoadGameObjectFromName(name));
    if (pathObject.m_object)
    {
      pathObject.m_objectID = pathObject.m_object.GetGameObjectID();
      pathObject.m_objectName = pathObject.m_object.GetLocalisedName();
    }
    else
    {
      DebugLog("InterlockingTowerPath.SetProperties> Failed to load legacy object: " + name, 1);
    }
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Sets this path's internal state using the Soup passed.
  // Parm: token - A token from the owning tower with rights "path-control"
  //=============================================================================
  public legacy_compatibility mandatory void SetProperties(SecurityToken token, Soup parentProperties)
  {
    if (!m_itpParentTower.ValidateToken(token, "path-control"))
    {
      Interface.Exception("InterlockingTowerPath.SetProperties> Unauthorised source");
      return;
    }

    int i;
    Soup properties = parentProperties.GetNamedSoup("default-properties");

    SetPathName(properties.GetNamedTag("name"));
    m_itpHasCustomName = properties.GetNamedTagAsBool("custom-name", m_itpHasCustomName);
    m_itpPathState = properties.GetNamedTagAsInt("state", m_itpPathState);

    Soup pathProperties = properties.GetNamedSoup("path-def");
    m_itpPathDefinition = new InterlockingObject[0];
    for (i = 0; i < pathProperties.CountTags(); ++i)
    {
      Soup objProperties = pathProperties.GetNamedSoup(pathProperties.GetIndexedTagName(i));

      InterlockingObject newObject = new InterlockingObject();
      newObject.m_objectID = objProperties.GetNamedTagAsGameObjectID("object-id");
      newObject.m_objectName = objProperties.GetNamedTag("object-name");
      newObject.m_childIndex = objProperties.GetNamedTagAsInt("child", -1);
      newObject.m_state = objProperties.GetNamedTagAsInt("state");
      newObject.m_rtnState = objProperties.GetNamedTagAsInt("rtn-state");

      LegacyLoadPathObjectFromName(newObject, objProperties.GetNamedTag("object"));

      if (newObject.m_objectID)
        m_itpPathDefinition[m_itpPathDefinition.size()] = newObject;

      DebugLog("InterlockingTowerPath.SetProperties> " + i + ": " + newObject.GetObjectDebugString(), 5);
    }

    Soup extReqProperties = properties.GetNamedSoup("path-ext");
    m_itpExternalRequirements = new InterlockingObject[0];
    for (i = 0; i < extReqProperties.CountTags(); ++i)
    {
      Soup objProperties = extReqProperties.GetNamedSoup(extReqProperties.GetIndexedTagName(i));

      InterlockingObject newObject = new InterlockingObject();
      newObject.m_objectID = objProperties.GetNamedTagAsGameObjectID("object-id");
      newObject.m_objectName = objProperties.GetNamedTag("object-name");
      newObject.m_childIndex = objProperties.GetNamedTagAsInt("child", -1);
      newObject.m_state = objProperties.GetNamedTagAsInt("state");
      newObject.m_rtnState = objProperties.GetNamedTagAsInt("rtn-state");

      LegacyLoadPathObjectFromName(newObject, objProperties.GetNamedTag("object"));

      if (newObject.m_objectID)
        m_itpExternalRequirements[m_itpExternalRequirements.size()] = newObject;

      DebugLog("InterlockingTowerPath.SetProperties> ext-" + i + ": " + newObject.GetObjectDebugString(), 5);
    }

    m_itpTransitionTime = properties.GetNamedTagAsFloat("transition-time", m_itpTransitionTime);
    m_itpPathTransitionTimer = properties.GetNamedTagAsFloat("transition-timer", m_itpPathTransitionTimer);
    m_itpPathTransitionStage = properties.GetNamedTagAsFloat("transition-stage", m_itpPathTransitionStage);
    m_itpAutoAssignAI = properties.GetNamedTagAsBool("auto-assign-ai", m_itpAutoAssignAI);
    m_itpAutoAssignPlrs = properties.GetNamedTagAsBool("auto-assign-players", m_itpAutoAssignPlrs);
    m_itpClearMethod = properties.GetNamedTagAsInt("clear-method", m_itpClearMethod);

    Soup trainProperties = properties.GetNamedSoup("trains");
    m_itpTrains = new InterlockingPathTrain[0];
    for (i = 0; i < trainProperties.CountTags(); ++i)
    {
      Soup trainData = trainProperties.GetNamedSoup(trainProperties.GetIndexedTagName(i));
      GameObjectID trainID = trainData.GetNamedTagAsGameObjectID("train-id");

      if (!trainID)
      {
        Train train = cast<Train>(LegacyLoadGameObjectFromName(trainData.GetNamedTag("train")));
        if (train)
          trainID = train.GetGameObjectID();
      }

      if (trainID)
      {
        m_itpTrains[i] = new InterlockingPathTrain();
        m_itpTrains[i].m_trainID = trainID;
        m_itpTrains[i].m_bIsCurrentlyOnPath = trainData.GetNamedTagAsBool("on-path", false);
      }
      else
      {
        DebugLog("InterlockingTowerPath.SetProperties> ERROR: Failed to load interlocking train for " + m_itpPathName, 1);
      }
    }

    m_itpHasPathRtnState = properties.GetNamedTagAsBool("has-rtn-state", m_itpHasPathRtnState);

    int visualisationsCount = properties.GetNamedTagAsInt("visualisations");
    EnablePathVisualisation(visualisationsCount > 0, visualisationsCount > 1);

    PostMessage(me, "InterlockingTowerPath", "UpdatePathState", 0.5f);
  }


  // Obsolete functions which may be used by a small number of old scripts. Do not add code which calls
  // these functions. Any code which does call them may not work as expected and should be updated if possible.
  public obsolete MapObject GetIndexedPathDefinitionObject(int index) { return GetIndexedPathDefinitionMapObject(null, index); }
  public obsolete MapObject GetIndexedExternalRequirementObject(int index) { return GetIndexedExternalRequirementMapObject(null, index); }
  public obsolete float IsObjectOnPath(MapObject obj) { return IsObjectOnPath(null, obj); }
  public obsolete float IsObjectOnOrBeyondPath(MapObject obj) { return IsObjectOnOrBeyondPath(null, obj); }
  public obsolete Signal GetPathEntrySignal() { return GetPathEntrySignal(null); }
  public obsolete Signal GetPathExitSignal() { return GetPathExitSignal(null); }
  obsolete bool SetObjectStateForActivation(InterlockingObject obj) { return SetObjectStateForActivation(null, obj); }
  obsolete bool SetObjectStateForCancellation(InterlockingObject obj) { return SetObjectStateForCancellation(null, obj); }
  public TrackCircuitBlock[] ListOccupiedTrackCircuitBlocks(bool bIncExt) { return ListOccupiedTrackCircuitBlocks(null, bIncExt); }


  // PropertyObject functions to allow 3rd party propertiy edits via InterlockingTowerEditHelper.
  // Override these if you need to add player configurable options to a custom tower script.
  public string GetDescriptionHTML() { return ""; }
  public string GetPropertyName(string pId) { return ""; }
  public string GetPropertyDescription(string pId) { return ""; }
  public string GetPropertyType(string pId) { return ""; }
  public string GetPropertyValue(string pId) { return ""; }
  public string[] GetPropertyElementList(string pId) { return new string[0]; }
  public void SetPropertyValue(string pId, string value) { }
  public void SetPropertyValue(string pId, float value) { }
  public void SetPropertyValue(string pId, int value) { }
  public void SetPropertyValue(string pId, string value, int index) { }
  public void LinkPropertyValue(string pId) { }

};

