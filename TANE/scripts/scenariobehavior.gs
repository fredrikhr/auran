//
// ScenarioBehavior.gs
//
//  Copyright (C) 2003-2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "TrainzGameObject.gs"
include "PropertyObject.gs"
include "Requirement.gs"


//! An independent scripted scenario behavior (i.e. session rule).
//
// The ScenarioBehavior class is the base class for a rule scriptlet.  Rules are configurable 
// scripted behaviors that can be added to a session in Surveyor.  A session has its own property
// settings for each included rule.
//
// The idea is that the session will pass in its custom data to the rule when it launches and the
// rule will be able to use that configuration data to do something useful for the session.  The
// scope of what rule scriptlet can do is not very restrictive and very much left to the script
// programmer to do what they want.
//
// Rule scripts differ from other scripted assets in that they do not have a specific game world 
// item associated with them like a mesh for example.  Rather, they exist as independent assets that
// consist of only script code and an icon.  That being said, a rule script is considered an asset
// in its own right as it has a name, type and KUID like all other %Trainz assets do.
//
// The <b TRS2006 Sessions & Rules Guide> (which will be released sometime late 2005) provides a 
// comprehensive overview of how rules behave in a session as well as details on the Auran-authored
// rules.  Understanding the flowcharts and logic of the various rules will be highly beneficial to
// those wishing to write their own rule scripts.  Also note that the <l astSrcRule  source code> 
// for all of the Auran rules is provided with this documentation.
//
// See Also:
//     ConditionalScenarioBehavior, PropertyObject, World::CreateBehavior(), World::GetBehaviors()
//
class ScenarioBehavior isclass TrainzGameObject, PropertyObject
{
  //! Pause or un-pause this behavior.
  //
  // This method is called by %Trainz to update the rule on its paused state and the programmer can
  // implement their own version as needed.  A behavior may be paused when %Trainz is shutting down
  // the session for instance.
  //
  // It is through Pause() that the rule's actions are initiated.  For instance, the rule is 
  // un-paused as the session is launched in Driver.  From there, you can start a thread or call a 
  // method to perform what actions you want your rule to have.
  //
  // Note:
  //     As <l ScenarioBehavior::Pause  Pause>() is called from native %Trainz code, you <bi CANNOT>
  //     <l GameObject::Sleep  Sleep>(), <l gscLangKeyWait  wait()> or 
  //     <l GameObject::SendMessage  send messages> in this method.  This is why 
  //     <l GameObject::PostMessage  PostMessage>() has to be used instead if a message needs to be
  //     sent.
  //
  // Param:  pause  Use true to pause this behavior, false to un-pause (start) it.
  //
  public void Pause(bool pause) {}


  //! \name   Behavior State Flags
  //  \anchor behaveState
  //@{
  //! Flags describing the current state of a behavior.
  //
  // See Also:
  //     ScenarioBehavior::GetStateFlags(), ScenarioBehavior::IsComplete(), ScenarioBehavior::IsPaused(),
  //     ScenarioBehavior::Reset(), ScenarioBehavior::SetComplete(), ScenarioBehavior::WasComplete()
  //

  public define int NONE = 0;           //!< No other flags set.
  public define int PAUSED = 1;         //!< This behavior is currently paused.
  public define int COMPLETE = 2;       //!< This behavior is complete.
  public define int WAS_COMPLETE = 4;   //!< This behavior was complete some time previously.
  public define int DOES_COMPLETE = 8;  //!< This behavior is capable of reaching a <n COMPLETE> state.

  //@}


  int stateFlags = PAUSED;

  int m_minChildren = -1;
  int m_maxChildren = -1;


  //! Gets the current \ref behaveState "state flags" of this behavior object.
  //
  // Returns:
  //     Returns the current \ref behaveState "state flags" of this behavior.
  //
  // See Also:
  //     \ref behaveState "Behavior State Flags"
  //
  public int GetStateFlags(void) { return stateFlags; }

  //! Sets the complete state of this behavior.
  //
  // Param:  isComplete  If true, the \ref behaveState "COMPLETE" flag is set to indicate this
  //                     behavior is complete.
  //
  public void SetComplete(bool isComplete);

  //! Gets the completed state of the behavior.
  //
  // Returns:
  //     Returns true if this behavior is complete (i.e. the \ref behaveState "COMPLETE" flag is
  //     set), false otherwise.
  //
  public bool IsComplete(void);

  //! Gets the was-complete state of this behavior.
  //
  // Returns:
  //     Returns true if this behavior was complete (i.e. the \ref behaveState "WAS_COMPLETE" flag
  //     is set), false otherwise.
  //
  public bool WasComplete(void);

  //! Determines if this behavior is paused.
  //
  // Returns:
  //     Returns true if this behavior is paused (i.e. the \ref behaveState "WAS_COMPLETE" flag is
  //     set), false otherwise.
  //
  public bool IsPaused(void) { return (stateFlags & PAUSED) != 0; }

  //! Sets the state of the specified flags for this behavior.
  //
  // Param:  flags  State to set the flags to.  Use the \ref behaveState "behavior state flags" for
  //                this argument.
  // Param:  set    If true, the flags specified in the <i flags> argument will be set, false to
  //                disabled them (i.e. switch off).
  //
  // See Also:
  //     \ref behaveState "Behavior State Flags"
  //
  void SetStateFlags(int flags, bool set);


  //
  // PropertyObject methods
  //

  //! Instructs this behavior object to re-initialize its data properties with the given database.
  //
  // This method is called by %Trainz to initialize a rule with custom data from a session.
  // ScenarioBehavior has it's own implementation so that the behavior's state flags can be 
  // initialized from the database.
  //
  // When initializing the properties in custom behavior classes, the scriptlet programmer must 
  // explicitly call this ScenarioBehavior method so that the saved behavior state flags in
  // <i soup> can be used to initialize the behavior.  This is done by using the 
  // <l gscLangKeyInherit  inherited> keyword, for example:
  // 
  //<code>
  //public void SetProperties(Soup soup)
  //{
  //  inherited(soup);  //# call overridden ScenarioBehavior.SetProperties()
  //
  //  dataMember1 = soup.GetNamedTagAsInt("MyCustomBehavior.dataproperty1");
  //}</code>
  //
  // Note how <l gscLangKeyInherit  inherited> accepts the arguments for the overridden method it
  // is calling.
  //
  // Param:  soup  Database to initialize this behavior object with.
  //
  public mandatory void SetProperties(Soup soup);

  //! Gets the current properties database of this behavior object.
  //
  // This method is generally used in order to save a behavior as a session rule in Surveyor.
  // ScenarioBehavior has it's own implementation so that the behavior's state flags can be saved
  // in the returned database.
  //
  // When saving the properties in custom behavior classes, the scriptlet programmer must 
  // explicitly call this ScenarioBehavior method so that the current behavior state flags can
  // be saved and returned along with the other custom properties.  This is done by using the
  // <l gscLangKeyInherit  inherited> keyword.  For example:
  //
  //<code>
  //public Soup GetProperties(void)
  //{
  //  Soup soup = inherited();  //# call overridden ScenarioBehavior.GetProperties()
  //
  //  soup.SetNamedTag("MyCustomBehavior.dataproperty1", dataMember1);
  //
  //  return soup;
  //}</code>
  //
  // Note how <l gscLangKeyInherit  inherited> handles the return value of a called overridden
  // method.  As the flag settings are now in <m soup>, we can now add our own data and return it.
  //
  // Returns:
  //     Returns a private descriptor for the current properties in use by this behavior.
  //
  public mandatory Soup GetProperties(void);


  //! Gets the requirements of this behavior.
  //
  // This method is called by %Trainz to determine the product requirements of a behavior (if any)
  // so a waybill listing drop-off/pickup requirements can be displayed to the user.  As this 
  // default implementation in ScenarioBehavior only returns an empty array, the scriptlet 
  // programmer must implement their own overridden version if they want their behavior rule to
  // provide requirements data for waybills.
  //
  // Note:
  //     This method shouldn't be called on a ScenarioBehavior object that <l IsPaused() is paused>.
  //
  // Returns:
  //     Returns an array of requirements this industry has.  The default ScenarioBehavior class
  //     implementation returns an empty array.
  //
  // See Also:
  //     ResourceRequirement
  //
  public Requirement[] GetRequirements(void) { Requirement[] ret; return ret; }


  //! Gets the child behaviors under this one (i.e. the ones immediately below this one in the Surveyor Rules Editor.
  //
  // Returns:
  //     Returns an array of this behavior's child behaviors.
  //
  public native ScenarioBehavior[] GetChildBehaviors(void);


  //=============================================================================
  // Name: AreAllChildrenComplete
  // Desc: Returns whether all child rules are complete
  //=============================================================================
  public bool AreAllChildrenComplete();


  //! Gets the parent behavior of this behavior.
  //
  // Returns:
  //     Returns the parent behavior if any or null if this is a top-level behavior.
  //
  public native ScenarioBehavior GetParentBehavior(void);


  //! Called to completely reset this behavior.
  //
  // This method clears the \ref behaveState "COMPLETE" and \ref behaveState "WAS_COMPLETE" flags.
  //
  public void Reset(void);


  //! Gets a short text description of this rule behavior.
  //
  // This method is called by %Trainz to get a piece of descriptive text of this particular rule 
  // instance to display next to the rule's icon in the Surveyor Edit Session window.  A basic 
  // default implementation is provided but you will need to provide your own implementation if 
  // you want anything fancier like a rule description generated from the rule's configuration.
  //
  // Returns:
  //     The default ScenarioBehavior implementation of this method returns whatever the string 
  //     table item named <m "description"> for this rule's <l GetAsset()  asset> has, otherwise a
  //     blank string (<m"">) is returned.
  //
  public string GetDescription(void);


  //! Gets any asset dependencies that are specific to this rule instance.
  //
  // This method is called by %Trainz to determine the asset dependencies of this rule.  Specifically,
  // this is for listing dependencies on KUIDs that are stored within the session's saved properties
  // data, as %Trainz has no other way to know of these dependencies.
  //
  // Param:  io_dependencies  List of KUIDs to append this rule's dependencies to.  You should
  //                          <l KUIDList::AddKUID()  add> to this list and not replace/overwrite 
  //                          existing list items it may have.
  //
  // See Also:
  //     KUIDList::AddKUID()
  //
  public void AppendDependencies(KUIDList io_dependencies);



  // ============================================================================
  // Name: GetDebugString
  // Desc: Returns a human-readable string identifying this ScenarioBehavior.
  //       Used for debugging purposes. The exact contents of this string may
  //       vary based on the class of this object and the Trainz version. Do not
  //       attempt to machine-parse this value.
  // Retn: The human-readable string identifying this ScenarioBehavior.
  // ============================================================================
  public string GetDebugString(void);


  // ============================================================================
  // Name: SetSessionString
  // Desc: SURVEYOR ONLY - Creates a localisable string-table entry in the 
  //       current session asset with the tag and English value passed. This
  //       should be used in any situation where a session creator is required
  //       to enter player visible text. The KUID for this ScenarioBehaviour will
  //       be prepended to the tag when the config.txt is updated.
  //       Use the GetSessionString() function to retrieve the string for display
  // Parm: tag - A unique identifier by which to refer to this string
  // Parm: value - The English value for this string
  // ============================================================================
  native void SetSessionString(string tag, string value);

  // ============================================================================
  // Name: GetSessionString
  // Desc: Returns a session string-table entry created by this asset using the 
  //       SetSessionString() function. If present the string for the currently
  //       active local will be returned, otherwise the english value will be
  //       returned. If no string with the specified tag exists for this asset
  //       then an empty string will be returned.
  // Parm: tag - The unique identifier by which to refer to this string
  // ============================================================================
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



  //
  // IMPLEMENTATION
  //


  public bool IsComplete(void)
  {
    return (stateFlags & COMPLETE) > 0;
  }


  public bool WasComplete(void)
  {
    return (stateFlags & WAS_COMPLETE) > 0;
  }


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
            // this is a PostMessage rather than a SendMessage so that SetComplete() can
            // be called from the static thread (ie. inside a handler)
          PostMessage(parent, "ScenarioBehavior", "Touch", 0.0);
        }
      }
    }
  }


  void SetStateFlags(int flags, bool set)
  {
    int wasStateFlags = stateFlags;
    
    if (set)
      stateFlags = stateFlags | flags;
    else 
      stateFlags = stateFlags & ~flags;

    //if (stateFlags != wasStateFlags)
    //  Interface.Log(GetDebugString() + " changing from state " + wasStateFlags + " to state " + stateFlags);
  }


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


  public mandatory Soup GetProperties(void)
  {
    Soup soup = inherited();

    soup.SetNamedTag("ScenarioBehavior.StateFlags", stateFlags);

    return soup;
  }


  // ============================================================================
  // Name: GetSessionProperties
  // Desc: Retrieve any data this rule wishes to store in the config.txt of the
  //       session, to be made available to script outside of the session
  //       - i.e.  while it is not running.
  // Retn: Soup form of rule-data container to be written.
  // NOTE: Called by native code while saving a session.
  // ============================================================================
  public Soup GetSessionProperties(void)
  {
    Soup soup = Constructors.NewSoup();

    return soup;
  }


  public void Reset(void)
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


  public string GetDescription(void)
  {
    // OVERRIDE THIS AS REQUIRED

    return GetAsset().GetStringTable().GetString("description");
  }

  public void AppendDependencies(KUIDList io_dependencies)
  {
    // ALWAYS INHERIT THIS FUNCTION
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

