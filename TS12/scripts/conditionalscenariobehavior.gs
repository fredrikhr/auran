//
// ConditionalScenarioBehavior.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "ScenarioBehavior.gs"


//! A conditional rule behavior template class that includes child rule support.
//
// This class provides conditional behavior extensions for session rules and basic management of child rules
// that make it easier for the programmer to create a rule.
//
// There are two different modes a ConditionalScenarioBehavior-derived rule can operate in: polled and 
// un-polled.  
//
//
// <bi Polled Mode><br>
// In polled mode, the rule runs a polling thread that waits for something to happen/reach a certain state.
// When the required event has happened, all child rules will be started and once they have all finished,
// this parent rule will complete itself. 
// 
// A conditional rule that runs in polled mode is made by overriding Init() and implementing GetConditionResult().  
// The Init() method needs to be overridden so that the <l ConditionalScenarioBehavior::m_pollingBehavior  m_pollingBehavior>
// flag can be set to true.  Further details on this are in the Init() method's description.
//
// GetConditionResult() will be used by the <l ThreadPollCondition()  polling thread> to determine if the
// conditions required for the rule to be 'activated' are met.  When GetConditionResult() does return true,
// all of the child rules (if any) are started.  Once the child rules have completed, this rule will complete
// itself.
//
//
// <bi Un-polled Mode><br>
// When not running in polled mode, a conditional behavior rule behaves as a simple 'use-once action' rule
// where once un-paused, GetConditionResult() is called to do the rule's work.  If it returns true, the child
// rules will be run through to completion and this rule will complete itself.  If GetConditionResult() 
// returns false, the rule will just complete itself without doing anything else.
//
//
// <bi Examples><br>
// All of the following rules use the ConditionalScenarioBehavior class:
//  - <l astSrcRuleConstChk            Consist Check>
//  - <l astSrcRuleResourceCheck       Resource Check>
//  - <l astSrcRuleTriggerCheck        Trigger Check>
//  - <l astSrcRuleVariableCheck       Variable Check>
//  - <l astSrcRuleDisablIconNotif     Disabled HUD Icon Notification>
//  - <l astSrcRuleDrivCmdChk          Driver Command Check>
//  - <l astSrcRuleMultJuncCheck       Multiple Junction Alignment Check>
//  - <l astSrcRuleMultResrcCheck      Multiple Resource Check>
//  - <l astSrcRuleWaitCamera          Wait for Camera View Mode>
//  - <l astSrcRuleWaitHUDIconClick    Wait for Click on HUD Icon>
//  - <l astSrcRuleWaitDerail          Wait for Derailment>
//  - <l astSrcRuleWaitDriverOnOff     Wait for Driver On/Off Train>
//  - <l astSrcRuleWaitHTMLPages       Wait for HTML Pages>
//  - <l astSrcRuleWaitMinimap         Wait on Minimap Screen/Main Screen>
//  - <l astSrcRuleWaitTrainStopStart  Wait on Train Stop/Start>
//  - <l astSrcRuleWaitWaybill         Wait on Waybill Screen/Main Screen>
//
// See Also:
//     ScenarioBehavior
//
class ConditionalScenarioBehavior isclass ScenarioBehavior
{
	//! Pauses all of the child rules.
	//
	// This method pauses all of the <l GetChildBehaviors()  child rules> by calling 
	// <l ScenarioBehavior::Pause  Pause>(true) on each one.
	//
	// Note:
	//     Use UnpauseChildren() to un-pause the child rules.
	//
	void PauseChildren(void);

	//! Resets all of the child rules.
	//
	// This method iterates through all the <l GetChildBehaviors()  child rules> and calls Reset() on each one.
	//
	void ResetChildren(void);

	//! Updates the child rules.
	//
	// This method is used to handle and update the child rules.
	//
	// When called, if this rule is not <l IsComplete()  complete> or <l IsPaused() paused>, any child rule
	// that hasn't been run will be started.  If the child rules have completed, this method will complete
	// this rule.
	//
	// Param:  notUsed  Dummy argument that serves no purpose.
	//
	void UpdateChildren(Message notUsed);

	//! Action/verification method that <bi must> be implemented by the programmer to make a conditional rule.
	//
	// This is the method of the conditional rule that the script programmer must implement.  What this method
	// does is largely up to the programmer.  Depending on whether this rule is running in 
	// <l ConditionalScenarioBehavior::m_pollingBehavior  polled mode> or not determines how you will go about
	// programming this method.
	//
	// If the conditional rule is running in polled mode, then ThreadPollCondition() will keep calling this
	// method every second to see if the rule's conditions are satisfied.  Your implementation should return 
	// true if the conditions of your rule have been satisfied so ThreadPollCondition() knows when it can move
	// on and run the child rules etc.
	//
	// If the conditional rule is not running in polled mode, this method will be called by ExecuteRule() just
	// once to perform the rule's required actions.  If true is returned (i.e. the actions were successful),
	// the child rules will be run.  Otherwise this rule will be completed without doing anything further.
	//
	// Returns:
	//     Should return true if the rule's conditions are satisfied, false otherwise.
	//
	bool GetConditionResult(void);

  //! Gets this rule up and running.
  //
  // This method is called by Pause() if the rule is being un-paused to get the rule running.
  //
  // If <l ConditionalScenarioBehavior::m_pollingBehavior  polling behavior> is enabled for this conditional
  // rule, the ThreadPollCondition() is called to start the main polling thread.
  //
  // If <l ConditionalScenarioBehavior::m_pollingBehavior  polling behavior> is not enabled and this rule's 
  // conditions are satisfied (i.e. GetConditionResult() returns true), all child rules will be reset with 
  // ResetChildren() and started by calling UpdateChildren().
  //
  // Otherwise, the child rules will be paused by calling PauseChildren() and this rule completes itself by
  // calling <l SetComplete()  SetComplete>(true).
  //
  void ExecuteRule(void);


	//! Indicates whether this rule has polling behavior or not.
	//
	// Set this member to true in your overridden Init() or SetProperties() method to enable polling 
	// behavior in your rule.  See the main class description for more details on polling behavior.
	//
	bool m_pollingBehavior = false;

	//! Flag that indicates if the ThreadPollCondition() method is running or not.
	//
	// This data member is for internal use only.  Use it to determine if the polling thread is  running but 
	// <bi DO NOT> play around with or set this value yourself unless you really know what you are doing!
	//
	bool m_pollingThreadRunning = false;

  //! Indicates that SetProperties() is to re-start the main thread if needed
  //
  // Allows your rule to be more save/load capable.  See SetProperties() for further details.
  //
  bool m_saveLoadRestart = false;
  
  
  // We need to persist this across a save, so that we don't reset the state of the child rules.
  bool m_bIsConditionalScenarioBehaviorFlagged = false;
  bool m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = false;
  
  
  // 
  // Rule Configuration Options
  // 
  // The following options must be configured appropriately by the derived class to describe how it wants the ConditionalScenarioBehavior
  // to operate. These options are NOT saved/loaded by ConditionalScenarioBehavior itself, but instead should be configured in the derived
  // InitConditionalScenarioBehavior() function. If the derived class wishes to allow the user to modify any of theses settings, it is 
  // responsible for providing any user interface, and for saving/loading the values.
  //
  // Concepts:
  // State changes between Flagged and Deflagged are not evaluated while this rule is PAUSED.
  // This rule starts running its children when Flagged. If they were not already running, it may optionally RESET the children at this time.
  // This rule may optionally PAUSE or Reset its running children when Deflagged, and may optionally be marked COMPLETE at this time.
  // This rule is marked as COMPLETE when the last running child is marked COMPLETE.
  // This rule is marked as COMPLETE if Flagged and it has no children.
  // This rule is marked as NOT COMPLETE when Deflagged unless specified otherwise above.
  //
  
  void InitConditionalScenarioBehavior(void);
  
  bool m_bDoesConditionalScenarioBehaviorResetChildrenWhenStartingChildren = true;
  bool m_bDoesConditionalScenarioBehaviorPauseChildrenWhenDeflagged = false;
  bool m_bDoesConditionalScenarioBehaviorResetChildrenWhenDeflagged = false;
  bool m_bDoesConditionalScenarioBehaviorSetCompleteWhenDeflagged = false;
  
  // Used to flag and deflag this rule. Flagging starts the child rules and leads towards this rule
  // becoming set as Complete. Deflagging optionally pauses/resets the children and stops progressing
  // toward the Complete state (or jumps straight to the Complete state if set above.)
  bool FlagConditionalScenarioBehavior(void);
  bool DeflagConditionalScenarioBehavior(void);
  
  


	//! Main polling thread.
	//
	// Thread that runs the rule if <l ConditionalScenarioBehavior::m_pollingThreadRunning  polling mode> is 
	// enabled.  It will call GetConditionResult() result every second until GetConditionResult() returns
	// true.  From there, the child rules will be started and once complete, this thread will complete itself.
	//
	// This rule will complete once the child rules have complete themselves.
	//
	thread void ThreadPollCondition(void);


  //! Called (on a delay) after loading a saved session
  //
  void OnDelayedRestart(Message msg);


	//! Main rule initialization method.
	//
	// This method adds a handler to this object that will update all child rules (if any) when there has been
	// a change on any one of them.  UpdateChildren() is the handler method used for this update.
	//
	// If you want your conditional rule to support polling behavior, you will need to override this method and
	// set the <l ConditionalScenarioBehavior::m_pollingBehavior  m_pollingBehavior> flag to true.  Make sure
	// to call through to the overridden parent method with the <l gscLangKeyInherit  inherit> keyword as shown 
	// in the code example below:
	//
	//<code>
	//public void Init(Asset p_self)
	//{
	//  inherited(p_self);
	//
	//  m_pollingBehavior = true;
	//}
	//</code>
	//
	// If your rule is to have polling behavior and you want it to work with saved sessions, you will also need to
	// set <l ConditionalScenarioBehavior::m_saveLoadRestart  m_saveLoadRestart> flag to true.
	//
	// The Init() method is also where you should add any property handlers to your rule so it is configurable
	// in the Surveyor Edit Session window.
	//
	// Param:  p_self  Asset this rule is based on.
	// 
	public void Init(Asset p_self)
	{
		inherited(p_self);
		
		// if one of our children is updated, we want to know about it
		AddHandler(me, "ScenarioBehavior", "Touch", "UpdateChildren");
    AddHandler(me, "ConditionalScenarioBehavior", "DelayedRestart", "OnDelayedRestart");
    
    // Can't call this here, the parent may not be fully initialised and may access null.
    // InitConditionalScenarioBehavior();
	}


	//! Pause/un-pause this conditional behavior rule.
	//
	// If <i paused> does not differ from the previous <l IsPaused()  paused state> of this rule, this method 
	// will return straight away without doing anything.  Otherwise a change of pause state has occurred and
	// this method will react.
	//
	// If <i paused> is true (i.e. this rule is being paused from a previously un-paused state), PauseChildren()
	// will be called to pause any child rules.
	// 
	// If <i paused> is false (i.e. this rule is being un-paused from a previously paused state), ExecuteRule()
	// is called to go ahead and do get this rule running.
	//
	// Param:  paused  Paused state this rule is being switched to.
	//
	public void Pause(bool paused)
	{
		if (paused == IsPaused())
			return;

		SetStateFlags(PAUSED, paused);

		if (paused)
			PauseChildren();
		else
			ExecuteRule();
	}


  // documented above at method definition
  void ExecuteRule(void)
  {
    // polling thread behavior
    if (m_pollingBehavior)
    {
      if (!m_pollingThreadRunning)
        ThreadPollCondition();
    }

    // once-off (non-polling) behavior
    else if (GetConditionResult())
    {
      FlagConditionalScenarioBehavior();
      //ResetChildren();
      //UpdateChildren(null);
    }
    
    // otherwise pause children and self-complete
    else
    {
      PauseChildren();
      SetComplete(true);
    }

  }


	// Gets the result of the conditional test. Must be implemented if running this rule in polling mode.
	//
	// Note: documented above at method definition
	//
	bool GetConditionResult(void)
	{
		//
		// Subclasses should OVERRIDE this.
		//
		return true;
	}
  
  
  // Called by ThreadPollCondition when our condition becomes TRUE.
  bool FlagConditionalScenarioBehavior(void)
  {
    if (m_bIsConditionalScenarioBehaviorFlagged)
      return false;
    
    Interface.Log(GetDebugString() + "- Flagged conditional scenario behavior. ");
    
    // Transition from Deflagged to Flagged.
    m_bIsConditionalScenarioBehaviorFlagged = true;
    
    
    // if no children are running, then run them...
    if (!m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning)
    {
      m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = true;
      
      if (m_bDoesConditionalScenarioBehaviorResetChildrenWhenStartingChildren)
      {
        Interface.Log(GetDebugString() + "- Children were not running, so resetting them now. ");
        ResetChildren();
      }
    }
    
    // Update any children that might be running.
    UpdateChildren(null);
    
    return true;
  }
  
  
  // Called by ThreadPollCondition when our condition becomes FALSE.
  bool DeflagConditionalScenarioBehavior(void)
  {
    if (!m_bIsConditionalScenarioBehaviorFlagged)
      return false;
    
    Interface.Log(GetDebugString() + "- Deflagged conditional scenario behavior. ");
    
    // Transition from Flagged to Deflagged.
    m_bIsConditionalScenarioBehaviorFlagged = false;
    
    
    if (m_bDoesConditionalScenarioBehaviorResetChildrenWhenDeflagged)
    {
      Interface.Log(GetDebugString() + "- Resetting children.");
      PauseChildren();
      ResetChildren();

      // The children are no longer running, so deflag them as such.
      //  NOTE: This change is being made to fix an issue where loading a saved session
      //  triggers an unflagged rule to incorrectly unpause its child rules (LP5511395).
      //  The specific condition that triggers this is a rule that is flagged, later
      //  deflagged, and the game then saved. On load ScenarioBehaviour posts a "Touch"
      //  message causing this rule to call UpdateChildren and incorrectly start the
      //  children up again. Deflagging this var will prevent UpdateChildren from thinking
      //  the children should be running, hopefully there's no edge case where they should be.
      m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = false;
    }
    
    else if (m_bDoesConditionalScenarioBehaviorPauseChildrenWhenDeflagged)
    {
      Interface.Log(GetDebugString() + "- Pausing children.");
      PauseChildren();

      // The children are no longer running, so deflag them as such.
      //  NOTE: This change is being made to fix an issue where loading a saved session
      //  triggers an unflagged rule to incorrectly unpause its child rules (LP5511395).
      //  The specific condition that triggers this is a rule that is flagged, later
      //  deflagged, and the game then saved. On load ScenarioBehaviour posts a "Touch"
      //  message causing this rule to call UpdateChildren and incorrectly start the
      //  children up again. Deflagging this var will prevent UpdateChildren from thinking
      //  the children should be running, hopefully there's no edge case where they should be.
      m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = false;
    }
    
    if (m_bDoesConditionalScenarioBehaviorSetCompleteWhenDeflagged and !m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning)
    {
      Interface.Log(GetDebugString() + "- No children currently running. Flagging as complete.");
      SetComplete(true);
    }
    
    else if (!m_bDoesConditionalScenarioBehaviorSetCompleteWhenDeflagged)
    {
      if (IsComplete())
      {
        Interface.Log(GetDebugString() + "- Flagging as not complete. ");
        SetComplete(false);
      }
    }
    
    return true;
  }


  // documented above at method definition
  // May be overridden, but the derived function is then responsible for calling
  // FlagConditionalScenarioBehavior() and DeflagConditionalScenarioBehavior() and exiting
  // as appropriate.
  thread void ThreadPollCondition(void)
  {
    if (m_pollingThreadRunning)
      return;
    m_pollingThreadRunning = true;
    
    InitConditionalScenarioBehavior();
    
    //SetComplete(false);

    while (!IsPaused())
    {
      // do rule check
      if (GetConditionResult())
      {
        // rule satisfied
        // if no children are running, then run them...
        FlagConditionalScenarioBehavior();
      }
      else
      {
        // rule not satisfied
        // if children are running, then stop them...
        DeflagConditionalScenarioBehavior();
      }

      Sleep(1.0f);
    }

    m_pollingThreadRunning = false;
  }


  public void Reset(void)
  {
    Interface.Log(GetDebugString() + "- Reset. ");
    
    // Deflag and kill our children.
    m_bIsConditionalScenarioBehaviorFlagged = false;
    m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = false;
    
    // Perform the standard functionality.
    inherited();
  }


	// pause all our children
	void PauseChildren(void)
	{
		int i;
		ScenarioBehavior[] child = GetChildBehaviors();

		for (i = 0; i < child.size(); i++)
			child[i].Pause(true);
    
    Interface.Log(GetDebugString() + "- Paused children.");
	}


	//! Un-pauses all of our child rules.
	//
	// This method un-pauses all of the <l GetChildBehaviors()  child rules> by calling 
	// <l ScenarioBehavior::Pause  Pause>(false) on each one.
	//
	// Note:
	//     Use PauseChildren() to pause the child rules.
	//
	void UnpauseChildren(void)
	{
		int i;
		ScenarioBehavior[] child = GetChildBehaviors();

		for (i = 0; i < child.size(); i++)
			child[i].Pause(false);
	}

	// clear the was-complete flag on all our kiddies
	void ResetChildren(void)
	{
		int i;
		ScenarioBehavior[] child = GetChildBehaviors();

		for (i = 0; i < child.size(); i++)
			child[i].Reset();
	}


  //
  // rescan our kiddies and update our progress - documented above at method definition
  //
  void UpdateChildren(Message notUsed)
  {
    // once we have completed, don't retry (unless we are reset)
    if (IsComplete() or IsPaused() or !m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning)
      return;

    int i;
    ScenarioBehavior[] child = GetChildBehaviors();

    for (i = 0; i < child.size(); i++)
    {
      if (child[i].WasComplete())
      {
        child[i].Pause(true);
      }
      else
      {
        // if he's already unpaused, this wont do any harm.
        child[i].Pause(false);
        return;
      }
    }

    // If we got this far, all our children have completed.
    // This doesn't mean that they're currently complete; we dont go back to make sure.
    // This also doesn't mean that we're currently flagged, though that is typical.
    //
    m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = false;
    Interface.Log(GetDebugString() + "- All children have completed. Marking self as complete now. ");
    SetComplete(true);
  }

  
  //! Re-executes the rule following a saved session load
  //
  void OnDelayedRestart(Message msg)
  {
    if (msg.src != me)
      return;

    Interface.Log("# ConditionalScenarioBehavior.OnDelayedRestart> Restarting rule...");
    ExecuteRule();
  }


  //! Get an icon style for a childs relationship to its parent
  //
  // Called by native code in Surveyor to get an icon to indicate the relationship
  //   of a child rule to its parent (this rule).
  //
  public string GetChildRelationshipIcon(ScenarioBehavior child)
  {
    // Locate the child rule within the list and return its sequence number
    ScenarioBehavior[] children = GetChildBehaviors();
    int i;
    for (i = 0; i < children.size(); ++i)
      if (children[i] == child)
        return (string)(i + 1);

    // This rule is not our child, we will not execute it
    return "none";
  }


  //! Sets the properties of this rule from the given database and gets the rule running again if needed.
  //
  // In %Trainz when a saved session is loaded, the Pause() method of a rule does not get called - only
  // Init() and SetProperties().  When the rule's state is saved along with the session, its
  // GetProperties() method will save the state of the rule's <l GetStateFlags()  flags>.  When the saved
  // session is loaded, ScenarioBehavior::SetProperties() will restore the <l GetStateFlags()  flags> to
  // their saved state but won't restart the rule's threads or change the paused state.  This means that
  // if you want your rule to work as normal after it is restored during the loading if a saved session,
  // you must specifically allow for this situation via your Init() and SetProperties() methods.
  //
  // This method automatically handles the restarting of the rule if needed if the
  // <l ConditionalScenarioBehavior::m_saveLoadRestart  m_saveLoadRestart> flag is set to true.  This flag
  // isn't true by default, so if you want to take advantage of this feature, you must ensure that it is set
  // to true in your Init() method.
  //
  // If this SetProperties() method is called and <l ConditionalScenarioBehavior::m_saveLoadRestart  m_saveLoadRestart>
  // is true, it will call ExecuteRule() to get the rule running again.  ExecuteRule() has safe guards in it 
  // such that even if this SetProperties() call is not part of a saved session being restored, it won't do
  // anything erratic like start multiple threads or cause this rule to do something it has already done.
  //
  // Param:  soup  Soup database of saved properties to initialize this rule with.
  //
  public void SetProperties(Soup soup)
  {
    inherited(soup);
    
    m_bIsConditionalScenarioBehaviorFlagged = soup.GetNamedTagAsBool("ConditionalScenarioBehavior.isFlagged");
    m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning = soup.GetNamedTagAsBool("ConditionalScenarioBehavior.doesHaveChildRulesRunning");

    if (m_saveLoadRestart)
    {
      // Following a saved session restart we may need to re-execute the rule, but we can't do
      // it yet as the child rules will not be initialised. Post a message and do it in 1 second.
      if ((World.GetCurrentModule() == World.DRIVER_MODULE)  and  !IsPaused())
        PostMessage(me, "ConditionalScenarioBehavior", "DelayedRestart", 1.0f);
    }
    
    InitConditionalScenarioBehavior();
  }
  
  
  //
  public Soup GetProperties(void)
  {
    Soup ret = inherited();
    
    ret.SetNamedTag("ConditionalScenarioBehavior.isFlagged", m_bIsConditionalScenarioBehaviorFlagged);
    ret.SetNamedTag("ConditionalScenarioBehavior.doesHaveChildRulesRunning", m_bDoesConditionalScenarioBehaviorHaveChildRulesRunning);
    
    return ret;
  }
  
  
  //
  void InitConditionalScenarioBehavior(void)
  {
    // Override this function to configure the following variables:
    // 
    // m_bDoesConditionalScenarioBehaviorResetChildrenWhenStartingChildren
    // m_bDoesConditionalScenarioBehaviorPauseChildrenWhenDeflagged
    // m_bDoesConditionalScenarioBehaviorResetChildrenWhenDeflagged
    // m_bDoesConditionalScenarioBehaviorSetCompleteWhenDeflagged
  }

};
