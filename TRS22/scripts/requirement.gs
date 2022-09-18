//=============================================================================
// File: Requirement.gs
// Desc: 
//=============================================================================
include "Asset.gs"
include "gs.gs"
include "ProductQueue.gs"
include "Train.gs"
include "Vehicle.gs"



//=============================================================================
// Name: Requirement
// Desc: Base class for ResourceRequirement.
//=============================================================================
class Requirement
{
  public Requirement  cause;    // The 'cause' of this requirement. Currently unused by Trainz.

};



//=============================================================================
// Name: ResourceRequirement
// Desc: This class defines a requirement to either bring a resource to an
//       input queue or to remove a resource from an output queue. This data
//       is used by Trainz to generate waybills. See waybillmanager.gs for more
//       information.
//=============================================================================
class ResourceRequirement isclass Requirement
{
  public GameObject   dst;      // Destination game object where the queue is.
  public ProductQueue dstQueue; // Destination queue for resource. Use null if no destination is needed.
  public int          amount;   // Amount of resources required. A negative value indicates that a
                                // resource is available to be taken away rather being required at dst.
  public Asset        resource; // The resource required/available for delivery/pickup.



  public Asset GetResource(void) { return resource; }
  public int GetAmount(void){ return amount; }
  public GameObject GetDst(void) { return dst; }
  public ProductQueue GetDstQueue(void) { return dstQueue; }

};

