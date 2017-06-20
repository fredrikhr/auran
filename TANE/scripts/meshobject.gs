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
// {[ Major               | Minor               | Source       | Destination                 ]
//  [ "Animation-Event"   | event name          | mesh object  | mesh object                 ]
//  [ "fx-mesh-attached"  | effect name         | mesh object  | mesh object                 ]
//  [ "pfx"               | +/-particle number  | anywhere     | object to set particles of  ]}
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

  //=============================================================================
  // Name: Init
  // Desc: Called by Trainz to initialize this object. This is best used to
  //       initialize data members and start threads to run the object.
  // Note: As Init() is called from native Trainz code, you cannot CANNOT call
  //       Sleep or wait from this function. However, Init() can start threaded 
  //       methods that are allowed to sleep and process messages.
  //=============================================================================
  public void Init(Asset asset);

  // Obsolete form. Do not override.
  public obsolete void Init(void) { }


  //=============================================================================
  // Name: HasMesh
  // Desc: Returns whether the named mesh exists in this object.
  //=============================================================================
  public native bool HasMesh(string meshName);


  //=============================================================================
  // Name: SetMeshAnimationState
  // Desc: Sets the animation state of the named mesh
  // Parm: meshName - Name of the mesh to set the animation state for
  // Parm: state - Whether the animation should be active
  //=============================================================================
  public native void SetMeshAnimationState(string meshName, bool state);


  //=============================================================================
  // Name: SetMeshAnimationFrame
  // Desc: Sets the named mesh to the specified animation frame
  // Parm: meshName - Name of the mesh to set the animation state for
  // Parm: state - Frame to set the animaition to
  //=============================================================================
  public native void SetMeshAnimationFrame(string meshName, float frame);


  //=============================================================================
  // Name: SetMeshAnimationFrame
  // Desc: Sets the named mesh to the specified animation frame
  // Parm: meshName - Name of the mesh to set the animation state for
  // Parm: state - Frame to set the animaition to
  // Parm: state - Duration (seconds) over which to move to the specified frame
  //=============================================================================
  public native void SetMeshAnimationFrame(string meshName, float frame, float interpTime);


  //=============================================================================
  // Name: GetMeshAnimationFrame
  // Desc: Gets the current animation frame of the named mesh
  //=============================================================================
  public native float GetMeshAnimationFrame(string meshName);
	

  //=============================================================================
  // Name: GetMeshAnimationFrameCount
  // Desc: Gets the number of animation frames in the named mesh
  //=============================================================================
  public native float GetMeshAnimationFrameCount(string meshName);


  //=============================================================================
  // Name: StartMeshAnimationLoop
  // Desc: Plays the animation of the named mesh loop (replayed continuously)
  //=============================================================================
  public native void StartMeshAnimationLoop(string meshName);
	

  //=============================================================================
  // Name: StopMeshAnimation
  // Desc: Stops animating the named mesh
  //=============================================================================
  public native void StopMeshAnimation(string meshName);


  //=============================================================================
  // Name: SetMeshAnimationSpeed
  // Desc: Sets the animation speed of the named mesh in this object
  //=============================================================================
  public native void SetMeshAnimationSpeed(string meshName, float speed);


  //=============================================================================
  // Name: SetFXAnimationState
  // Desc: Sets the animation state of the named effect
  //=============================================================================
  public native void SetFXAnimationState(string effectName, bool state);


  //=============================================================================
  // Name: SetFXAttachment
  // Desc: Creates a new object of the given asset type and attaches it to the
  //       named attachment effect. Any other object attached here will be 
  //       removed first.
  // Note: This function may return before the mesh is loaded and attached. If
  //       a script needs to know when the mesh is set it should wait on the
  //       ("fx-mesh-attached",effectName) message which will be posted when the
  //       load is fully complete.
  // Parm: effectName - Name of the effect to attach asset to.
  // Parm: asset - Asset to attach. If null, any attached asset to will be
  //       removed and nothing new will be added.
  //=============================================================================
  public native MeshObject SetFXAttachment(string effectName, Asset asset);


  //=============================================================================
  // Name: GetFXAttachment
  // Desc: Gets the mesh attached to the named effect.
  // Note: This will return the mesh that is currently attached. If the a mesh
  //       change is still queued/loading this may return null or a different
  //       asset to what is expected. See SetFXAttachment for more.
  // Parm: effectName - Name of the effect to query.
  //=============================================================================
  public native MeshObject GetFXAttachment(string effectName);


  //=============================================================================
  // Name: SetFXTextureReplacement
  // Desc: Sets the specified texture onto the named effect.
  // Parm: effectName - Name of the effect to set a texture for.
  // Parm: textureGroupAsset - A texture-group asset, null to disable the effect.
  // Parm: textureIndex - Specifies which texture to use from the group.
  //=============================================================================
  public native void SetFXTextureReplacement(string effectName, Asset textureGroupAsset, int textureIndex);


  //=============================================================================
  // Name: SetFXTextureReplacementTexture
  // Desc: Sets the specified texture onto the named effect.
  //=============================================================================
  public native void SetFXTextureReplacementTexture(string effectName, string textureName);


  // ! This function is obsolete.
  //   Use SetFXTextureReplacementTexture with a texture-replacement effect instead.
  public native obsolete void SwapTextureOnMesh(string meshName, string oldTextureName, string newTextureName);


  //=============================================================================
  // Name: SetFXCoronaTexture
  // Desc: Modifies the texture of the named corona.
  //=============================================================================
  public native void SetFXCoronaTexture(string effectName, Asset textureAsset);


  //=============================================================================
  // Name: SetFXNameText
  // Desc: Sets the effect name text for the specified corona.
  //=============================================================================
  public native void SetFXNameText(string effectName, string text);


  //=============================================================================
  // Name: SetMeshVisible
  // Desc: Sets the visibility of the specified mesh.
  //=============================================================================
  public native void SetMeshVisible(string meshName, bool visible, float fadeDuration);


  //=============================================================================
  // Name: SetMesh
  // Desc: Sets the specified mesh as visible and all other meshes as invisible.
  //=============================================================================
  public native void SetMesh(string meshName, float fadeDuration);


  //=============================================================================
  // Name: SetMeshTranslation
  // Desc: Sets the translation of the specified mesh relative to the object
  //       origin or attachment point.
  //=============================================================================
  public native void SetMeshTranslation(string meshName, float x, float y, float z);


  //=============================================================================
  // Name: SetMeshOrientation
  // Desc: Sets the orientation of the specified mesh relative to the object
  //       orientation or attachment point.
  // Parm: meshName - Name of the mesh to set the visibility of.
  // Parm  x,y,z - Rotations about each axis for the new orientation (radians).
  //=============================================================================
  public native void SetMeshOrientation(string meshName, float x, float y, float z);


  //=============================================================================
  // Name: SetTextureSelfIllumination
  // Desc: This will iterate the mesh-table of this MeshObject and overrides the
  //       emissive color of any materials which use the specified texture. This
  //       causes the entire mesh to become uniquely instanced, meaning that
  //       material sharing optimisations will cease operating.
  //       The effect of this function is undefined on meshes eligible for
  //       stitching; currently it does nothing to stitched meshes but this may
  //       not be true in future implementations. Since there is no formal
  //       definition of which meshes are eligible for stitching, this means that
  //       there is no clear definition of whether this function will work on any
  //       given mesh. At the current time, traincar meshes are not eligible for
  //       stitching.
  //       The effect of targeting the same material multiple times with
  //       different texture names is undefined.
  //       In some earlier versions of Trainz, this function did not instance the
  //       mesh and thus all other instances of the mesh which were sharing a
  //       material may have also reacted in some cases.
  //       Because of the limitations and peformance implications of this
  //       function, it is not recommended for use and may be phased out
  //       permanently in the future. It is strongly recommended that the
  //       emissive color is controlled in the mesh file instead. If the ability
  //       to switch on/off the emissive attribute is desired, mesh switching
  //       (especially night-mode support, where applicable) is recommended.
  // Parm: textureName - The name of the texture to search for. This should be
  //       the filepath of the texture within the mesh asset, minus any
  //       ".texture" or ".texture.txt" extension.
  // Parm: r,g,b - float values that represent the emissive RGB values, where
  //       0.0f is no emissive output, 1.0f is 100% emissive output, and so on.
  //       HDR values are supported. The result of negative values is undefined.
  //=============================================================================
  public native void SetTextureSelfIllumination(string textureName, float r, float g, float b);


  //=============================================================================
  // Name: GetTextureSelfIlluminationState
  // Desc: Determines whether SetTextureSelfIllumination() has been called with a
  //       non-zero color for the specified texture name.
  // Parm: textureName - The name of the texture to search for. This should be
  //       the filepath of the texture within the mesh asset, minus any
  //       ".texture" or ".texture.txt" extension.
  // Retn: bool - True if SetTextureSelfIllumination() has been called for the
  //       specified texture name, and the color passed was above zero.
  //=============================================================================
  public native bool GetTextureSelfIlluminationState(string textureName);



  //=============================================================================
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

