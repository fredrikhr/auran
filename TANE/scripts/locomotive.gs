//
// Locomotive.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "vehicle.gs"


//! CabinData is custom storage used by the Cabin and Locomotive classes.
//
// When a Cabin of a locomotive is not being used (i.e. the camera is focused on another vehicle), that Cabin
// is destroyed for reasons of game efficiency.  As a result, the settings of the various CabinControls in 
// the Cabin will be at their default positions when the player returns to that cabin because %Trainz is
// re-creating that cabin for them.
//
// The basic controls in the cabin can be reset by querying the host Locomotive easily enough but custom 
// controls will have to be reset from somewhere and this is what the CabinData class is useful for.
// 
// A Locomotive has a CabinData object and it is the responsibility of the Cabin script to ensure the cabin
// data of the locomotive it is attached to is kept updated.  The Cabin script can also refer back to the 
// loco's cabin data to configure itself.  The Cabin class and the examples mentioned below show how the
// Cabin should be scripted in more detail.
//
// CabinData is an empty class and is used as a type for the parameters of the Locomotive methods.  It is up
// to the programmer of the locomotive script to create their own CabinData-derived class suitable for their
// locomotive.  An example of a CabinData-derived object and a cabin that uses it is the DefaultSteamCabinData
// and DefaultSteamCabin classes.  The full implementation of these two classes can be found in the
// <b \Trainz\scripts\DefaultSteamCabin.gs> script file.  The <l astSrcIntDD40  DD40 Interior> cabin interior
// asset also provides a good demonstration of how to use this class.
//
// See Also:
//     Cabin, CabinControl, Locomotive::GetCabinData(), Locomotive::SetCabinData(),
//     DefaultLocomotiveCabin, DefaultSteamCabinData
//
class CabinData
{
};


//! Locomotive is an instance of a loco (a special type of Vehicle).
//
// See Also:
//     Cabin, Cabin::GetParentObject(), CabinData, CabinControl, DefaultLocomotiveCabin, 
//     DriverCharacter, Train, Vehicle,
//
game class Locomotive isclass Vehicle
{
	//! Disable/enable the throttle lever's effect on the loco. 
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Note:
	//     When broken, the throttle lever can still be used by the player, it just won't affect the
	//     loco.
	//
	// Param:  broken  If true the throttle lever will be broken and unable to affect the locomotive.
	//                 Use false to enable it.
	//
	public native void SetBrokenThrottle(bool broken);

	//! Disable/enable the reverser lever's effect on the loco. 
  //
  // Note: During multiplayer games this function will only succeed on the server
	// 
	// Note:
	//     When broken, the reverser lever can still be used by the player, it just won't affect the
	//     loco.
	//
	// Param:  broken  If true the reverser lever will be broken and unable to affect the locomotive.
	//                 Use false to enable.
	//
	public native void SetBrokenReverser(bool broken);  

	//! Sets the efficiency of this locomotive's compressor.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  efficiency  Efficiency of compressor in the range of [0.0 - 1.0] where 0.0 is complete
	//                     failure and 1.0 is normal.
	//
	public native void SetCompressorEfficiency(float efficiency);


	//! Sets this locomotive as having a driver.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Note:
	//     Only one loco in a train may have a driver. If you attempt to place a driver in this loco,
	//     any other driver on the train will be removed. The consist name/id will always stay with
	//     the driver.
	//
	// Param:  hasDriver  Driver state for this locomotive.  If true, it has a driver, otherwise 
	//                    false for no driver.
	//
	// See Also:
	//     Train::GetActiveDriver(), DriverCharacter::SetLocation()
	//
	public native void SetHasDriver(bool hasDriver);

	//! Gets the value of the named engine setting.
	// 
	// Param:  p_settingName  Setting to get the value of.  See SetEngineSetting() for details of
	//                        available engine settings.
	//
	// Returns:
	//     Returns the value of the engine setting named by <i p_settingName> if possible.
	//
	public native float GetEngineSetting(string p_settingName);

	//! Sets the value of the named engine setting.
	//
	// Engine setting strings you can use with this method are:
	//  - "dynamic-brake"
	//  - "headlight"
	//  - "injector"
	//  - "coal-rate"
	//  - "loco-auto-brake"
	//  - "pantograph"
	//  - "regulator"
	//  - "reverser"
	//  - "steam-blower"
	//  - "throttle"
	//  - "train-auto-brake"
	//  - "train-lap-brake"
	//
	// These strings correspond to engine properties as described elsewhere in documents such as the
	// <b Content Creation Guide (CCG)>.  Some apply to steam locomotives only.
	//
	// Param:  p_settingName  Name of the setting to change.
	// Param:  p_value        Value to change the setting to.
	//
	public native void SetEngineSetting(string p_settingName, float p_value);


	CabinData m_cabinData;


	//! Gets the cabin data of this locomotive.
	//
	// The cabin data refers to an internal private CabinData object in this class that represents
	// the state of the cabin's controls.  The internal CabinData object of a Locomotive is usually
	// maintained by the Cabin::Attach() and Cabin::Update() methods of the Cabin script.
	//
	// Returns:
	//     Returns the cabin data of this loco.
	//
	public CabinData GetCabinData(void);

	//! Sets this locomotive's cabin data.
	// 
	// Note:
	//     See GetCabinData() and CabinData for more details on cabin data.
	//
	// Param:  data  Cabin data for this locomotive.
	//
	public void SetCabinData(CabinData data);


	//
	// IMPLEMENTATION
	//

	public CabinData GetCabinData(void)
	{
		return m_cabinData;
	}

	public void SetCabinData(CabinData data)
	{
		m_cabinData = data;
	}

	public void HandleDrainCocks()
	{
		ToggleDrainCocks();
	}

  /*void ViewDetails(Message msg)
  {
    if (!info)
    {
      info = Constructors.NewBrowser();
			  
      string paramOutput = "<html><body>";
      paramOutput = paramOutput + "<p><b><font size=3 color=#FFFFFF>" + BrowserInterface.Quote(GetLocalisedName()) + "</font></b></p>";

      // Get the total mass of all the vehicles in tow.
      Train train = GetMyTrain();
      Vehicle[] vehicles = train.GetVehicles();
      int i;
      float totalMass = 0.0;
      for (i = 0; i < vehicles.size(); ++i)
      {
        if(!vehicles[i].isclass(Locomotive))
        {
          totalMass = totalMass + vehicles[i].GetMass();
        }
      }

      paramOutput = paramOutput + strTable.GetString1("vehicle_view_details1", (int)(totalMass / 1000));
      paramOutput = paramOutput + "<table>";
			
			bool isEmpty = true;
      ProductQueue[] vehicleQueues = GetQueues();
      int emptyCount = 0;
      for (i = 0; i < vehicleQueues.size(); i++)
      {
        ProductQueue vehicleQueue = vehicleQueues[i];
        Asset[] products = vehicleQueue.GetProductList();
        int l;
        for (l = 0; l < products.size(); l++)
        {
			    paramOutput = paramOutput + HTMLWindow.GetPercentHTMLCode(null, vehicleQueue, products[l]);
					isEmpty = false;
        }
      }

      // Only report an empty queue if all queues are empty.
      if (isEmpty  and  (vehicleQueues.size() > 0))
			  paramOutput = paramOutput + strTable.GetString1("vehicle_veiw_details2", BrowserInterface.Quote(GetLocalisedName()));

      paramOutput = paramOutput + "</table></body></html>";

      info.SetWindowRect(100, 100, 360, 325);
	    info.LoadHTMLString(GetAsset(), paramOutput);
    }

  }*/

};


