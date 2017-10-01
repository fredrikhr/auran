//
// PortalTunnelInfo.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "HTMLPropertyHandler.gs"
include "PortalTunnel.gs"
include "common.gs"
include "ConsistListHelper.gs"
include "TrainHelperInfo.gs"


//
//
//
class PortalTunnelInfo isclass HTMLPropertyGroup
{
  PortalTunnel hostPortal;
	
	bool m_produce = false;
	bool m_consume = true;
	bool m_regurgitate = false;
	bool m_regurgitateAlternatePortal = false;
	int m_produceTime = 15;
	int m_regurgitateTime = 5;
	string m_regurgitateAlternatePortalName = "none";
	int m_regurgitateAction = 0;

	ConsistListHelper m_consistList;
	TrainHelperInfo m_consumptionFilter;


  public bool GetProduce(void)         { return m_produce; }
  public bool GetConsume(void)         { return m_consume; }
  public bool GetRegurgitate(void)     { return m_regurgitate; }
  public bool GetRegurgAltPortal(void) { return m_regurgitateAlternatePortal; }

  public int  GetProduceTime(void)     { return m_produceTime; }
  public int  GetRegurgitateTime(void) { return m_regurgitateTime; }


  // 
  // Properties methods
  //

	public void Init(PortalTunnel a_hostPortal)
	{
		hostPortal = a_hostPortal;
		
		m_consistList = new ConsistListHelper();
		AddHandler(m_consistList, "consist-list/");

		m_consumptionFilter = new TrainHelperInfo();
		m_consumptionFilter.Init();
		AddHandler(m_consumptionFilter, "consumption-filter/");
	}


  //
  //
  //
	public string GetDescriptionHTML(void)
	{
    StringTable strTable    = hostPortal.GetAsset().GetStringTable();
    StringTable coreStrings = Constructors.GetTrainzStrings();


		string body = "<p><b><font size=3 color=#000000>" + hostPortal.GetLocalisedName() + "</font></b></p>";
		body = body + "<font color=#000000>";
		
//		body = body + "<p>" + HTMLWindow.HelpButton(Link("help")) + "</p>";
		
		body = body + "<p>" + HTMLWindow.CheckBox(Link("produce"), m_produce) + 
			strTable.GetString("html_portal_produce_new_trains") +  "</p>";
		
		if (m_produce)
		{
			body = body + HTMLWindow.StartIndent(20);

			// production schedule
			body = body + "<p>" + strTable.GetString("html_portal_produce_trains_every") + HREF("produce-time") + 
                            m_produceTime + strTable.GetString("") + "</a>.</p>";

			// consist(s)
			body = body + "<p>" + strTable.GetString("html_portal_produce_random_consist") + "</p>";

			body = body + HTMLWindow.StartIndent(20);
			body = body + m_consistList.GetDescriptionHTML();
			body = body + HTMLWindow.EndIndent();

			body = body + HTMLWindow.EndIndent();
		}

		body = body + "<p>" + HTMLWindow.CheckBox(Link("consume"), m_consume) + 
		       strTable.GetString("html_portal_produce_consume_trains") + "</p>";

		if (m_consume)
		{
			body = body + HTMLWindow.StartIndent(20);

			// consumption criteria
			//body = body + "<p>Consumes trains matching the following criteria:</p>";
			body = body + m_consumptionFilter.GetDescriptionHTML() + "<br>";

			// regurgitate
			body = body + "<p>" + HTMLWindow.CheckBox(Link("regurgitate"), m_regurgitate) +
			       strTable.GetString("html_portal_produce_return_after") + HREF("regurgitate-time") + 
             m_regurgitateTime + strTable.GetString("html_portal_produce_return_delay") + "</p>";

			if (m_regurgitate)
			{
				body = body + HTMLWindow.StartIndent(20);

				body = body + "<p>" + HTMLWindow.RadioButton(Link("reg-none"), m_regurgitateAction == 0) +
               strTable.GetString("html_portal_produce_load_none") + "</p>";

				body = body + "<p>" + HTMLWindow.RadioButton(Link("reg-load"), m_regurgitateAction == 1) +
               strTable.GetString("html_portal_produce_load_load_only") + "</p>";

				body = body + "<p>" + HTMLWindow.RadioButton(Link("reg-unload"), m_regurgitateAction == 2) +
               strTable.GetString("html_portal_produce_load_unload_only") + "</p>";

				body = body + "<p>" + HTMLWindow.RadioButton(Link("reg-toggle"), m_regurgitateAction == 3) +
               strTable.GetString("html_portal_produce_load_both") + "</p>";

				// alternative location
				string altName = BrowserInterface.Quote(m_regurgitateAlternatePortalName);
				if (m_regurgitateAlternatePortal)
					if (! cast<BasePortal> Router.GetGameObject(m_regurgitateAlternatePortalName))
						altName = "<font color=#FF0000>" + altName + "</font>";

				body = body + "<p>" + HTMLWindow.CheckBox(Link("reg-alternate"), m_regurgitateAlternatePortal) +
//					"Train returns through alternate portal '" + HREF("reg-alternate-name") + altName + "</a>'.</p>";
					strTable.GetString("html_portal_produce_portals_return") + HREF("reg-alternate-name") + altName + "</a>'.</p>";

				body = body + HTMLWindow.EndIndent();
			}

			body = body + HTMLWindow.EndIndent();
		}

		return body + "</font>";
	}


  public void SetPropertyValue(string propertyID, PropertyValue value)
	{
		if (propertyID == Prop("produce"))
		{
			m_produce = !m_produce;
		}
		else if (propertyID == Prop("consume"))
		{
			m_consume = !m_consume;
		}
		else if (propertyID == Prop("regurgitate"))
		{
			m_regurgitate = !m_regurgitate;
		}
		else if (propertyID == Prop("reg-alternate"))
		{
			m_regurgitateAlternatePortal = !m_regurgitateAlternatePortal;
		}
		else if (propertyID == Prop("reg-alternate-name"))
		{
			m_regurgitateAlternatePortalName = value.AsString();

			if (m_regurgitateAlternatePortalName == "")
			{
				m_regurgitateAlternatePortalName = "none";
				m_regurgitateAlternatePortal = false;
			}
			else
				m_regurgitateAlternatePortal = true;
		}
		else if (propertyID == Prop("reg-none"))
		{
			m_regurgitateAction = 0;
		}
		else if (propertyID == Prop("reg-load"))
		{
			m_regurgitateAction = 1;
		}
		else if (propertyID == Prop("reg-unload"))
		{
			m_regurgitateAction = 2;
		}
		else if (propertyID == Prop("reg-toggle"))
		{
			m_regurgitateAction = 3;
		}
		else if (propertyID == Prop("produce-time"))
		{
			m_produceTime = value.AsInt();
			if (m_produceTime < 1)
				m_produceTime = 1;
		}
		else if (propertyID == Prop("regurgitate-time"))
		{
			m_regurgitateTime = value.AsInt();
			if (m_regurgitateTime < 1)
				m_regurgitateTime = 1;
			m_regurgitate = true;
		}
		else
			inherited(propertyID, value);
	}

	public string GetPropertyValue(string propertyID)
	{
		if (propertyID == Prop("help"))
			return "Help goes here";

		return "";
	}
	

  public string GetPropertyType(string propertyID)
	{
		if (propertyID == Prop("produce"))
		{
			return "link";
		}
		else if (propertyID == Prop("consume"))
		{
			return "link";
		}
		else if (propertyID == Prop("regurgitate"))
		{
			return "link";
		}
		else if (propertyID == Prop("reg-alternate"))
		{
			return "link";
		}
		else if (propertyID == Prop("reg-none"))
		{
			return "link";
		}
		else if (propertyID == Prop("reg-load"))
		{
			return "link";
		}
		else if (propertyID == Prop("reg-unload"))
		{
			return "link";
		}
		else if (propertyID == Prop("reg-toggle"))
		{
			return "link";
		}
		else if (propertyID == Prop("produce-time"))
		{
			return "int,1,6000";
		}
		else if (propertyID == Prop("regurgitate-time"))
		{
			return "int,1,6000";
		}
		else if (propertyID == Prop("reg-alternate-name"))
		{
			return "string";
		}
		else if (propertyID == Prop("help"))
		{
			return "help";
		}

		return inherited(propertyID);
	}
	

  public string GetPropertyName(string propertyID)
	{
		string result = hostPortal.GetAsset().GetStringTable().GetString("propname-" + PropStripPrefix(propertyID, ""));
		if (result != "")
			return result;

		return inherited(propertyID);
	}
	

  public string GetPropertyDescription(string propertyID)
	{
		string result = hostPortal.GetAsset().GetStringTable().GetString("propdesc-" + PropStripPrefix(propertyID, ""));
		if (result != "")
			return result;

		return inherited(propertyID);
	}


	public bool ShouldConsumeTrain(Train train)
	{
		return m_consume  and  m_consumptionFilter.DoesMatch(train);
	}


	public float GetProduceTimeInSeconds(void)
	{
		if (!m_produce)
			return 0.0f;

		return m_produceTime * 60.0f;
	}


	public float GetRegurgitateTimeInSeconds(Soup consistDescriptor)
	{
		if (!m_regurgitate)
			return 0.0f;
		
		return m_regurgitateTime * 60.0f;
	}


	public string GetRegurgitateAlternatePortalName(void)
	{
		if (!m_regurgitateAlternatePortal)
			return "";

		return m_regurgitateAlternatePortalName;
	}


	public int GetRegurgitateAction(void)
	{
		return m_regurgitateAction;
	}


	public Soup GetRandomProduceConsist(void)
	{
		return m_consistList.GetRandomConsist();
	}

	
  public void SetProperties(Soup soup)
	{
		inherited(soup);

		m_produce = soup.GetNamedTagAsBool("PortalTunnelInfo.produce", m_produce);
		m_consume = soup.GetNamedTagAsBool("PortalTunnelInfo.consume", m_consume);
		m_regurgitate = soup.GetNamedTagAsBool("PortalTunnelInfo.regurgitate", m_regurgitate);
		m_regurgitateAlternatePortal = soup.GetNamedTagAsBool("PortalTunnelInfo.regurgitateAlternatePortal");
		m_produceTime = soup.GetNamedTagAsInt("PortalTunnelInfo.produceTime", m_produceTime);
		m_regurgitateTime = soup.GetNamedTagAsInt("PortalTunnelInfo.regurgitateTime", m_regurgitateTime);
		m_regurgitateAlternatePortalName = soup.GetNamedTag("PortalTunnelInfo.regurgitateAltenatePortalName");
		m_regurgitateAction = soup.GetNamedTagAsInt("PortalTunnelInfo.regurgitateAction", m_regurgitateAction);

		if (m_regurgitateAlternatePortalName == "")
		{
			m_regurgitateAlternatePortalName = "none";
			m_regurgitateAlternatePortal = false;
		}
	}
	
  public Soup GetProperties(void)
	{
		Soup soup = inherited();

		soup.SetNamedTag("PortalTunnelInfo.produce", m_produce);
		soup.SetNamedTag("PortalTunnelInfo.consume", m_consume);
		soup.SetNamedTag("PortalTunnelInfo.regurgitate", m_regurgitate);
		soup.SetNamedTag("PortalTunnelInfo.regurgitateAlternatePortal", m_regurgitateAlternatePortal);
		soup.SetNamedTag("PortalTunnelInfo.produceTime", m_produceTime);
		soup.SetNamedTag("PortalTunnelInfo.regurgitateTime", m_regurgitateTime);
		soup.SetNamedTag("PortalTunnelInfo.regurgitateAltenatePortalName", m_regurgitateAlternatePortalName);
		soup.SetNamedTag("PortalTunnelInfo.regurgitateAction", m_regurgitateAction);

		return soup;
	}


  //=============================================================================
  // Name: AppendDependencies
  // Desc: Called from PortalTunnel.AppendDependencies()
  //=============================================================================
  public void AppendDependencies(KUIDList io_dependencies)
  {
    m_consistList.AppendDependencies(io_dependencies);
  }

};
