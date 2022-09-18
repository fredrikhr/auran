//=============================================================================
// File: ScenarioBehavior.gs
// Desc: 
//=============================================================================
include "TrainzGameObject.gs"
include "PropertyObject.gs"
include "Requirement.gs"



//=============================================================================
// Name: ScenarioBehavior
// Desc: The ScenarioBehavior class is the base class for a session rule. Rules
//       are configurable scripted objects that can be added to a session in
//       Surveyor, in order to perform some gamplay function.
//       Rule scripts differ from other scripted assets in that they do not
//       have a specific game world item associated with them (like a mesh for
//       example). Rather, they exist only as script code, are mostly
//       'invisible' to the end player (though they can create objects of their
//       own, show dialogs, play sounds, etc etc).
//=============================================================================
class ScenarioBehavior isclass TrainzGameObject, PropertyObject
{
  //=============================================================================
  // Desc: Possible state flags for session behaviours. See GetStateFlags,
  //       SetStateFlags, IsComplete, etc for more info.
  public define int NONE = 0;           // No flags set.
  public define int PAUSED = 1;         // This behavior is currently paused.
  public define int COMPLETE = 2;       // This behavior is complete.
  public define int WAS_COMPLETE = 4;   // This behavior was complete some time previously.
  public define int DOES_COMPLETE = 8;  // This behavior is capable of reaching a <n COMPLETE> state.

  int               stateFlags = PAUSED;
  int               m_minChildren = -1;
  int               m_maxChildren = -1;


  //=============================================================================
  // Name: Pause
  // Desc: Pauses or un-pauses this behavior. This is called either by Trainz
  //       native code or this behavior's parent. When called this rule should
  //       begin or stop whatever it is configured to do. e.g. Once Pause(false)
  //       is called on a "Wait" behaviour, the behaviour would wait for the
  //       configured amount of time, and then execute its children.
  //=============================================================================
  public void Pause(bool pause) { }


  //=============================================================================
  // Name: SetComplete
  // Desc: Sets this rule as complete. This should be called on any rule that can
  //       reach a state where it is no longer doing anything, once it reaches
  //       that state. If this rule executes children, then this should not be
  //       called until all children have completed.
  //=============================================================================
  public void SetComplete(bool isComplete);


  //=============================================================================
  // Name: IsComplete
  // Desc: Returns whether this behavior is currently complete/
  //=============================================================================
  public bool IsComplete(void) { return (stateFlags & COMPLETE) > 0; }


  //=============================================================================
  // Name: 
  // Desc: Returns whether this behavior was ever complete (or has the flag)/
  //=============================================================================
  public bool WasComplete(void) { return (stateFlags & WAS_COMPLETE) > 0; }


  //=============================================================================
  // Name: IsPaused
  // Desc: Returns whether this behavior is paused.
  //=============================================================================
  public bool IsPaused(void) { return (stateFlags & PAUSED) != 0; }


  //=============================================================================
  // Name: GetStateFlags
  // Desc: Gets the current state flags for this behavior object.
  //=============================================================================
  public int GetStateFlags(void) { return stateFlags; }


  //=============================================================================
  // Name: SetStateFlags
  // Desc: Sets the state of the specified flags for this behavior.
  //=============================================================================
  void SetStateFlags(int flags, bool set);


  //=============================================================================
  // Name: GetProperties
  // Desc: Returns a Soup database describing the current state of this rule.
  //       Inheriting classes should override this to save all rule state. This
  //       includes the Surveyor configuration, and and Driver runtime state, as
  //       this function is used for saving sessions/profiles, and for savegames.
  //=============================================================================
  public mandatory Soup GetProperties(void);

  //=============================================================================
  // Name: SetProperties
  // Desc: Configures this rule state using a Soup database created by a previous
  //       call to GetProperties (see above). This call should restore all data,
  //       start any necessary threads, add handlers, etc such that the rule can
  //       continue execution in whatever state it was previously.
  //=============================================================================
  public mandatory void SetProperties(Soup soup);


  //=============================================================================
  // Name: GetRequirements
  // Desc: Returns the resource requirements of this rule. This is called by
  //       Trainz native code to determine the product requirements of a behavior
  //       (if any) so a waybill listing drop-off/pickup requirements can be
  //       displayed to the user.
  //=============================================================================
  public Requirement[] GetRequirements(void) { Requirement[] ret; return ret; }


  //=============================================================================
  // Name: GetChildBehaviors
  // Desc: Gets the child behaviors under this one i.e. the ones immediately
  //       below this one in the Surveyor Rules Editor.
  //=============================================================================
  public native ScenarioBehavior[] GetChildBehaviors(void);


  //=============================================================================
  // Name: AreAllChildrenComplete
  // Desc: Returns whether all child rules are complete
  //=============================================================================
  public bool AreAllChildrenComplete();


  //=============================================================================
  // Name: GetParentBehavior
  // Desc: Returns the parent of this rule in the rules list (ie, the rule that
  //       will/should execute it. Will return null for "top level" rules.
  //=============================================================================
  public native ScenarioBehavior GetParentBehavior(void);


  //=============================================================================
  // Name: Reset
  // Desc: Resets the complete and was-complete flags for this rule.
  //=============================================================================
  public mandatory void Reset(void);


  //=============================================================================
  // Name: GetDescription
  // Desc: Gets a short text description of this session rule, for display in the
  //       rules list. This should at least contain a basic overview of what the
  //       rule does, but may also reference specific configured objects etc.
  // Retn: string - The text describing this rule. Basic html markup is supported
  //       but do not include images, embedded objects, etc.
  //=============================================================================
  public string GetDescription(void);


  //=============================================================================
  // Name: AppendDependencies
  // Desc: Gets any asset dependencies that are specific to this rule instance.
  //       This method is called by Trainz to determine the asset dependencies of
  //       this rule instance, as configured by the player in Surveyor.
  //       Inheriting scripts should override this to add assets that the player
  //       may configure/select, e.g. html assets, sounds, textures.
  //=============================================================================
  public void AppendDependencies(KUIDList io_dependencies) { }


  //=============================================================================
  // Name: GetDebugString
  // Desc: Returns a human-readable string identifying this ScenarioBehavior.
  //       Used for debugging purposes. The exact contents of this string may
  //       vary based on the class of this object and the Trainz version. Do not
  //       attempt to machine-parse this value.
  // Retn: The human-readable string identifying this ScenarioBehavior.
  //=============================================================================
  public string GetDebugString(void);


  //=============================================================================
  // Name: SetSessionString
  // Desc: SURVEYOR ONLY - Creates a localisable string-table entry in the 
  //       current session asset with the tag and English value passed. This
  //       should be used in any situation where a session creator is required
  //       to enter player visible text. The KUID for this ScenarioBehaviour will
  //       be prepended to the tag when the config.txt is updated.
  //       Use the GetSessionString() function to retrieve the string for display
  // Parm: tag - A unique identifier by which to refer to this string
  // Parm: value - The English value for this string
  //=============================================================================
  native void SetSessionString(string tag, string value);

  //=============================================================================
  // Name: GetSessionString
  // Desc: Returns a session string-table entry created by this asset using the 
  //       SetSessionString() function. If present the string for the currently
  //       active local will be returned, otherwise the english value will be
  //       returned. If no string with the specified tag exists for this asset
  //       then an empty string will be returned.
  // Parm: tag - The unique identifier by which to refer to this string
  //=============================================================================
  native string GetSessionString(string tag);


  //=============================================================================
  // Name: IsCorrectlyConfigured
  // Desc: Called by native code in Surveyor to test whether this rule has been
  //       correctly configured by the player. If it returns false Surveyor will
  //       show a visual indication to the player that the setup needs action.
  // Retn: bool - true if this rule is correctly configured.
  //=============================================================================
  public bool IsCorrectlyConfigured()
  {
    if (m_minChildren > 0 or m_maxChildren >= 0)
    {
      int numChildren = GetChildBehaviors().size();
      if (numChildren < m_minChildren or numChildren > m_maxChildren)
        return false;
    }

    return true;
  }


  //=============================================================================
  // Name: SetChildrenLimits
  // Desc: Sets the limits on the number of children this rule can have. Rules
  //       configured in Surveyor with more than the max or less that the minimum
  //       will display as incorrectly configured (via IsCorrectlyConfigured()).
  // Parm: minChildren - The minimum number of children required
  // Parm: maxChildren - The maximum number of children allowed, or -1 for no max
  //=============================================================================
  public void SetChildrenLimits(int minChildren, int maxChildren)
  {
    if (m_maxChildren >= 0 and m_maxChildren < m_minChildren)
      return;

    m_minChildren = minChildren;
    m_maxChildren = maxChildren;
  }


  //=============================================================================
  // Name: GetChildRelationshipIcon
  // Desc: Called by native code in Surveyor to get an icon to indicate the
  //       relationship of a child rule to its parent (this rule). This is for
  //       Surveyor display purposes only and provides no rule functionality.
  // Parm: child - The child of this rule to get the relationship for
  // Retn: string - Either:
  //                * "none" > The child is not used by this rule in any way
  //                * "simultaneous" > Rule is a child, and all children are
  //                  executed simultaneously on completion
  //                * A positive integer, representing the order in which a
  //                  child rule will be executed by the parent on completion
  //                  (e.g., "1" is first, "2" is second, etc.)
  //                * A path to a custom icon file within this rule assets dir
  //                * A KUID for a custom texture asset
  //=============================================================================
  public string GetChildRelationshipIcon(ScenarioBehavior child) { return ""; }


  //=============================================================================
  public void SetComplete(bool isComplete)
  {
    int wasStateFlags = stateFlags;

    if (isComplete)
      SetStateFlags(COMPLETE | WAS_COMPLETE, true);
    else
      SetStateFlags(COMPLETE, false);

    // Have we changed state?
    if (stateFlags != wasStateFlags)
    {
      // If we've become paused, suppress any "Touch" messages that
      // might already be in flight. This shouldn't really be necessary but
      // we may as well be agressive about protecting rules from spurious
      // input in case they don't do a thorough job of protecting themselves.
      if ((stateFlags & PAUSED) and !(wasStateFlags & PAUSED))
        ClearMessages("ScenarioBehavior", "Touch");
      
      // Notify our parent of any changes.
      ScenarioBehavior parent = GetParentBehavior();
      if (parent)
      {
        // Sanity check: don't pass messages to Paused parents, in case they don't correctly
        // check whether they're paused before acting on the message.
        if (!parent.IsPaused())
        {
          // This is a PostMessage rather than a SendMessage so that SetComplete()
          // can be called from the static thread (ie. inside a handler)
          PostMessage(parent, "ScenarioBehavior", "Touch", 0.0);
        }
      }
    }
  }


  //=============================================================================
  void SetStateFlags(int flags, bool set)
  {
    if (set)
      stateFlags = stateFlags | flags;
    else 
      stateFlags = stateFlags & ~flags;
  }


  //=============================================================================
  public mandatory void SetProperties(Soup soup)
  {
    inherited(soup);
    stateFlags = soup.GetNamedTagAsInt("ScenarioBehavior.StateFlags", PAUSED);
    
    //Interface.Log(GetDebugString() + " loading with state " + stateFlags);
    
    // It's feasible that a "Touch" message could have been in flight when the session was saved. In-flight
    // script messages are not saved, so this would be lost when the session is reloaded. Forcing a "Touch"
    // message here can mitigate that problem, and should not have any negative side-effects since rules are
    // supposed to be safe against receiving spurious "Touch" messages.
    if (!IsComplete() and !IsPaused())
      PostMessage(me, "ScenarioBehavior", "Touch", 0.0);
  }

  //=============================================================================
  public mandatory Soup GetProperties(void)
  {
    Soup soup = inherited();
    soup.SetNamedTag("ScenarioBehavior.StateFlags", stateFlags);
    return soup;
  }


  //=============================================================================
  // Name: GetSessionProperties
  // Desc: Retrieve any data this rule wishes to store in the config.txt of the
  //       session, to be made available to script outside of the session (i.e.
  //       when it is not running), such as in a menu etc.
  // Retn: Soup form of rule-data container to be written.
  //=============================================================================
  public Soup GetSessionProperties(void)
  {
    return Constructors.NewSoup();
  }

  //=============================================================================
  public mandatory void Reset(void)
  {
    SetStateFlags(COMPLETE | WAS_COMPLETE, false);
  }


  //=============================================================================
  // Name: AreAllChildrenComplete
  // Desc: Returns whether all child rules are complete
  //=============================================================================
  public bool AreAllChildrenComplete()
  {
    int i;
    ScenarioBehavior[] children = GetChildBehaviors();
    for (i = 0; i < children.size(); i++)
      if (!children[i].IsComplete())
        return false;

    return true;
  }


  //=============================================================================
  // Name: GetDescription
  // Desc: Gets a short text description of this rule behavior.
  //=============================================================================
  public string GetDescription(void)
  {
    // Override this as required
    return GetAsset().GetStringTableCached().GetString("description");
  }



  // ============================================================================
  // Name: GetDebugString
  // Desc: Returns a human-readable string identifying this ScenarioBehavior.
  //       Used for debugging purposes. The exact contents of this string may
  //       vary based on the class of this object and the Trainz version. Do not
  //       attempt to machine-parse this value.
  // Retn: The human-readable string identifying this ScenarioBehavior.
  // ============================================================================
  public string GetDebugString(void)
  {
    ScenarioBehavior parent = GetParentBehavior();
    string behaviorIndexString = "unknown";
    string prefixString = "";
    ScenarioBehavior[] behaviorList;
    int behaviorIndex;
    
    if (parent)
    {
      behaviorList = parent.GetChildBehaviors();
      prefixString = parent.GetDebugString() + ".";
    }
    else
    {
      behaviorList = World.GetBehaviors();
    }
    
    if (behaviorList)
    {
      for (behaviorIndex = 0; behaviorIndex < behaviorList.size(); ++behaviorIndex)
      {
        if (behaviorList[behaviorIndex] == me)
        {
          behaviorIndexString = (string)behaviorIndex;
          break;
        }
      }
    }
    
    
    return prefixString + GetGSClassName() + "(index=" + behaviorIndexString + ",id=" + GetDebugName() + ")";
  }
};

