//
// MapObject.gs
//
//  Copyright (C) 2003-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "MeshObject.gs"
include "ProductQueue.gs"
include "WorldCoordinate.gs"
include "Orientation.gs"
include "TrackCircuitBlock.gs"


//! A map object with product queues.
//
// This class extends MeshObject to include product queues.  A MapObject can have a number of 
// product queues and they are defined in the <m queues> section of the <n config.txt> file for the
// asset.
//
// {[ Major        | Minor           | Destination                                      ]
//  [ "MapObject"  | "View-Details"  | Object that the details have been requested of.  ]}
//
// The (<m"MapObject">, <m"View-Details">) message is sent to a MapObject instance when the user
// right-clicks on the object and selects <b View Details> from the pop-up menu.  What happens when
// this message is received is left to the script programmer.  It is recommended that something 
// about the object's current state is displayed in a Browser window.  The GenericIndustry class 
// provides a demonstration of this.
//
// See Also:
//     Asset, Buildable, GameObject, GenericIndustry, Industry, MeshObject, ProductQueue, Trackside
//
game class MapObject isclass MeshObject
{
	//! Gets a product queue by name.
	//
	// Param:  queueName  Name of the product queue to get.
	//
	// Returns:
	//     Returns the product queue named <i queueName> if possible, null otherwise.
	//
	public native ProductQueue GetQueue(string queueName);

	//! Gets a list of the product queues this map object has.
	//
	// Returns:
	//     Returns an array of ProductQueue objects.  If there are no queues, an empty array will
	//     be returned.
	//
	public native ProductQueue[] GetQueues(void);

	//! Gets the localized name of this map object.
	//
	// Note:
	//     The localized name may be different from the unique name provided by GameObject::GetName().
	//
	// Returns:
	//     Returns the localized name of this map object.
	//
	public native string GetLocalisedName(void);


	//! Plays the specified sound event from the asset's SoundScript.
	//
	// SoundScripts are defined as sub-containers in the <n soundscript> container of the asset's 
	// configuration.  For details on creating assets with SoundScripts, see the 
	// <bi TRS2006 Content Creators Guide>.
	//
	// This method will start playing the sound.  Depending on the SoundScript configuration, the
	// sound will either be played just once or played continuously in a looping cycle such that
	// StopSoundScriptEvent() will need to be called to stop it.
	//
	// Param:  soundName  Name of the sound event to start playing.  The name is defined in the 
	//                    <n trigger> tag of the SoundScript sub-container.
	//
	public native void PlaySoundScriptEvent(string soundName);

	//! Stops the specified sound event from the asset's SoundScript.
	//
	// Param:  soundName  Name of the sound event to stop playing. See PlaySoundScriptEvent() for
	//                    details on sound event name details.
	//
	public native void StopSoundScriptEvent(string soundName);

	//!  No longer supported.
	public float GetPFXEmitterRate(int id, int phase) { return 0.0; }

	//! Sets the Rate of particle emitters creation of particles. The value represents particles
	// per a second.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	rate	The new rate of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterRate(int id, int phase, float rate);

	//!  No longer supported.
	public float GetPFXEmitterVelocity(int id, int phase) { return 0.0; }

	//! Sets the Velocity of particle emitters creation of particles. The value represents particles
	// speed in m/s as a scaler value.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	vel		The new velocity of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterVelocity(int id, int phase, float vel);

	//! Sets the starting color of particle emitters creation of particles. Value can be between 0-1 or 
	// 0-255, but use one format or the other for all values. If using values between 0-255 use intergers. 
	// NOTE: that 1,1,1,1 is white as it will be treaded as floats while 2,2,2,2 would be black because it 
	// is about the float threshold.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	r		red value of the color.
	// Param:	g		green value of the color
	// Param:	b		blue value of the color
	// Param:	a		alpha value of the color
	//
	//
	public native void SetPFXEmitterStartColor(int id, int phase, float r, float g, float b, float a);
	
	//! Sets the starting color of particle emitters creation of particles. Value can be between 0-1 or 
	// 0-255, but use one format or the other for all values. If using values between 0-255 use intergers. 
	// NOTE: that 1,1,1,1 is white as it will be treaded as floats while 2,2,2,2 would be black because it 
	// is about the float threshold.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	r		red value of the color.
	// Param:	g		green value of the color
	// Param:	b		blue value of the color
	// Param:	a		alpha value of the color
	//
	//
	public native void SetPFXEmitterEndColor(int id, int phase, float r, float g, float b, float a);

	//! No longer supported.
	public float GetPFXEmitterLifetime(int id, int phase) { return 0.0; }

	//! Sets the lifetime of particle emitters creation of particles. The value represents particles
	// life in seconds. 
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	life	The new lifetime of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterLifetime(int id, int phase, float life);

	//! No longer supported.
	public float GetPFXEmitterMinSize(int id, int phase) { return 0.0; }

	//! Sets the min size of particle.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	newsize	The new minimum size of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterMinSize(int id, int phase, float newsize);

	//! Gets the Max Size of particle.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	//
	// Returns: 
	//		Returns the value for the maximum size of particle effect id at phase phase.
	//
	public float GetPFXEmitterMaxSize(int id, int phase) { return 0.0; }

	//! Sets the Max Size of particle.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	newsize	The new maximum size of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterMaxSize(int id, int phase, float newsize);

	//! No longer supported.
	public float GetPFXEmitterMinRate(int id) { return 0.0; }

	//! Sets the min size of particle.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	newsize	The new minimum size of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterMinRate(int id, float newsize);

	//! No longer supported.
	public float GetPFXEmitterMaxRate(int id) { return 0.0; }

	//! Sets the Max Size of particle.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	newsize	The new maximum size of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterMaxRate(int id, float newsize);

	//! Sets the Cone Size of particle emitters creation of particles. 
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	x		x value of the cone.
	// Param:	y		y value of the cone.
	// Param:	z		z value of the cone.
	//
	//
	public native void SetPFXEmitterConeSize(int id, float x, float y, float z);

	//! Sets the texture of particle emitters creation of particles.
  // NOTE: NOT CURRENTLY IMPLEMENTED.
	//
	// Param:	id				The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	texturekuid		The kuid of the new texture.
	//
	//
	public native void SetPFXEmitterTexture(int id, KUID texturekuid);

	//! Emits the given number of particles. 
	//
	// Param:	id			The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	number		The number of particles to emit.
	//
	//
	public native void SetPFXEmitterEmitParticles(int id, int number,float time);

	//! No longer supported.
	public float GetPFXEmitterPhysicsDelay(int id, int phase) { return 0.0; }

	//! Sets the Physics delay of particle.
	//
	// Param:	id		The ID of the particle effect, 0 = first and they are in order of config file.
	// Param:	phase	The phase of the particle effect of interest, if only one phase pass in 0.
	// Param:	value	The new Physics delay of particle effect id, at phase phase.
	//
	public native void SetPFXEmitterPhysicsDelay(int id, int phase, float value);



  //! Gets any asset dependencies that are specific to this object instance.
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
  public void AppendDependencies(KUIDList io_dependencies)
  {
    ProductQueue[] queues = GetQueues();
    if (queues.size() > 0)
    {
      int i = 0;
      int l = 0;
      int k = 0;
      for (i = 0; i < queues.size(); i++)
      {
        ProductFilter pf = queues[i].GetProductFilter();
        Asset[] products = pf.GetProducts();
        
        for (l = 0; l < products.size(); l++)
        {
          // Interface.Log("Adding Asset: " + products[l].GetLocalisedName());
          io_dependencies.AddKUID((products[l]).GetKUID());
        }
      }
    }
  }
  
  // ============================================================================
  // Name: SetMapObjectPosition
  // Desc: Instantly repositions this MapObject to the specified absolute 
  //       position, as best possible. This will not successfully reposition a 
  //       MapObject which has a parent relationship (for example, a Trackside 
  //       object.) This function may be VERY slow and should generally not be
  //       used. Various object parameters and game states may restrict or remove
  //       the ability to position objects.
  // Parm: position - The new position intended for this MapObject.
  // ============================================================================
  public native void SetMapObjectPosition(WorldCoordinate position);
  
  
  // ============================================================================
  // Name: GetMapObjectPosition
  // Desc: Returns the absolute position of this MapObject. A call to 
  //       GetMapObjectPosition() which immediately follows a call to
  //       SetMapObjectPosition() is not guaranteed to return the input position,
  //       since various other position restrictions may be in effect.
  // Retn: WorldCoordinate - The current position of this MapObject.
  // ============================================================================
  public native WorldCoordinate GetMapObjectPosition(void);
  
  
  // ============================================================================
  // Name: AdjustMapObjectPosition
  // Desc: Instantly repositions this MapObject by the specified displacement, 
  //       as best possible. This will not successfully reposition a MapObject
  //       which has a parent relationship (for example, a Trackside object.) 
  //       This function may be VERY slow and should generally not be used.
  //       Various object parameters and game states may restrict or remove
  //       the ability to position objects.
  // Parm: dx - The distance (m) to move the object along its x axis (right.)
  // Parm: dy - The distance (m) to move the object along its y axis (foward.)
  // Parm: dz - The distance (m) to move the object along its z axis (upward.)
  // ============================================================================
  public native void AdjustMapObjectPosition(float dx, float dy, float dz);
  
  
  // ============================================================================
  // Name: SetMapObjectOrientation
  // Desc: Instantly reorients this MapObject to the specified absolute 
  //       orientation, as best possible. This will not successfully reposition a 
  //       MapObject which has a parent relationship (for example, a Trackside 
  //       object.) Various object parameters and game states may restrict or 
  //       remove the ability to reorient objects.
  // Parm: orientation - The new orientation intended for this MapObject.
  // ============================================================================
  public native void SetMapObjectOrientation(Orientation orientation);
  
  
  // ============================================================================
  // Name: GetMapObjectOrientation
  // Desc: Returns the absolute orientation of this MapObject. A call to 
  //       GetMapObjectOrientation() which immediately follows a call to
  //       SetMapObjectOrientation() is not guaranteed to return the input
  //       orientation, since various other orientation restrictions may be in
  //       effect.
  // Retn: WorldCoordinate - The current orientation of this MapObject.
  // ============================================================================
  public native Orientation GetMapObjectOrientation(void);
  
  
  // ============================================================================
  // Name: GetDriverCharacter
  // Desc: Returns the driver character for this map object, if any
  // ============================================================================
  public native DriverCharacter GetDriverCharacter(void);
  
  
  // ============================================================================
  // Name: GetOccupiedTrackCircuitBlocks
  // Desc: Returns the track circuit blocks that this map object is within
  // ============================================================================
  public native TrackCircuitBlock[] GetOccupiedTrackCircuitBlocks(void);

};

