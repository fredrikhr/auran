//
// Requirement.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Asset.gs"
include "gs.gs"
include "ProductQueue.gs"
include "Train.gs"
include "Vehicle.gs"


//! Base class for ResourceRequirement.
//
// See Also:
//     Industry::GetRequirements(), ScenarioBehavior::GetRequirements(), ResourceRequirement
//
class Requirement
{
	//! The cause of this requirement.
	public Requirement cause;

	// return a description of this requirement for display purposes
	//public string GetHTMLDescription(void) { return "Unknown."; }
};


//! A resource requirement 
//
// This class defines a requirement to either bring a resource to an input queue or to remove a
// resource from an output queue.  Currently, both <l Industry  industries> and <l ScenarioBehavior  rules>
// can have requirements.  The data in a requirement is used by %Trainz to generate waybills.
//
// See Also:
//     ProductFilter, ProductQueue, Requirement, Industry::GetRequirements(), ScenarioBehavior::GetRequirements()
//
class ResourceRequirement isclass Requirement
{
	//! \name   Requirements Data
	//  \anchor reqDat
	//@{
	//! These data members define the properties of a requirement.
	//
	// See Also:
	//     ResourceRequirement::GetAmount(), ResourceRequirement::GetDst(),
	//     ResourceRequirement::GetDstQueue(), ResourceRequirement::GetResource()
	//

	public Asset resource;         //!< Resource required for destination queue.

	//! Amount of resources required.  Can be negative to indicate that a resource is to be taken away rather than dropped off.
	public int amount;

	public GameObject dst;         //!< Destination game object where the queue is.

	public ProductQueue dstQueue;  //!< Destination queue for resource.  Use null if no destination is needed.
	
	//@}


	//! Gets the resource that this requirement needs.
	//
	// Returns:
	//     Returns the resource this requirement needs.
	//
	public Asset GetResource(void);

	//! Gets the amount of resources this requirement needs.
	//
	// Returns:
	//     Returns the amount of resources this requirement needs.
	//
	public int GetAmount(void);

	//! Gets the destination object this requirement is attached to (i.e. the object this requirement is defined to fulfil).
	//
	// Returns:
	//     Returns the destination this requirement is attached to.
	//
	public GameObject GetDst(void);

	//! Gets the destination queue for this requirement.
	//
	// Returns:
	//     Returns the destination queue for this requirement.
	//
	public ProductQueue GetDstQueue(void);
	

	//
	// IMPLEMENTATION
	//
	
	public Asset GetResource(void) { return resource; }
	public int GetAmount(void) { return amount; }
	public GameObject GetDst(void) { return dst; }
	public ProductQueue GetDstQueue(void) { return dstQueue; }

	
	/*
	public string GetHTMLDescription(void)
	{
		if (!dst)
			return "Unknown.";

		if (amount > 0)
			return "Bring " + amount + " to " + dst.GetName() + ".";

		return "Remove " + amount + " from " + dst.GetName() + ".";
	}
	*/
};


/*
//! The requirement for a Train or Vehicle to arrive at an Industry or Trigger.
//
// See Also:
//     Requirement
//
class TrainRequirement isclass Requirement
{
	public Train train;
	public Vehicle vehicle;					// null = dont care

	public GameObject dst;				// industry OR trigger
	


	public string GetHTMLDescription(void)
	{
		if (!dst or !train)
			return "Unknown.";
		
		return "Take train to " + dst.GetName() + ".";
	}
};
*/

