//
// DefaultLocomotiveCabin.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "train.gs"
include "locomotive.gs"
include "cabin.gs"


//! A default locomotive cabin suitable for both diesel and electric locos.
//
// This Cabin-derived class provides the framework for building a generic locomotive cabin as it 
// already contains many generic levers and controls common to diesel and electric locos.
//
// Although documented, the real details of this class manages the controls of a steam loco cabin 
// can be found in the implementations that can seen in the <b \Trainz\scripts\DefaultLocomotiveCabin.gs>
// script file.
//
// To get this class working with your own cabin, little implementation is required.  You will to
// write your own overridden methods if you want your cabin to have fancy custom controls that this
// cabin doesn't have.
//
// See the <l astSrcIntDD40  UP DD40> cabin for an example of a cabin built with this class.
//
// See Also:
//     Cabin, CabinControl, DefaultSteamCabin, Locomotive
//
class DefaultLocomotiveCabin isclass Cabin
{
	Locomotive loco;  //!< %Locomotive this cabin is attached to.
	Vehicle veh;

	//! \name   Locomotive Cabin Controls
	//  \anchor locoCabControls
	//@{
	//! %Cabin controls for the levers and gauges in a generic diesel or electric locomotive cab.
	//
	// These object references provide access to the gauge/lever instruments in the cabin of a diesel
	// or electric loco.  They are initialized and associated with their controls by the <l DefaultLocomotiveCabin::Init()  Init>()
	// method and used throughout this class to manage the cab.
	//
	// See Also:
	//     DefaultLocomotiveCabin::Init()
	//

	CabinControl speedometer;             //!< Speed indicator.
	CabinControl speedometer2;             //!< Speed indicator2.
	CabinControl main_reservoir_needle;   //!< Main reservoir needle.
	CabinControl brake_cylinder0_needle;  //!< Brake cylinder needle 0.
	CabinControl brake_cylinder0_needle2;  //!< Brake cylinder needle 0 2nd.
	CabinControl brake_cylinder1_needle;  //!< Brake cylinder needle 1.
	CabinControl no3_pipe_needle;         //!< Number 3 pipe needle.
	CabinControl brake_pipe_needle;       //!< Brake pipe needle.
	CabinControl brake_pipe_needle2;       //!< Brake pipe needle.
	CabinControl equaliser_needle;        //!< Equalizer needle.
	CabinControl flow_needle;             //!< Flow needle.
	CabinControl ampmeter_needle0;        //!< Amp meter needle 0.
	CabinControl ampmeter_needle1;        //!< Amp meter needle 1.
	CabinControl throttle_lever;          //!< Throttle lever.
	CabinControl reverser_lever;          //!< Reverser lever.
	CabinControl train_brake_lever;       //!< Brake lever for entire train.
	CabinControl train_lapbrake_lever;    //!< %Train lap-brake lever.
	CabinControl loco_brake_lever;        //!< Brake lever for loco brakes only.
	CabinControl dynamic_brake_lever;     //!< Dynamic brake lever.
	CabinControl wheelslip_light;         //!< Wheel slip indicator light.
	CabinControl horn_rope;               //!< Rope to blow horn with.
	CabinControl bell_control;            //!< Bell lever/switch
	CabinControl pantograph_lever;        //!< Pantograph control lever.
	CabinControl light_switch;            //!< %Locomotive light switch.
	CabinControl throttle_brake_lever;    //!< %Locomotive Throttle and Brake combined into a lever.

	//@}


	//! Initializes all of the controls in this cabin.
	// 
	// This method makes sure all of the \ref locoCabControls "cabin controls" in this cab are 
	// initialized and ready for use by script code throughout this class.
	//
	// See Also:
	//     \ref locoCabControls "Locomotive Cabin Controls"
	//
	public void Init(void)
	{
		speedometer =				GetNamedControl("speedo_needle");
		speedometer2 =				GetNamedControl("speedo_needle2");
		main_reservoir_needle =		GetNamedControl("bplocomain_needle");
		brake_cylinder0_needle =	GetNamedControl("bptrainbrakecylinder_needle");
		brake_cylinder0_needle2 =	GetNamedControl("bptrainbrakecylinder_needle2");
		brake_cylinder1_needle =	GetNamedControl("no3pipe_needle");
		no3_pipe_needle =			GetNamedControl("bptrainbrakecylinder2_needle");
		brake_pipe_needle =			GetNamedControl("bptrainbrakepipe_needle");
		brake_pipe_needle2 =			GetNamedControl("bptrainbrakepipe_needle2");
		equaliser_needle =			GetNamedControl("bploco_equaliser");
		flow_needle =				GetNamedControl("flow_needle");
		ampmeter_needle0 =			GetNamedControl("ampmeter_needle");
		ampmeter_needle1 =			GetNamedControl("ampmeter2_needle");
		throttle_lever =			GetNamedControl("throttle_lever");
		reverser_lever =			GetNamedControl("reverser_lever");
		train_brake_lever =			GetNamedControl("trainbrake_lever");
		train_lapbrake_lever =		GetNamedControl("trainbrakelap_lever");
		loco_brake_lever =			GetNamedControl("independantbrake_lever");
		dynamic_brake_lever =		GetNamedControl("dynamicbrake_lever");
		wheelslip_light =			GetNamedControl("wheelslip_light");
		horn_rope =					GetNamedControl("horn");
    bell_control = GetNamedControl("bell");
		light_switch =				GetNamedControl("light_switch");
		pantograph_lever =		GetNamedControl("pantograph_lever");
		throttle_brake_lever =GetNamedControl("throttle_brake_lever");
	}

	// Attach this cabin to a game object (i.e. a locomotive).
	//
	// Param:  obj  Game object to attach this cabin to (usually a Locomotive).
	//
	public void Attach(GameObject obj)
	{
		loco = cast<Locomotive>(obj);
		veh = cast<Vehicle>(obj);
	}

	//! Used by Update() in pressure calculations.
	//
	// The default locomotive configuration uses kPa to describe pressure dial ranges.  This method 
	// converts from g/m^3 into kPa-above-atmospheric.
	//
	// Param:  param  Name of the engine parameter to convert.
	//
	public float GetPressureParam(string param)
	{
		float pressureMultiplier = 1.0 / (0.145 * 0.0000703);
		float pressureBase = 14.7 * 0.0000703;

		return pressureMultiplier * (loco.GetEngineParam(param) - pressureBase);
	}
	
	public float GetRelativePressureParam(string param)
	{
		float pressureMultiplier = 1.0 / (0.145 * 0.0000703);

		return pressureMultiplier * loco.GetEngineParam(param);
	}

	//! Called to update the cabin.
	//
	// The DefaultLocomotiveCabin implementation of this method updates the \ref locoCabControls "controls" of
	// this cabin so they correspond to the <l DefaultLocomotiveCabin::loco  loco> this cabin is attached to.
	//
	public void Update(void)
	{
		if (!loco)
			return;

		float value;
		Train train = loco.GetMyTrain();


		//
		// Update Needles
		//

		if (speedometer)
			speedometer.SetValue(Math.Fabs(loco.GetVelocity()));
		if (speedometer2)
			speedometer2.SetValue(Math.Fabs(loco.GetVelocity()));
		

		if (main_reservoir_needle)
			main_reservoir_needle.SetValue(GetPressureParam("main-reservoir-pressure"));
		

		value = GetPressureParam("brake-cylinder-pressure");
		if (brake_cylinder0_needle)
			brake_cylinder0_needle.SetValue(value);
		if (brake_cylinder0_needle2)
			brake_cylinder0_needle2.SetValue(value);
		if (brake_cylinder1_needle)
			brake_cylinder1_needle.SetValue(value);

		
		if (no3_pipe_needle)
			no3_pipe_needle.SetValue(GetPressureParam("no3-pipe-pressure"));

		
		if (brake_pipe_needle)
			brake_pipe_needle.SetValue(GetPressureParam("brake-pipe-pressure"));

		if (brake_pipe_needle2)
			brake_pipe_needle2.SetValue(GetPressureParam("brake-pipe-pressure"));

		
		if (equaliser_needle)
			equaliser_needle.SetValue(GetPressureParam("equaliser-pressure"));

		
		if (flow_needle)
			flow_needle.SetValue(GetRelativePressureParam("flow"));

		
		value = loco.GetEngineParam("current-drawn");
		if (ampmeter_needle0)
			ampmeter_needle0.SetValue(value);
		if (ampmeter_needle1)
			ampmeter_needle1.SetValue(value);


		//
		// Update Levers
		//
		// This is done in case the game logic has changed any of the settings from what
		// the user selected.
		//
		
		if (throttle_lever)
			throttle_lever.SetValue(loco.GetEngineSetting("throttle"));// * 8.0);


		if (reverser_lever)
			reverser_lever.SetValue(loco.GetEngineSetting("reverser"));

		
		if (train_brake_lever)
			train_brake_lever.SetValue(loco.GetEngineSetting("train-auto-brake"));

		
		if (throttle_brake_lever)
		{
			Train train = loco.GetMyTrain();
			float middle = (throttle_brake_lever.GetMaximum()-throttle_brake_lever.GetMinimum()+1)/2;
			if(train.GetTrainBrakes()>0)
			{
				if(train.GetTrainBrakes() < 2)
				{
					throttle_brake_lever.SetValue((train.GetTrainBrakes()-1)*0.1*middle+middle);
				}
				else if(train.GetTrainBrakes() < 3)
				{
					throttle_brake_lever.SetValue((train.GetTrainBrakes()-2)*0.9*middle+middle*1.1);
				}
				else
				{
					throttle_brake_lever.SetValue(throttle_brake_lever.GetMaximum());
				}
			}
			else
			{
				throttle_brake_lever.SetValue(middle - loco.GetEngineSetting("throttle"));
			}
		}

		if (train_lapbrake_lever)
			train_lapbrake_lever.SetValue(loco.GetEngineSetting("train-lap-brake"));


		if (loco_brake_lever)
			loco_brake_lever.SetValue(loco.GetEngineSetting("loco-auto-brake"));

		
		if (dynamic_brake_lever)
			dynamic_brake_lever.SetValue(loco.GetEngineSetting("dynamic-brake"));


		if (wheelslip_light)
			wheelslip_light.SetValue(loco.GetEngineParam("wheelslip"));


		if (horn_rope)
		{
			//float ropeVal = loco.GetEngineParam("horn");
			//if (ropeVal > 0)
			//{
			//	ropeVal =  ropeVal - 0.0000005;
			//}
			if(horn_rope.GetValue() > 0.5f)
			{
			  UserSetControl(horn_rope,horn_rope.GetValue());
			}
			else
				horn_rope.SetValue(loco.GetEngineParam("horn"));
		}

    if (bell_control)
      bell_control.SetValue(loco.GetBellState());

		if (pantograph_lever)
			pantograph_lever.SetValue(loco.GetEngineSetting("pantograph"));


		if (light_switch)
			light_switch.SetValue(loco.GetEngineSetting("headlight"));

	}


	//! Called by %Trainz when the user sets a cabin control.
	//
	// This method updates the loco this Cabin is attached so it (the loco) can respond to one of the
	// \ref locoCabControls "cabin controls" being manipulated.
	//
	// Param:  control  Control that user has set.
	// Param:  value    Value control is set to.
	//
	void UserSetControl(CabinControl control, float value)
	{
		if (!loco)
		{
			inherited(control, value);
			return;
		}
		
    //Interface.Log("control: " + control.GetName() + " value: " + value);

		if (control == reverser_lever)
			loco.SetEngineSetting("reverser", value);

		else if (control == throttle_lever)
			loco.SetEngineSetting("throttle", value);

		else if (control == train_brake_lever)
			loco.SetEngineSetting("train-auto-brake", value);

		else if (control == throttle_brake_lever)
		{
			float middle = (throttle_brake_lever.GetMaximum()-throttle_brake_lever.GetMinimum()+1)/2;
			if(value>middle)
			{
				loco.SetEngineSetting("throttle", 0);
				Train train = loco.GetMyTrain();
				//loco.SetEngineSetting("train-auto-brake", value-middle);
				if(value < 1.1*middle)
				{
					train.SetTrainBrakes(1+1/(middle*0.1)*(value-middle));
				}
				else if (value < throttle_brake_lever.GetMaximum())
				{
					train.SetTrainBrakes(2+1/(middle*0.9)*(value-middle*1.1));
				}
				else
				{
					train.SetTrainBrakes(4);
				}
			}
			else
			{
				Train train = loco.GetMyTrain();
				//loco.SetEngineSetting("train-auto-brake", value-middle);
				train.SetTrainBrakes(0);
				loco.SetEngineSetting("throttle", middle - value);
			}
		}

		else if (control == train_lapbrake_lever)
			loco.SetEngineSetting("train-lap-brake", value);

		else if (control == loco_brake_lever)
			loco.SetEngineSetting("loco-auto-brake", value);

		else if (control == dynamic_brake_lever)
			loco.SetEngineSetting("dynamic-brake", value);

		else if (control == horn_rope)
			loco.SetEngineSetting("horn", value);

    else if (control == bell_control)
    {
      if (value >= 0.5)
        loco.SetBellState(true);
      else if (value < 0.5)
        loco.SetBellState(false);
    }

		else if (control == pantograph_lever)
			loco.SetEngineSetting("pantograph", value);

		else if (control == light_switch)
			loco.SetEngineSetting("headlight", value);
		
		else
			// call parent method to ensure changed cabin controls are set
			inherited(control, value);
	}
	

	// Called by Trainz when user has pressed a key in this cabin.
	void UserPressKey(string s)
	{
		if (!veh)
		{
			inherited(s);
			return;
		}

		Train train = veh.GetMyTrain();

		if (s == "train_cabin_brake_application")
		{
			if (train_brake_lever )
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
			else if (throttle_brake_lever)
			{
				if (train.GetTrainBrakes() > 0)
				{
						UserSetControl(throttle_brake_lever, throttle_brake_lever.GetValue()+1);
				}
				else
				{
						train.SetTrainBrakes(Train.TRAIN_BRAKE_INITIAL);
				}
				/*float brakes = train.GetTrainBrakes();
				float middle = (throttle_brake_lever.GetMaximum()-throttle_brake_lever.GetMinimum()+1)/2;

				if (brakes < Train.TRAIN_BRAKE_INITIAL)
					brakes = Train.TRAIN_BRAKE_INITIAL;
				else
				{
					brakes = brakes + 2/middle;
					if (brakes > Train.TRAIN_BRAKE_HANDLE_OFF)
						brakes = Train.TRAIN_BRAKE_EMERGENCY;
				}

				train.SetTrainBrakes(brakes);*/
			}
			else
			{
				// "old" brakes
				train.SetTrainBrakes(Train.TRAIN_BRAKE_APPLICATION);
			}
		}

    else if (s == "train_cabin_aws_reset")
    {
      PostMessage(me, "AWS", "Reset", 0);

      // Legacy support, do not rely on this message as it will eventually be removed
      Router.LegacyBroadcastMessage(me, "AWS", "Reset", 0, true);
    }

		else 
		{
			// Some commands to take into consideration the throttle-brake lever before the inherited functionallity.

			
			inherited(s);

			// Some commands to take into consideration the throttle-brake lever after the inherited functionallity.

			//Case 1 (zero throttle) - brakes should release and throttle should 0.
			if (s == "train_cabin_throttle_0")
			{
				if(throttle_brake_lever)
				{
					train.SetTrainBrakes(0);
					if(loco) {
						loco.SetEngineSetting("throttle",0);
					}
				}
			}
			
			//Case 2 (Throttle down) - if brakes are on then should lower the brake app.
			if (s == "train_cabin_throttle_down" and throttle_brake_lever)
			{
				if(train.GetTrainBrakes()>0)
				{
					//loco.SetEngineSetting("train-auto-brake",0);
					if (throttle_brake_lever.GetValue() >= throttle_brake_lever.GetMaximum()) 
						UserSetControl(throttle_brake_lever, throttle_brake_lever.GetMaximum()-2);
					else
						UserSetControl(throttle_brake_lever, throttle_brake_lever.GetValue()-1);
				}
			}
			
			//Case 1 (Throttle up) - if brakes are on should release and accelerate.
			if (s == "train_cabin_throttle_up" and throttle_brake_lever)
			{
				if(train.GetTrainBrakes()>0)
				{
					train.SetTrainBrakes(0);
					if(loco) {
						loco.SetEngineSetting("throttle",1);
					}
				}
			}
		}
	}

};
