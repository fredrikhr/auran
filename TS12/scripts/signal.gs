//
// Signal.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "trackside.gs"
include "baseportal.gs"

//! Provides control over track side signal objects.
//
// Signals placed in Surveyor can be accessed in script code by calling
// <l Router::GetGameObject  Router::GetGameObject>("signalName") and <l gscLangKeyCast  casting>
// the returned reference to Signal.
//
// Note:
//     The methods to get a signal's state are <l Trackside::GetSignalState()  GetSignalState>() and 
//     <l Trackside::GetSignalStateEx()  GetSignalStateEx>() from the parent Trackside class.
//
// Messages related to signals are:
// {[ Major    | Minor                       | Source | Destination ]
//  [ "Signal" | "StateChanged"              | signal | broadcast   ]
//  [ "Train"  | "Entered red signal"        | signal | train       ]
//  [ "Train"  | "Entered red signal notify" | train  | broadcast   ]}
//
// See Also:
//     Junction, TrackMark, Trigger, Trackside, Vehicle, Navigate::Signal(), SignalBehaviour,
//     Trackside::GetSignalState(), Trackside::GetSignalStateEx()
//
game class Signal isclass Trackside
{

	// Useful Terminology:
	// 
	// "In Advance" - Signal 1 is said to be "In Advance" of signal 2
	//                if a driver at signal 2 will arrive at signal 1 later on
	//                - i.e. signal 1 is currently ahead of him.
	// "In Rear" - Signal 1 is said to be "In Rear" of signal 2 if a driver at
	//             signal 2 has already passed signal 1 - i.e. signal 1 is behind him.
	// "On" - A signal is said to be "On" if it is showing it's most restrictive aspect
	// "Off" - A signal is said to be "Off" if it is showing it's least restrictive aspect
	//
	// handy distances

	public define int HALF_A_CAR_LENGTH = 20;	// i.e. a 40m long traincar.
	public define int MINIMUM_SIGNAL_SPACING = 50;	// Signals must be placed more than 50m apart to increment state.
	public define int PORTAL_LENGTH = 300;		// Just how far after finding a portal do we keep looking for trains?
																						// this is because users may attach track to both ends of a portal.
	public define int DEFAULT_OVERLAP = 25;		// random default. Overridden by 'overlap' in the config.txt.

	//! \name   Signal States
	//  \anchor sigStates
	//@{
	//! Defines the possible states for a track side signal.
	//
	// For more complex states, the \ref extSigStates "Extended Signal States" are used.
	//
	// See Also:
	//     Trackside::GetSignalState(), Signal::SetSignalState()
	//

	public define int GREEN = 2;       //!< Signal is green (clear state).
	public define int YELLOW = 1;      //!< Signal is yellow (caution state).
	public define int RED = 0;         //!< Signal is red (stop state).
	public define int AUTOMATIC = -1;  //!< Signal state is automatically handled by %Trainz.

	//@}


	//! \name   Extended Signal States
	//  \anchor extSigStates
	//@{
	//! Values specifying an extended signal state.
	//
	// These are extra signal states for more specialist purposes that are defined in addition to
	// the standard \ref sigStates "signal states".
	//
	// Note:
	//     Not all signals may necessarily support the extended signal states.
	//
	// See Also:
	//     Trackside::GetSignalStateEx(), Signal::SetSignalStateEx()
	//

// shared states
	public define int EX_STOP                    = 0;   //!< Extended stop state.  Signal is red.
	public define int EX_STOP_THEN_CONTINUE      = 1;   //!< Alternative for stop - asset specific.
	public define int EX_CAUTION                 = 4;   //!< The next signal is red.
	public define int EX_ADVANCE_CAUTION         = 7;   //!< The next signal is yellow.
	public define int EX_PROCEED                 = 8;   //!< Extended proceed state.  Signal is green.
		
// route signalling specific states	
	public define int EX_CAUTION_LEFT            = 2;   //!< The next junction is left and the next signal is red.
	public define int EX_CAUTION_RIGHT           = 3;   //!< The next junction is right and the next signal is red.
	public define int EX_CAUTION_LEFT_2          = 13;  //!< The next junction is 2nd left and the next signal is red.
	public define int EX_CAUTION_RIGHT_2         = 14;  //!< The next junction is 2nd right and the next signal is red.
	public define int EX_CAUTION_LEFT_3          = 15;  //!< The next junction is 3rd left and the next signal is red.
	public define int EX_CAUTION_RIGHT_3         = 16;  //!< The next junction is 3rd right and the next signal is red.
	public define int EX_ADVANCE_CAUTION_LEFT    = 11;  //!< The next junction is left and the next signal is yellow.
	public define int EX_ADVANCE_CAUTION_RIGHT   = 12;  //!< The next junction is right and the next signal is yellow.
	public define int EX_ADVANCE_CAUTION_LEFT_2  = 17;  //!< The next junction is 2nd left and the next signal is yellow.
	public define int EX_ADVANCE_CAUTION_RIGHT_2 = 18;  //!< The next junction is 2nd right and the next signal is yellow.
	public define int EX_ADVANCE_CAUTION_LEFT_3  = 19;  //!< The next junction is 3rd left and the next signal is yellow.
	public define int EX_ADVANCE_CAUTION_RIGHT_3 = 20;  //!< The next junction is 3rd right and the next signal is yellow.
	public define int EX_PROCEED_LEFT            = 5;   //!< The next junction is left and the next signal is green.
	public define int EX_PROCEED_RIGHT           = 6;   //!< The next junction is right and the next signal is green.
	public define int EX_PROCEED_LEFT_2          = 21;  //!< The next junction is 2nd left and the next signal is green.
	public define int EX_PROCEED_RIGHT_2         = 22;  //!< The next junction is 2nd right and the next signal is green.
	public define int EX_PROCEED_LEFT_3          = 23;  //!< The next junction is 3rd left and the next signal is green.
	public define int EX_PROCEED_RIGHT_3         = 24;  //!< The next junction is 3rd right and the next signal is green.
	
// speed signalling	specific staets
	public define int EX_SLOW													= 9;   //!< Proceed at slow speed.
	public define int EX_MEDIUM												= 10;  //!< Proceed at medium speed.
	public define int EX_RESTRICTED             			= 25;  //!< Proceed at restricted speed.
	public define int EX_LIMITED                			= 26;  //!< Proceed at limited speed.
	public define int EX_APPROACH_LIMITED							= 27;	//!< Approach next signal at limited speed.
	public define int EX_APPROACH_MEDIUM							= 28;	//!< Approach next signal at medium speed.
	public define int EX_APPROACH_SLOW								= 29;	//!< Approach next signal at slow speed.
	public define int EX_APPROACH_RESTRICTED					= 30;	//!< Approach next signal at restricted speed.
	public define int EX_LIMITED_APPROACH							= 31;	//!< Proceed at Limited speed prepared to stop at next signal
	public define int EX_MEDIUM_APPROACH							= 32;	//!< Proceed at Medium speed prepared to stop at next signal
	public define int EX_SLOW_APPROACH								= 33;	//!< Proceed at Slow speed prepared to stop at next signal
	public define int EX_LIMITED_APPROACH_MEDIUM			= 34;	//!< Proceed at Limited speed, approach next signal at Medium speed
	public define int EX_LIMITED_APPROACH_SLOW				= 35;	//!< Proceed at Limited speed, approach next signal at Slow speed
	public define int EX_LIMITED_APPROACH_RESTRICTED	= 36;	//!< Proceed at Limited speed, approach next signal at Restricted speed
	public define int EX_MEDIUM_APPROACH_SLOW					= 37;	//!< Proceed at Medium speed, approach next signal at Slow speed
	public define int EX_MEDIUM_APPROACH_RESTRICTED		= 38;	//!< Proceed at Medium speed, approach next signal at Restricted speed
	public define int EX_SLOW_APPROACH_RESTRICTED			= 39;	//!< Proceed at Slow speed, approach next signal at Restricted speed
	//@}

	//! Set the signal state and its 'mouse over' reason.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  state   One of the \ref sigStates "signal state" values to set this signal to.
	// Param:  reason  Reason string to be displayed when a mouse cursor is placed over the signal.
	//
	// See Also:
	//     Trackside::GetSignalState()
	//
	public native void SetSignalState(int state, string reason);

	// 
	// the following functions are now derived from the Trackside class.
	//
	//public native int GetSignalState(void);
	//public native int GetSignalStateEx(void);


	//! Set the emissive state of the signal bulbs.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Note:
	//     AI trains will still read the signal state, even if it is switched off.
	//
	// Param:  show  If true, the signal flare is switched on, otherwise false to turn it off.
	//
	public native void LightSignal(bool show);

	//! Set the extended state of this signal and its 'mouse over' reason.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Note:
	//     Only certain signal assets support the extended signal functionality.
	//
	// Param:  state   One of the \ref extSigStates "extended signal state" values to set this
	//                 signal to.
	// Param:  reason  Reason string to be displayed when a mouse cursor is placed over the signal.
	//
	// See Also:
	//     Trackside::GetSignalStateEx()
	//
	public native void SetSignalStateEx(int state, string reason);

	//! Determines if this signal is currently lit.
	//
	// Returns:
	//     Returns true if the signal is lit, false otherwise.
	//
	public native bool GetSignalLit(void);

	//! Determines if this is a distant signal
	//
	// Returns:
	//     Returns true if the object is a Distant signal, false otherwise.
	//
	public native bool GetIsDistant(void);

	//! Determines if this is a home signal
	//
	// Returns:
	//     Returns true if the object is a Home signal, false otherwise.
	//
	public native bool GetIsHome(void);

	//! Determines if this is a repeater signal
	//
	// Returns:
	//     Returns true if the object is a Repeater signal, false otherwise.
	//
	public native bool GetIsRepeater(void);
	
	//! Makes the signal update at the next available opportunity.
	//
	public native void ForceUpdate(void);
	
	//! Sets the autopilot hint object.
	//
	// This helps the AI direct it's attention toward solving the problem causing
	// a restrictive signal aspect, rather than letting it sit there like a lemon
	// waiting for the user to solve it for them.
	//
	public native void SetAutopilotHintObj(MapObject autopilotHintObj);

	//! Sets the autopilot first junction.
	//
	// This tells the AI what the first junction after a signal is.
	// It will look here if looking at the object returned as the Hint object does
	// not help with solving the problem.
	//
	public native void SetAutopilotJunction(JunctionBase autopilotFirstJunction);

	float overlap, baseOverlap;
	Soup myConfig, mySignals;
	bool overlapTC, doubleBlocking, isOldStyle3Aspect, alwaysControlled = false;

	//! Retrieves the overlap distance of this particular signal
	//
	// Returns:
	//     Returns the overlap distance of this particular signal.
	//
	public float GetOverlap(void) {
		return overlap;
	}

	//! Find out if the signal can display a specific state.
	//
	// Param:  state   One of the extSigStates "extended signal state" values.
	//
	public bool CanDisplayStateEx(int state)
	{
		if(isOldStyle3Aspect) {
			if(state == EX_STOP or state == EX_CAUTION or state == EX_PROCEED) {
				return true;
			}
			return false;
		}
		if(mySignals) { // should always be the case, but buggy content that doesn't call inherited() in the Init() method will not have this set.
			Soup myState = mySignals.GetNamedSoup(state);
			return(myState.CountTags() > 0);
		} else {
			// broken content. Should have called inherited() in their Init() method.
			// Log profusely. Give as much debugging info as possible. Don't rely on anything set up in Init(), because it might not be there!
			KUID myKUID = me.GetAsset().GetKUID();
			Interface.WarnObsolete("Signal.gs: Error: Signal is not old style 3 aspect, yet mySignals is undefined!");
			Interface.WarnObsolete("Signal.gs: Did someone forget to call inherited() in their Init method in asset \"" + myKUID.GetName() + "\" with KUID \"" + myKUID.GetLogString() + "\"?");
//			Interface.Print("Signal \"" + myKUID.GetName() + "\" with KUID \"" + myKUID.GetLogString() + "\" is faulty and needs fixing.");

			isOldStyle3Aspect = true; // failsafe so broken content goes dumb, but not totally dead. 
			return CanDisplayStateEx(state); // recursion is safe because of line above - this doesn't try looking at any of the stuff Init() should have set up.
		}
		return false;
	}

	public void Init(void)
	{

		inherited();

		// read the config file
		myConfig = GetAsset().GetConfigSoup();
		mySignals = myConfig.GetNamedSoup("signals");
		if(mySignals.CountTags() == 0) {
			// this an old style (pre-1.3) signal.
			// Buffer stops are still like this, and there may be other things out there like it too.
			isOldStyle3Aspect = true;
		}

		// get the 'overlap' tag
		baseOverlap = myConfig.GetNamedTagAsFloat("overlap");
		if(baseOverlap < DEFAULT_OVERLAP) {
			baseOverlap = DEFAULT_OVERLAP;
		}
		overlap = baseOverlap;

		// get the 'automatic' tag
		alwaysControlled = myConfig.GetNamedTagAsBool("always-controlled", false);

		// get the 'overlapTrackCircuit' tag
		overlapTC = myConfig.GetNamedTagAsBool("overlap-track-circuited", false);

		// get the 'double-blocking' tag
		doubleBlocking = myConfig.GetNamedTagAsBool("double-blocking", false);
		// prevent double blocking from being set on inappropriate signals
		if(!CanDisplayStateEx(EX_STOP) or !CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
			doubleBlocking = false;
		}
	}

	//! Find the nearest approaching train for a specific signal.
	//
	// Param:  start							The signal to start from
	// Param:  searchDirection		Which direction to search in. 'False' == in rear of the signal, 'True' == in advance of the signal.
	// Param:  numSignalsToCheck	How many signals to look past when looking for a train
	// Param:  maxDistance				How far down the track graph to look for a train
	//
	public Train findApproachingTrain(Signal start, bool searchDirection, int numSignalsToCheck, float maxDistance) {

		GSTrackSearch myGST = start.BeginTrackSearch(searchDirection);
		MapObject nextMapObject;
		int signalCount = 0;
		Vehicle theVeh;

    while(nextMapObject = myGST.SearchNext()) {
    	if(myGST.GetDistance() > maxDistance) {
	    	return null;
      } else if(cast<Signal> nextMapObject) {
      	if(!myGST.GetFacingRelativeToSearchDirection()) {
      		if((numSignalsToCheck > 0) and (++signalCount > numSignalsToCheck)) {
      			return null;
      		}
      	}
      } else if(cast<Vehicle> nextMapObject) {
      	theVeh = cast<Vehicle> nextMapObject;
      	
      	if(myGST.GetFacingRelativeToSearchDirection()) {
      		if(theVeh.GetVelocity() < 0.01) {
	      		return theVeh.GetMyTrain();
	      	} else {
	      		return null;
	      	}
      	} else {
       		if(theVeh.GetVelocity() > -0.01) {
		      	return theVeh.GetMyTrain();
		      } else {
		      	return null;
					}
      	}
	    }
    }
    return null;
  }

	//! Find a state that the signal can display, given a desired state.
	//
	// Param:  state   One of the extSigStates "extended signal state" values.
	//
	public int FindNearestDisplayableStateEx(int state)
	{
		// check if we can already do this one
		if(CanDisplayStateEx(state)) {
//			Interface.Log("Signal.gs: <" + me.GetName() + ">: Signal can already display state \"" + state + "\".");
			return state;
		}
		// okay, we can't, so try to find one we can.
//		Interface.Log("Signal.gs: <" + me.GetName() + ">: Signal can't display state \"" + state + "\" - finding alternative.");
		
    switch (state) {
    	case EX_STOP:
    		// can't display absolute stop.
    		if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
    			// Permissive signal
    			return EX_STOP_THEN_CONTINUE;
    		} else if (CanDisplayStateEx(EX_CAUTION)) {
    			// Distant
    			return EX_CAUTION;
    		}
	    	break;
	    case EX_STOP_THEN_CONTINUE:
	    	// can't display permissive stop
	    	if(CanDisplayStateEx(EX_STOP)) {
	    		// Absolute indication available
	    		return EX_STOP;
	    	}	else if(CanDisplayStateEx(EX_CAUTION)) {
	    		// Distant - no stop.
	    		return EX_CAUTION;
	    	}
	    	break;
  	  case EX_CAUTION:
				if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand caution - 2A home (R/G)?
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_CAUTION_LEFT:
   	 		if(CanDisplayStateEx(EX_CAUTION)) {
   	 			// don't understand left states
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_LEFT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
     	case EX_CAUTION_RIGHT:
   	 		if(CanDisplayStateEx(EX_CAUTION)) {
	 	 			// don't understand right states
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand right or caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
  				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
   			}
   			break;
  	  case EX_CAUTION_LEFT_2:
  	  	if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
  	  		// doesn't do 2nd left states
  	  		return EX_CAUTION_LEFT;
  	  	} else if(CanDisplayStateEx(EX_CAUTION)) {
   	 			// don't understand left states
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED_LEFT_2)) {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_LEFT_2;
   			} else if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
   				// don't understand caution or second left - 2 aspect stop/go?
   				return EX_PROCEED_LEFT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_CAUTION_RIGHT_2:
  	  	if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
  	  		// doesn't do 2nd right states
  	  		return EX_CAUTION_RIGHT;
  	  	} else if(CanDisplayStateEx(EX_CAUTION)) {
   	 			// don't understand left states
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED_RIGHT_2)) {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT_2;
   			} else if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
   				// don't understand caution or second right - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_CAUTION_LEFT_3:
  	  	if(CanDisplayStateEx(EX_CAUTION_LEFT_2)) {
  	  		// doesn't do 3rd left states
  	  		return EX_CAUTION_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
  	  		// doesn't do 2nd left states
  	  		return EX_CAUTION_LEFT;
  	  	} else if(CanDisplayStateEx(EX_CAUTION)) {
   	 			// don't understand left states
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED_LEFT_3)) {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_LEFT_3;
   			} else if(CanDisplayStateEx(EX_PROCEED_LEFT_2)) {
   				// don't understand caution or left 3 - 2 aspect stop/go?
   				return EX_PROCEED_LEFT_2;
   			} else if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
   				// don't understand caution or second left - 2 aspect stop/go?
   				return EX_PROCEED_LEFT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_CAUTION_RIGHT_3:
  	  	if(CanDisplayStateEx(EX_CAUTION_RIGHT_2)) {
  	  		// doesn't do 3rd right states
  	  		return EX_CAUTION_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
  	  		// doesn't do 2nd right states
  	  		return EX_CAUTION_RIGHT;
  	  	} else if(CanDisplayStateEx(EX_CAUTION)) {
   	 			// don't understand left states
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED_RIGHT_3)) {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT_3;
   			} else if(CanDisplayStateEx(EX_PROCEED_RIGHT_2)) {
   				// don't understand caution or right 3 - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT_2;
   			} else if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
   				// don't understand caution or second right - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
			case EX_SLOW:
				if(CanDisplayStateEx(EX_MEDIUM)) {
					return EX_MEDIUM;
				} else if(CanDisplayStateEx(EX_CAUTION)) {
					return EX_CAUTION;
				} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
					return EX_STOP_THEN_CONTINUE;
				} else if(CanDisplayStateEx(EX_PROCEED)) {
					return EX_PROCEED;
				}
			case EX_MEDIUM:
     		if(CanDisplayStateEx(EX_SLOW)) {
     			return EX_SLOW;
				} else if(CanDisplayStateEx(EX_CAUTION)) {
					return EX_CAUTION;
				} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
					return EX_STOP_THEN_CONTINUE;
				} else if(CanDisplayStateEx(EX_PROCEED)) {
					return EX_PROCEED;
				}
			case EX_ADVANCE_CAUTION:
				if(CanDisplayStateEx(EX_PROCEED)) {
					// 3 aspect
					return EX_PROCEED;
				} else if(CanDisplayStateEx(EX_CAUTION)) {
					// terminating
					return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
   			}
  	  case EX_ADVANCE_CAUTION_LEFT:
  	  	// ex_proceed_left is first so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
   	 		if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// don't understand left states
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or advance caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_ADVANCE_CAUTION_RIGHT:
  	  	// ex_proceed_right is first so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
   	 		if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// don't understand right states
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand right or advance caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_ADVANCE_CAUTION_LEFT_2:
  	  	if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT)) {
  	  		// doesn't do 2nd left states
  	  		return EX_ADVANCE_CAUTION_LEFT;
  	  	// ex_proceed_left is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
  	  	} else if(CanDisplayStateEx(EX_PROCEED_LEFT_2)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// don't understand left states
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or advance caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_ADVANCE_CAUTION_RIGHT_2:
  	  	if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT)) {
  	  		// doesn't do 2nd right states
  	  		return EX_ADVANCE_CAUTION_RIGHT;
  	  	// ex_proceed_right is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
  	  	} else if(CanDisplayStateEx(EX_PROCEED_RIGHT_2)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// don't understand right states
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand right or advance caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_ADVANCE_CAUTION_LEFT_3:
  	  	if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_2)) {
  	  		// doesn't do 3rd left states
  	  		return EX_ADVANCE_CAUTION_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT)) {
  	  		// doesn't do 2nd left states
  	  		return EX_ADVANCE_CAUTION_LEFT;
  	  	// ex_proceed_left is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
  	  	} else if(CanDisplayStateEx(EX_PROCEED_LEFT_3)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT_3;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_LEFT_2)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// don't understand left states
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand left or advance caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT_3)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_3;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_ADVANCE_CAUTION_RIGHT_3:
  	  	if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_2)) {
  	  		// doesn't do 3rd right states
  	  		return EX_ADVANCE_CAUTION_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT)) {
  	  		// doesn't do 2nd right states
  	  		return EX_ADVANCE_CAUTION_RIGHT;
  	  	// ex_proceed_right is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
  	  	} else if(CanDisplayStateEx(EX_PROCEED_RIGHT_3)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT_3;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_RIGHT_2)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// don't understand right states
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   				// don't understand right or advance caution
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT_3)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_3;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
			case EX_PROCEED:
   	 		if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   	 			// Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;

  	  case EX_PROCEED_LEFT:
  	  	// ex_advance_caution_left is first so that NSWGRian signals work, where proceed_left is not possible - all _left or _right states are restrictive
   	 		if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   	 			// don't understand left states
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   				// don't understand left or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_PROCEED_RIGHT:
  	  	// ex_advance_caution_right is first so that NSWGRian signals work, where proceed_right is not possible - all _left or _right states are restrictive
  	  	if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   	 			// don't understand right states
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   				// don't understand right or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_PROCEED_LEFT_2:
  	  	if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
  	  		// don't understand left 2 states
  	  		return EX_PROCEED_LEFT;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_2)) {
	  	  	// ex_advance_caution_left is here so that NSWGRian signals work, where proceed_left is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   	 			// don't understand left states
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   				// don't understand left or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_PROCEED_RIGHT_2:
  	  	if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
  	  		// don't understand right 2 states
  	  		return EX_PROCEED_RIGHT;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_2)) {
	  	  	// ex_advance_caution_right is here so that NSWGRian signals work, where proceed_right is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   	 			// don't understand right states
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   				// don't understand right or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_PROCEED_LEFT_3:
  	  	if(CanDisplayStateEx(EX_PROCEED_LEFT_2)) {
  	  		// don't understand left 3 states
  	  		return EX_PROCEED_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_LEFT)) {
  	  		// don't understand left 2 states
  	  		return EX_PROCEED_LEFT;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_3)) {
	  	  	// ex_advance_caution_left is here so that NSWGRian signals work, where proceed_left is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT_3;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_2)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT_2;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   	 			// don't understand left states
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   				// don't understand left or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT_3)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_3;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_LEFT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
  	  case EX_PROCEED_RIGHT_3:
  	  	if(CanDisplayStateEx(EX_PROCEED_RIGHT_2)) {
  	  		// don't understand right 3 states
  	  		return EX_PROCEED_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_PROCEED_RIGHT)) {
  	  		// don't understand right 2 states
  	  		return EX_PROCEED_RIGHT;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_3)) {
	  	  	// ex_advance_caution_right is here so that NSWGRian signals work, where proceed_right is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT_3;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_2)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT_2;
  	  	} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT)) {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_PROCEED)) {
   	 			// don't understand right states
   				return EX_PROCEED;
   			} else if(CanDisplayStateEx(EX_ADVANCE_CAUTION)) {
   				// don't understand right or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT_3)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_3;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT_2)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
   			} else if(CanDisplayStateEx(EX_CAUTION_RIGHT)) {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
   			} else if(CanDisplayStateEx(EX_CAUTION)) {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
   			} else if(CanDisplayStateEx(EX_STOP_THEN_CONTINUE)) {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
   			} else if(CanDisplayStateEx(EX_STOP)) {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
   		default:
				Interface.Log("Signal.gs: <" + me.GetName() + ">: Asked to find alternative to unknown state: " + state);
		}
		// failed to find a sensible fallback, grab the first state in the signal's state table.
		Interface.Log("Signal.gs: <" + me.GetName() + ">: Failed to find sensible alternative to state \"" + state + "\"!");
		string firstEntry = mySignals.GetIndexedTagName(0);
		return Str.ToInt(firstEntry);
	}

	//! Apply the speed limit for a given state. Limits are read from the config file.
	//
	// Param:  state   One of the extSigStates "extended signal state" values.
	//
	public void ApplySpeedLimitForStateEx(int state)
	{
		if(GetAsset().SupportsTrainzBuildVersion(2.8)) {
			if(mySignals) { // Damn signals that DON'T CALL INHERITED IN THEIR INIT METHOD LIKE THEY BLOODY WELL SHOULD DO!! GRRRAAAAARRR!!!
				Soup myState = mySignals.GetNamedSoup(state);
				SetSpeedLimit(myState.GetNamedTagAsFloat("speed", 0.0f));
			}
		}
	}

	//! Check for an oncoming train.
	//
	// Param:  myGST		TrackSearch object to search with.
	//									Should be set at the point to start searching from
	//									(e.g. right where "CheckForTrainInOverlap" left it).
	//
	// Note: Sideeffecting function. Will move the tracksearch on.
	//
	public Vehicle CheckForOncomingTrain(GSTrackSearch myGST)
	{
		// Note for the unwary:
		// Yes, we do need to inspect the object that is current before moving on to the next.
		// It may well be important in the case of a 1 car train that is the first thing
		// encountered outside the overlap distance.
		MapObject nextMapObject = myGST.GetMapObject();
		Vehicle nextVeh = null;
 	  while(nextMapObject) {
 			nextVeh = cast<Vehicle> nextMapObject;
 	  	if(nextVeh) {
	 	    if(myGST.GetFacingRelativeToSearchDirection()) {
 		    	if(nextVeh.GetVelocity() < -0.1) {
 	  	  		return nextVeh;
 	  	  	}
 	    	} else {
 	    		if(nextVeh.GetVelocity() > 0.1) {
 	    			return nextVeh;
 	    		}
 	    	}
 	    } else if(cast<Junction> nextMapObject) {
 	    	return null;
 	    }
    	nextMapObject = myGST.SearchNext();
    }
    return null;
	}

	//! Check for a train in the overlap distance.
	//
	// Param:  myGST   TrackSearch object to search with. Should be set at the signal we are to search the overlap of.
	// Param:  overlapDistance	   Overlap distance we need to search. 
	//
	// Note: Sideeffecting function. Will move the tracksearch on.
	//
	public Vehicle CheckForTrainInOverlap(GSTrackSearch myGST, float overlapDistance)
	{
		float signalDistance = myGST.GetDistance();
		MapObject nextMapObject;
 	  while((nextMapObject = myGST.SearchNext()) and myGST.GetDistance() < signalDistance + overlapDistance + HALF_A_CAR_LENGTH) {
 			if(cast<Vehicle> nextMapObject) {
 				return cast<Vehicle> nextMapObject;
 			}
 		}
 		return null;
	}

	//! Decide on a state for this signal.
	//
	// Note: the cool thing about this being here is if you don't like it,
	// or it doesn't suit your particular prototype, you can override it...
	//
	// Do be warned however: should you do this, it is VERY VERY easy to
	// destroy the performance of Trainz. Make sure your code is efficient.
	// For example: Don't read config files, as this is a time consuming operation!

	public Soup DetermineUpdatedState(void)
  {
//		TrainzScript.Print("Signal.gs: <" + me.GetName() + ">: DetermineUpdatedState called!");
		
		// GSTrackSearch our way down the track, and find out what is ahead of us.
		
    GSTrackSearch myGST = me.BeginTrackSearch(true);
    object nextObject;
		JunctionBase lastJunction = null;
		int trainApproaching = -1;
		Signal nextSignal = null;
		Train approachingTrain = null;
		float signalDistance, maxDistance;
		bool trainInPortalArea;
		
		int signalState = -1;
		string signalStateReason = "$signal_undecided_lbl";

		if(alwaysControlled)
		{
			approachingTrain = findApproachingTrain(me, false, 5, 16090); // 5 signals or 10 miles, whichever is closer
			if(approachingTrain and approachingTrain.GetFrontmostLocomotive())
			{
				trainApproaching = 1;
			}
			else
			{
				trainApproaching = 0;
			}
		}
		
		
    while(myGST.SearchNextObject())
    {
      nextObject = myGST.GetObject();
      
      if (cast<Vehicle> nextObject)
      {
        if (!me.GetIsRepeater())
        {
//          TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found traincar \"" + nextObject.GetName() + "\".");

				  // Base overlap test used here to prevent home signals from displaying confusing behaviour
				  // on very small portal-to-terminus layouts (e.g. Portal -> Home -> Buffers)
				  // and far too heavy traffic generated from the portal

				  if ((overlapTC) or (me.GetIsHome() and (me.GetOverlap() != baseOverlap)) or (myGST.GetDistance() > me.GetOverlap() - HALF_A_CAR_LENGTH))
				  {
            signalState = EX_STOP;
            signalStateReason = "$signal_nextblockbusy_lbl";
            SetAutopilotHintObj(nextObject);
	          break;
 	        }
 	        else
 	        {
//   	        TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: ... traincar is entirely within overlap, and is thus still in the block in rear.");
 	        }
 	      }
      }
      else if (cast<JunctionBase> nextObject)
      {
        if (!me.GetIsRepeater())
        {
//          TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found junction \"" + (cast<JunctionBase> nextObject).GetMapObject().GetName() + "\".");
				  if (!lastJunction)
				  {
					  SetAutopilotJunction(cast<JunctionBase> nextObject);
				  }
          lastJunction = cast<JunctionBase> nextObject;
          if(trainApproaching == -1)
          {
					  approachingTrain = findApproachingTrain(me, false, 5, 16090); // 5 signals or 10 miles, whichever is closer
					  if(approachingTrain and approachingTrain.GetFrontmostLocomotive())
					  {
						  trainApproaching = 1;
					  }
					  else
					  {
						  trainApproaching = 0;
					  }
          }
        }
      }
      else if (cast<Signal>(nextObject))
      {
        Signal tempSignal = cast<Signal>(nextObject);
        //TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found signal " + tempSignal.GetAsset().GetKUID().GetLogString() + "-\"" + tempSignal.GetName() + "\" ...");
        if(myGST.GetFacingRelativeToSearchDirection())
        {
	        //TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: ... and it's facing the correct way :)");
        	if (tempSignal.GetIsRepeater())
        	{
						// it's a repeater - ignore it.
						// It is only copying it's state from the signal in advance.
						// It is that signal we need to be looking at.
					}
					else if (me.GetIsRepeater())
					{
						// I am a repeater - copy my state from the signal in advance.
       			signalState = tempSignal.GetSignalStateEx();
       			signalStateReason = "$signal_repeater_lbl";
       			break;
					}
					else if (tempSignal.GetIsDistant())
					{
						// it's a distant
						if (!nextSignal and myGST.GetDistance() > me.GetOverlap() + HALF_A_CAR_LENGTH)
						{
						  // it's the first distant we've seen, and it's far enough away from the start of the search to want to increment states
						  // remember this one, as our aspect will be one greater than this, provided we can clear to the next home.
						  nextSignal = tempSignal;
						}
					}
					else
					{
    	      if (!nextSignal)
    	      {
    	      	// we haven't seen a distant, so our aspect will be based off this home or combined signal
    	      	nextSignal = tempSignal;
    	      	// if we are a home, the distance to this signal (minus a bit of fudge distance) is our overlap
    	      	if (me.GetIsHome())
    	      		overlap = myGST.GetDistance() - HALF_A_CAR_LENGTH;
    	      }
    	      else
    	      {
    	      	// if we are a home and our next signal is a distant (thus more accurately, we are a starter), set our default overlap
    	      	if (me.GetIsHome())
    	      		overlap = baseOverlap;
    	      }
      	    signalDistance = myGST.GetDistance();
      	    Vehicle theVeh = null;
      	    theVeh = CheckForTrainInOverlap(myGST, nextSignal.GetOverlap());
      	    if (theVeh)
      	    {
         			signalState = EX_STOP;
         			signalStateReason = "$signal_overlapoccupied_lbl";
         			SetAutopilotHintObj(cast<MapObject> theVeh);
    	      }
    	      else if (theVeh = CheckForOncomingTrain(myGST))
    	      {
    	      	signalState = EX_STOP;
          		signalStateReason = "$signal_oncomingtrain_lbl";
          		SetAutopilotHintObj(theVeh);
	          }
	          else if (signalDistance < me.GetOverlap() + HALF_A_CAR_LENGTH)
	          {
	          	// signals too close to each other for the AI to stop safely - don't advance state.
        	  	signalStateReason = "$signal_tooclose_lbl";
          	  switch (nextSignal.GetSignalStateEx())
          	  {
								case EX_STOP:
									if (doubleBlocking)
									{
										signalState = EX_STOP_THEN_CONTINUE;
										break;
									}
									// not double blocking - fall through
    	       		case EX_STOP_THEN_CONTINUE:
	         	  	case EX_CAUTION:
 		          	case EX_CAUTION_LEFT:
 		          	case EX_CAUTION_LEFT_2:
 		          	case EX_CAUTION_LEFT_3:
 	  	        	case EX_CAUTION_RIGHT:
 	  	        	case EX_CAUTION_RIGHT_2:
 	  	        	case EX_CAUTION_RIGHT_3:
								case EX_SLOW:
								case EX_MEDIUM:
									if (lastJunction)
									{
										if (trainApproaching)
										{
											switch (lastJunction.GetDirection())
											{
												case Junction.DIRECTION_LEFT:
													signalState = EX_CAUTION_LEFT;
													break;
												case Junction.DIRECTION_RIGHT:
													signalState = EX_CAUTION_RIGHT;
													break;
												default:
													signalState = EX_CAUTION;
											}
										}
										else
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
									}
									else
									{
										if (alwaysControlled and !trainApproaching)
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
										else
										{
											signalState = EX_CAUTION;
										}
									}
									break;
								case EX_ADVANCE_CAUTION:
								case EX_ADVANCE_CAUTION_LEFT:
								case EX_ADVANCE_CAUTION_LEFT_2:
								case EX_ADVANCE_CAUTION_LEFT_3:
								case EX_ADVANCE_CAUTION_RIGHT:
								case EX_ADVANCE_CAUTION_RIGHT_2:
								case EX_ADVANCE_CAUTION_RIGHT_3:
									if (lastJunction)
									{
										if (trainApproaching)
										{
											switch (lastJunction.GetDirection())
											{
												case Junction.DIRECTION_LEFT:
													signalState = EX_ADVANCE_CAUTION_LEFT;
													break;
												case Junction.DIRECTION_RIGHT:
													signalState = EX_ADVANCE_CAUTION_RIGHT;
													break;
												default:
													signalState = EX_ADVANCE_CAUTION;
											}
										}
										else
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
									}
									else
									{
										if (alwaysControlled and !trainApproaching)
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
										else
										{
											signalState = EX_ADVANCE_CAUTION;
										}
									}
							  		break;
								case EX_PROCEED:
								case EX_PROCEED_LEFT:
								case EX_PROCEED_LEFT_2:
								case EX_PROCEED_LEFT_3:
								case EX_PROCEED_RIGHT:
								case EX_PROCEED_RIGHT_2:
								case EX_PROCEED_RIGHT_3:
									if (lastJunction)
									{
										if (trainApproaching)
										{
											switch (lastJunction.GetDirection())
											{
												case Junction.DIRECTION_LEFT:
													signalState = EX_PROCEED_LEFT;
													break;
												case Junction.DIRECTION_RIGHT:
													signalState = EX_PROCEED_RIGHT;
													break;
												default:
													signalState = EX_PROCEED;
											}
										}
										else
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
									}
									else
									{
										if (alwaysControlled and !trainApproaching)
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
										else
										{
											signalState = EX_PROCEED;
										}
									}
								  break;
								default:
     					    signalState = EX_STOP;
		        		  signalStateReason = "$signal_unknownstate_lbl";
		        		  TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Signal ahead (" + nextSignal.GetName() + ") is in unknown state: " + nextSignal.GetSignalStateEx());
							}
	          }
	          else
	          {
    	        switch (nextSignal.GetSignalStateEx())
    	        {
								case EX_STOP:
									if (doubleBlocking)
									{
										signalState = EX_STOP_THEN_CONTINUE;
	      				    signalStateReason = "$signal_nsrdoubleblock_lbl";
										break;
									}
									// not double blocking - fall through
    	  	     	case EX_STOP_THEN_CONTINUE:
   	      				if (me.GetIsHome() and !(findApproachingTrain(me, false, 0, 40)))
   	      				{
   	      					// approach release case - train not close enough yet.
   	      					signalState = EX_STOP;
   	      					signalStateReason = "$signal_apprel_lbl";
									}
									else
									{
	      				    signalStateReason = "$signal_nextsignalred_lbl";
										if (lastJunction)
										{
											if (trainApproaching)
											{
												switch (lastJunction.GetDirection())
												{
													case Junction.DIRECTION_LEFT:
														signalState = EX_CAUTION_LEFT;
														break;
													case Junction.DIRECTION_RIGHT:
														signalState = EX_CAUTION_RIGHT;
														break;
													default:
														signalState = EX_CAUTION;
												}
											}
											else
											{
												signalState = EX_STOP;
												signalStateReason = "$signal_idle_lbl";
											}
										}
										else
										{
											if (alwaysControlled and !trainApproaching)
											{
												signalState = EX_STOP;
												signalStateReason = "$signal_idle_lbl";
											}
											else
											{
												signalState = EX_CAUTION;
											}
										}
									}
      	 	    		break;
        	 	  	case EX_CAUTION:
 	        	  	case EX_CAUTION_LEFT:
 	        	  	case EX_CAUTION_LEFT_2:
 	        	  	case EX_CAUTION_LEFT_3:
 	          		case EX_CAUTION_RIGHT:
 	          		case EX_CAUTION_RIGHT_2:
 	          		case EX_CAUTION_RIGHT_3:
								case EX_SLOW:
								case EX_MEDIUM:
			        	  signalStateReason = "$signal_nextsignalyellow_lbl";
			        	  if (lastJunction)
			        	  {
										if (trainApproaching)
										{
											switch (lastJunction.GetDirection())
											{
												case Junction.DIRECTION_LEFT:
													signalState = EX_ADVANCE_CAUTION_LEFT;
													break;
												case Junction.DIRECTION_RIGHT:
													signalState = EX_ADVANCE_CAUTION_RIGHT;
													break;
												default:
													signalState = EX_ADVANCE_CAUTION;
											}
										}
										else
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
									}
									else
									{
										if(alwaysControlled and !trainApproaching)
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
										else
										{
											signalState = EX_ADVANCE_CAUTION;
										}
									}
									break;
								case EX_ADVANCE_CAUTION:
								case EX_ADVANCE_CAUTION_LEFT:
								case EX_ADVANCE_CAUTION_LEFT_2:
								case EX_ADVANCE_CAUTION_LEFT_3:
								case EX_ADVANCE_CAUTION_RIGHT:
								case EX_ADVANCE_CAUTION_RIGHT_2:
								case EX_ADVANCE_CAUTION_RIGHT_3:
								case EX_PROCEED:
								case EX_PROCEED_LEFT:
								case EX_PROCEED_LEFT_2:
								case EX_PROCEED_LEFT_3:
								case EX_PROCEED_RIGHT:
								case EX_PROCEED_RIGHT_2:
								case EX_PROCEED_RIGHT_3:
		        		  signalStateReason = "$signal_lineclear_lbl";
									if (lastJunction)
									{
										if (trainApproaching)
										{
											switch (lastJunction.GetDirection())
											{
												case Junction.DIRECTION_LEFT:
													signalState = EX_PROCEED_LEFT;
													break;
												case Junction.DIRECTION_RIGHT:
													signalState = EX_PROCEED_RIGHT;
													break;
												default:
													signalState = EX_PROCEED;
											}
										}
										else
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
									}
									else
									{
										if (alwaysControlled and !trainApproaching)
										{
											signalState = EX_STOP;
											signalStateReason = "$signal_idle_lbl";
										}
										else
										{
											signalState = EX_PROCEED;
										}
									}
									break;
								default:
     					    signalState = EX_STOP;
		        		  signalStateReason = "$signal_unknownstate_lbl";
									TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Signal ahead (" + nextSignal.GetName() + ") is in unknown state: " + nextSignal.GetSignalStateEx());
							}
						}
    	      break;
    	    }
      	}
      	else
      	{
//	        TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: ... but it's facing the wrong way. This means we're on bi-di track...");
      	}
      }
      else if(cast<Trackside> nextObject)
      {
      	// some other trackside object.
//      	TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found trackside scenery item.");

        Trackside nextTracksideObject = (cast<Trackside> nextObject);
				if(nextTracksideObject.GetIsSearchLimit())
				{
					// it's a direction marker - does it affect signalling?
					if (nextTracksideObject.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsBool("30501-search-limit-affects-signaling"))
					{
				    if (!myGST.GetFacingRelativeToSearchDirection())
				    {
					    // facing against us
						  signalState = EX_STOP;
						  signalStateReason = "$signal_aidirectionmarker_lbl";
						  SetAutopilotHintObj(cast<MapObject> nextTracksideObject);
						  break;
					  }
					}
				}
      }
      else if(cast<SceneryWithTrack> nextObject)
      {
      	// some kind of crossing / turntable / buildable / fixed track junction.
        //TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found a Scenery object with attached track.");
        
        SceneryWithTrack theMoSWT = cast<SceneryWithTrack> nextObject;
        JunctionBase[] attachedJunctions = theMoSWT.GetAttachedJunctions();
        
        if (attachedJunctions and attachedJunctions.size() > 0)
        {
          // We have a fixed track junction
          //TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found a fixed track junction with " + attachedJunctions.size() + " junction nodes.");

          if (!me.GetIsRepeater())
          {
            if (!lastJunction)
              SetAutopilotJunction(attachedJunctions[0]);

            lastJunction = attachedJunctions[attachedJunctions.size() - 1];
            if (trainApproaching == -1)
            {
              approachingTrain = findApproachingTrain(me, false, 5, 16090); // 5 signals or 10 miles, whichever is closer
              if (approachingTrain and approachingTrain.GetFrontmostLocomotive())
                trainApproaching = 1;
              else
                trainApproaching = 0;
            }
          }
        }

        if (cast<BasePortal> nextObject)
        {
          // it's a portal.
          //BasePortal thePortal = cast<BasePortal> nextObject;
          //TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found a Portal");
          // Search to end of track to prove no additional trains are lurking.
          trainInPortalArea = false;
          maxDistance = myGST.GetDistance() + PORTAL_LENGTH + HALF_A_CAR_LENGTH;
          while (myGST.SearchNext())
          {
            nextObject = myGST.GetObject();
            if (cast<Vehicle> nextObject and myGST.GetDistance() < maxDistance)
            {
              signalState = EX_STOP;
              signalStateReason = "$signal_nextblockbusy_lbl";
              SetAutopilotHintObj(nextObject);
              break;
            }
          }
          if (signalState == -1)
          {
	      		// assume portal is willing to accept a train if there is no evidence of traincars nearby.
        	  signalStateReason = "$signal_lineclearportal_lbl";
        	  if (lastJunction)
        	  {
							if (trainApproaching)
							{
								switch (lastJunction.GetDirection())
								{
									case Junction.DIRECTION_LEFT:
										signalState = EX_PROCEED_LEFT;
										break;
									case Junction.DIRECTION_RIGHT:
										signalState = EX_PROCEED_RIGHT;
										break;
									default:
										signalState = EX_PROCEED;
								}
							}
							else
							{
								signalState = EX_STOP;
								signalStateReason = "$signal_trainapproaching_lbl";
							}
						}
						else
						{
							if (alwaysControlled and !trainApproaching)
							{
								signalState = EX_STOP;
								signalStateReason = "$signal_idle_lbl";
							}
							else
							{
								signalState = EX_PROCEED;
							}
						}
	      	}
	      	break;
	      }
      	else
      	{
      		// something other than a portal - ignore
//      		TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Scenery with track is not a Portal or Fixed Track Junction -- irrelevant from the signalling perspective.");
      	}
      }
      else
      {
      	if (!nextObject)
      	{
      	  // This is bad. TrackSearch found something, but it can't tell us what it found.
      	  TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: TrackSearch.GetObject() returned null, when TrackSearch.SearchNext() returned true. Huh?");
      	}
      	else
      	{
      	  // nextObject is definitely not null, but it wasn't anything we have code for.
      	  // It is possible this is something where it's GSClass doesn't match it's native class. This is disturbingly common with Level Crossings, which should be "Crossing", but are often "MapObject".
//      	  if (cast<MapObject> nextObject)
//      	  {
//      	    TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found some other type of object I need to be educated about: \"" + (cast<MapObject> nextObject).GetName() + "\".");
//          }
//    	    else
//    	    {
//    	      TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found some other type of object I need to be educated about. Not null, but not castable to MapObject.");
//    	    }
        }
      }
    }


    if (signalState == -1)
    {
//      TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Ran out of things in the search.");
	    signalState = EX_STOP;
   	  
   	  if (lastJunction)
   	  {
        SetAutopilotHintObj(lastJunction.GetMapObject());
	   	  signalStateReason = "$signal_unsignalled_lbl";
   	  }
   	  else
   	  {
	   	  signalStateReason = "$signal_endofline_lbl";
	   	}
    }
    
    // okay, so we've found what we think is the state we want.
    // however, we have no idea if the signal can display it,
    // so we now check this against what the signal can do
		signalState = FindNearestDisplayableStateEx(signalState);

		Soup signalStateSoup = Constructors.NewSoup();

		signalStateSoup.SetNamedTag("state", signalState);
		signalStateSoup.SetNamedTag("reason", signalStateReason);

		return signalStateSoup;

	}

	void ApplyUpdatedState(Soup signalStateSoup) {
		int signalState = signalStateSoup.GetNamedTagAsInt("state", EX_STOP);
		
		// Signals can apply speed limits
		// so check to see if this signal has a limit specified for this state
		ApplySpeedLimitForStateEx(signalState);
	}
	
	final Soup PerformLogic(void) {
		Soup signalStateSoup = DetermineUpdatedState();
		ApplyUpdatedState(signalStateSoup);
		return signalStateSoup;
	}
};

