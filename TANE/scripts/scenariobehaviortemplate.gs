//=============================================================================
// File: ScenarioBehaviorTemplate.gs
// Desc: 
//=============================================================================
include "ScenarioBehavior.gs"



//=============================================================================
// Name: ScenarioBehaviorTemplate
// Desc: 
//=============================================================================
class ScenarioBehaviorTemplate isclass ScenarioBehavior
{
  void OnScenarioBehaviorTouch(Message msg);


  //=============================================================================
  // Name: Init
  // Desc: Initialise this template instance
  //============================================================================= 
  public void Init(Asset asset)
  {
    inherited(asset);

    AddHandler(me, "ScenarioBehavior", "Touch", "OnScenarioBehaviorTouch");
  }

  //=============================================================================
  // Name: Pause
  // Desc: Pause/unpuase this template instance
  //=============================================================================
  public void Pause(bool pause)
  {
    if (pause == IsPaused())
      return;

    SetStateFlags(PAUSED, pause);

    TrainzScript.Log("ScenarioBehaviorTemplate.Pause(" + pause + ")");

    // Apply this change to the child rules
    int i;
    ScenarioBehavior[] children = GetChildBehaviors();
    for (i = 0; i < children.size(); ++i)
      children[i].Pause(pause);
  }


  //=============================================================================
  // Name: GetChildRelationshipIcon
  // Desc: Called by native code in Surveyor to get an icon to indicate the
  //       relationship of a child rule to its parent (this rule).
  //=============================================================================
  public string GetChildRelationshipIcon(ScenarioBehavior child)
  {
    // Rule templates execute all children simultaneously
    return "simultaneous";
  }


  //=============================================================================
  // Name: OnScenarioBehaviorTouch
  // Desc: Called when a ("ScenarioBehavior", "Touch") message is received
  //=============================================================================
  void OnScenarioBehaviorTouch(Message msg)
  {
    // Ignore messages if paused or complete
    if (IsComplete() or IsPaused())
      return;

    // Check for an active child
    int i;
    ScenarioBehavior[] children = GetChildBehaviors();
    for (i = 0; i < children.size(); ++i)
      if (!children[i].IsComplete())
        return;

    // All children are complete, set the template complete too
    SetComplete(true);
    TrainzScript.Log("ScenarioBehaviorTemplate.OnScenarioBehaviorTouch> Template complete");
  }
};
