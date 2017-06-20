//
// PassengerStationInfo.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "HTMLPropertyHandler.gs"
include "World.gs"
include "Soup.gs"


//! Property handler for use by the GenericPassengerStation class.
//
// This property handler defines the properties for a single platform in a passenger station.  A
// GenericPassengerStation object contains one of these handlers for each platform it has.
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\PassengerStationInfo.gs> script file.
//
// See Also:
//     GenericPassengerStation, GenericPassengerStation::InitPassengerStation()
//
class PassengerStationInfo isclass HTMLPropertyHandler
{
	// \name   Passenger Station Platform Types
	// \anchor passengerStationTypes
	//
	// Passenger Station Types
	//
	// These constants define the percentage of passengers in the entire train that will disembark 
	// when that train has stopped at the platform.
	//
	// See Also:
	//     PassengerStationInfo::GetStationType(), PassengerStationInfo::SetStationType(),
	//     PassengerStationInfo::GetRatioOfPassengersToDisembark()
	//

	public define int TERMINUS_STATION = 0;  // All passengers will disembark from the train.
	public define int LARGE_STATION = 1;     // 50% of passengers will disembark from the train.
	public define int STANDARD_STATION = 2;  // 25% of passengers will disembark from the train.
	public define int SMALL_STATION = 3;     // 1% of passengers will disembark from the train.


	// \name   Passenger Transfer Levels
	// \anchor passengerTransfer
	//
	// Passenger Transfer Levels
	//
	// These constants define the amount of passenger transfers 
	// GetPresetTrafficGraph
	//

	public define int AM_PEAK_PRESET = 0;      // ??
	public define int PM_PEAK_PRESET = 1;      // ??
	public define int DOUBLE_PEAK_PRESET = 2;  // ??




	//
	// PassengerStationInfo methods
	//

	//@ Document me!
	public void SetStationType(int stationType);

	//@ Document me!
	public int GetStationType(void);

	//@ Document me!
	public string GetStationTypeName(void);

	//@ Document me!
	public float GetRatioOfPassengersToDisembark(void);

	//@ Document me!
	public int GetNumberOfPassengersToDisembark(int numberOnTrain);


	//@ Document me!
	public void SetTrafficGraphShape(float[] trafficGraph);

	//@ Document me!
	public float[] GetTrafficGraphShape(void);

	//@ Document me!
	public void SetTrafficGraphPreset(int preset);

	//@ Document me!
	public string GetTrafficGraphName(void);

	//@ Document me!
	public void SetTrafficScale(float trafficScale);

	//@ Document me!
	public float GetTrafficScale(void);


	//@ Document me!
	public float GetNumberOfNewPassengersPerHour(void);


	//@ Gets the initial amount of passengers the platform has.
	//
	// Returns:
	//     Returns the initial amount of passengers the platform has.
	//
	public int GetInitialPassengerCount(void);

	//@ Sets the initial amount of passengers the platform has.
	//
	// Param:  count  Amount of passengers this platform will have when initially created before any
	//                passenger movement to/from trains has taken place.
	//
	public void SetInitialPassengerCount(int count);


	public float[] GetPresetTrafficGraph(int graph);


  public void SetProperties(Soup soup);
  public Soup GetProperties(void);


	//@ Document me!
	public void SetPlatformName(string name);

	//@ Document me!
	public void SetPassengerMaximumCount(int count);


	//@ Document me!
	public void SetPlatformQueue(ProductQueue queue);

	//@ Document me!
	public ProductQueue GetPlatformQueue();


	//@ Document me!
	public string GetViewDetailsHTMLCode();


	//
	// HTMLPropertyHandler dispatch methods
	//

  public string GetDescriptionHTML(void);
  public string GetPropertyName(string propertyID);
  public string GetPropertyDescription(string propertyID);
  public string GetPropertyType(string propertyID);
  public string GetPropertyValue(string propertyID);
  public void SetPropertyValue(string propertyID, PropertyValue value);
  public string[] GetPropertyElementList(string propertyID);
	

	//
	// PRIVATE IMPLEMENTATION
	//

	int m_stationType = STANDARD_STATION;
	float[] m_trafficGraphShape = GetPresetTrafficGraph(0);
	int m_trafficGraphPreset = 0;
	float m_trafficScale = 120.0f;
	string m_platformName;
	int m_initialPassengerCount = 10;
	int m_maximumPassengerCount = 255;
  ProductQueue m_platformQueue;


	public void SetStationType(int stationType)
	{
		m_stationType = stationType;
	}


	public int GetStationType(void)
	{
		return m_stationType;
	}


	public string GetStationTypeName(void)
	{
    StringTable strTable = Constructors.GetTrainzStrings();
		if (m_stationType == TERMINUS_STATION)
			return strTable.GetString("interface-pass-station-terminus");
		
		if (m_stationType == LARGE_STATION)
			return strTable.GetString("interface-pass-station-large");

		if (m_stationType == STANDARD_STATION)
			return strTable.GetString("interface-pass-station-standard");

		if (m_stationType == SMALL_STATION)
			return strTable.GetString("interface-pass-station-small");

		return strTable.GetString("interface-pass-station-unknowntype");
	}


	public float GetRatioOfPassengersToDisembark(void)
	{
		if (m_stationType == TERMINUS_STATION)
			return 1.0f;
		
		if (m_stationType == LARGE_STATION)
			return 0.5f;

		if (m_stationType == STANDARD_STATION)
			return 0.25f;

		if (m_stationType == SMALL_STATION)
			return 0.1f;


		// unknown Passenger Station type?!
		return 0.25f;
	}


	public int GetNumberOfPassengersToDisembark(int numberOnTrain)
	{
		float ratio = GetRatioOfPassengersToDisembark();
		int ret = numberOnTrain * ratio + 0.999f;
		return ret;
	}

	
		// the trafficGraph must have 24 entries, ranging between 0.0f and 1.0f inclusive
	public void SetTrafficGraphShape(float[] trafficGraph)
	{
		m_trafficGraphPreset = -1;
		m_trafficGraphShape = trafficGraph;
	}


	public void SetTrafficGraphPreset(int preset)
	{
		m_trafficGraphPreset = preset;
		m_trafficGraphShape = GetPresetTrafficGraph(preset);
	}


	public string GetTrafficGraphName(void)
	{
    StringTable strTable = Constructors.GetTrainzStrings();
		if (m_trafficGraphPreset == 0)
			return strTable.GetString("interface-pass-station-morning");
		if (m_trafficGraphPreset == 1)
			return strTable.GetString("interface-pass-station-evening");
		if (m_trafficGraphPreset == 2)
			return strTable.GetString("interface-pass-station-double");

		return strTable.GetString("interface-pass-station-custom");
	}


	public float[] GetTrafficGraphShape(void)
	{
		return m_trafficGraphShape;
	}


	public void SetTrafficScale(float trafficScale)
	{
		m_trafficScale = trafficScale;
	}


	public float GetTrafficScale(void)
	{
		return m_trafficScale;
	}


	public float GetNumberOfNewPassengersPerHour(void)
	{
		if (!m_trafficGraphShape)
			return 0.0f;

		float time = (World.GetGameTime() + 0.5f) * 24.0f;
		int hour = time;
		float interp = time - hour;

		hour = hour % 24;
		
		float pre = m_trafficGraphShape[hour];
		float post = m_trafficGraphShape[(hour + 1) % 24];
		float graphValue = pre + (post - pre) * interp;
		
		return graphValue * m_trafficScale;
	}

	public int GetInitialPassengerCount(void)
	{
		return m_initialPassengerCount;
	}

	public void SetInitialPassengerCount(int count)
	{
		if (count >= 0)
			m_initialPassengerCount = count;
		else
			m_initialPassengerCount = 0;
	}


	public float[] GetPresetTrafficGraph(int graph)
	{
		float[] ret;

		if (graph == AM_PEAK_PRESET)
		{
			ret = new float[24];
			ret[0] = 0.05f;
			ret[1] = 0.05f;
			ret[2] = 0.0f;
			ret[3] = 0.05f;
			ret[4] = 0.2f;
			ret[5] = 0.55f;
			ret[6] = 0.9f;
			ret[7] = 1.0f;
			ret[8] = 0.9f;
			ret[9] = 0.65f;
			ret[10] = 0.5f;
			ret[11] = 0.4f;
			ret[12] = 0.35f;
			ret[13] = 0.3f;
			ret[14] = 0.3f;
			ret[15] = 0.25f;
			ret[16] = 0.2f;
			ret[17] = 0.2f;
			ret[18] = 0.15f;
			ret[19] = 0.15f;
			ret[20] = 0.1f;
			ret[21] = 0.1f;
			ret[22] = 0.1f;
			ret[23] = 0.05f;
		}
		else if (graph == PM_PEAK_PRESET)
		{
			ret = new float[24];
			ret[0] = 0.05f;
			ret[1] = 0.05f;
			ret[2] = 0.0f;
			ret[3] = 0.05f;
			ret[4] = 0.1f;
			ret[5] = 0.1f;
			ret[6] = 0.1f;
			ret[7] = 0.1f;
			ret[8] = 0.1f;
			ret[9] = 0.1f;
			ret[10] = 0.1f;
			ret[11] = 0.2f;
			ret[12] = 0.3f;
			ret[13] = 0.4f;
			ret[14] = 0.6f;
			ret[15] = 0.8f;
			ret[16] = 0.95f;
			ret[17] = 1.0f;
			ret[18] = 0.9f;
			ret[19] = 0.55f;
			ret[20] = 0.35f;
			ret[21] = 0.2f;
			ret[22] = 0.1f;
			ret[23] = 0.05f;
		}
		else if (graph == DOUBLE_PEAK_PRESET)
		{
			ret = new float[24];
			ret[0] = 0.05f;
			ret[1] = 0.05f;
			ret[2] = 0.0f;
			ret[3] = 0.05f;
			ret[4] = 0.2f;
			ret[5] = 0.55f;
			ret[6] = 0.9f;
			ret[7] = 1.0f;
			ret[8] = 0.9f;
			ret[9] = 0.65f;
			ret[10] = 0.5f;
			ret[11] = 0.4f;
			ret[12] = 0.35f;
			ret[13] = 0.4f;
			ret[14] = 0.6f;
			ret[15] = 0.8f;
			ret[16] = 0.95f;
			ret[17] = 1.0f;
			ret[18] = 0.9f;
			ret[19] = 0.55f;
			ret[20] = 0.35f;
			ret[21] = 0.2f;
			ret[22] = 0.1f;
			ret[23] = 0.05f;
		}

		return ret;
	}
	
	
	public string GetDescriptionHTML(void)
	{
    StringTable strTable = Constructors.GetTrainzStrings();
		string body = "";
		
		body = body + "<font color=#FFFFFF>";
		body = body + "<p><b>" + BrowserInterface.Quote(m_platformName) + "</b></p>";
		body = body + strTable.GetString2("interface-pass-station-htmldesc0", HREF("station-type"), GetStationTypeName());
		body = body + strTable.GetString2("interface-pass-station-htmldesc1", HREF("graph-type"), GetTrafficGraphName());
		body = body + strTable.GetString2("interface-pass-station-htmldesc2", HREF("queue-rate"), HTMLWindow.GetCleanFloatString(GetTrafficScale()));
		body = body + strTable.GetString2("interface-pass-station-htmldesc3", HREF("passenger-count"), m_initialPassengerCount);
		body = body + "</font>";

		return body;
	}


  public string GetPropertyName(string propertyID)
	{
    StringTable strTable = Constructors.GetTrainzStrings();
		if (propertyID == Prop("station-type"))
			return strTable.GetString("interface-ps-name-station-type");

		if (propertyID == Prop("graph-type"))
			return strTable.GetString("interface-ps-name-graph-type");

		if (propertyID == Prop("queue-rate"))
			return strTable.GetString("interface-ps-name-queue-rate");

		if (propertyID == Prop("passenger-count"))
			return strTable.GetString("interface-ps-name-passenger-count");

		return "null";
	}


  public string GetPropertyDescription(string propertyID)
	{
    StringTable strTable = Constructors.GetTrainzStrings();
		if (propertyID == Prop("station-type"))
			return strTable.GetString("interface-ps-desc-station-type");

		if (propertyID == Prop("graph-type"))
			return strTable.GetString("interface-ps-desc-graph-type");

		if (propertyID == Prop("queue-rate"))
			return strTable.GetString("interface-ps-desc-queue-rate");

		if (propertyID == Prop("passenger-count"))
			return strTable.GetString("interface-ps-desc-passenger-count");

		return "null";
	}


  public string GetPropertyType(string propertyID)
	{
		if (propertyID == Prop("station-type"))
			return "list";

		if (propertyID == Prop("graph-type"))
			return "list";

		if (propertyID == Prop("queue-rate"))
			return "int,1,4000";

		if (propertyID == Prop("passenger-count"))
			return "int,0," + m_maximumPassengerCount;

		return "null";
	}


  public string GetPropertyValue(string propertyID)
	{
		if (propertyID == Prop("station-type"))
			return GetStationTypeName();

		if (propertyID == Prop("graph-type"))
			return "";

		if (propertyID == Prop("queue-rate"))
			return HTMLWindow.GetCleanFloatString(GetTrafficScale());

		if (propertyID == Prop("passenger-count"))
			return (string)m_initialPassengerCount;

		return "";
	}


  public void SetPropertyValue(string propertyID, PropertyValue value)
	{
		if (propertyID == Prop("station-type"))
			SetStationType(value.GetIndex());

		else if (propertyID == Prop("graph-type"))
			SetTrafficGraphPreset(value.GetIndex());

		else if (propertyID == Prop("queue-rate"))
			SetTrafficScale(value.AsInt());

		else if (propertyID == Prop("passenger-count"))
			SetInitialPassengerCount(value.AsInt());
	}


  public string[] GetPropertyElementList(string propertyID)
	{
    StringTable strTable = Constructors.GetTrainzStrings();
		string[] ret;

		if (propertyID == Prop("station-type"))
		{
			ret = new string[4];
			ret[0] = strTable.GetString("interface-pass-station-terminus");
			ret[1] = strTable.GetString("interface-pass-station-large");
			ret[2] = strTable.GetString("interface-pass-station-standard");
			ret[3] = strTable.GetString("interface-pass-station-small");
		}

		else if (propertyID == Prop("graph-type"))
		{
			ret = new string[3];
			ret[0] = strTable.GetString("interface-pass-station-morning");
			ret[1] = strTable.GetString("interface-pass-station-evening");
			ret[2] = strTable.GetString("interface-pass-station-double");
		}

		else
			ret = new string[0];

		return ret;
	}


	
  public void SetProperties(Soup soup)
	{
		int type, preset, initCount;
		float scale;

		type = soup.GetNamedTagAsInt("PassengerStationInfo.stationType", m_stationType);
		preset = soup.GetNamedTagAsInt("PassengerStationInfo.trafficGraphPreset");
		scale = soup.GetNamedTagAsInt("PassengerStationInfo.trafficScale", m_trafficScale);
		initCount = soup.GetNamedTagAsInt("PassengerStationInfo.initialPassengerCount", m_initialPassengerCount);
		
		Soup graph = soup.GetNamedSoup("PassengerStationInfo.trafficGraphShape");
		if (graph.CountTags() == 24)
		{
			float[] graphData = new float[24];

			int i;
			for (i = 0; i < 24; i++)
				graphData[i] = graph.GetNamedTagAsFloat((string)i);
			
			SetTrafficGraphShape(graphData);
		}
		else
			SetTrafficGraphPreset(preset);

		SetTrafficScale(scale);
		SetStationType(type);
		SetInitialPassengerCount(initCount);

		inherited(soup);
	}


  public Soup GetProperties(void)
	{
		Soup soup = inherited();
		
		soup.SetNamedTag("PassengerStationInfo.stationType", m_stationType);
		soup.SetNamedTag("PassengerStationInfo.trafficGraphPreset", m_trafficGraphPreset);
		soup.SetNamedTag("PassengerStationInfo.trafficScale", m_trafficScale);
		soup.SetNamedTag("PassengerStationInfo.initialPassengerCount", m_initialPassengerCount);

		if (m_trafficGraphPreset == -1  and  m_trafficGraphShape)
		{
			Soup graph = Constructors.NewSoup();
			int i;
			for (i = 0; i < 24; i++)
				graph.SetNamedTag((string)i, m_trafficGraphShape[i]);

			soup.SetNamedSoup("PassengerStationInfo.trafficGraphShape", graph);
		}

		return soup;
	}

		// the platform name is for display purposes only, and will not be saved out into the soup
	public void SetPlatformName(string name)
	{
		m_platformName = name;
	}

		// the maximum count is for display purposes only, and will not be saved out into the soup
	public void SetPassengerMaximumCount(int count)
	{
		m_maximumPassengerCount = count;
	}

  public void SetPlatformQueue(ProductQueue queue)
  {
    m_platformQueue = queue;
  }

  public ProductQueue GetPlatformQueue()
  {
    return m_platformQueue;
  }

  public string GetViewDetailsHTMLCode()
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    string retHTML = "";
		retHTML = retHTML + "<font color=#FFFFFF>";
		retHTML = retHTML + "<p><b>" + BrowserInterface.Quote(m_platformName) + "</b></p>";
		retHTML = retHTML + strTable.GetString1("interface-ps-view-details-html0", GetStationTypeName());
		retHTML = retHTML + strTable.GetString1("interface-ps-view-details-html1", HTMLWindow.GetCleanFloatString(GetTrafficScale()));
    if (m_platformQueue)
		  retHTML = retHTML + strTable.GetString1("interface-ps-view-details-html2", m_platformQueue.GetQueueCount());
		retHTML = retHTML + "</font>";

    return retHTML;
    
  }


};
