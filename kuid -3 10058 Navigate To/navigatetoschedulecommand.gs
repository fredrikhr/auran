//=============================================================================
// File: NavigateToScheduleCommand.gs
// Desc: 
//=============================================================================
include "DriverCommand.gs"
include "World.gs"
include "Industry.gs"
include "NavigateToCommand.gs"


//=============================================================================
class NavigateToScheduleCommandData
{
  public GameObjectID   m_industryID;
  public Industry       m_industry;
  public string         m_trackName;
  public string         m_industryName;
};


//=============================================================================
// Name: NavigateToCustomCommand
// Desc: 
//=============================================================================
class NavigateToCustomCommand isclass CustomCommand
{
  public NavigateToScheduleCommandData m_data;


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
    AsyncObjectSearchResult asyncSearch = World.GetGameObjectByID(m_data.m_industryID);
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
      m_data.m_industry = cast<Industry>(searchResults[0].objectRef);

    if (!m_data.m_industry)
    {
      Interface.Log("NavigateToCustomCommand> Failed to load industry: " + m_data.m_industryID.GetDebugString());
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
// Name: NavigateToScheduleCommand
// Desc: Driver schedule command used by NavigateToCommand to get a driver
//       character to take a train to a industry location.
//=============================================================================
class NavigateToScheduleCommand isclass DriverScheduleCommand
{
  public NavigateToScheduleCommandData m_data;

  public obsolete void SetParent(NavigateToCommand newParent) { }


  bool HasReachedDestination(DriverCharacter driver)
  {
    Vehicle driverVehicle = cast<Vehicle>(driver.GetLocation());
    if (!driverVehicle)
      return false;

    return m_data.m_industry.IsTrainOnTrack(driverVehicle.GetMyTrain(), m_data.m_trackName);
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


  //=============================================================================
  // Name: UpdateExecute
  // Desc: 
  //=============================================================================
  public bool UpdateExecute(DriverCharacter driver)
  {
    if (!m_data.m_industry)
    {
      // Industry not loaded yet, add a schedule command to search for it
      NavigateToCustomCommand command = new NavigateToCustomCommand();
      command.m_data = m_data;

      driver.DriverCustomCommand(command);
      driver.DriverIssueSchedule();

      // We'll have more to do once the industry is found
      return true;
    }

    if (!HasReachedDestination(driver))
    {
      // Industry loaded and set, have native code build a schedule to navigate to it
      driver.NavigateToIndustry(m_data.m_industry, m_data.m_trackName);
      return true;
    }

    // Destination industry reached, no more work to do
    return false;
  }


  public object GetIcon(void)
  {
    if (!m_data.m_industry)
      m_data.m_industry = cast<Industry>(World.GetGameObjectByIDIfLoaded(m_data.m_industryID));

    if (m_data.m_industry)
      return cast<object>(m_data.m_industry);

    return cast<object>(m_driverCommand);
  }


  public string GetTooltip(void)
  {
    StringTable strTable = GetAsset().GetStringTable();
    return strTable.GetString1("driver_command_navigate_to", m_data.m_industryName);
  }


  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();

    soup.SetNamedTag("industryID", m_data.m_industryID);
    soup.SetNamedTag("industryName", m_data.m_industryName);
    soup.SetNamedTag("trackName", m_data.m_trackName);

    return soup;
  }


  obsolete void ObsoleteLoadIndustryByName(string industryName)
  {
    if (industryName == "")
      return;

    Industry industry = cast<Industry>(Router.GetGameObject(industryName));
    if (industry)
      m_data.m_industryID = industry.GetGameObjectID();
    else
      Interface.Log("NavigateToScheduleCommand.ObsoleteLoadIndustryByName> Failed to find industry: " + industryName);
  }


  public void SetProperties(Soup soup)
  {
    m_data = new NavigateToScheduleCommandData();
    m_data.m_industryID = soup.GetNamedTagAsGameObjectID("industryID");
    m_data.m_industryName = soup.GetNamedTag("industryName");
    m_data.m_trackName = soup.GetNamedTag("trackName");

    if (!m_data.m_industryID and m_data.m_industryName != "")
      ObsoleteLoadIndustryByName(m_data.m_industryName);

  }

};

