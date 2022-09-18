//=============================================================================
// File: VehicleHelperInfo.gs
// Desc: Originally defined a number of classes which slightly modified those 
//       in TrainHelperInfo.gs by removing the DoesMatch(train) functions and
//       instead adding DoesMatch(vehicle) functions. This resulted in a lot
//       of needless code duplication, so the DoesMatch(vehicle) functions
//       have been incorporated into the handlers into TrainHelperInfo.gs.
// 
//       i.e. This entire file is obsolete, and scripters should instead just
//       use the classes defined in TrainHelperInfo.gs
//
//=============================================================================
include "TrainHelperInfo.gs"


class VHISpecificVehiclesInfo isclass SpecificVehiclesInfo
{
  public obsolete bool DoesMatch(Vehicle vehicle) { return inherited(vehicle); }
};

class VHIVehicleTypesInfo isclass VehicleTypesInfo
{
  public obsolete bool DoesMatch(Vehicle vehicle) { return inherited(vehicle); }
};

class VHIDriversInfo isclass DriversInfo
{
  public obsolete bool DoesMatch(Vehicle vehicle) { return inherited(vehicle); }
};

class VehicleHelperInfo isclass TrainHelperInfo
{
  public obsolete bool DoesMatch(Vehicle vehicle) { return inherited(vehicle); }
};

