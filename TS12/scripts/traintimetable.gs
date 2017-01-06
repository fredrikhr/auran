//
// TrainTimetable.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Train.gs"
include "ScenarioBehavior.gs"


//! An event item in a train timetable.
//
// This class describes a single event in a TrainTimetable object.
//
// See Also:
//     TrainTimetable
//
class TrainTimetableItem
{
  //! \name   Timetable Mode
  //  \anchor timetableMode
  //@{
  //! Timetable Item Modes
  //
  // See Also:
  //     TrainTimetableItem::mode
  //

  public define int MODE_INDUSTRY = 1;   //!< Drive to the named industry and (optionally) perform command.
  public define int MODE_TRACKMARK = 2;  //!< Drive via a named TrackMark.

  //@}

  public int mode;                   //!< Mode of this item, must be either \ref timetableMode "MODE_INDUSTRY" or \ref timetableMode "MODE_TRACKMARK".
  public string destinationName;     //!< Destination name.
  public string trackName;           //!< Name of destination track (if it is an industry).
  public KUID command;               //!< KUID of the DriverCommand to perform this item.
  public float arrivalTime;          //!< Scheduled arrival time.
  public float departureTime;        //!< Scheduled departure time.
  public bool msgLateSent;           //!< Has a late message been sent?
  public bool msgEarlySent;          //!< Has an early message been sent?
  public bool arrivedAtDestination;  //!< Has the train arrived at the destination yet?
  public bool arrivedLate;           //!< Has the train arrived late?
  public bool departOnTime;          //!< Did the train depart on time?
  public bool departEarly;           //!< Did the train depart early?
  public bool arriveEarly;           //!< Did the train arrive early?
};



//! This is an abstract base type for Train Timetabling.
//
// Object of this class are never created directly.  Instead, subclasses are derived from this class
// and override each of the functions defined here.  Instances of these subclasses are created by
// train timetable rules (such as \ref astSrcRuleSchedule "Schedule") and assigned to a Train to run.
//
// The creating rule is responsible for tracking and updating the TrainTimetable object and, when
// complete, removing it from the Train.
//
// See Also:
//     TrainTimetableItem, Train::GetTrainTimetable(), Train::SetTrainTimetable(),
//     \ref astSrcRuleSchedule "Schedule Rule"
//
class TrainTimetable isclass GSObject
{

	//! Gets the rule that owns this TrainTimetable object.
	//
	// Note:
	//     This method <bi MUST> be overridden by a derivative class as the TrainTimetable
	//     implementation always returns null.
	//
	// Returns:
	//     Should return the <l ScenarioBehavior rule> that owns this TrainTimetable object.
	//
	public ScenarioBehavior GetTimetableRule(void)
	{
		// MUST be overridden by derivative class
		return null;
	}


	//! Gets the Train that this TrainTimetable object is attached to.
	//
	// Note:
	//     This method <bi MUST> be overridden by derivative class as the TrainTimetable 
	//     implementation always returns null.
	//
	// Returns:
	//     Should return the Train to which this TrainTimetable object is attached to, null otherwise.
	//
	public Train GetTrain(void)
	{
		// MUST be overridden by derivative class
		return null;
	}


	//! Gets the current schedule TrainTimetableItem that is currently executing.
	//
	// When the schedule moves to the next item, a (<m"TrainTimetable">, <m "Touch">) message is sent
	// from the owning rule to the train.
	//
	// Note:
	//     This method <bi MUST> be overridden by a derivative class as the TrainTimetable 
	//     implementation always returns null.
	//
	// Note:
	//     This method may return NULL if there is no item currently available.  This does not
	//     necessarily mean that the schedule is complete however.
	//
	// Returns:
	//     Return the current schedule item which is executing, null otherwise.  The caller
	//     <bi MUST NOT> modify the returned TrainTimetableItem.
	//
	public TrainTimetableItem GetCurrentTimetableItem(void)
	{
		// MUST be overridden by derivative class
		return null;
	}


	//! Gets the current TrainTimetableItem and a number of future items from the current schedule.
	//
	// The timetable may be infinitely long (procedural) and in this case, only the first 
	// <i hintMaxDesired> items will be returned.
	//
	// Note:
	//     The caller <bi MUST NOT> modify the returned array or the contents of the array.
	//     Nor should they make any assumptions about the number of items returned.
	//
	// Note:
	//     This method <bi MUST> be overridden by a derivative class as the TrainTimetable 
	//     implementation always returns an empty array.
	//
	// Param:  hintMaxDesired  provides a hint as to the maximum number of items that should be returned.
	//
	// Returns:
	//     Return the current (item 0) and some number of future items from the current schedule.
	//
	public TrainTimetableItem[] GetCurrentTimetable(int hintMaxDesired)
	{
		// MAY be overridden by derivative class
		return new TrainTimetableItem[0];
	}


	//! Determines if the Train running this timetable has arrived at its destination yet.
	//
	// Note:
	//     This method <bi MUST> be overridden by a derivative class as the TrainTimetable 
	//     implementation always returns false.
	//
	// Returns:
	//     Returns true if the Train running the timetable has arrived at its destination, false
	//     otherwise.
	//
	public bool GetArrivedAtDestination(void)
	{
		// MUST be overridden by derivative class
		return false;
	}

	//! Determines if the Train running this timetable is late.
	//
	// Note:
	//     This method <bi MUST> be overridden by a derivative class as the TrainTimetable 
	//     implementation always returns false.
	//
	// Returns:
	//     Returns true if the Train is running late, false otherwise.
	//
	public bool GetIsLate(void)
	{
		// MUST be overridden by derivative class
		return false;
	}

	//! Determines if the Train running this timetable has arrived at its destination yet.
	//
	// Note:
	//     This method <bi MUST> be overridden by a derivative class as the TrainTimetable 
	//     implementation always returns false.
	//
	// Returns:
	//     Returns true if the Train has arrived at its destination, false otherwise.
	//
	public bool GetIsAtDestination(void)
	{
		// MUST be overridden by derivative class
		return false;
	}

};

