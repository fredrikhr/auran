//
// Flags.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//


//! Flag handling utility class.
//
// This static class provides methods to test a set of flags against a flag mask.  Flag sets in the
// GS language are 32-bit integers.  Although the bits in the 32-bit integer can be easily checked 
// and manipulated using <l gscLangOp logical operators>, this can be tricky for those with limited
// programming experience, hence this class.
//
// What the bits in a flag set represent is up to the programmer to decide.  There are however 
// several places in the %Trainz classes where a pre-defined set of flags is defined for a specific
// purpose such as the \ref behaveState "Behavior State" flags in the ScenarioBehavior class.
//
// As well as flag constants located throughout the %Trainz API, there also status/mode constants
// which look similar to flags but serve a different purpose.  Unlike a flag set that can act as a
// collection of multiple Boolean values, a status/mode value can only be one thing at a time.  
// This class is for flags and wasn't intended for status/mode values as they can be easily checked
// with a simple <l gscLangKeyIfElse if> statement.
//
// See Also:
//     \ref behaveState "Behavior State Flags", \ref camModes "Camera View Modes", 
//     \ref camViewFlags "Camera Flags", \ref coupFlags "Coupler Flags",
//     \ref sideFlags "Vehicle Side Flags", \ref vehicleType "Vehicle Types"
//
final static class Flags
{
	//! Tests the given flags against a mask.
	//
	// This method uses AND logic when testing the flags against the mask so all flags need to match
	// to get a true result.
	//
	// As an example, the following Test() call will evaluate to true if the vehicle is a tender with
	// an interior (an odd unlikely combination, but makes for an interesting example):
	//
	//<code>
	//Flags.TestAny(vehicle.GetVehicleTypeFlags(), Vehicle.TYPE_TENDER |# Vehicle.TYPE_HAS_INTERIOR);
	//</code>
	//
	// Param:  flags  Flag set to test.
	// Param:  mask   Mask to compare against <i flags> with.
	//
	// Returns:
	//     Returns true if all of the flags in <i flags> match the corresponding flag in <i mask>,
	//     false otherwise.
	//
	public bool Test(int flags, int mask);

	//! Tests all of the flags against a mask.
	//
	// This method uses OR logic when testing the flags against the mask so only one flag needs to
	// match to get a true result.
	//
	// As an example, this TestAny() call will evaluate to true if the vehicle is either a locomotive
	// or tender:
	//
	//<code>
	//Flags.TestAny(vehicle.GetVehicleTypeFlags(), Vehicle.TYPE_LOCOMOTIVE |# Vehicle.TYPE_TENDER);
	//</code>
	//
	// Param:  flags  Flag set to test.
	// Param:  mask   Mask to compare against <i flags> with.
	//
	// Returns:
	//     Returns true if any one of the flags in <i flags> matches its corresponding flag in
	//     <i mask>, false otherwise.
	//
	public bool TestAny(int flags, int mask);

	//! Compares two flag sets against each other through a filter mask.
	//
	// This method compares two sets of flags against each other using AND logic after both have been
	// masked, thus allowing the selective testing of only certain flags.
	//
	// As an example, this Test() call will evaluate to true if the \ref behaveState "PAUSED" and
	// \ref behaveState "DOES_COMPLETE" flags of both <m scenarioBehavior1> and <m scenarioBehavior2>
	// are set.  This is because the <i mask> argument is being used to only have those two flags
	// compared - other flags will not be considered.
	//
	//<code>
	//Flags.Test(scenarioBehavior1.GetStateFlags(),
	//           ScenarioBehavior.PAUSED |# ScenarioBehavior.WAS_COMPLETE,
	//           scenarioBehavior2.GetStateFlags());
	//</code>
	//
	// Param:  flags    Flag set to test.
	// Param:  mask     Mask to apply to both <i flags> and <i options> before comparison.
	// Param:  options  Other flag set to compare against <i flags>.
	//
	// Returns:
	//     Returns true if <i flags> and <i options> are equal after both have been masked, false
	//     otherwise.
	//
	public bool Test(int flags, int mask, int options);


	//
	// IMPLEMENTATION
	//
	public bool Test(int flags, int mask)
	{
		return (flags & mask) == mask;
	}

	public bool TestAny(int flags, int mask)
	{
		return (flags & mask) != 0;
	}

	public bool Test(int flags, int mask, int options)
	{
		return (flags & mask) == (options & mask);
	}
};