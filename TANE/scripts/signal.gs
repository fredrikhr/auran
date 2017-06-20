// ============================================================================
// File: Signal.gs
// Desc: The script base-class for Trainz signal assets.
// ============================================================================
include "gs.gs"
include "trackside.gs"
include "baseportal.gs"



// ============================================================================
// Name: Signal
// Desc: The script base-class for Trainz signal assets. Responsible for
//       implementing the script<->native API bindings, and performing some
//       logic to determine which signal state should be displayed. Signals
//       in Trainz are normally self-sustaining rather than part of a larger
//       signal/dispatch system. It is possible for a Rule or Library to
//       override this behaviour and take manual control over the signal
//       objects, but a Signal script should never attempt this by itself.
// Note: Messages related to signals are:
//       [ Major    | Minor                       | Source | Destination ]
//       [ "Signal" | "State Changed"             | signal | signal      ]
//       [ "Signal" | "Train Approaching"         | train  | signal      ]
//       [ "Signal" | "Train Leaving"             | train  | signal      ]
//       [ "Train"  | "Entered red signal"        | signal | train       ]
//       [ "Train"  | "Entered signal"            | signal | train       ]
//       Legacy messages, which will be phased out and should not be used:
//       [ "Signal" | "State Changed"             | signal | broadcast   ]
//       [ "Train"  | "Passed Signal"             | train  | broadcast   ]
//       [ "Train"  | "Entered red signal notify" | train  | broadcast   ]
// ============================================================================
game class Signal isclass Trackside
{
  // Useful Signalling Terminology:
  //
  // "Home" - a signal that can display at minimum a stop aspect and a proceed aspect. 
  //
  // "Starter" - a "home" signal used to start the train away from a station stop.
  //             Functionally no different to a standard "home" signal.
  //
  // "Distant" - a signal that cannot display a stop aspect. The most restrictive aspect
  //             a distant signal can display is generally "caution".
  //
  // "Repeater" - a signal that merely copies the display of another signal
  //              Generally these are found a short distance in rear (see below...) of
  //              the signal they are repeating, and serve to extend the distance a
  //              driver can see the signal for on approach.
  //
  // "Clear" - A signal is said to be "Clear" if it is not showing it's most restrictive
  //           aspect.
  // 
  // "In Advance" - Signal 1 is said to be "In Advance" of signal 2
  //                if a driver at signal 2 will arrive at signal 1 later on
  //                - i.e. signal 1 is currently ahead of him.
  //
  //  ---[DRIVER>-(2)---------------(1)------  "1 is in advance of 2"
  //
  // "In Rear" - Signal 2 is said to be "In Rear" of signal 1 if a driver at
  //             signal 1 has already passed signal 2 - i.e. signal 2 is behind him.
  //
  //  ------------(2)------[DRIVER>-(1)------  "2 is in rear of 1"
  //
  // "Plain Line" - The track in advance of this signal (as far as the next signal)
  //                does not include any junctions at all.
  // 
  // "Controlled" - A controlled signal is normally at stop, and will only clear
  //                to allow the passage of a train -- i.e. it requires an approaching
  //                train before it will clear. This is typical for signals that are
  //                under human control, whether directly or via an interlocking or panel.
  //                Controlled signals are normally used at junctions.
  //
  // "Automatic" - An automatic signal is normally at proceed, unless restricted by
  //               occupied track or the state of signals in advance. It does not need
  //               an approaching train in order to show a clear aspect.
  //               Automatic signals are normally used on plain line, and are not normally
  //               found at junctions.
  //
  // "Overlap" - The overlap is the piece of track beyond a signal reserved for safety.
  //
  //  --[TRAIN-B>-(2)---------------(1)-[TRAIN-A>---- 
  //               ^   ^             ^   ^           Signal 2 will not clear until Train-A
  //                                                 has moved beyond the end of Signal 1's
  //                                                 overlap distance, marked by "^" in the
  //                                                 diagram.

  // ============================================================================
  // Desc: Some distance constants used in our logic (meters.)
  // ============================================================================
  public define int HALF_A_CAR_LENGTH = 20;       // i.e. half a 40m long traincar.
  public define int MINIMUM_SIGNAL_SPACING = 50;  // Signals must be placed more than 50m apart to increment state.
  public define int PORTAL_LENGTH = 300;          // Just how far after finding a portal do we keep looking for trains?
                                                  // this is because users may attach track to both ends of a portal.
  public define int DEFAULT_OVERLAP = 25;         // Overridden by 'overlap' in the config.txt.


  // ============================================================================
  // Desc: Basic signal states. AI driver behaviour is mostly defined in terms
  //       of these simple states.
  // ============================================================================
  public define int GREEN = 2;       // Signal is green (clear state).
  public define int YELLOW = 1;      // Signal is yellow (caution state).
  public define int RED = 0;         // Signal is red (stop state).
  public define int AUTOMATIC = -1;  // Signal state is automatically handled by %Trainz.


  // ============================================================================
  // Name: EX_*
  // Desc: "Extended" signal state enumerations. Each of these states
  //       corresponds to one of the basic signal states but provides additional
  //       detail to interested parties. A given signal may implement only a
  //       subset of these states.
  // ============================================================================
// shared states
  public define int EX_STOP                    = 0;   // Extended stop state.  Signal is red.
  public define int EX_STOP_THEN_CONTINUE      = 1;   // Alternative for stop - asset specific.
  public define int EX_CAUTION                 = 4;   // The next signal is red.
  public define int EX_ADVANCE_CAUTION         = 7;   // The next signal is yellow.
  public define int EX_PROCEED                 = 8;   // Extended proceed state.  Signal is green.

// route signalling specific states
  public define int EX_CAUTION_LEFT            = 2;   // The next junction is left and the next signal is red.
  public define int EX_CAUTION_RIGHT           = 3;   // The next junction is right and the next signal is red.
  public define int EX_CAUTION_LEFT_2          = 13;  // The next junction is 2nd left and the next signal is red.
  public define int EX_CAUTION_RIGHT_2         = 14;  // The next junction is 2nd right and the next signal is red.
  public define int EX_CAUTION_LEFT_3          = 15;  // The next junction is 3rd left and the next signal is red.
  public define int EX_CAUTION_RIGHT_3         = 16;  // The next junction is 3rd right and the next signal is red.
  public define int EX_ADVANCE_CAUTION_LEFT    = 11;  // The next junction is left and the next signal is yellow.
  public define int EX_ADVANCE_CAUTION_RIGHT   = 12;  // The next junction is right and the next signal is yellow.
  public define int EX_ADVANCE_CAUTION_LEFT_2  = 17;  // The next junction is 2nd left and the next signal is yellow.
  public define int EX_ADVANCE_CAUTION_RIGHT_2 = 18;  // The next junction is 2nd right and the next signal is yellow.
  public define int EX_ADVANCE_CAUTION_LEFT_3  = 19;  // The next junction is 3rd left and the next signal is yellow.
  public define int EX_ADVANCE_CAUTION_RIGHT_3 = 20;  // The next junction is 3rd right and the next signal is yellow.
  public define int EX_PROCEED_LEFT            = 5;   // The next junction is left and the next signal is green.
  public define int EX_PROCEED_RIGHT           = 6;   // The next junction is right and the next signal is green.
  public define int EX_PROCEED_LEFT_2          = 21;  // The next junction is 2nd left and the next signal is green.
  public define int EX_PROCEED_RIGHT_2         = 22;  // The next junction is 2nd right and the next signal is green.
  public define int EX_PROCEED_LEFT_3          = 23;  // The next junction is 3rd left and the next signal is green.
  public define int EX_PROCEED_RIGHT_3         = 24;  // The next junction is 3rd right and the next signal is green.

// speed signalling specific staets
  public define int EX_SLOW                         = 9;   // Proceed at slow speed.
  public define int EX_MEDIUM                       = 10;  // Proceed at medium speed.
  public define int EX_RESTRICTED                   = 25;  // Proceed at restricted speed.
  public define int EX_LIMITED                      = 26;  // Proceed at limited speed.
  public define int EX_APPROACH_LIMITED             = 27;  // Approach next signal at limited speed.
  public define int EX_APPROACH_MEDIUM              = 28;  // Approach next signal at medium speed.
  public define int EX_APPROACH_SLOW                = 29;  // Approach next signal at slow speed.
  public define int EX_APPROACH_RESTRICTED          = 30;  // Approach next signal at restricted speed.
  public define int EX_LIMITED_APPROACH             = 31;  // Proceed at Limited speed prepared to stop at next signal
  public define int EX_MEDIUM_APPROACH              = 32;  // Proceed at Medium speed prepared to stop at next signal
  public define int EX_SLOW_APPROACH                = 33;  // Proceed at Slow speed prepared to stop at next signal
  public define int EX_LIMITED_APPROACH_MEDIUM      = 34;  // Proceed at Limited speed, approach next signal at Medium speed
  public define int EX_LIMITED_APPROACH_SLOW        = 35;  // Proceed at Limited speed, approach next signal at Slow speed
  public define int EX_LIMITED_APPROACH_RESTRICTED  = 36;  // Proceed at Limited speed, approach next signal at Restricted speed
  public define int EX_MEDIUM_APPROACH_SLOW         = 37;  // Proceed at Medium speed, approach next signal at Slow speed
  public define int EX_MEDIUM_APPROACH_RESTRICTED   = 38;  // Proceed at Medium speed, approach next signal at Restricted speed
  public define int EX_SLOW_APPROACH_RESTRICTED     = 39;  // Proceed at Slow speed, approach next signal at Restricted speed

  public define int EX_SIGNAL_STATE_MAX             = 40;  // This is not a valid signal state, used for state iteration only.
                                                           // Note that this value may change in future versions.


  //=============================================================================
  // Name: SetSignalOwner
  // Desc: Modifies the signal owner object if possible. If the signal is already
  //       owned this call will only succeed if the token is valid for the
  //       current owner.
  // Parm: token - A token for the signal owner (new and current, if applicable)
  //       with rights "signal-owner"
  // Parm: owner - The new desired signal owner, or null to switch to unowned
  // Retn: bool - Whether the call succeeded, and the signal owner was changed
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native bool SetSignalOwner(SecurityToken token, TrainzGameObject owner);

  //=============================================================================
  // Name: GetSignalOwner
  // Desc: Returns the current signal owner object, if any
  //=============================================================================
  public native TrainzGameObject GetSignalOwner();


  //=============================================================================
  // Name: IsSignalStateAutomatic
  // Desc: Returns whether this signals state is currently 'automatic' (i.e.
  //       under native code control)
  //=============================================================================
  public native bool IsSignalStateAutomatic();


  //=============================================================================
  // Name: SetSignalState
  // Desc: Sets the signal state and mouseover tooltip. If set to AUTOMATIC the
  //       signal will operate automatically based on nearby activity. Setting
  //       any other value will override the signal state until it is set back to
  //       AUTOMATIC. If this signal is owned and a null token is passed the call
  //       will fail and throw a script exception.
  // Parm: token - A token for the signal owner with rights "signal-state"
  // Parm: state - The basic signal state to set this signal to
  // Parm: reason - Localised text explaining why the signal is set the way it is
  // Retn: bool - Whether the call succeeded, and the signal state was changed
  // Note: During multiplayer games this function will only succeed on the server
  // Note: There is a 'GetSignalState()' function declared in our base class
  //=============================================================================
  public native bool SetSignalState(SecurityToken token, int state, string reason);

  //=============================================================================
  // Name: SetSignalState
  // Desc: Obsolete. This function will throw an exception if the signal is owned
  //=============================================================================
  public obsolete void SetSignalState(int state, string reason)
  {
    SetSignalState(null, state, reason);
  }


  //=============================================================================
  // Name: SetSignalStateEx
  // Desc: Sets the signal state and mouseover tooltip. Note that setting the
  //       state to AUTOMATIC is not valid here, call SetSignalState() instead.
  //       If this signal is owned and a null token is passed the call will fail
  //       and throw a script exception.
  // Parm: token - A token for the signal owner with rights "signal-state"
  // Parm: state - The extended signal state to set this signal to, Signal.EX_*
  // Parm: reason - Localised text explaining why the signal is set the way it is
  // Retn: bool - Whether the call succeeded, and the signal state was changed
  // Note: During multiplayer games this function will only succeed on the server
  // Note: There is a 'GetSignalStateEx()' function declared in our base class
  //=============================================================================
  public native bool SetSignalStateEx(SecurityToken token, int state, string reason);

  //=============================================================================
  // Name: SetSignalStateEx
  // Desc: Obsolete. This function will throw an exception if the signal is owned
  //=============================================================================
  public obsolete void SetSignalStateEx(int state, string reason)
  {
    SetSignalStateEx(null, state, reason);
  }

  //=============================================================================
  // Name: LightSignal
  // Desc: Controls whether this signal should display corona effects. This is
  //       intended to be called by other scripts to set this signal as inactive.
  //       If this signal is owned and a null token is passed the call will fail
  //       and throw a script exception.
  // Parm: token - A token for the signal owner with rights "signal-state"
  // Parm: bShouldLightSignal - true to enable signal coronas, false to be unlit
  // Retn: bool - Whether the call succeeded, and the signal state was changed
  // Note: The signal script should not normally call this on itself as its
  //       usage may conflict with other callers. If the signal requires an
  //       all-dark state then it should provide one through other means such as
  //       an actual signal state which defines no coronas lit, or by completely
  //       scripted control over the coronas.
  // Note: Deactivating the signal display in this manner should not affect the
  //       signal state logic in any fashion- the current state of the signal is
  //       still considered in effect, but is simply not displayed to the user.
  //=============================================================================
  public native bool LightSignal(SecurityToken token, bool bShouldLightSignal);

  //=============================================================================
  // Name: LightSignal
  // Desc: Obsolete. This function will throw an exception if the signal is owned
  //=============================================================================
  public obsolete void LightSignal(bool bLit)
  {
    LightSignal(null, bLit);
  }

  // ============================================================================
  // Name: GetSignalLit
  // Desc: Returns whether the signal state display is currently enabled, as per
  //       LightSignal(). This should be called by signals which provide custom
  //       display logic, such as semaphores, or signals which do not make use of
  //       the standard native signal mechanisms. Rules or Libraries may call
  //       this function to determine whether this signal's state is visible to
  //       the user.
  // ============================================================================
  public native bool GetSignalLit(void);


  // ============================================================================
  // Name: GetIsDistant
  // Desc: Determines if this is a "distant" type signal. See definitions above
  //       for what a distant signal is.
  // Retn: bool - True if this signal is a "distant" type signal.
  // ============================================================================
  public native bool GetIsDistant(void);


  // ============================================================================
  // Name: GetIsHome
  // Desc: Determines if this is a "home" type signal. See definitions above for
  //       what a home signal is.
  // Retn: bool - True if this signal is a "home" type signal.
  // ============================================================================
  public native bool GetIsHome(void);


  // ============================================================================
  // Name: GetIsRepeater
  // Desc: Determines if this is a "repeater" type signal. See definitions above
  //       for what a repeater signal is.
  // Retn: bool - True if this signal is a "repeater" type signal.
  // ============================================================================
  public native bool GetIsRepeater(void);


  // ============================================================================
  // Name: ForceUpdate
  // Desc: Forces the signal to update its state using the scripted logic at the
  //       next available opportunity. This carries a heavy performance penalty
  //       if called frequently. Do not call this on a timer or other regular
  //       basis
  // Note: The native systems are quite smart about updating the signal state at
  //       appropriate times. If you find that you need to call this function,
  //       it's likely that you are doing something wrong. This function should
  //       only be necessary in response to a scripted state change which is
  //       completely invisible to the native systems, such as a scripted
  //       configuration change in Surveyor.
  // ============================================================================
  public native void ForceUpdate(void);


  // ============================================================================
  // Name: SetAutopilotHintObj
  // Desc: Blames the specified map object for the current signal state. If the
  //       AI train drivers find that this signal is set inappropriately for
  //       their needs, they will use this hint as a guide on what they can do
  //       to resolve the problem. This function is generally called by the
  //       internal signal logic.
  // Parm: autopilotHintObj - The map object which is most contributing to the
  //       current signal state, or null if no map object is influencing the
  //       signal state.
  // ============================================================================
  public native void SetAutopilotHintObj(MapObject autopilotHintObj);


  // ============================================================================
  // Name: SetAutopilotJunction
  // Desc: Called by the signal state update logic, this function records the
  //       first junction encountered after this signal, which may be useful for
  //       the AI driver characters in resolving blockages. If no junction
  //       follows after this signal within the signal logic's search range, this
  //       should be called with null.
  // ============================================================================
  public native void SetAutopilotJunction(JunctionBase autopilotFirstJunction);


  // ============================================================================
  // Desc: Values cached from the config file during Init().
  // ============================================================================
  float overlap;          // Our overlap distance, see GetOverlap().
  float baseOverlap;      // The overlap distance specified in our config file.
  Soup mySignals;         // A reference to the signals container from our
                          // config file.
                          
  bool overlapTC;         // Is the overlap distance a separate track circuit?
                          // If the overlap is separately track circuited, our
                          // signal will return to danger the moment it is passed.
                          // If it is not, it will only return to danger when the
                          // train passing it has travelled the length of the overlap
                          // (Overlaps are generally separately track circuited at
                          // junctions, but not on plain line.)
                          
  bool doubleBlocking;    // Do we want Double Blocking behaviour on this signal?
                          // Double blocking adds an ex_stop_then_continue aspect
                          // into the aspect sequence between ex_stop and ex_caution
                          // This is common in cab-signalling systems, where an
                          // entire safety block between trains is required, but
                          // can be used anywhere.
                          
  bool isOldStyle3Aspect; // An autodetected compatibility hack for older signals.
  
  bool alwaysControlled;  // Signals that are always controlled will never go into
                          // automatic mode. They must always wait for a train to
                          // approach before clearing, even on plain line.



  // ============================================================================
  // Desc: Called from DetermineUpdatedState() to update the value of our
  //       cached 'overlap' variable. See GetOverlap() for details.
  // Parm: newOverlap - The new overlap distance, in meters.
  // ============================================================================
  void SetOverlap(float newOverlap)
  {
    // If nothing has changed, early out.
    if (overlap == newOverlap)
      return;
    
    // Update to the new value and notify any nearby signals that something has
    // changed that they may need to react to.
    overlap = newOverlap;
    NotifyTrackGraphObservers();
  }


  // ============================================================================
  // Name: GetOverlap
  // Desc: Returns the measured overlap for this signal's block.
  // Retn: float - The distance beyond the next Signal to which our
  //       effective signalling block extends. For example, a return value of
  //       10.0 would indicate that our signal will clear when the trailing
  //       vehicle of a Train is at least 10m beyond the next Signal.
  // ============================================================================
  public float GetOverlap(void)
  {
		return overlap;
	}

  
  // ============================================================================
  // Name: CanDisplayStateEx
  // Desc: Determines whether this signal object is capable of displaying the
  //       specified extended state.
  // Parm: state - The extended state that you wish to test for.
  // Retn: bool - True if this signal can display the state.
  // ============================================================================
	public bool CanDisplayStateEx(int state)
	{
    if (!isOldStyle3Aspect)
    {
      // should always be the case, but buggy content that doesn't call inherited() in the Init() method will not have this set.
      if (mySignals)
      {
			Soup myState = mySignals.GetNamedSoup(state);
			return(myState.CountTags() > 0);
      }
      
			// broken content. Should have called inherited() in their Init() method.
			// Log profusely. Give as much debugging info as possible. Don't rely on anything set up in Init(), because it might not be there!
			KUID myKUID = me.GetAsset().GetKUID();
			Interface.WarnObsolete("Signal.gs: Error: Signal is not old style 3 aspect, yet mySignals is undefined!");
			Interface.WarnObsolete("Signal.gs: Did someone forget to call inherited() in their Init method in asset \"" + myKUID.GetName() + "\" with KUID \"" + myKUID.GetLogString() + "\"?");
//			Interface.Print("Signal \"" + myKUID.GetName() + "\" with KUID \"" + myKUID.GetLogString() + "\" is faulty and needs fixing.");

			isOldStyle3Aspect = true; // failsafe so broken content goes dumb, but not totally dead. 
		}
    
    
    if (state == EX_STOP or state == EX_CAUTION or state == EX_PROCEED)
      return true;

		return false;
	}


  // ============================================================================
  // Name: Init
  // Desc: Constructor. Called when this object is created in the world. 
  // ============================================================================
	public void Init(void)
	{
		inherited();

		// read the config file
    Soup myConfig = GetAsset().GetConfigSoup();
		mySignals = myConfig.GetNamedSoup("signals");
    if (mySignals.CountTags() == 0)
    {
			// this an old style (pre-1.3) signal.
			// Buffer stops are still like this, and there may be other things out there like it too.
			isOldStyle3Aspect = true;
		}

		// get the 'overlap' tag
		baseOverlap = myConfig.GetNamedTagAsFloat("overlap");
    if (baseOverlap < DEFAULT_OVERLAP)
			baseOverlap = DEFAULT_OVERLAP;

		// get the 'automatic' tag
		alwaysControlled = myConfig.GetNamedTagAsBool("always-controlled", false);

		// get the 'overlapTrackCircuit' tag
		overlapTC = myConfig.GetNamedTagAsBool("overlap-track-circuited", false);

		// get the 'double-blocking' tag
		doubleBlocking = myConfig.GetNamedTagAsBool("double-blocking", false);
		// prevent double blocking from being set on inappropriate signals
    if (!CanDisplayStateEx(EX_STOP) or !CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
			doubleBlocking = false;
		}


  // ============================================================================
  // Name: FindApproachingTrain
  // Desc: Find the nearest approaching train for a specific signal.
  // Parm: start - The signal to start searching from.
  // Parm: searchDirection - Which direction to search in. 'False' == in rear of
  //       the signal, 'True' == in advance of the signal.
  // Parm: numSignalsToCheck - How many signals to look past when looking for a
  //       train. Negative means infinite. Zero means stop at the first signal.
  //       One means stop at the second signal encountered, etc.
  // Parm: maxDistance - How far down the track to look for a train (meters.)
  //       Note that there is no 'infinite' distance search as this would never
  //       end if the track was looped. Generally speaking a limit of around 15km
  //       is considered acceptable unless you have a specific reason to set some
  //       other limit.
  // ============================================================================
  public Train FindApproachingTrain(Signal start, bool searchDirection, int numSignalsToCheck, float maxDistance)
  {
		GSTrackSearch myGST = start.BeginTrackSearch(searchDirection);
		MapObject nextMapObject;
		int signalCount = 0;

    // Get the next search result. Loop until we run out of search results.
    while (nextMapObject = myGST.SearchNext())
    {
      // Have we reached the distance limit?
      if (myGST.GetDistance() > maxDistance)
      {
        // Yes, so give up searching. We found nothing.
	    	return null;
      }
      
      // Is the search result a signal?
      if (cast<Signal> nextMapObject)
      {
        // Yes. Is it facing the same direction as us?
        if (!myGST.GetFacingRelativeToSearchDirection())
        {
          // Yes. Do we limit our search by signal count?
          if (numSignalsToCheck > 0)
          {
            // Yes. Have we reached the limit?
            if (++signalCount > numSignalsToCheck)
            {
              // Yes, so give up searching. We found nothing.
      			return null;
      		}
      	}
        }
      }
      
      // Is the search result a Vehicle?
      else if (cast<Vehicle> nextMapObject)
      {
        // Yes, it's a Vehicle.
        Vehicle theVeh = cast<Vehicle> nextMapObject;
        
        // Get the Vehicle's velocity relative to us.
        float relativeVelocity = theVeh.GetVelocity();
        if (!myGST.GetFacingRelativeToSearchDirection())
          relativeVelocity = -relativeVelocity;
        
      	
        // Is the vehicle moving towards us?
        if (relativeVelocity < 0.01)
        {
          // Yes, it's moving towards us (or stationary.) We return the Train to which the vehicle belongs.
	      		return theVeh.GetMyTrain();
	      	}
        else
        {
          // No, it's moving away. We don't search past the first train because it will
          // prevent any other train reaching us.
		      	return null;
					}
      	}
	    }
    
    // We reached the end of the search without finding any train.
    return null;
    }
  
  
  // ============================================================================
  // Name: findApproachingTrain [SIC]
  // Desc: Obsolete. Use FindApproachingTrain. Be aware that the parameters
  //       differ slightly in interpretation.
  // Parm: start - The signal to start searching from.
  // Parm: searchDirection - Which direction to search in. 'False' == in rear of
  //       the signal, 'True' == in advance of the signal.
  // Parm: numSignalsToCheck - How many signals to look past when looking for a
  //       train. Zero means infinite. One means look past the first signal but
  //       not past a second signal.
  // Parm: maxDistance - How far down the track graph to look for a train
  //       (meters.)
  // ============================================================================
  public obsolete Train findApproachingTrain(Signal start, bool searchDirection, int numSignalsToCheck, float maxDistance)
  {
    if (numSignalsToCheck <= 0)
      numSignalsToCheck = -1;
    
    return FindApproachingTrain(start, searchDirection, numSignalsToCheck, maxDistance);
  }


  // ============================================================================
  // Name: FindNearestDisplayableStateEx
  // Desc: Given an extended display state, returns the closest-matching extended
  //       display state that this signal object can actually display.
  // Parm: state - The extended display state that you would like to use.
  // Retn: int - The closest-matching extended display state that is supported.
  // ============================================================================
	public int FindNearestDisplayableStateEx(int state)
	{
    // Check if we support the requested state.
    if (CanDisplayStateEx(state))
			return state;
    
    
    // We don't support the requested state, so try to find one we support.
    
//		Interface.Log("Signal.gs: <" + me.GetName() + ">: Signal can't display state \"" + state + "\" - finding alternative.");
		
    switch (state)
    {
    	case EX_STOP:
    		// can't display absolute stop.
      if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
    			// Permissive signal
    			return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
    			// Distant
    			return EX_CAUTION;
    		}
	    	break;
    
	    case EX_STOP_THEN_CONTINUE:
	    	// can't display permissive stop
      if (CanDisplayStateEx(EX_STOP))
      {
	    		// Absolute indication available
	    		return EX_STOP;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
	    		// Distant - no stop.
	    		return EX_CAUTION;
	    	}
	    	break;
    
  	  case EX_CAUTION:
      if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand caution - 2A home (R/G)?
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_CAUTION_LEFT:
      if (CanDisplayStateEx(EX_CAUTION))
      {
   	 			// don't understand left states
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT))
      {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
     	case EX_CAUTION_RIGHT:
      if(CanDisplayStateEx(EX_CAUTION))
      {
	 	 			// don't understand right states
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand right or caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
  				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
   			}
   			break;
    
  	  case EX_CAUTION_LEFT_2:
      if(CanDisplayStateEx(EX_CAUTION_LEFT))
      {
  	  		// doesn't do 2nd left states
  	  		return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   	 			// don't understand left states
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT_2))
      {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT))
      {
   				// don't understand caution or second left - 2 aspect stop/go?
   				return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_CAUTION_RIGHT_2:
      if(CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
  	  		// doesn't do 2nd right states
  	  		return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   	 			// don't understand left states
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT_2))
      {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
   				// don't understand caution or second right - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_CAUTION_LEFT_3:
      if(CanDisplayStateEx(EX_CAUTION_LEFT_2))
      {
  	  		// doesn't do 3rd left states
  	  		return EX_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
  	  		// doesn't do 2nd left states
  	  		return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   	 			// don't understand left states
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT_3))
      {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_LEFT_3;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT_2))
      {
   				// don't understand caution or left 3 - 2 aspect stop/go?
   				return EX_PROCEED_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT))
      {
   				// don't understand caution or second left - 2 aspect stop/go?
   				return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_CAUTION_RIGHT_3:
      if(CanDisplayStateEx(EX_CAUTION_RIGHT_2))
      {
  	  		// doesn't do 3rd right states
  	  		return EX_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
  	  		// doesn't do 2nd right states
  	  		return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   	 			// don't understand left states
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT_3))
      {
   				// don't understand caution - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT_3;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT_2))
      {
   				// don't understand caution or right 3 - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
   				// don't understand caution or second right - 2 aspect stop/go?
   				return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
			case EX_SLOW:
      if(CanDisplayStateEx(EX_MEDIUM))
      {
					return EX_MEDIUM;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
					return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
					return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
					return EX_PROCEED;
				}
      break;
    
			case EX_MEDIUM:
      if(CanDisplayStateEx(EX_SLOW))
      {
     			return EX_SLOW;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
					return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
					return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
					return EX_PROCEED;
				}
      break;
    
			case EX_ADVANCE_CAUTION:
      if(CanDisplayStateEx(EX_PROCEED))
      {
					// 3 aspect
					return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
					// terminating
					return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
   			}
      break;
    
  	  case EX_ADVANCE_CAUTION_LEFT:
  	  	// ex_proceed_left is first so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
      if(CanDisplayStateEx(EX_PROCEED_LEFT))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// don't understand left states
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or advance caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_ADVANCE_CAUTION_RIGHT:
  	  	// ex_proceed_right is first so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
      if(CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// don't understand right states
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand right or advance caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_ADVANCE_CAUTION_LEFT_2:
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT))
      {
  	  		// doesn't do 2nd left states
  	  		return EX_ADVANCE_CAUTION_LEFT;
  	  	// ex_proceed_left is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT_2))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// don't understand left states
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or advance caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_ADVANCE_CAUTION_RIGHT_2:
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT))
      {
  	  		// doesn't do 2nd right states
  	  		return EX_ADVANCE_CAUTION_RIGHT;
  	  	// ex_proceed_right is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT_2))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// don't understand right states
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand right or advance caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_ADVANCE_CAUTION_LEFT_3:
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_2))
      {
  	  		// doesn't do 3rd left states
  	  		return EX_ADVANCE_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT))
      {
  	  		// doesn't do 2nd left states
  	  		return EX_ADVANCE_CAUTION_LEFT;
  	  	// ex_proceed_left is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT_3))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT_3;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT_2))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// don't understand left states
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand left or advance caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT_3))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_3;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_ADVANCE_CAUTION_RIGHT_3:
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_2))
      {
  	  		// doesn't do 3rd right states
  	  		return EX_ADVANCE_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT))
      {
  	  		// doesn't do 2nd right states
  	  		return EX_ADVANCE_CAUTION_RIGHT;
  	  	// ex_proceed_right is here so that USian signals work, where Advance Caution is a rare aspect, and AC+direction isn't possible
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT_3))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT_3;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT_2))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
   				// don't understand advance caution - probably 3 aspect.
   				return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// don't understand right states
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   				// don't understand right or advance caution
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT_3))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_3;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
			case EX_PROCEED:
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   	 			// Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;

  	  case EX_PROCEED_LEFT:
  	  	// ex_advance_caution_left is first so that NSWGRian signals work, where proceed_left is not possible - all _left or _right states are restrictive
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   	 			// don't understand left states
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   				// don't understand left or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_PROCEED_RIGHT:
  	  	// ex_advance_caution_right is first so that NSWGRian signals work, where proceed_right is not possible - all _left or _right states are restrictive
      if(CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   	 			// don't understand right states
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   				// don't understand right or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_PROCEED_LEFT_2:
      if(CanDisplayStateEx(EX_PROCEED_LEFT))
      {
  	  		// don't understand left 2 states
  	  		return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_2))
      {
	  	  	// ex_advance_caution_left is here so that NSWGRian signals work, where proceed_left is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   	 			// don't understand left states
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   				// don't understand left or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_PROCEED_RIGHT_2:
      if(CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
  	  		// don't understand right 2 states
  	  		return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_2))
      {
	  	  	// ex_advance_caution_right is here so that NSWGRian signals work, where proceed_right is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   	 			// don't understand right states
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   				// don't understand right or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_PROCEED_LEFT_3:
      if(CanDisplayStateEx(EX_PROCEED_LEFT_2))
      {
  	  		// don't understand left 3 states
  	  		return EX_PROCEED_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_LEFT))
      {
  	  		// don't understand left 2 states
  	  		return EX_PROCEED_LEFT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_3))
      {
	  	  	// ex_advance_caution_left is here so that NSWGRian signals work, where proceed_left is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT_3;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT_2))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_LEFT))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   	 			// don't understand left states
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   				// don't understand left or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT_3))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_3;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_LEFT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_LEFT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or left states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
  	  case EX_PROCEED_RIGHT_3:
      if(CanDisplayStateEx(EX_PROCEED_RIGHT_2))
      {
  	  		// don't understand right 3 states
  	  		return EX_PROCEED_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_PROCEED_RIGHT))
      {
  	  		// don't understand right 2 states
  	  		return EX_PROCEED_RIGHT;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_3))
      {
	  	  	// ex_advance_caution_right is here so that NSWGRian signals work, where proceed_right is not possible - all _left or _right states are restrictive
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT_3;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT_2))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION_RIGHT))
      {
   				// don't understand proceed - Y/R/Y Terminating or NSWGRian?
   				return EX_ADVANCE_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_PROCEED))
      {
   	 			// don't understand right states
   				return EX_PROCEED;
      }
      else if (CanDisplayStateEx(EX_ADVANCE_CAUTION))
      {
   				// don't understand right or proceed - Y/R/Y Terminating?
   				return EX_ADVANCE_CAUTION;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT_3))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_3;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT_2))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT_2;
      }
      else if (CanDisplayStateEx(EX_CAUTION_RIGHT))
      {
   				// don't understand advance caution or proceed - 2 aspect R/Y?
   				return EX_CAUTION_RIGHT;
      }
      else if (CanDisplayStateEx(EX_CAUTION))
      {
   				// don't understand advance caution or proceed or right states - 2 aspect R/Y?
   				return EX_CAUTION;
      }
      else if (CanDisplayStateEx(EX_STOP_THEN_CONTINUE))
      {
   				// fixed red with a shunt route?
   				return EX_STOP_THEN_CONTINUE;
      }
      else if (CanDisplayStateEx(EX_STOP))
      {
   				// fixed red with *no* shunt routes?
   				return EX_STOP;
  			}
   			break;
    
   		default:
      Interface.Log("Signal.gs: <" + me.GetDebugName() + ">: Asked to find alternative to unknown state!");
      break;
		}
    
		// failed to find a sensible fallback, grab the first state in the signal's state table.
		Interface.Log("Signal.gs: <" + me.GetDebugName() + ">: Failed to find sensible alternative to state \"" + state + "\"!");
		string firstEntry = mySignals.GetIndexedTagName(0);
		return Str.ToInt(firstEntry);
	}

  
  // ============================================================================
  // Name: ApplySpeedLimitForStateEx
  // Desc: Apply the speed limit for a given state. Limits are read from the
  //       signal's config file.
  // Parm: state - The extended signal state for which to apply the speed limit.
  // ============================================================================
	public void ApplySpeedLimitForStateEx(int state)
	{
    if (GetAsset().SupportsTrainzBuildVersion(2.8))
    {
      if (mySignals)
      {
				Soup myState = mySignals.GetNamedSoup(state);
				SetSpeedLimit(myState.GetNamedTagAsFloat("speed", 0.0f));
			}
		}
	}

  
  // ============================================================================
  // Name: CheckForOncomingTrain
  // Desc: Continue the specified track search, looking for a Vehicle which is
  //       moving toward the search origin. Stops searching if we encouter a
  //       Junction object.
  //
  //       The reasoning for the apparently random search limit of a single
  //       junction is that this is used for one specific case - a long single
  //       track line which is heavily signalled in both directions, and looks
  //       something like this, where vertical bars are pairs of signals:
	//
  //                     ===|>---|---|---|---|---|---<|=====
	//
  //       This line needs to have all the signals "against movement direction"
  //       show STOP, and that moving train could be many signals away, but the moment
  //       there is a junction, we have the opportunity to pass the other train there.
	//
  // Parm: io_trackSearch (IN, OUT) - A track search object which represents the
  //       starting conditions for our train search. The current result of the
  //       track search is inspected first before progressing.
  // Retn: The found vehicle, or null if none found.
  // ============================================================================
  public Vehicle CheckForOncomingTrain(GSTrackSearch io_trackSearch)
	{
		// Note for the unwary:
		// Yes, we do need to inspect the object that is current before moving on to the next.
		// It may well be important in the case of a 1 car train that is the first thing
		// encountered outside the overlap distance.
    MapObject nextMapObject = io_trackSearch.GetMapObject();
     while (nextMapObject)
    {
      // Is the search result a vehicle?
       Vehicle nextVehicle = cast<Vehicle> nextMapObject;
       if (nextVehicle)
      {
        // Yes, so check its velocity.
        float nextVehicleRelativeVelocity = nextVehicle.GetVelocity();
        
         if (!io_trackSearch.GetFacingRelativeToSearchDirection())
          nextVehicleRelativeVelocity = - nextVehicleRelativeVelocity;
        
        // (ignore subtle movements.)
        if (nextVehicleRelativeVelocity < -0.1)
        {
          // It's moving toward the search origin.
          return nextVehicle;
 	  	  	}
 	    		}
      
      // Is the search result a junction?
      else if (cast<Junction> nextMapObject)
      {
        // Don't search past junctions.
 	    	return null;
 	    }
      
      
      // Move on to the next search result.
      nextMapObject = io_trackSearch.SearchNext();
    }
    
    // Didn't find anything.
    return null;
	}

  
  // ============================================================================
  // Name: CheckForTrainInOverlap
  // Desc: Continue the specified track search, looking for a Vehicle.
  // Parm: io_trackSearch (IN, OUT) - A track search object which represents the
  //       starting conditions for our train search. The current result of the
  //       track search is inspected first before progressing.
  // Parm: overlapDistance - The maximum distance that this function call will
  //       search beyond the distance provided in 'io_trackSearch'.
  // Retn: The found vehicle, or null if none found.
  // ============================================================================
	public Vehicle CheckForTrainInOverlap(GSTrackSearch myGST, float overlapDistance)
	{
    // TODO: why do we add HALF_A_CAR_LENGTH here? Car length isn't even a constant.
    float maxDistance = myGST.GetDistance() + overlapDistance + HALF_A_CAR_LENGTH;
    
    // Search until we hit the distance limit.
		MapObject nextMapObject;
     while ((nextMapObject = myGST.SearchNext()) and myGST.GetDistance() < maxDistance)
    {
      // Have we found a Vehicle?
       Vehicle foundVehicle = cast<Vehicle> nextMapObject;
      if (foundVehicle)
      {
        // Yes, so return it.
         return foundVehicle;
 			}
 		}
    
    // Didn't find a Vehicle.
 		return null;
	}


  // ============================================================================
  // Name: DetermineUpdatedState
  // Desc: Called by PerformLogic() to determine the new state of this signal.
  //       This provides a default implementation of signalling logic and may be
  //       overridden to provide a more complex or custom-purpose signalling
  //       logic. This function should update only this signal, and not attempt
  //       to implement any broader-area signalling control systme. Any such
  //       signalling control system should be implemented in a Library or Rule
  //       and should use SetSignalStateEx().
  // Retn: Soup - A newly created soup containing the new state information. The
  //       soup must contain an integer tag "state" and a string tag "reason"
  //       which should contain values suitable for passing to
  //       SetSignalStateEx(). The soup may also contain additional tags
  //       representing state information beyond that which is used by the native
  //       systems. This extra information can be used by ApplyUpdatedState() to
  //       customise its behaviour. The state and reason tags will be applied by
  //       the calling native code.
  // Note: This function does not change any state, it simply determines what the
  //       state should be. Do not make state changes here.
  // Note: This function is very performance-sensitive. If you do unnecessary
  //       work here, you'll end up costing a lot of game performance. You should
  //       attempt to minimise track searching by performing all checks in a
  //       single pass rather than performing one check per pass, and by setting
  //       appropriate distance limits and stop conditions. You should also
  //       precache as much constant data as possible during Init() so that you
  //       don't need to load it here.
  // Note: The native code will monitor the searching you perform inside
  //       PerformLogic() and will use that as a clue to the conditions you are
  //       responding to. When something changes which would affect your search,
  //       a new call to PeformLogic will be queued.
  // Note: During multiplayer games this function is only called on the server,
  //       with the resulting state being replicated to clients afterwards.
  // ============================================================================
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
      approachingTrain = FindApproachingTrain(me, false, 5, 16090); // 5 signals or 10 miles, whichever is closer
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
            approachingTrain = FindApproachingTrain(me, false, 5, 16090); // 5 signals or 10 miles, whichever is closer
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
                SetOverlap(myGST.GetDistance() - HALF_A_CAR_LENGTH);
    	      }
            
    	      else
    	      {
    	      	// if we are a home and our next signal is a distant (thus more accurately, we are a starter), set our default overlap
    	      	if (me.GetIsHome())
                SetOverlap(baseOverlap);
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
                  TrainzScript.Log("Signal.gs: <" + me.GetDebugName() + ">: Signal ahead is in unknown state!");
                  break;
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
                  if (me.GetIsHome() and !(FindApproachingTrain(me, false, -1, 40)))
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
                          break;
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
                  TrainzScript.Log("Signal.gs: <" + me.GetDebugName() + ">: Signal ahead is in unknown state!");
                  break;
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
              approachingTrain = FindApproachingTrain(me, false, 5, 16090); // 5 signals or 10 miles, whichever is closer
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
                    break;
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
      	  TrainzScript.Log("Signal.gs: <" + me.GetDebugName() + ">: Trackside object has faulty or missing asset");
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

    
    // Construct the soup to be passed to ApplyUpdatedState()
		Soup signalStateSoup = Constructors.NewSoup();

		signalStateSoup.SetNamedTag("state", signalState);
		signalStateSoup.SetNamedTag("reason", signalStateReason);

		return signalStateSoup;
  }


  // ============================================================================
  // Name: ApplyUpdatedState
  // Desc: Called by PerformLogic() to apply the results of
  //       DetermineUpdatedState() to this signal. This allows custom per-state
  //       visualisations or other non-standard behaviours. The default
  //       implementation provides a "variable speed restriction" logic which
  //       can be customised in the config file. It is recommended that you
  //       inherit the default behaviour so that this functionality and any
  //       future additions can be applied to your signal.
  // Parm: signalStateSoup - A soup in the format described in
  //       DetermineUpdatedState(). Note that while you may add custom tags which
  //       are passed between your overridden DetermineUpdatedState() and your
  //       overridden ApplyUpdatedState() functions, you should not assume that
  //       these tags will always be present (see notes.)
  // Note: Native code may in some cases opt to directly call
  //       ApplyUpdatedState(), bypassing DetermineUpdatedState(). Firstly,
  //       native code may create a Soup with only the required tags,
  //       and you should handle this appropriately. Secondly, native code may
  //       capture the Soup returned by a call to your DetermineUpdatedState()
  //       function, and may replay it at any time thereafter, including on other
  //       instances of your object which have never had DetermineUpdatedState()
  //       called (eg. for multiplayer or load/save.) This means a few things for
  //       your implementation:
  //       * Do not ever modify state (including local variables) in
  //         DetermineUpdatedState(). Always return all state in the soup.
  //         EXCEPTION: You may modify local variables which are ONLY used to
  //         cache lookups within DetermineUpdatedState(), such as 'overlap'.
  //         Such variables should change infrequently and any change to such a
  //         variable must result in a call to NotifyTrackGraphObservers().
  //       * Don't ever attempt to recalculate any state in ApplyUpdatedState().
  //         Always trust the values in the soup.
  //       * Be tolerant of missing or extra tags in the soup. If the soup
  //         contains only the bare requirements, your function should still work
  //         reasonably well.
  // Note: The "reason" and "state" values should not be passed to
  //       SetSignalStateEx() here. PerformLogic will return those to native code
  //       for appropriate handling once this function returns.
  // Note: Don't modify the Soup here.
  // ============================================================================
  void ApplyUpdatedState(Soup signalStateSoup)
  {
		int signalState = signalStateSoup.GetNamedTagAsInt("state", EX_STOP);
		
		// Signals can apply speed limits
		// so check to see if this signal has a limit specified for this state
		ApplySpeedLimitForStateEx(signalState);
	}
	
  
  // ============================================================================
  // Name: PerformLogic
  // Desc: Called by native code when it's time to update this signal. You can't
  //       override this function directly, but you can override the
  //       DetermineUpdatedState() and ApplyUpdatedState() functions.
  // Retn: Soup - The state information as determined by DetermineUpdatedState().
  // ============================================================================
  final Soup PerformLogic(void)
  {
    // Calculate the current state of this signal. Don't change any state yet.
		Soup signalStateSoup = DetermineUpdatedState();
    
    // Update our custom state based on the calculated state.
		ApplyUpdatedState(signalStateSoup);
    
    // Return the state information to native code for caching and to update the
    // native state of this signal.
		return signalStateSoup;
	}
};

