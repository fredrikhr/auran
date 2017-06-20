//
// ConsistListHelper.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "ConsistHelperInfo.gs"
include "common.gs"


//! A group handler that allows multiple consist definitions.
//
// This handler is an extension of HTMLPropertyGroup that allows consist definitions based on 
// ConsistHelperInfo class to be managed.
//
// Note:
//     This class was mainly written for use in the portal assets and is not a core %Trainz API 
//     class.
//
// See Also:
//     ConsistHelperInfo, VehicleDescriptor, HTMLPropertyGroup, TrainHelperInfo
//
class ConsistListHelper isclass HTMLPropertyGroup
{
	ConsistHelperInfo[] m_consists = new ConsistHelperInfo[0];

	void ResetHandlers(void);


	public int CountConsists(void)
	{
		return m_consists.size();
	}

	public Soup GetConsist(int index)
	{
		if (index < 0  or  index >= m_consists.size())
			return null;

		return m_consists[index].GetProperties();
	}

	public void AddConsist(Soup consistDescriptor)
	{
		int num = m_consists.size();
		m_consists[num] = new ConsistHelperInfo();
		m_consists[num].SetProperties(consistDescriptor);
		ResetHandlers();
	}

	public Soup GetRandomConsist(void)
	{
		int num = m_consists.size();

		if (!num)
			return null;
		
		return m_consists[Math.Rand(0, num)].GetProperties();
	}

	

	public string GetDescriptionHTML(void)
	{
		int i;
		string body = "";

    StringTable strTable = Constructors.GetTrainzStrings();

		for (i = 0; i < m_consists.size(); i++)
		{
			body = body + HTMLWindow.StartBorder("bgcolor=#FFAD0059 bordercolor=#00000059");
			body = body + "<p><font color=#FFFFFF>Consist #" + (i + 1) + " (" + HREF("delete" + i) + strTable.GetString("consist-helper-delete-consist") + "</a>)</font></p>";
			
			body = body + m_consists[i].GetDescriptionHTML();
			body = body + HTMLWindow.EndBorder();

			body = body + "<br>";
		}

		body = body + "<p>" + HREF("add") + strTable.GetString("consist-helper-add-consist") + "</a></p>";

		return body;
	}

	
  public void SetPropertyValue(string propertyID, PropertyValue value)
	{
		if (propertyID == Prop("add"))
		{
			m_consists[m_consists.size()] = new ConsistHelperInfo();
			ResetHandlers();
		}
		else if (PropMatchesPrefix(propertyID, "delete"))
		{
			int consistNumber = Str.ToInt(PropStripPrefix(propertyID, "delete"));

			RemoveHandler(m_consists[consistNumber]);
			m_consists[consistNumber, consistNumber+1] = null;

			ResetHandlers();
		}
		else
			inherited(propertyID, value);
	}


  public string GetPropertyType(string propertyID)
	{
		if (propertyID == Prop("add"))
		{
			return "link";
		}
		else if (PropMatchesPrefix(propertyID, "delete"))
		{
			return "link";
		}
		
		return inherited(propertyID);
	}


	public void SetProperties(Soup soup)
	{
		int count = soup.GetNamedTagAsInt("ConsistListHelper.consistCount");
		
		//
		// Get rid of any existing handlers
		//
		int i;
		for (i = 0; i < m_consists.size(); i++)
			RemoveHandler(m_consists[i]);
		
		//
		// Create a new bunch and attach them
		//
		m_consists = new ConsistHelperInfo[count];
		for (i = 0; i < count; i++)
			m_consists[i] = new ConsistHelperInfo();
		ResetHandlers();
		
		//
		// Load their data
		//
		inherited(soup);
	}


  public Soup GetProperties(void)
	{
		Soup soup = inherited();

		soup.SetNamedTag("ConsistListHelper.consistCount", m_consists.size());

		return soup;
	}


	void ResetHandlers(void)
	{
		int i;
		for (i = 0; i < m_consists.size(); i++)
		{
			RemoveHandler(m_consists[i]);
			AddHandler(m_consists[i], (string)i);

			m_consists[i].SetShowSearchInterface(false);
			m_consists[i].SetShowOrdersInterface(true);
		}
	}


  //=============================================================================
  // Name: AppendDependencies
  // Desc: Gathers the dependencies of this object as it is currently configured
  //       and adds them to io_dependencies. Should be called from the
  //       appropriate AppendDependencies() on the owner of this object.
  //=============================================================================
  public void AppendDependencies(KUIDList io_dependencies)
  {
    // For each configured consist
    int consistIndex;
    for (consistIndex = 0; consistIndex < m_consists.size(); ++consistIndex)
    {
      // Get the consist info
      ConsistHelperInfo consist = m_consists[consistIndex];

      // Add the driver
      KUID driverKuid = consist.GetDriverKUID();
      if (driverKuid)
        io_dependencies.AddKUID(driverKuid);

      // Add the commands
      consist.GetDriverCommands().AppendDependencies(io_dependencies);

      // Add the vehicles
      int vehicleIndex;
      for (vehicleIndex = 0; vehicleIndex < consist.vehicles.size(); ++vehicleIndex)
        io_dependencies.AddKUID(consist.vehicles[vehicleIndex].vehicle);
    }
  }
};

