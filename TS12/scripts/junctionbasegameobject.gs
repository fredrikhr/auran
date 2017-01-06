// ============================================================================
// File: JunctionBaseGameObject
// Desc: INTERNAL USE ONLY.
//       Internal helper functions used by MOSceneryWithTrack.
// ============================================================================
include "JunctionBase.gs"
include "SceneryWithTrack.gs"



//! Wrapper class for an object which derives from JunctionBase and GameObject. <bi FOR INTERNAL USE ONLY.>
//
// Note:
//     A JunctionBaseGameObject does not have the exact same behavior of a Trackside derived 
//     Junction or even the behavior of a MapObject.
//
// See Also:
//     Junction, JunctionBase, MapObject
//
final game class JunctionBaseGameObject isclass JunctionBase, GameObject
{
	// ============================================================================
  // Name: UserRequestToggle
  // Desc: Called from native code when the user wishes to toggle this junction.
  //       Basic permission checks have already been performed at this point-
  //       the user is clear to proceed, so any override here should honor the
  //       request.
  // ============================================================================
	public void UserRequestToggle(void)
	{
	  SceneryWithTrack sceneryWithTrack = cast<SceneryWithTrack> GetMapObject();
	  
	  if (sceneryWithTrack == null)
	  {
	    inherited();
	    return;
	  }
	  
	  sceneryWithTrack.UserRequestToggle(me);
	}
};

