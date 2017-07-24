//=============================================================================
// File: NavigateToTrackmarkScheduleCommand.gs
// Desc: 
//=============================================================================
include "DriverCommand.gs"
include "World.gs"
include "Browser.gs"
include "KUID.gs"
include "Industry.gs"
include "NavigateToTrackmarkCommand.gs"
include "Schedule.gs"


//=============================================================================
class NavigateToTrackmarkScheduleCommandData
{
  public GameObjectID   m_trackMarkID;
  public TrackMark      m_trackMark;
  public string         m_localisedName;
};


//=============================================================================
// Name: NavigateToTrackmarkCustomCommand
// Desc: 
//=============================================================================
class NavigateToTrackmarkCustomCommand isclass CustomCommand
{
  public NavigateToTrackmarkScheduleCommandData m_data;

  //=============================================================================
  // Name: Execute
  // Desc: Actually execute this command
  //=============================================================================
  public bool Execute(Train train, int px, int py, int pz)
  {
    DriverCharacter driver = train.GetActiveDriver();
    if (!driver)
      return false;

    driver.GetTrain().SetAutopilotMode(Train.CONTROL_SCRIPT);

    // Search for the target object, triggering it to load if necessary
    AsyncObjectSearchResult asyncSearch = World.GetGameObjectByID(m_data.m_trackMarkID);
    train.Sniff(asyncSearch, "ObjectSearch", "AsyncLoadComplete", true);

    // This function is always called from a thread on Train, so we're able to
    // just wait here for the result.
    Message msg;
    wait()
    {
      on "ObjectSearch", "AsyncLoadComplete", msg:
      if (msg.src == asyncSearch)
        break;

      continue;
    };

    NamedObjectInfo[] searchResults = asyncSearch.GetResults();

    if (searchResults.size() > 0)
      m_data.m_trackMark = cast<TrackMark>(searchResults[0].objectRef);

    if (!m_data.m_trackMark)
    {
      Interface.Log("NavigateToTrackmarkScheduleCommand> Failed to load trackmark: " + m_data.m_trackMarkID.GetDebugString());
      train.Sleep(5);
      return false;
    }

    return true;
  }
};


//=============================================================================
class DummyCommand isclass CustomCommand
{
  public bool Execute(Train train, int px, int py, int pz) { return true; }
};



//=============================================================================
// Name: NavigateToTrackmarkScheduleCommand
// Desc: 
//=============================================================================
class NavigateToTrackmarkScheduleCommand isclass DriverScheduleCommand
{
  NavigateToTrackmarkCommand              parent;
  NavigateToTrackmarkScheduleCommandData  m_data;

  public obsolete string trackmarkName;


  public void SetParent(NavigateToTrackmarkCommand newParent)
  {
    parent = newParent;
  }


  bool HasReachedDestination(DriverCharacter driver)
  {
    Vehicle driverVehicle = cast<Vehicle>(driver.GetLocation());
    if (!driverVehicle)
      return false;

    return m_data.m_trackMark.IsNodeInsideTrigger(driverVehicle.GetMyTrain().GetGameObjectID(), true);
  }


  public bool BeginExecute(DriverCharacter driver)
  {
    if (UpdateExecute(driver))
      return true;

    // Update has returned false, meaning we're already at our destination, but
    // if we don't issue any schedule commands the calling code will think the
    // command has failed and stop processing the schedule. Issue a dummy empty
    // command to avoid this.
    driver.DriverCustomCommand(new DummyCommand());
    driver.DriverIssueSchedule();
    return true;
  }


  public bool UpdateExecute(DriverCharacter driver)
  {
    if (!m_data.m_trackMark)
    {
      // TrackMark not loaded yet, add a schedule command to search for it
      NavigateToTrackmarkCustomCommand command = new NavigateToTrackmarkCustomCommand();
      command.m_data = m_data;

      driver.DriverCustomCommand(command);
      driver.DriverIssueSchedule();

      // We'll have more to do once the trackmark is found
      return true;
    }

    if (!HasReachedDestination(driver))
    {
      // TrackMark loaded and set, have native code build a schedule to navigate to it
      driver.NavigateToTrackside(m_data.m_trackMark);
      return true;
    }

    // Destination trackmark reached, no more work to do
    return false;
  }


  public object GetIcon(void)
  {
    return cast<object>(parent);
  }


  public string GetTooltip(void)
  {
    StringTable strTable = GetAsset().GetStringTable();
    return strTable.GetString1("tt_navigate_to", m_data.m_localisedName);
  }


  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();
    soup.SetNamedTag("trackmark-id", m_data.m_trackMarkID);
    soup.SetNamedTag("trackmark-name", m_data.m_localisedName);

    return soup;
  }


  obsolete void ObsoleteLoadTrackmarkByName(string trackMarkName)
  {
    if (trackMarkName == "")
      return;

    TrackMark trackMark = cast<TrackMark>(Router.GetGameObject(trackMarkName));
    if (trackMark)
    {
      m_data.m_trackMarkID = trackMark.GetGameObjectID();
      m_data.m_localisedName = trackMark.GetLocalisedName();
    }
    else
    {
      Interface.Log("NavigateToTrackmarkScheduleCommand.ObsoleteLoadTrackmarkByName> Failed to find trackmark: " + trackMarkName);
      m_data.m_localisedName = trackMarkName;
    }
  }

  public void SetProperties(Soup soup)
  {
    m_data = new NavigateToTrackmarkScheduleCommandData();
    m_data.m_trackMarkID = soup.GetNamedTagAsGameObjectID("trackmark-id");
    m_data.m_localisedName = soup.GetNamedTag("trackmark-name");

    if (!m_data.m_trackMarkID)
      ObsoleteLoadTrackmarkByName(soup.GetNamedTag("trackmarkName"));
  }

};

