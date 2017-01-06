//
// Cabin.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "meshobject.gs"


//! A control in a cabin.
//
// Class that represents a control in a Cabin.  %Interface methods to access the control's name,
// value/setting, visibility and value range are provided.  The Cabin::GetControls() method provides
// a list of controls in a cabin.
//
// See Also:
//     Cabin, DefaultSteamCabinData, DefaultLocomotiveCabin, GameObject, Locomotive,
//     CabinControlSetting, ControlSettingsManager
//
class CabinControl isclass GameObject
{
	//! Gets name of this object.
	//
	// Returns:
	//     Returns the name of this object.
	//
	public native string GetName(void);

	//! Gets the current setting value of this control.
	//
	// Returns:
	//     Returns the current value of this control.
	//
	public native float GetValue(void);

	//! Determines if this control is visible.
	//
	// Returns:
	//     Returns true if this control is visible, false otherwise.
	//
	public native bool IsVisible(void);

	//! Determines if this control is locked.
	//
	// Returns:
	//     Returns true if this control is locked, false otherwise.
	//
	public native bool IsLocked(void);

	//! Gets the minimum possible value for this control.
	//
	// Returns:
	//     Returns the minimum possible value for this control.
	//
	public native float GetMinimum(void);

	//! Gets the maximum possible value for this control.
	//
	// Returns:
	//     Returns the maximum possible value for this control.
	//
	public native float GetMaximum(void);


	//! Sets the value for this control. 
	//
	// Param:  value  New value to set this control to.
	//
	public native void SetValue(float value);

	//! Sets the visible state of this control.
	//
	// Param:  visible  If true, this control will be set to a visible state, false to make it 
	//                  invisible.
	//                  
	public native void SetVisible(bool visible);

	//! Locks/unlocks this control.
	//
	// Param:  locked  Locked state for this control.  If true, the control is locked, otherwise
	//                 false to unlock it.
	//
	public native void SetLocked(bool locked);

	//! Sets descriptive text for this control.
	//
	// Param:  text  String of descriptive text for this control.
	//
	public native void SetText(string text);

	//! <bi NOT IMPLEMENTED, DO NOT USE!!!>
	//
	// Sets the limits range of values for this control.
	//
	// Param:  min  Minimum allowable value setting for this control.
	// Param:  max  Maximum allowable value setting for this control.
	//
	public native void SetUserLimits(float min, float max);

	//! Sets the named control value.
	//
	// Param:  name   Name of the value to set.
	// Param:  value  Actual value.
	//
	public native void SetNamedValue(string name, float value);
};


//! An interface to a cabin.
//
// This class is the interface class used for cabins/interior assets in %Trainz.  From the scripting 
// perspective, a Cabin is mainly a collection of <l CabinControl  cabin controls>.  What controls 
// the cabin has depends on the configuration of the asset.
//
// If a cabin asset is to have custom scripted features, it's script class will need to be derived 
// from this one.
//
// The types of controls a cabin has is largely locomotive specific hence this class is the 
// interface and not a cabin implementation.  The DefaultLocomotiveCabin and DefaultSteamCabin 
// classes provide a basic default Cabin implementation that can be used for diesels/electrics 
// and steam locos respectively.
//
// The source code for the <l astSrcIntBigSteam  Bigsteam Interior (UP Big Boy)>, <l astSrcIntDD40  UP DD40>
// and <l astSrcIntPB15  QR PB15> interiors are included with this documentation.
//
// See Also:
//     CabinControl, DefaultLocomotiveCabin, DefaultSteamCabin, GameObject, Locomotive,
//     CabinControlSetting, ControlSettingsManager
//
class Cabin isclass MeshObject
{
	//! Gets the controls in this cabin.
	//
	// Returns:
	//     Returns the controls in this cabin as an array.
	//
	public native CabinControl[] GetControls(void);

	//! Gets a cabin control by name.
	//
	// Param:  name  Name of the cabin control to get.
	//
	// Returns:
	//     Returns the cabin control specified by name if it exists, null otherwise.
	//
	public native CabinControl GetNamedControl(string name);

	//! Gets the parent game object of this cabin (i.e. the Locomotive)
	//
	// Returns:
	//    Returns the parent GameObject that this cabin is attached to (usually a Locomotive),
	//    null otherwise.
	//
	public native GameObject GetParentObject(void);

	//! Does nothing.
	public bool IsActive(void) { return true; }


	//! Adds coal to the firebox.
	//
	// Returns:
	//     Returns true if coal is successfully added to the firebox, false otherwise.
	//
	public native bool FireAddCoal(void);
	
	//! Sets the intensity of lighting in this cabin.
	//
	// This method acts as a dimmer for the in-cab lighting.  Be warned that this is in-game lighting,
	// not physically realistic lighting.  Also, this method affects the "fire light" in steam interiors.
	//
	//
	// Param:  intensity  Level of cabin lighting intensity.  This is a normalized value in the range
	//                    of [0.0 - 1.0].  0.0 is black, regardless of the background lighting levels
	//                    and higher values mean a brighter cab.
	//
	public native void SetCabLightIntensity(float intensity);


	//! Gets the time since the user last interacted with the cab controls.
	//
	// Returns:
	//     Returns the in-game time duration in seconds since the user last
	//     interacted with the controls of this cab.
	//
	public native float GetTimeSinceLastUserActivity(void);
	
	
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


	//! Initializes this Cabin object.
	//
	// This method is called by %Trainz when it creates a new Cabin object.  Usually it would
	// initialize all the <l CabinControl  controls> the cabin has.  
	//
	// The implementation in the Cabin class is empty.  Override to perform any custom initialization.
	//
	// Note:
	//     Both the DefaultLocomotiveCabin and DefaultSteamCabin cabins contain good example implementations
	//     of this method.
	//
	public void Init(void) {}

	//! Attaches this cabin to a game object (i.e. a Locomotive).
	//
	// This method is called by %Trainz when it is about to either attach or detach this cabin to an object.
	//
	// Because a cabin is destroyed when it is no longer needed and re-created by %Trainz later on if needed
	// again, this method is where you should restore the cabin control settings.  A Locomotive object has a
	// <l Locomotive::GetCabinData()  cache> of cabin control settings that can be saved to when the cabin
	// is updated.  However the programmer needs to update and make use of cabin settings in their 
	// implementation of this method (and possibly Update() as well).
	//
	// Param:  obj  Game object to attach this cabin to (usually a Locomotive).
	//
	// Note:
	//     Both the DefaultLocomotiveCabin and DefaultSteamCabin cabins contain good example implementations
	//     of this method.
	//
	// See Also:
	//     Locomotive::GetCabinData()
	// 
	public void Attach(GameObject obj) {}

	//! Cabin update method.
	//
	// Called by %Trainz to update this cabin object.  This implementation is empty so the script programmer 
	// must implement it if they want their cabin's controls to be updated.
	//
	// If you want to keep the controls in the cabin up to date and to accurately reflect the current state of
	// the locomotive, you will need to perform those updates from an overridden implementation of this method.
	// It is mostly a case of querying the current status of the host locomotive's state and applying them to
	// the matching control.  For example, the speedometer in the cab would need to be updated based on the
	// loco's current velocity.
	//
	// Note:
	//     Both the DefaultLocomotiveCabin and DefaultSteamCabin cabins contain good example implementations
	//     of this method.
	//
	public void Update(void) {}

	//! Called when user has pressed a key in this cabin.
	//
	// The default Cabin implementation does not handle any keystrokes.  You must do so in your own overridden
	// implementation.
	//
	// Param:  s  Name of the key user has pressed.  This is a name for the keystroke, not the actual key.
	//
	public void UserPressKey(string s)
	{
		Interface.Log("Cabin.UserPressKey> unhandled key-command " + s);
	}

	//! Called when user sets a cabin control.
	//
	// Param:  control  Control that user has set.
	// Param:  value    Value control is set to.
	//
	public void UserSetControl(CabinControl control, float value) {}

};



//! Describes the sate of a cabin control in simple format.
//
// This class describes a cabin control's state in a simple format for use in the 
// ControlSettingsManager class.
//
// See Also:
//     ControlSettingsManager, CabinControl, CabinData
//
class CabinControlSetting
{
	public string ctrl_name;  //!< Name of the cabin control.
	public float  ctrl_value; //!< Value of the cabin control.
};


//! Manager for a set of cabin control settings.
//
// This utility class manages a collection of simplified cabin control settings and includes the 
// functionality to automatically update a cabin via the UpdateCabin() method.  Use is not 
// compulsory but it can automate tasks related to saving & loading the position of a cabin's 
// controls.
//
// The DefaultSteamCabin class as seen in the <b \Trainz\scripts\DefaultSteamCabin.gs> file makes
// use of this class.
//
// Note:
//     More details about the saving and loading of cabin data can be found in the description of
//     the CabinData class.
//
// See Also:
//     CabinControlSetting, Cabin, CabinControl, CabinData, DefaultSteamCabin
//
class ControlSettingsManager
{
	//! The control settings this class manages.
	public CabinControlSetting[] controlSettings = new CabinControlSetting[0];

	//! Finds the index to a control setting by name.
	//
	// Param:  nameTest  Name of the control to get the index to.
	//
	// Returns:
	//     Returns the index to the control setting specified by <i nameTest> that is suitable for
	//     use with the <l ControlSettingsManager::controlSettings  controlSettings> array if such
	//     a control setting exists, -1 otherwise.
	//
	public int FindIndex(string nameTest)
	{
		int index;
		for (index = 0; index < controlSettings.size(); index++)
			if (controlSettings[index].ctrl_name == nameTest)
				return index;

		return -1;
	}

	//! Adds the specified control to this manager's list.
	//
	// Param:  name   Name of the control.  If a control of this name already exists, its setting will
	//                be overwritten with <i value>.
	// Param:  value  Value of the control.
	//
	public void AddControl(string name, float value)
	{
		int index = FindIndex(name);

		if (index < 0)
		{
			index = controlSettings.size();
			controlSettings[index] = new CabinControlSetting();
		}

		controlSettings[index].ctrl_name  = name;
		controlSettings[index].ctrl_value = value;
	}

	//! Updates the controls of the given Cabin based on the specifications of this control manager's list.
	//
	// This method cycles through this manager's <l ControlSettingsManager::controlSettings  controls list> and
	// if an actual <l Cabin::GetControls()  cabin control> from <i cabinToUpdate> is found that matches the 
	// name of a control setting in this manager, the <l CabinControl::SetValue()  value> of the control from
	// <i cabinToUpdate> will be updated.
	//
	// Param:  cabinToUpdate  Cabin to update the controls of.
	//
	// See Also:
	//     Cabin::GetControls(), CabinControl::SetValue()
	//
	public void UpdateCabin(Cabin cabinToUpdate)
	{
		int i;
		for (i = 0; i < controlSettings.size(); i++)
		{
			CabinControl retrievedCtrl = cabinToUpdate.GetNamedControl(controlSettings[i].ctrl_name);
			retrievedCtrl.SetValue(controlSettings[i].ctrl_value);
		}
	}

};
