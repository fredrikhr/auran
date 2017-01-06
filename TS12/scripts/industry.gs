//
// Industry.gs
//
//  Copyright (C) 2002-2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
//include "productqueue.gs"
include "buildable.gs"
include "Requirement.gs"


//! An industry map object.
//
// Industries are a special type of map object that can have track, triggers, processes and be used
// to transfer products to and from vehicles.
//
// Messages delivered to an Industry game object are:
// {[ Major            | Minor         | Source    | Destination  ]
//  [ "Process-Start"  | process name  | industry  | industry     ]
//  [ "Process-Stop"   | process name  | industry  | industry     ]}
//
// See Also:
//     Buildable, GenericIndustry, BaseIndustry, SceneryWithTrack, IndustryTrainController, ProductQueue,
//     Vehicle, World::GetIndustryList(), Train::GetLastVisitedIndustry()
//
game class Industry isclass Buildable
{
	//! Gets the names of all of the processes this industry has.
	//
	// Returns:
	//     Returns an array of strings containing the names of all processes in this industry.
	//
	public native string[] GetProcessNameList(void);

	//! Determines if the named process has started.
	//
	// Param:  processName  Name of the process to check.
	//
	// Returns:
	//     Returns true if the process specified by <i processName> has started, false otherwise.
	//
	public native bool GetProcessStarted(string processName);

	//! Determines if the named process is enabled.
	//
	// Param:  processName  Name of the process to check
	//
	// Returns:
	//     Returns true if the process specified by <i processName> is enabled, false otherwise.
	//
	public native bool GetProcessEnabled(string processName);

	//! Enables/disables the named process.
	//
	// Param:  processName  Name of the process to enable/disable.
	// Param:  enabled      If true, the process will be enabled, false to disable.
	//
	public native void SetProcessEnabled(string processName, bool enabled);

	//! Gets the duration of the named process in seconds.
	//
	// Param:  processName  Name of process to get.
	//
	// Returns:
	//     Returns the duration of <i processName> in seconds if successful.
	//
	public native float GetProcessDuration(string processName);

	//! Sets the duration of the named process in seconds.
	//
	// Param:  processName      Name of process to set duration of.
	// Param:  processDuration  New duration for process in seconds.
	//
	public native void SetProcessDuration(string processName, float processDuration);

	//! Clears ALL process inputs and outputs for the named process.
	//
	// Param:  processName  Name of the process to totally clear the input and output of.
	//
	public native void ClearProcess(string processName);


	//! Modify the input requirements for the specified process.
	//
	// Using this method will override any existing requirements that match the arguments that the
	// process already has (i.e. set previously through this method or in the industry's configurartion).
	//
	// Param:  processName  Name of the process to modify input requirements for.
	// Param:  queue        Name of the input queue to adjust.
	// Param:  product      Product type to accept as input into <i queue>.
	// Param:  amount       Amount of products output to <i queue> in a process cycle.  If 0, input
	//                      requirements specified for <i processName> will be removed.
	//
	public native void SetProcessInput(string processName, ProductQueue queue, Asset product, int amount);

	//! Gets the input rate of a process per cycle for the given queue and product.
	//
	// Param:  processName  Name of the process to get the input rate for.
	// Param:  queue        Name of the input queue.
	// Param:  product      Product type to get input rate of in <i queue> from <i processName>.
	//
	// Returns:
	//     Returns the amount of <i product> instances consumed by <i processName> from <i queue> per
	//     process cycle.
	//
	public native int GetProcessInput(string processName, ProductQueue queue, Asset product);


	//! Modify the output requirements for the specified process.
	//
	// Using this method will override any existing requirements that match the arguments that the
	// process already has (i.e. set previously through this method or in the industry's configurartion).
	//
	// Param:  processName  Name of the process to modify output requirements for.
	// Param:  queue        Name of the output queue to adjust.
	// Param:  product      Product type to produce as output into <i queue>.
	// Param:  amount       Amount of products output to queue in a process cycle.  If 0, output
	//                      requirements specified for <i processName> will be removed.
	//
	public native void SetProcessOutput(string processName, ProductQueue queue, Asset product, int amount);

	//! Gets the output rate of a process per cycle for the given queue and product.
	//
	// Param:  processName  Name of the process to get the output rate for.
	// Param:  queue        Name of the output queue.
	// Param:  product      Product type to get output rate of in <i queue> from <i processName>.
	//
	// Returns:
	//     Returns the amount of <i product> instances produced by <i processName> into <i queue>
	//     per process cycle.
	//
	public native int GetProcessOutput(string processName, ProductQueue queue, Asset product);


	//! Gets the specified input/output queue from the named process.
	//
	// Param:  processName  Name of the process to get the queue from.
	// Param:  wantInput    Use true to specify an input queue, false for an output queue.
	// Param:  ioIndex      Index of the input or output queue to get.  Use 0 for the 1st queue and
	//                      so on.
	//
	// Returns:
	//     Returns the requested queue if possible, null otherwise.
	//
	public native ProductQueue GetProcessIOQueue(string processName, bool wantInput, int ioIndex);

	//! Gets the product in the specified queue from the named process.
	//
	// Param:  processName  Name of the process.
	// Param:  wantInput    Use true to specify an input queue, false for an output queue.
	// Param:  ioIndex      Index of the input or output queue to get the product of.  Use 0 for the
	//                      1st queue and so on.
	//
	// Returns:
	//     Returns the product in the specified queue if possible, null otherwise.
	//
	public native Asset GetProcessIOProduct(string processName, bool wantInput, int ioIndex);

	//! Gets the amount of products a process consumes/produces per cycle for a specific queue.
	//
	// Param:  processName  Name of the process.
	// Param:  wantInput    Use true to specify an input queue, false for an output queue.
	// Param:  ioIndex      Index of the input or output queue to examine.  Use 0 for the 1st queue
	//                      and so on.
	//
	// Returns:
	//     Returns the amount of products consumed/produced per cycle by the process for the specified
	//     queue if possible, 0 otherwise.
	//
	public native int GetProcessIOAmount(string processName, bool wantInput, int ioIndex);


	//! Adds any products that this industry is currently capable of producing to the end of the given list.
	//
	// Note: 
	//     To append something to the end of an array, use <l gscLangKeySize  size>() as the index
	//     value (i.e. <i productList[productList.size()]>).
	//
	// Param:  productList  List of products to add to.  Check first to make sure you're not adding a
	//                      product that already exists in this list.
	//
	public void AppendProductList(Asset[] productList) {}

	//! Provides destinations for use of this industry's entry on the <b Drive To> sub-menu.
	//
	// If the scriptlet programmer wants their industry to appear in the <b Drive To> command with
	// destinations to send drivers to listed on a sub-menu, this method must be implemented.  Both a
	// human-readable name for the sub-menu and the name of the actual destination track must be 
	// provided.
	//
	// Two arrays are passed in as return arguments, one for the readable names and the other for the
	// track names.  The indexes of each these arrays must correspond directly to each other.  For
	// example, if <i destNames[2]> is <m "%Log Pickup">, than <i destTracks[2]> must be the name of
	// the track where the log pickup is.
	//
	// Note:
	//     You don't have to worry about allocating memory for the arrays as <l gsc GS> allows you to
	//     simply go ahead and place data in an array, even for positions that aren't explicitly
	//     allocated for.
	//
	// Param:  destNames   Array of human-readable, localized names of destinations.  These will be
	//                     displayed on a sub-menu, so be mindful of how long the names are.
	// Param:  destTracks  Array of attached-track names as per the industry's <n config.txt> file.
	//                     Must contain the same number of entries as the <i destNames> array.
	//
	public void AppendDriverDestinations(string[] destNames, string[] destTracks) {}

	//! Determines if the named track exists in this industry.
	//
	// Param:  track  Name of track to verify existence of.
	//
	// Returns:
	//     Returns true if <i track> exists in this industry, false otherwise.
	//
	// See Also:
	//     Buildable::GetAttachedTrack()
	//
	public bool HasTrack(string track);


	//! Lets %Trainz know that it may start running the named process.
	//
	// Param:  processName  Name of process to start running.
	//
	public native void PerformProcessStarted(string processName);

	//! Lets %Trainz know that it should abort the named process.
	//
	// Param:  processName  Name of process to abort running.
	//
	public native void PerformProcessCancelled(string processName);

	//! Lets %Trainz know that it may complete the named process.
	//
	// Param:  processName  Name of process to complete.
	//
	public native void PerformProcessFinished(string processName);

	//! Lets %Trainz know that it should perform inputs of for the named process now.
	//
	// Note:
	//     This method <bi MUST> be called exactly <bi ONCE> after each call to NotifyProcessStarted().
	//     Don't call it if PerformProcessCancelled() is called first.
	//
	// Param:  processName  Name of process to perform inputs on.
	//
	// Returns:
	//     Returns true if process inputs were performed successfully, false otherwise.
	//
	public native bool PerformProcessInput(string processName);

	//! Lets %Trainz know that it should perform outputs for the named process now.
	//
	// Note:
	//     This method <bi MUST> be called exactly <bi ONCE> after each call to NotifyProcessStarted().
	//     Don't call it if PerformProcessCancelled() is called first.
	//
	// Param:  processName  Name of process to perform outputs on.
	//
	// Returns:
	//     Returns true if process outputs were performed successfully, false otherwise.
	//
	public native void PerformProcessOutput(string processName);


	//! Called by %Trainz when a process is ready to start.
	//
	// You may override this function to provide custom behavior, however, you <bi MUST> call the 
	// PerformProcessInput(), PerformProcessStarted() and PerformProcessCancelled() functions as
	// demonstrated here.  The call to these functions may be delayed for animation purposes, but it
	// must happen.
	//
	// You are guaranteed that PerformProcessInput() will succeed if you call it immediately in this
	// function, however we do not currently guarantee that it will succeed if you delay before
	// calling it.  For this reason, you should handle failure as demonstrated here (and animate
	// accordingly if necessary).
	//
	// You should not use PerformProcessCancelled() for other reasons.
	//
	// Note:
	//     As this is not a threaded function, you must not use sleep() or wait().
	//
	// Param:  processName  Name of the process that is ready to start.
	//
	public void NotifyProcessStarted(string processName)
	{
		if (PerformProcessInput(processName))
			PerformProcessStarted(processName);
		else
			PerformProcessCancelled(processName);
	}

	//! Called by %Trainz once when a process is ready to stop running.
	//
	// You may override this function to provide custom behavior, however, you <bi MUST> call the
	// PerformProcessOutput() and PerformProcessFinished() methods as demonstrated here.  The call
	// to these methods may be delayed for animation purposes, but it must happen.
	//
	// Note:
	//     As this is not a threaded function, you must not use sleep() or wait().
	//
	// Param:  processName  Name of process that has stopped.
	//
	public void NotifyProcessFinished(string processName)
	{
		PerformProcessOutput(processName);
		PerformProcessFinished(processName);
	}


	//! Gets the requirements of this industry.
	//
	// This method is called by %Trainz to determine the product requirements of an industry so a 
	// waybill listing can be generated for display to the user.  As this default implementation in
	// Industry only returns an empty array, the scriptlet programmer must implement their own 
	// overridden version if they want their industry to provide requirements data for waybills.
	//
	// Returns:
	//     Returns an array of requirements this industry has.  The default Industry class 
	//     implementation returns an empty array.
	//
	// See Also:
	//     ResourceRequirement
	//
	public Requirement[] GetRequirements(void) { Requirement[] ret; return ret; }


	//
	// The following functions are called by Vehicle.gs while loading/unloading product.
	// See Vehicle.gs for more information.
	//
	// The return value of each function is the minimum time, in seconds, that the appropriate
	// stage should run for.
	//
	// These functions may be overridden to provide custom industry loading/unloading animations.
	//

	//! Called by Vehicle::UnloadProduct() before the unloading takes place.
	//
	// Param:  report  Progress report of unloading operation.
	//
	// Returns:
	//     Returns the minimum time in seconds this stage should run for.
	//
	public float BeginUnload(LoadingReport report);

	//! Called by Vehicle::UnloadProduct() to determine how long the unload operation should take.
	//
	// Param:  report  Progress report of unloading operation.
	//
	// Returns:
	//     Returns the minimum time in seconds this stage should run for.
	//
	public float GetUnloadTime(LoadingReport report);

	//! Called by Vehicle::UnloadProduct() after the unloading has taken place.
	//
	// Param:  report  Progress report of unloading operation.
	//
	// Returns:
	//     Returns the minimum time in seconds this stage should run for.
	//
	public float EndUnload(LoadingReport report);

	//! Called by Vehicle::LoadProduct() before the loading has taken place.
	//
	// Param:  report  Progress report of loading operation.
	//
	// Returns:
	//     Returns the minimum time in seconds this stage should run for.
	//
	public float BeginLoad(LoadingReport report);

	//! Called by Vehicle::LoadProduct() to determine how long the load operation should take.
	//
	// Param:  report  Progress report of loading operation.
	//
	// Returns:
	//     Returns the minimum time in seconds this stage should run for.
	//
	public float GetLoadTime(LoadingReport report);

	//! Called by Vehicle::LoadProduct() after the loading has taken place.
	//
	// Param:  report  Progress report of loading operation.
	//
	// Returns:
	//     Returns the minimum time in seconds this stage should run for.
	//
	public float EndLoad(LoadingReport report);


	//! \name   Load and Unload Driver Command Strings
	//  \anchor loadUnloadCmds
	//@{
	//! String constants indicating the type of driver command that is calling <l Industry::HandleTrain  HandleTrain>().
	//
	// See Also:
	//     Industry::HandleTrain()
	//

	public define string LOAD_COMMAND = "load";      //!< <b Load> driver command.
	public define string UNLOAD_COMMAND = "unload";  //!< <b Unload> driver command.

	//@}


	//! Called by the <l astSrcDriveCmdLoad  Load> and <l astSrcDriveCmdLoad  Unload> driver commands to initiate loading/unloading of a train.
	//                   
	// This method is called from within a DriverCharacter schedule and is permitted to control the
	// train (i.e. stop it. move it etc.).  It only drives the train and does not do any actual
	// loading/unloading.
	//
	// Param:  train        Train to control and guide through this industry.
	// Param:  loadCommand  String indicating what type of driver command that is calling this method.
	//                      See \ref loadUnloadCmds "Load and Unload Driver Command Strings" for
	//                      details.
	//
	// Returns:
	//     Returns true if successful or if the loading/unloading is handled in another ongoing thread,
	//     false otherwise on failure.  The default Industry implementation always returns false.
	//
	public bool HandleTrain(Train train, string loadCommand);


	//
	// IMPLEMENTATION
	//
  
  float m_overriddenBeginLoadTime = 0;  // Setting this to a positive number of seconds will override the industry's BeginLoad() result.

	
	public float BeginUnload(LoadingReport report)
	{
    if (m_overriddenBeginLoadTime > 0)
      return m_overriddenBeginLoadTime;
    
		return 0.0;
	}

	public float GetUnloadTime(LoadingReport report)
	{
		return 1.0;
	}

	public float EndUnload(LoadingReport report)
	{
		return 0.0;
	}

	
	public float BeginLoad(LoadingReport report)
	{
    if (m_overriddenBeginLoadTime > 0)
      return m_overriddenBeginLoadTime;
    
		return 0.0;
	}

	public float GetLoadTime(LoadingReport report)
	{
		return 1.0;
	}

	public float EndLoad(LoadingReport report)
	{
		return 0.0;
	}

	public bool HandleTrain(Train train, string loadCommand)
	{
		return false;
	}


	//! Creates a report describing a loading operation from a queue in this industry.
	//
	// Param:  srcIndustryQueue  Industry source queue to load from.
	// Param:  amountLoad        Desired amount to load from the source queue.
	//
	// Note:
	//     This method generates a report but doesn't perform any actual loading.
	//
	// Returns:
	//     Returns a newly created LoadingReport object describing a loading operation with this 
	//     industry.
	//
	public LoadingReport CreateLoadingReport(ProductQueue srcIndustryQueue, int amountLoad)
	{
		LoadingReport report = new LoadingReport();
		report.Clear();
		report.src = me;
		report.srcQueue = srcIndustryQueue;
		report.desiredAmount = amountLoad;
		return report;
	}

	//! Creates a report describing an unloading operation for a queue in this industry.
	//
	// Param:  dstIndustryQueue  Industry destination queue to unload to.
	// Param:  amountToUnload    Desired amount to unload to the destination queue.
	//
	// Note:
	//     This method generates a report but doesn't perform any actual unloading.
	//
	// Returns:
	//     Returns a newly created LoadingReport object describing an unloading operation with this
	//     industry.
	//
	public LoadingReport CreateUnloadingReport(ProductQueue dstIndustryQueue, int amountToUnload)
	{
    Interface.Log("Industry.CreateUnloadingReport> amountToUnload=" + amountToUnload);
    
		LoadingReport report = new LoadingReport();
		report.Clear();
		report.dst = me;
		report.dstQueue = dstIndustryQueue;
		report.desiredAmount = amountToUnload;
		return report;
	}



	//
	// Returns TRUE if this Industry has a track with this track-name.
	//
	public bool HasTrack(string track)
	{
		string[] names = new string[0];
		string[] tracks = new string[0];
		int i;

		AppendDriverDestinations(names, tracks);
		
		for (i = 0; i < tracks.size(); i++)
			if (tracks[i] == track)
				return true;

		return false;
	}
  
  
  
  // ============================================================================
  // Name: SetOverriddenBeginLoadTime
  // Desc: This function allows the construction of a rule so that the session
  //       builder may override this Industry's normal BeginLoad/BeginUnload
  //       duration.
  // Parm: overriddenBeginLoadTime - If set to a positive integer, this causes
  //       the BeginLoad() / BeginUnload() functions to return that integer as
  //       the duration in seconds, ignoring any other logic. Note that if the
  //       BeginLoad() / BeginUnload() functions are overridden in a base class,
  //       this override behaviour will only work if correctly supported in the
  //       base class. Pass 0.0 to switch off the override.
  // ============================================================================
  public void SetOverriddenBeginLoadTime(float overriddenBeginLoadTime)
  {
    m_overriddenBeginLoadTime = overriddenBeginLoadTime;
  }
	
};


