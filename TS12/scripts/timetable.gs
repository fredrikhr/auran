//
// timetable.gs
//
// Copyright (C) 2002 Auran Developments Pty Ltd
// All Rights Reserved.
//

include "gs.gs"


//! State of a timetable announcement.
//
// The members of this class define the properties of an announcement in a Timetable.
//
// Note:
//     This class is mostly a legacy class from the SP3/UTC era of %Trainz and does not have 
//     anything to do with the TrainTimetable class and its associated classes.
//
// See Also:
//     Timetable
//
final class TimetableState
{
  public string stateName;  //!< State name.
  public int[] observers;   //!< Node IDs of GameObjects that are observing this state.
  public bool state;        //!< Flag indicating if this state has been announced (true) or not (false).
};


//! Static timetable for storing current game information/stats etc.
//
// The static Timetable class may be used to store the current game/timetable state.  It allows you
// to announce that something has happened (i.e. a train has reach a certain location, such that 
// other trains or events may wait on that announcement).  A list of TimetableState objects is 
// managed for the current states in the timetable.  One way to understand this class is to think of
// it as a global 'notice board' that any script code can access.
//
// As an example, <m trainB> is waiting for <m trainA> to pull into the station before it leaves,
// but <m trainB> may not be at the station when <m trainA> arrives, so <m trainA> will announce
// the state of <m "TrainAatStation"> when it arrives, which is what <m trainB> will be waiting on.
//
// When <m trainA> arrives, it announces its arrival by posting the <m "TrainAatStation"> state to
// the timetable:
//
//<code>
//Timetable.Announce("TrainAatStation", trainA.GetId());
//</code>
//
// and for <m trainB> to wait on the <m "TrainAatStaiton"> annoucnement, the following code would
// be used:
//
//<code>
//if(!Timetable.OnAnnouncement("TrainAatStation", me.GetId()))
//{
//  on "Timetable", "TrainAatStation" : ;
//}
//</code>
//
// Note:
//     As this is a <l gscLangKeyStatic  static> class, you cannot create instances of it, only call
//     its methods directly.
//
// Note:
//     This class is mostly a legacy class from the SP3/UTC era of %Trainz and does not have
//     anything to do with the TrainTimetable class and its associated classes.
//
// See Also:
//     Schedule, TimetableState
//
static class Timetable
{
  //! Announces a timetable state.
  //
  // Param:  stateName  The event/state being announced.
  // Param:  srcId      Node ID of the GameObject setting the state.  Use <l GameObject::GetId  GetId>()
  //                    on the object to get its node ID.
  //
  // Returns:
  //     Returns true if <i stateName> is being waited on, false otherwise.
  //
  // See Also:
  //     Schedule::Announce()
  //
  public bool Announce(string stateName, int srcId);

  //! Clears the named announcement from this timetable.
  //
  // Param:  stateName  Name of the event/state to remove.
  //
  // Returns:
  //     Returns true if <i stateName> was found and removed from the timetable, false otherwise.
  //
  public bool UnAnnounce(string stateName);

  //! Removes all announcements from the timetable.
  public void Reset();

  //! Determines if the named timetable state has been set.
  //
  // This method returns true if the named timetable state has been set.  If not, a message of type
  // (<m"Timetable">, <i stateName>) will be posted to the object identified by <i notifyId>
  // when the state is announced.
  //
  // Param:  stateName  Name of state/event to wait for.
  // Param:  notifyId   Node ID of the GameObject to be notified when the announcement of
  //                    <i stateName> is made.  Use <l GameObject::GetId  GetId>() on the object to
  //                    get its node ID.
  //
  // Returns:
  //     Returns true if <i stateName> has been announced, false otherwise.
  //
  // See Also:
  //     Schedule::OnAnnounce()
  //
  public bool OnAnnouncement(string stateName, int notifyId);

  //! Waits on the given thread on the named state until that state has been announced.
  //
  // Param:  runningThread  Current running thread.
  // Param:  stateName      Name of the timetable state to wait on.
  //
  // Note:
  //     This method waits until the announcement is made.  This means <i runningThread> will be 
  //     not be able to move on until this method returns.
  //
  // Returns:
  //     Always returns true.
  //
  // See Also:
  //     Schedule::OnAnnounce()
  //
  public bool OnAnnouncement(GameObject runningThread, string stateName);


  //
  //
  // PRIVATE IMPLEMENTATION
  //
  //

  TimetableState[] states = new TimetableState[0];

  public bool Announce(string stateName, int srcId)
  {
    int i, numStates = states.size(), j;
    TimetableState state;

    for(i = 0; i < numStates; ++i)
    {
      if(states[i].stateName == stateName)
      {
        state = states[i];

        if(state.state == false)
        {
          // notifiy the observers
          int numObservers = state.observers.size();

          for(j = 0; j < numObservers; ++j)
          {
            Router.PostMessage(srcId, state.observers[j], "Timetable", stateName, 0);
          }

          state.observers = null;
          state.state = true;
          return true;
        }
        return false;
      }
    }

    // add a new state
    state = new TimetableState();
    state.stateName = stateName;
    state.state = true;
    states[states.size()] = state;
    return true;
  }

  public bool UnAnnounce(string stateName)
  {
    int i, numStates = states.size();

    for(i = 0; i < numStates; ++i)
    {
      if(states[i].stateName == stateName)
      {
        states[i,i+1] = null;
        return true;
      }
    }
    return false;
  }

  public void Reset()
  {
    states = new TimetableState[0];
  }

  public bool OnAnnouncement(string stateName, int notifyNode)
  {
    int i, numStates = states.size(), j;
    TimetableState state;

    for(i = 0; i < numStates; ++i)
    {
      if(states[i].stateName == stateName)
      {
        state = states[i];

        if(state.state)
        {
          return true;
        }

        state.observers[state.observers.size()] = notifyNode;
        return false;
      }
    }

    // add a new state
    state = new TimetableState();
    state.stateName = stateName;
    state.observers = new int[1];
    state.observers[0] = notifyNode;
    state.state = false;
    states[states.size()] = state;
    return false;
  }

  public bool OnAnnouncement(GameObject runningThread, string stateName)
  {
    Message msg;

    if(!OnAnnouncement(stateName, runningThread.GetId()))
    {
      wait()
      {
        on "Timetable", "", msg :
        {
          if(msg.minor == stateName)
          {
            break;
          }
          continue;
        }
      }
    }
    return true;
  }
};



