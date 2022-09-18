//=============================================================================
// File: JunctionBaseGameObject
// Desc: INTERNAL USE ONLY.
//       Internal helper functions used by MOSceneryWithTrack.
//=============================================================================
include "JunctionBase.gs"
include "SceneryWithTrack.gs"



//=============================================================================
// Name: JunctionBaseGameObject
// Desc: Wrapper class for an object which derives from JunctionBase and
//       GameObject. FOR INTERNAL USE ONLY.
//=============================================================================
final game class JunctionBaseGameObject isclass JunctionBase, GameObject
{

  //=============================================================================
  // Name: UserRequestToggle
  // Desc: Called from native code when the user wishes to toggle this junction.
  //       Basic permission checks have already been performed at this point-
  //       the user is clear to proceed, so any override here should honor the
  //       request.
  //=============================================================================
  public void UserRequestToggle(void)
  {
    SceneryWithTrack sceneryWithTrack = cast<SceneryWithTrack>(GetMapObject());
    if (sceneryWithTrack == null)
    {
      inherited();
      return;
    }

    sceneryWithTrack.UserRequestToggle(me);
  }


  //=============================================================================
  // Name: GetDebugName
  // Desc: Returns a debug name for identifying this object in logs etc. This is
  //       not guaranteed to be human-readable, but will be where possible.
  //=============================================================================
  public legacy_compatibility string GetDebugName(void)
  {
    SceneryWithTrack sceneryWithTrack = cast<SceneryWithTrack>(GetMapObject());
    if (sceneryWithTrack)
    {
      // Scenery with track attached junctions will not have a GameObjectID, so
      // we'll return the index within the parent.
      JunctionBase[] swtJunctions = sceneryWithTrack.GetAttachedJunctions();
      int index;
      for (index = 0; index < swtJunctions.size(); ++index)
      {
        if (swtJunctions[index] == me)
          return "SceneryWithTrack_Junction_" + index + "{" + GetGSClassName() + ":" + (string)GetId() + "}";
      }
    }

    return inherited();
  }

};

