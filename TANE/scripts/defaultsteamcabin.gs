//
// DefaultSteamCabin.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "train.gs"
include "locomotive.gs"
include "cabin.gs"




//! Cabin data for the DefaultSteamCabin.
//
// This class provides simplified storage for the values of the various controls that are particular
// to a generic steam locomotive.  It is used by the DefaultSteamCabin class to save the state of its
// steam-specific controls to the Locomotive so that when the cabin is destroyed and later re-created,
// it's controls will be in the same state the user left them in.
//
// See Also:
//     DefaultSteamCabin, Cabin, CabinData, Locomotive::GetCabinData()
//
class DefaultSteamCabinData isclass CabinData
{
	public float fire_plates_val;           //!< Fire plates setting.
	public float left_window_val;           //!< Left side cabin window.
	public float right_window_val;          //!< Right side cabin window.
	public float left_sliding_window_val;   //!< Left side sliding cabin window.
	public float right_sliding_window_val;  //!< Right side sliding cabin window.
	public float seat0_val;                 //!< Movable seat 1.
	public float seat1_val;                 //!< Movable seat 2.
	public float sanding_lever_val;         //!< Sanding lever.
	public float whistle_lever_val;         //!< Whistle lever.
	public float regulator_lever_val;       //!< Regulator/throttle lever.
	public float blowdown_lever_val;        //!< Blowdown lever.
	public bool  fireboxDoorOpen;           //!< Firebox door open/close state.

	//! Extra controls.
	public ControlSettingsManager ctrlManager = new ControlSettingsManager();
};


//! A generic cabin suitable for use in a steam locomotive.
//
// This Cabin-derived class provides the framework for building a steam locomotive cabin as it
// already contains many generic levers and controls steam locos have.  
//
// Although documented, the real details of this class manages the controls of a steam loco cabin
// can be found in the implementations that can seen in the <b \Trainz\scripts\DefaultSteamCabinData.gs>
// script file. 
//
// To get this class working with your own steam cabin, little implementation is required.  You will
// however need to write your own overridden methods if you want your cabin to have fancy custom 
// controls that this cabin doesn't have.
//
// See the <l astSrcIntBigSteam  Bigsteam (UP Big Boy)> and <l astSrcIntPB15  QR PB15> asset source
// for examples of interiors built with this class.
//
// See Also:
//     DefaultSteamCabinData, DefaultLocomotiveCabin, Locomotive, CabinData
//
class DefaultSteamCabin isclass Cabin
{
	Locomotive loco;  //!< Locomotive this cabin is attached to.

	//! \name   Steam Cabin Needles
	//  \anchor steamCabNeedle
	//@{
	//! %Cabin controls for the needles in a steam locomotive cab.
	//
	// These object references provide access to the needle/gauge instruments in the cabin of a steam loco.
	// They are initialized and associated with their controls by the <l DefaultSteamCabin::Init()  Init>()
	// method and used throughout this class to manage the cab.
	//
	// See Also:
	//     DefaultSteamCabin::Init(), \ref steamCabLevers "Steam Cabin Levers", 
	//     \ref miscSteamControls "Miscellaneous Steam Cabin Controls"
	//

	CabinControl speedometer;             //!< Speedometer.
	CabinControl main_reservoir_needle;   //!< Main reservoir.
	CabinControl brake_cylinder0_needle;  //!< Brake cylinder 1.
	CabinControl brake_cylinder1_needle;  //!< Brake cylinder 2.
	CabinControl no3_pipe_needle;         //!< Pipe needle.
	CabinControl brake_pipe_needle;       //!< Brake pipe.
	CabinControl equaliser_needle;        //!< Equaliser.
	CabinControl flow_needle;             //!< Flow.
	CabinControl waterGlassLeft_dial;     //!< Left water glass.
	CabinControl waterGlassRight_dial;    //!< Right water glass.
	CabinControl firebox;                 //!< Fire box.
	CabinControl boiler_needle;           //!< Boiler needle 1.
	CabinControl boiler_needle1;          //!< Boiler needle 2.
	CabinControl steamChest_needle;       //!< Boiler needle 2.

	//@}


	//! \name   Steam Cabin Levers
	//  \anchor steamCabLevers
	//@{
	//! %Cabin controls for the levers in a steam locomotive cab.
	//
	// These object references provide access to the control levers in the cabin of a steam loco.
	// They are initialized and associated with their controls by the <l DefaultSteamCabin::Init()  Init>()
	// method and used throughout this class to manage the cab.
	//
	// See Also:
	//     DefaultSteamCabin::Init(), \ref steamCabNeedle "Steam Cabin Needles", 
	//     \ref miscSteamControls "Miscellaneous Steam Cabin Controls"
	//

	CabinControl reverser_lever;        //!< Reverser lever.
	CabinControl train_brake_lever;     //!< Train brakes.
	CabinControl train_lapbrake_lever;  //!< Train lap brakes.
	CabinControl loco_brake_lever;      //!< Loco brakes.
	CabinControl horn_rope;             //!< Whistle rope.
	CabinControl light_switch;          //!< Light switch.
	CabinControl bell_control;          //!< Bell control.

	CabinControl regulator_lever;       //!< Regulator/throttle lever.
	CabinControl fire_plates;           //!< Fire plates.

	CabinControl waterInjector0;        //!< Water injector 1.
	CabinControl waterInjector1;        //!< Water injector 2.
	CabinControl blower_lever;          //!< Blower lever.

	//@}


	//! \name   Miscellaneous Steam Cabin Controls
	//  \anchor miscSteamControls
	//@{
	//! Miscellaneous controls and items in the steam loco cab.
	//
	// These object references provide access to some of the various miscellaneous items found in the
	// cabin of a steam loco.  They are initialized and associated with their controls by the 
	// <l DefaultSteamCabin::Init()  Init>() method and used throughout this class to manage the cab.
	//
	// See Also:
	//     DefaultSteamCabin::Init(), \ref steamCabNeedle "Steam Cabin Needles", 
	//     \ref steamCabLevers "Steam Cabin Levers"
	//

	CabinControl left_window;           //!< Left window.
	CabinControl right_window;          //!< Right window.
	CabinControl left_sliding_window;   //!< Left sliding window.
	CabinControl right_sliding_window;  //!< Right sliding window.
	CabinControl seat0;                 //!< Seat 1.
	CabinControl seat1;                 //!< Seat 2.
	CabinControl sanding_lever;         //!< Sanding lever.
	CabinControl whistle_lever;         //!< Whistle lever.
	CabinControl blowdown_lever;        //!< Blowdown lever.

	//@}


	//
	float maxCoalMass;
	float maxFireTemperature;

	//
	// Cabin Data
	//
	DefaultSteamCabinData cabinData;


	bool hasAnimatedFireman = true;
	bool shovellingCoal;
	bool waving;


	//! Updates this cabin's controls from the given cabin data.
	//
	// This method is called by Attach() when the cabin has been re-created to reset the control and
	// dial positions to match the user's previous selections.
	//
	// Param:  cd  %Cabin data to reset the controls of this cabin with.
	//
	// See Also:
	//     DefaultSteamCabinData, Locomotive::GetCabinData()
	//
	public void UpdateCabinFromSavedData(CabinData cd);

	//! Gets the state of this cabin's controls in simple object for saving.
	//
	// On first creating the cabin, this method is called to create an appropriate scratch storage
	// space for cabin control settings.  The returned object will be used by Attach() to save the
	// control settings to the loco with Locomotive::SetCabinData().
	//
	// Returns:
	//     Returns a DefaultCabinData object which contains the settings of all of this cabin's controls 
	//     in a simplified format.
	//
	// See Also:
	//     DefaultSteamCabinData, Locomotive::SetCabinData()
	//
	public DefaultSteamCabinData CreateCabinSavedData(void);


	//! Instructs the fireman to shovel coal.
	void FiremanShovelCoal(void);

	//! Animation support method used by FiremanShovelCoal().
	void AnimateFiremanShovelCoal(void);

	//! Instructs the fireman to wave out the window.
	void FiremanWave(void);

	//! Animation support method used by FiremanWave().
	void AnimateFiremanWave(void);


	//! Initializes all of the controls in this cabin.
	// 
	// This method makes sure all of the cabin control references from the \ref miscSteamControls "miscellaneous",
	// \ref steamCabLevers "cabin levers" and \ref steamCabNeedle "needles" collections are initialized for use
	// by script code throughout this class.
	//
	// See Also:
	//     \ref miscSteamControls "Miscellaneous Steam Cabin Controls",  \ref steamCabLevers "Steam Cabin Levers",
	//     \ref steamCabNeedle "Steam Cabin Needles"
	//
	public void Init(void)
	{
		speedometer =				GetNamedControl("speedo_needle");
		main_reservoir_needle =		GetNamedControl("bplocomain_needle");
		brake_cylinder0_needle =	GetNamedControl("bptrainbrakecylinder_needle");
		brake_cylinder1_needle =	GetNamedControl("no3pipe_needle");
		no3_pipe_needle =			GetNamedControl("bptrainbrakecylinder2_needle");
		brake_pipe_needle =			GetNamedControl("bptrainbrakepipe_needle");
		equaliser_needle =			GetNamedControl("bploco_equaliser");
		flow_needle =				GetNamedControl("flow_needle");
		train_brake_lever =			GetNamedControl("trainbrake_lever");
		train_lapbrake_lever =		GetNamedControl("trainbrakelap_lever");
		loco_brake_lever =			GetNamedControl("independantbrake_lever");
		horn_rope =					GetNamedControl("horn");
		light_switch =				GetNamedControl("light_switch");
    bell_control = GetNamedControl("bell");

		waterGlassLeft_dial = GetNamedControl("waterglass_left");
		waterGlassRight_dial = GetNamedControl("waterglass_right");

		firebox = GetNamedControl("firebox");
		boiler_needle = GetNamedControl("boiler_needle");
		boiler_needle1 = GetNamedControl("boiler_needle1");
		steamChest_needle = GetNamedControl("steam_chest_needle");
		regulator_lever = GetNamedControl("regulator");
		reverser_lever = GetNamedControl("reverser");

		waterInjector0 = GetNamedControl("water_injector_0");
		waterInjector1 = GetNamedControl("water_injector_1");
		blower_lever = GetNamedControl("blower");

		fire_plates = GetNamedControl("fire_plates");
		left_window = GetNamedControl("left_window");
		right_window = GetNamedControl("right_window");
		left_sliding_window = GetNamedControl("left_sliding_window");
		right_sliding_window = GetNamedControl("right_sliding_window");
		seat0 = GetNamedControl("seat0");
		seat1 = GetNamedControl("seat1");
		sanding_lever = GetNamedControl("sanding_lever");
		whistle_lever = GetNamedControl("whistle_lever");
		blowdown_lever = GetNamedControl("blowdown_lever");
	}


	//! Attach this cabin to a game object (i.e. a locomotive).
	//
	// This overridden method ensures that the settings of the cabin's controls are restored from the loco's
	// <l Locomotive::GetCabinData()  cabin data> so the cabin appears in the same state it was when the user
	// left.  The UpdateCabinFromSavedData() method will be called to do this.
	//
	// Param:  obj  Game object to attach this cabin to (usually a Locomotive).
	//
	public void Attach(GameObject obj)
	{
		loco = cast<Locomotive>(obj);
		
		// get cabin data
		DefaultSteamCabinData cd = cast<DefaultSteamCabinData>(loco.GetCabinData());
		if (cd)
			UpdateCabinFromSavedData(cd);
		else
		{
			cd = CreateCabinSavedData();
			loco.SetCabinData(cd);
		}

		maxCoalMass = loco.GetEngineParam("max-coal-mass");
		maxFireTemperature = loco.GetEngineParam("max-fire-temperature");
	}

	// documented above
	public void UpdateCabinFromSavedData(CabinData cd)
	{
		DefaultSteamCabinData pbcd = cast<DefaultSteamCabinData>cd;

		if(fire_plates)
			fire_plates.SetValue(pbcd.fire_plates_val);
		if(left_window)
			left_window.SetValue(pbcd.left_window_val);
		if(right_window)
			right_window.SetValue(pbcd.right_window_val);
		if(left_sliding_window)
			left_sliding_window.SetValue(pbcd.left_sliding_window_val);
		if(right_sliding_window)
			right_sliding_window.SetValue(pbcd.right_sliding_window_val);
		if(seat0)
			seat0.SetValue(pbcd.seat0_val);
		if(seat1)
			seat1.SetValue(pbcd.seat1_val);
		if(sanding_lever)
			sanding_lever.SetValue(pbcd.sanding_lever_val);
		if(whistle_lever)
			whistle_lever.SetValue(pbcd.whistle_lever_val);
		if(regulator_lever)
			regulator_lever.SetValue(pbcd.regulator_lever_val);
		if(blowdown_lever)
			blowdown_lever.SetValue(pbcd.blowdown_lever_val);

        // restore saved value settings from the cabin data
		pbcd.ctrlManager.UpdateCabin(me);
	}

	// documented above
	public DefaultSteamCabinData CreateCabinSavedData(void)
	{
		DefaultSteamCabinData pbd = new DefaultSteamCabinData();
		return pbd;
	}


	//! Used by Update() in pressure calculations.
	//
	// The default locomotive configuration uses kPa to describe pressure dial ranges.  This
	// method converts from g/m^3 into kPa-above-atmospheric.
	//
	// Param:  param  Name of the engine parameter to convert.
	//
	// See Also:
	//     Locomotive::GetEngineParam()
	//
	public float GetPressureParam(string param)
	{
		float pressureMultiplier = 1.0 / (0.145 * 0.0000703);
		float pressureBase = 14.7 * 0.0000703;

		return pressureMultiplier * (loco.GetEngineParam(param) - pressureBase);
	}



	//! Called by %Trainz to update the cabin.
	//
	// The DefaultSteamCabin implementation of this method updates the controls of this cabin so they 
	// correspond to the <l DefaultSteamCabin::loco  loco> this cabin is attached to.  The loco's
	// <l Locomotive::SetCabinData()  cabin data> is also updated from this method so the loco has a 
	// cached copy of this cabin's settings that can be <l Locomotive::GetCabinData()  retrieved> by
	// Attach() to re-initialize the cabin.
	//
	public void Update(void)
	{
		float value;
		Train train = loco.GetMyTrain();

		//
		// Update Needles
		//

		if (speedometer)
			speedometer.SetValue(Math.Fabs(loco.GetVelocity()));
		

		if (main_reservoir_needle)
			main_reservoir_needle.SetValue(GetPressureParam("main-reservoir-pressure"));
		

		value = GetPressureParam("brake-cylinder-pressure");
		if (brake_cylinder0_needle)
			brake_cylinder0_needle.SetValue(value);
		if (brake_cylinder1_needle)
			brake_cylinder1_needle.SetValue(value);

		
		if (no3_pipe_needle)
			no3_pipe_needle.SetValue(GetPressureParam("no3-pipe-pressure"));

		
		if (brake_pipe_needle)
			brake_pipe_needle.SetValue(GetPressureParam("brake-pipe-pressure"));

		
		if (equaliser_needle)
			equaliser_needle.SetValue(GetPressureParam("equaliser-pressure"));

		
		if (flow_needle)
			flow_needle.SetValue(GetPressureParam("flow"));


		//
		// Update Levers
		//
		// This is done in case the game logic has changed any of the settings from what
		// the user selected.
		//

		//if (throttle_lever)
		//	throttle_lever.SetValue(loco.GetEngineSetting("throttle"));// * 8.0);


		if (reverser_lever)
			reverser_lever.SetValue(loco.GetEngineSetting("reverser"));
			
		if (regulator_lever)
			regulator_lever.SetValue(loco.GetEngineSetting("regulator"));

		
		if (train_brake_lever)
			train_brake_lever.SetValue(loco.GetEngineSetting("train-auto-brake"));


		if (train_lapbrake_lever)
			train_lapbrake_lever.SetValue(loco.GetEngineSetting("train-lap-brake"));


		if (loco_brake_lever)
			loco_brake_lever.SetValue(loco.GetEngineSetting("loco-auto-brake"));

		
		if(sanding_lever)
			sanding_lever.SetValue(loco.GetEngineSetting("sanding"));
		

		

		if (horn_rope)
			horn_rope.SetValue(loco.GetEngineParam("horn"));

    if (bell_control)
      bell_control.SetValue(loco.GetBellState());

		if (light_switch)
			light_switch.SetValue(loco.GetEngineSetting("headlight"));
		
		if (waterGlassLeft_dial)
			waterGlassLeft_dial.SetValue(loco.GetEngineParam("steam-boiler-liquid-percent"));
		
		if (waterGlassRight_dial)
			waterGlassRight_dial.SetValue(loco.GetEngineParam("steam-boiler-liquid-percent"));

		//
		// update cabin data
		//
		DefaultSteamCabinData cd = cast<DefaultSteamCabinData>loco.GetCabinData();

		if(left_window)
			cd.left_window_val = left_window.GetValue();
		if(right_window)
			cd.right_window_val = right_window.GetValue();
		if(left_sliding_window)
			cd.left_sliding_window_val = left_sliding_window.GetValue();
		if(right_sliding_window)
			cd.right_sliding_window_val = right_sliding_window.GetValue();
		if(seat0)
			cd.seat0_val = seat0.GetValue();
		if(seat1)
			cd.seat1_val = seat1.GetValue();
		if(sanding_lever)
			cd.sanding_lever_val = sanding_lever.GetValue();
		if(whistle_lever)
			cd.whistle_lever_val = whistle_lever.GetValue();
		if(regulator_lever)
			cd.regulator_lever_val = regulator_lever.GetValue();
		if(fire_plates)
		{
			cd.fire_plates_val = fire_plates.GetValue();
		  cd.fireboxDoorOpen = fire_plates.GetValue() > 0.9;
		}
		if(blowdown_lever)
			cd.blowdown_lever_val = blowdown_lever.GetValue();


		if (firebox)
		{
			firebox.SetNamedValue("amount-burning-coal", loco.GetEngineParam("coal-mass") / maxCoalMass);

			if(fire_plates)
			{	
				firebox.SetNamedValue("door-open", fire_plates.GetValue());
			}

			firebox.SetNamedValue("fire-life", loco.GetEngineParam("fire-temperature") / maxFireTemperature);
			firebox.SetNamedValue("steam-piston-cycle", loco.GetEngineParam("steam-piston-cycle"));
		}

		if (boiler_needle)
		{
			boiler_needle.SetValue(GetPressureParam("steam-boiler-pressure"));
		}

		if (boiler_needle1)
		{
			boiler_needle1.SetValue(GetPressureParam("steam-boiler-pressure"));
		}
		
		if (steamChest_needle)
		{
			steamChest_needle.SetValue(GetPressureParam("steam-chest-pressure"));
		}

		if (waterInjector0)
			waterInjector0.SetValue(loco.GetEngineSetting("injector"));

		if (waterInjector1)
			waterInjector1.SetValue(loco.GetEngineSetting("injector2"));

		if (blower_lever)
			blower_lever.SetValue(loco.GetEngineSetting("steam-blower"));
	}

	//! Called by %Trainz when the user sets a cabin control.
	//
	// This method updates the <l DefaultSteamCabin::loco  loco> this Cabin is attached so it (the loco)
	// can respond to <i p_control> being manipulated by the user.
	//
	// Param:  p_control  Control that the user has set.
	// Param:  p_value    Value that <i p_control> is set to.
	//
	void UserSetControl(CabinControl p_control, float p_value)
	{
		if (p_control == reverser_lever)
			loco.SetEngineSetting("reverser", p_value);

		else if (p_control == train_brake_lever)
			loco.SetEngineSetting("train-auto-brake", p_value);

		else if (p_control == train_lapbrake_lever)
			loco.SetEngineSetting("train-lap-brake", p_value);

		else if (p_control == loco_brake_lever)
			loco.SetEngineSetting("loco-auto-brake", p_value);

		else if (p_control == horn_rope)
			loco.SetEngineSetting("horn", p_value);

    else if (p_control == bell_control)
    {
      if (p_value >= 0.5)
        loco.SetBellState(true);
      else if (p_value < 0.5)
        loco.SetBellState(false);
    }

		else if (p_control == light_switch)
			loco.SetEngineSetting("headlight", p_value);

		else if (p_control == regulator_lever)
			loco.SetEngineSetting("regulator", p_value);

		else if (p_control == waterInjector0)
			loco.SetEngineSetting("injector", p_value);

		else if (p_control == waterInjector1)
			loco.SetEngineSetting("injector2", p_value);

		else if (p_control == blower_lever)
			loco.SetEngineSetting("steam-blower", p_value);

		// other control, save it to cabin data so it can be restored when cabin is reconstructed
		else
		{
			DefaultSteamCabinData dscd = cast<DefaultSteamCabinData>loco.GetCabinData();
			dscd.ctrlManager.AddControl(p_control.GetName(), p_value);
		}

        if (p_control == sanding_lever)
			loco.SetEngineSetting("sanding", p_value);

		// call parent method to ensure changed cabin controls are set
		inherited(p_control, p_value);
	}


	//! Called by %Trainz when user has pressed a key in this cabin.
	//
	// The DefaultSteamCabin implementation of this method is responsible for animating the fireman and
	// updating the steam loco-specific controls.
	//
	// Param:  s  Name of the key user has pressed.  This is a name for the keystroke, not the actual key.
	//
	void UserPressKey(string s)
	{
		if (s == "shovel-coal")
			FiremanShovelCoal();

		else if (s == "wave")
			FiremanWave();

		else if (s == "firebox-door-toggle")
		{
			if (fire_plates)
				if (fire_plates.GetValue() > 0.5f)
				{
					if (!shovellingCoal)
						fire_plates.SetValue(0.0f);
				}
				else
					fire_plates.SetValue(1.0f);
		}

		else if (s == "steam-regulator-up")
		{
			if (regulator_lever)
			{
				float value = regulator_lever.GetValue();
				
				if (value >= 0.29f  or  value <= -0.29f) {
					value = value + 0.1f;
				} else if (value >= 0.045f  or  value <= -0.045f) {
					value = value + 0.05f;
				} else {
					value = value + 0.01f;
				}

				regulator_lever.SetValue(value);
				loco.SetEngineSetting("regulator", regulator_lever.GetValue());
			}
		}

		else if (s == "steam-regulator-down")
		{
			if (regulator_lever)
			{
				float value = regulator_lever.GetValue();
				
				if (value >= 0.29f  or  value <= -0.29f)
					value = value - 0.1f;
				else
					value = value - 0.05f;

				regulator_lever.SetValue(value);
				loco.SetEngineSetting("regulator", regulator_lever.GetValue());
			}
		}

		else if (s == "steam-reverser-up")
		{
			if (reverser_lever)
			{
				float value = reverser_lever.GetValue();

				value = value + 0.0666f;

				reverser_lever.SetValue(value);
				loco.SetEngineSetting("reverser", reverser_lever.GetValue());
			}
		}

		else if (s == "steam-reverser-down")
		{
			if (reverser_lever)
			{
				float value = reverser_lever.GetValue();

				value = value - 0.0666f;

				reverser_lever.SetValue(value);
				loco.SetEngineSetting("reverser", reverser_lever.GetValue());
			}
		}

		else if (s == "steam-injector-up")
		{
			if (waterInjector0)
			{
				float value = waterInjector0.GetValue();

				value = value + 0.1f;

				waterInjector0.SetValue(value);
				loco.SetEngineSetting("injector", waterInjector0.GetValue());
			}
		}

		else if (s == "steam-injector-down")
		{
			if (waterInjector0)
			{
				float value = waterInjector0.GetValue();

				value = value - 0.1f;

				waterInjector0.SetValue(value);
				loco.SetEngineSetting("injector", waterInjector0.GetValue());
			}
		}

		else if (s == "steam-injector2-up")
		{
			if (waterInjector1)
			{
				float value = waterInjector1.GetValue();

				value = value + 0.1f;

				waterInjector1.SetValue(value);
				loco.SetEngineSetting("injector2", waterInjector1.GetValue());
			}
		}

		else if (s == "steam-injector2-down")
		{
			if (waterInjector1)
			{
				float value = waterInjector1.GetValue();

				value = value - 0.1f;

				waterInjector1.SetValue(value);
				loco.SetEngineSetting("injector2", waterInjector1.GetValue());
			}
		}

		else if (s == "steam-blower-up")
		{
			if (blower_lever)
			{
				float value = blower_lever.GetValue();
				
				if (value < 0.5f)
					value = 0.5f;
				else
					value = value + 0.1f;

				blower_lever.SetValue(value);
				loco.SetEngineSetting("steam-blower", blower_lever.GetValue());
			}
		}

		else if (s == "steam-blower-down")
		{
			if (blower_lever)
			{
				float value = blower_lever.GetValue();
				
				value = value - 0.1f;
				if (value < 0.5f)
					value = 0.0f;

				blower_lever.SetValue(value);
				loco.SetEngineSetting("steam-blower", blower_lever.GetValue());
			}
		}

		else if (s == "train_cabin_brake_application")
		{
			Train train = loco.GetMyTrain();

			if (train_brake_lever)
			{
				// self-lapping brakes
				float brakes = train.GetTrainBrakes();

				if (brakes < Train.TRAIN_BRAKE_INITIAL)
					brakes = Train.TRAIN_BRAKE_INITIAL;
				else
				{
					brakes = brakes + 0.05f;
					if (brakes > Train.TRAIN_BRAKE_APPLICATION)
						brakes = Train.TRAIN_BRAKE_APPLICATION;
				}

				train.SetTrainBrakes(brakes);
			}
			else
			{
				// "old" brakes
				train.SetTrainBrakes(Train.TRAIN_BRAKE_APPLICATION);
			}
		}

		else if (s == "train_cabin_toggle_draincocks")
		{
			loco.HandleDrainCocks();
		}

    else if (s == "train_cabin_aws_reset")
    {
      PostMessage(me, "AWS", "Reset", 0);

      // Legacy support, do not rely on this message as it will eventually be removed
      Router.LegacyBroadcastMessage(me, "AWS", "Reset", 0, true);
    }

    else
    {
      inherited(s);
    }
  }



	void FiremanShovelCoal(void)
	{
		if (waving or shovellingCoal)
			return;

		DefaultSteamCabinData cd = cast<DefaultSteamCabinData>loco.GetCabinData();
		if (FireAddCoal())
		{
			if (fire_plates)
				fire_plates.SetValue(1.0f);
			
			if (hasAnimatedFireman)
			{
				shovellingCoal = true;

				AnimateFiremanShovelCoal();
			}
		}
	}


	void FiremanWave(void)
	{
		if (waving or shovellingCoal)
			return;
		if (!hasAnimatedFireman)
			return;

		waving = true;

		AnimateFiremanWave();
	}


	void AnimateFiremanShovelCoal(void)
	{
		SetFXAnimationState("idle1", false);
		SetFXAnimationState("idle2", false);
		SetFXAnimationState("loop2shovel", false);
		SetFXAnimationState("loop2shovel", true);
	}


	void AnimateFiremanWave(void)
	{
		SetFXAnimationState("wave", false);
		SetFXAnimationState("wave", true);
	}

};

