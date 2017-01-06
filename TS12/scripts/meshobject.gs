//
// MeshObject.gs
//
//  Copyright (C) 2003-2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "TrainzGameObject.gs"
include "PropertyObject.gs"


//! A mesh object with animation and particle support.
//
// This class is a base class for Asset-based game objects that have meshes, animation and particles.
// %Interface methods to deal with meshes, animation and particles are provided so things like
// showing/hiding a mesh, attaching a mesh to an attachment point or starting/stopping an animation
// can be done from a script.
//
// For animation, %Trainz uses key frames with interpolation.  This means an intermediate animation
// frame is calculated dynamically to be-in-synch with the game's framerate.  Further information 
// about meshes, animations and particles can be found in the <b TRS2006 Content Creators> guide.
//
// Note:
//     GS is only an interpreted scripting language intended to be used as a way to monitor and 
//     react to events in the %Trainz world, not perform sophisticated real-time animation tasks.
//     Using a script to start an animation in response to an event in a thread is reasonable
//     usage.  However trying to control animation tightly down to intervals in the millisecond
//     is not and will most likely provide unsatisfactory results.
//
//
// <bi MeshObject Messages><br>
//
// {[ Major              | Minor               | Source       | Destination                 ]
//  [ "Animation-Event"  | event name          | mesh object  | mesh object                 ]
//  [ "pfx"              | +/-particle number  | anywhere     | object to set particles of  ]}
//
// When a message with a <l Message::major  major type> of <m "Animation-Event"> is received, the 
// name of the animation event that has occurred is used as the <l Message::minor  minor type>.  The
// event name is defined in the <n .kin> animation event file and is not to be confused with the
// name of the mesh or animation.
//
// The <m "pfx"> message is used to activate/deactivate the particles.  Which particles to activate
// or deactivate is specified in the <l Message::minor  minor string> of the message.  By sending a
// message like this to an object, the script programmer can control the particle effects however 
// they want.  This minor string is a list of numbers specifying the particle effects to activate or
// deactivate.  For each particle number in the string, a prefix of either <n '+'> or <n '-'> is
// needed where the plus symbol activates the particle while minus deactivates it.  For example:
//
//<code>
//  SendMessage(me, "pfx", "+0+1+2");      //# Activates particle effects 0, 1 and 2.
//  SendMessage(me, "pfx", "-0+2-4-5+6");  //# Deactivates particle effects 0, 4 & 5 and activates particle effects 2 & 6.
//  SendMessage(me, "pfx", "-0-1-2");      //# Deactivates particle effects 0, 1 and 2.
//</code>
//
// Note:
//     In addition to GameObject::SendMessage(), both the GameObject::PostMessage() and 
//     Router::PostMessage() methods can be used to send <m "pfx"> messages to an object to 
//     activate or deactivate particle effects.
//
// See Also:
//     Asset, GameObject, PropertyObject, TrainzGameObject, Bogey, Cabin, MapObject, SceneryWithTrack, Trackside
//
game class MeshObject isclass PropertyObject, TrainzGameObject
{
	//! Called by %Trainz to initialize this object.
	//
	// When creating an instance of a game object, %Trainz looks for an Init() method.  If it
	// finds one, that method will be called.
	//
	// It is best used to initialize data members and start threads to run the object.  If overridden
	// in a class of your own, always ensure that the overridden Init() in the parent class is 
	// explicitly called, otherwise you may run into problems.  Use the <l gscLangKeyInherit  inherited>
	// keyword to call an overridden parent method.
	//
	// For example, Train::Init() does a lot of Train-specific initialization and if an overridden
	// Init() method in a class derived from Train neglects to call Train::Init(), essential
	// initialization won't happen and the train would not behave as expected.  The same applies 
	// to GenericIndustry::Init() as well.
	//
	// Note:
	//     As Init() is called from native %Trainz code, you cannot <bi CANNOT> <l GameObject::Sleep  Sleep>()
	//     or <l gscLangKeyWait  wait()> in an Init() method.  However, Init() can start threaded 
	//     methods that are allowed to sleep and process messages.
	//
	// See Also:
	//     TrainzGameObject::Init(), ScenarioBehavior::Init(), SetProperties()
	//
	public void Init(Asset asset);
	
	
	// Obsolete form. Do not override.
	public void Init(void) {}


	//! Determines if the named mesh exists in this object.
	//
	// Param:  p_meshName  Name of the mesh to look for in this object.
	//
	// Returns:
	//     Returns true if <i p_meshName> exists, false otherwise.
	//
	public native bool HasMesh(string p_meshName);
	

	//! Sets the animation state of the named mesh.
	//
	// Param:  p_meshName  Name of the mesh to set the animation state of.
	// Param:  p_state     State to set the animation to. true plays through to the end frame of the
	//                     animation. false plays through to the start frame of the animation.
	//
	public native void SetMeshAnimationState(string p_meshName, bool p_state);
	

	//! Sets the named mesh to the specified animation frame.
	//
	// Param:  p_meshName  Name of the mesh to set the animation frame of.
	// Param:  p_frame     Frame to set the mesh to.
	//
	public native void SetMeshAnimationFrame(string p_meshName, float p_frame);
	

	//! Sets the named mesh to the specified animation frame.
	//
	// Param:  p_meshName  Name of the mesh to set the animation frame of.
	// Param:  p_frame     Frame to set the mesh to.
	// Param:  interpTime  Duration (seconds) over which to move to the specified frame.
	//
	public native void SetMeshAnimationFrame(string p_meshName, float p_frame, float interpTime);
	

	//! Gets the current animation frame of the named mesh.
	//
	// Param:  p_meshName  Name of the mesh to get the animation frame of.
	//
	// Returns:
	//     Returns the current frame position of the specified mesh.
	//
	public native float GetMeshAnimationFrame(string p_meshName);
	

	//! Gets the number of animation frames in the named mesh.
	//
	// Param:  p_meshName  Name of the mesh to get the number of animation frames in.
	// 
	// Returns:
	//     Returns the number of frames in <i p_meshName>.
	//
	public native float GetMeshAnimationFrameCount(string p_meshName);
	

	//! Plays the animation of the named mesh loop (i.e. replayed continuously).
	//
	// Param:  p_meshName  Name of the mesh to start animating.
	//
	// Note:
	//     An animation can be played backwards by using a negative animation speed set through the
	//     SetMeshAnimationSpeed() method.
	//
	public native void StartMeshAnimationLoop(string p_meshName);
	

	//! Stops animating the named mesh.
	//
	// Param:  p_meshName  Name of mesh to stop the animation of.
	//
	public native void StopMeshAnimation(string p_meshName);
	

	//! Sets the animation speed of the named mesh in this object.
	//
	// Param:  p_meshName  Name of mesh to set animation speed of.
	// Param:  p_speed     Factor to adjust animation speed by, compared to the original.  For 
	//                     example, 1.0 for normal speed, 0.5 for half speed or 2.0 for double speed.
	//                     Use a negative value to have the animation played backwards in reverse.
	//
	public native void SetMeshAnimationSpeed(string p_meshName, float p_speed);


	//! Creates a new object of the given asset type and attaches it to the named
	//
	// Any object already attached will be removed first. 
	//
	// Param:  effectName  Name of the particle effect to attach asset to.
	// Param:  asset       Asset to attach to <i effectName>.  If null, the existing asset attached to
	//                     <i effectName> will be removed and nothing new will be added.
	//
	// Returns:
	//     Returns <i asset> as a MeshObject.
	// 
	public native MeshObject SetFXAttachment(string effectName, Asset asset);
	

	//! Gets the mesh attached to the named effect.
	//
	// Param:  effectName  Name of the effect to get the attached object of.
	//
	// Returns:
	//     Returns the object attached to <i effectName> if it exists, null otherwise.
	//
	public native MeshObject GetFXAttachment(string effectName);
	

	//! Sets the animation state of the named effect.
	//
	// Param:  effectName  Effect to set the animation state of.
	// Param:  state       State to set animation effect to.  If true, the effect is started in its
	//                     animation loop, false to stop it.
	//
	public native void SetFXAnimationState(string effectName, bool state);
	

	//! Sets the specified texture onto the named effect.
	//
	// Param:  effectName         Name of the effect to set a texture for,
	// Param:  textureGroupAsset  Must be a texture-group asset.  Use null to disable the effect.
	// Param:  textureIndex       Specifies which texture to use from the group.
	//
	public native void SetFXTextureReplacement(string effectName, Asset textureGroupAsset, int textureIndex);
	

	//! Modify the texture of the named corona.
	// 
	// Param:  effectName    Name of the corona effect to set the texture for.
	// Param:  textureAsset  Specifies the texture asset.  Use null to switch off the corona.
	//
	public native void SetFXCoronaTexture(string effectName, Asset textureAsset);
	

	//! Sets the effect name text for the specified corona.
	//
	// Param:  effectName  Name of the corona effect to set the effect name of.
	// Param:  text        Name to set the effect text of <i effectName> to.
	//
	public native void SetFXNameText(string effectName, string text);


	//! Sets the visibility of the specified mesh.
	//
	// Param:  meshName      Name of the mesh to set the visibility of.
	// Param:  visible       Visibility status. Use true for visible and false for invisible.
	// Param:  fadeDuration  Specifies the duration in seconds over which the visibility will 
	//                       transition.  An instantaneous transition will occur if <i fadeDuration>
	//                       is zero (0.0).
	//
	public native void SetMeshVisible(string meshName, bool visible, float fadeDuration);


	//! Sets the translation of the specified mesh relative to the object origin or attachment point.
	//
	// Param:  meshName      Name of the mesh to set the visibility of.
	// Param:  x,y,z         Translation vector in parent modelspace (meters.)
	//
	public native void SetMeshTranslation(string meshName, float x, float y, float z);


	//! Sets the orientation of the specified mesh relative to the object orientation or attachment point.
	//
	// Param:  meshName      Name of the mesh to set the visibility of.
	// Param:  a,b,c         Euler angle describing the new orientation (radians.)
	//
	public native void SetMeshOrientation(string meshName, float a, float b, float c);
	

	//! Sets the specified mesh as visible and all other meshes as invisible.
	//
	// Param:  meshName      Name of the mesh to set as visible.
	// Param:  fadeDuration  Specifies the duration in seconds over which the visibility will
	//                       transition.  An instantaneous transition will occur if <i fadeDuration>
	//                       is zero.
	//
	public native void SetMesh(string meshName, float fadeDuration);
	

	// ! This function is obsolete.
  //   Use SetFXTextureReplacementTexture with a texture-replacement effect instead.
	public native void SwapTextureOnMesh(string meshName, string oldTextureName, string newTextureName);


	//! This will change the texture name that have to be replaced on the effects mesh.
	//  WARNING: This will typically cause Trainz to freeze for a short period when called and/or when
	//  the mesh in question first becomes visible.
	//
	// Param:  effectName			the name of the effect that we want to apply the texture to
	// Param:  textureName		the name of the texture that we want to apply	
	//                       
	public native void SetFXTextureReplacementTexture(string effectName, string textureName);
	

	//! This will change the texture self illumination (emissiveness) to whatever you set.
	//
	// Param:  textureName		the name of the texture that we want to apply	
	// Param:	 r,g,b					3 float between 0 and 1.0f that states the red green blue values                       
	//
	//
	public native void SetTextureSelfIllumination(string textureName, float r, float g, float b);
	

	//! this will obtain the texture self illumnation value
	//
	// Param:  textureName		the name of the texture that we want to obtain the self illumination from
	//
	// Return: false if all values are ~0 and true if they are above that
	//                       
	public native bool GetTextureSelfIlluminationState(string textureName);
	
	
	

  // 
  // IMPLEMENTATION
  //

	
	public void Init(Asset asset)
	{
		inherited(asset);
		
			// legacy Init() support
		Init();
	}
	
	  // for obsolete access to GetAsset() prior to Init(Asset)
	native Asset NativeGetAsset(void);
	
	Asset ObsoleteGetAsset(void)
	{
	  return NativeGetAsset();
	}
};

