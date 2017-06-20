//
// LoadingReport.gs
//
//  Copyright (C) 2002-2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "ProductQueue.gs"
include "Vehicle.gs"
include "Industry.gs"


//! Report of a loading operation.
//
// This class is used as a parameter to for the <l Vehicle::LoadProduct()  LoadProduct>() and
// <l Vehicle::UnloadProduct()  UnloadProduct>() call-back methods in Vehicle to describe the 
// transfer of product happening between the vehicle and the Industry that called these methods.
//
// The various public data members of this class describe a desired transfer of product that the
// vehicle should attempt to perform when called on.
//
// See Also:
//     Industry, ProductQueue, Vehicle, Vehicle::LoadProduct(), Vehicle::UnloadProduct()
//
class LoadingReport isclass GSObject
{
	public GameObject src,         //!< Source object where the product is transferred from.
	                  dst;         //!< Destination object where the product is transferred to.
	public ProductQueue srcQueue,  //!< Source queue in src of product transfer.
	                    dstQueue;  //!< Destination queue in dst of product transfer.
	public int amount;             //!< Amount of products actually loaded/unloaded.
	public int desiredAmount;      //!< Amount of products desired to be loaded/unloaded.
	
	
	//! \name   Vehicle Side Flags
	//  \anchor sideFlags
	//@{
	//! Defines which side/s of a vehicle a report is referring to.

	public define int LEFT_SIDE = 1;    //!< Left side.
	public define int RIGHT_SIDE = 2;   //!< Right side.
	public define int TOP_SIDE = 4;     //!< Top side.
	public define int BOTTOM_SIDE = 8;  //!< Bottom side.

	//@}


	//! Variable that dictates which side(s) of a vehicle the loading operation took place on.
	//
	// When one (and only one) of either the source or destination (for the products) is a vehicle,
	// this variable will provide details on which side of the vehicle was loaded from.
	//
	// See Also:
	//     \ref sideFlags "Vehicle Side Flags"
	//
	public int sideFlags;

  // todo: errorCode, products, amounts

	//! Clears out this report.
	public void Clear(void);


	//! Gets the source vehicle where the product/s are unloaded from.
	//
	// Returns:
	//     Returns the source vehicle.
	//
	public Vehicle GetSrcVehicle(void);

	//! Gets the destination vehicle where the product/s are loaded to.
	//
	// Returns:
	//     Returns the destination vehicle.
	//
	public Vehicle GetDstVehicle(void);

	//! Gets the source industry where the product/s are loaded from.
	//
	// Returns:
	//     Returns the source industry.
	//
	public Industry GetSrcIndustry(void);

	//! Gets the destination industry where the product/s are unloaded to.
	//
	// Returns:
	//     Returns the destination industry.
	//
	public Industry GetDstIndustry(void);


	//
	// IMPLEMENTATION
	//

  public void Clear(void)
  {
    src = null;
    dst = null;
    srcQueue = null;
    dstQueue = null;
    amount = 0;
		desiredAmount = 0;
		sideFlags = 0;
  }
	
	public Vehicle GetSrcVehicle(void)
	{
		Vehicle it = cast<Vehicle>(src);

		if (!it)
			src.Exception("LoadingReport.GetSrcVehicle> source is not a vehicle");

		return it;
	}

	public Vehicle GetDstVehicle(void)
	{
		Vehicle it = cast<Vehicle>(dst);

		if (!it)
			src.Exception("LoadingReport.GetDstVehicle> dest is not a vehicle");

		return it;
	}

	public Industry GetSrcIndustry(void)
	{
		Industry it = cast<Industry>(src);

		if (!it)
			src.Exception("LoadingReport.GetSrcIndustry> source is not an industry");

		return it;
	}

	public Industry GetDstIndustry(void)
	{
		Industry it = cast<Industry>(dst);

		if (!it)
			src.Exception("LoadingReport.GetDstIndustry> dest is not an industry");

		return it;
	}

};


