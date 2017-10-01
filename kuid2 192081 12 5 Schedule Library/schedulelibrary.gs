include "ScenarioBehavior.gs"
include "World.gs"
include "Browser.gs"


//
// schedulelibrary
//
// This rule allows the scenario-designer to assign Drivers to Vehicles. The drivers are created
// whenever this rule becomes un-paused (usually at the beginning of the Driver session.).
//
class schedulelibrary isclass ScenarioBehavior
{
  string[] libName;  // array of names
  int[] libGroupName;  // array of group names of commands
  DriverCommands[] driverCommands;
  string[] groupsName;  // array of group names
  bool[] groupsOpen;
  
  //
  // ScenarioBehavior methods
  //

  public void Init(Asset p_self)
  {
    inherited(p_self);
    libName = new string[0];
    libGroupName = new int[0];
    groupsName = new string[0];
    groupsOpen = new bool[0];
    driverCommands = new DriverCommands[0];
  }
  public void Pause(bool paused)
  {
    if (paused == IsPaused())
      return;
    
    SetStateFlags(PAUSED, paused);
  }


  //
  // PropertyObject methods
  // 

  public void SetProperties(Soup soup)
  {
    inherited(soup);
Interface.Log ("schedulelibrary::SetProperties()");
    
    //
    // Clear any existing data
    //
    libName = new string[0];
    driverCommands = new DriverCommands[0];
    libGroupName = new int[0];
    groupsName = new string[0];
    groupsOpen = new bool[0];

    Soup groups = soup.GetNamedSoup("groups");
    
    int i, count = groups.CountTags();
    for (i = 0; i < count; i++)
    {
      groupsName[i] = groups.GetNamedTag("name"+i);
      groupsOpen[i] =false;
    }

    Soup libs = soup.GetNamedSoup("library");
    
    count = libs.CountTags();
    for (i = 0; i < count; i++)
    {
      Soup dataInfo = libs.GetNamedSoup((string)i);
      libName[i] = dataInfo.GetNamedTag("name");
      libGroupName[i] = dataInfo.GetNamedTagAsInt("group",-1);
      if (libGroupName[i]<0 or libGroupName[i]>=groupsName.size())
      	libGroupName[i]=-1;
  
      Soup driverCommandsProperties = dataInfo.GetNamedSoup("driver-commands");
      driverCommands[i] = Constructors.NewDriverCommands();
      driverCommands[i].SetProperties(driverCommandsProperties);
    }
  }

  public Soup GetProperties(void)
  {
    Soup soup = inherited();
//Interface.Log ("schedulelibrary::GetProperties()");

    Soup libs = Constructors.NewSoup();
    int i, count = libName.size();
    for (i = 0; i < count; i++)
    {
      Soup dataInfo = Constructors.NewSoup();
      dataInfo.SetNamedTag("name", libName[i]);
      dataInfo.SetNamedTag("group", libGroupName[i]);

      Soup driverCommandsProperties = driverCommands[i].GetProperties();
      dataInfo.SetNamedSoup("driver-commands", driverCommandsProperties);

      libs.SetNamedSoup((string)i, dataInfo);

    }
    soup.SetNamedSoup("library", libs);

    Soup groups = Constructors.NewSoup();
    count = groupsName.size();
    for (i = 0; i < count; i++)
    {
      groups.SetNamedTag("name"+i, groupsName[i]);
    }
    soup.SetNamedSoup("groups", groups);
    return soup;
  }


  public string GetDescriptionHTML(void)
  {
    StringTable strTable = GetAsset().GetStringTable();
	string text = "<br><table width=100%>";
    int i,g,gc;

    if (libName.size() == 0)
      text = strTable.GetString("html_warning_1") + "<br>"+text;

    for (gc=0;gc<=groupsName.size();gc++)
    {
    	if (gc<groupsName.size())
    		g=gc;
    	else
    		g=-1;

		string bgcolorG;
		if (g % 2)
			bgcolorG = "#DDDDDD90";
		else
		    bgcolorG = "#FFFFBB90";
    	if (g>=0)
    	{
		      string name = groupsName[g];
		      string o;
		      if (groupsOpen[g])
		      {
		      	o="<a href=live://property/gclose/"+g+"><img src=img/open.tga></a>";
		      }
		      else
		      {
		      	o="<a href=live://property/gopen/"+g+"><img src=img/close.tga></a>";
		      }
		      
		      if (!name or name.size() == 0)
		        name = strTable.GetString("html_description_not_named");
		      else
		        name = BrowserInterface.Quote(name);

		      text = text + 
		        "<tr bgcolor="+bgcolorG+">" +
		          "<td><font color=#000000>" + o +
		            "<a href=live://property/gname/" + ((string)g) + ">" + 
		              name +
		            "</a>" +
		          "</font></td>" +
		          "<td width=5></td>" + 
		          "<td><font color=#000000>" + 
		            "<a href=live://property/gremove/" + ((string)g) + ">" +
		              strTable.GetString("html_description_lib_remove") +
		            "</a>" +
		          "</font></td>" + 
		        "</tr>";
		     text = text + "<tr bgcolor="+bgcolorG+"><td colspan=3><table width=100%>";
    	}
    	if (g<0 or groupsOpen[g])
    	{
		    for (i = 0; i < libName.size(); i++)
		    {
		      if (libGroupName[i]==g)
		      {
			      string name = libName[i];
			      
			      if (!name or name.size() == 0)
			        name = strTable.GetString("html_description_not_named");
			      else
			        name = BrowserInterface.Quote(name);
			      
			      string bgcolor;
			      if (i % 2)
			        bgcolor = "#DDDDDD80";
			      else
			        bgcolor = "#FFFFBB80";
			
			      text = text + 
			        "<tr bgcolor="+bgcolor+">" +
			          "<td><font color=#000000>" + 
			            "<a href=live://property/name/" + ((string)i) + ">" + 
			              name +
			            "</a>" +
			          "</font></td>" +
			          "<td width=5></td>" + 
			          "<td><font color=#000000>" + 
			            "<a href=live://property/remove/" + ((string)i) + ">" +
			              strTable.GetString("html_description_lib_remove") +
			            "</a>&nbsp;|&nbsp;" +
			            "<a href=live://property/copy/" + ((string)i) + ">" +
			              strTable.GetString("html_description_lib_copy") +
			            "</a>&nbsp;|&nbsp;" +
			            "<a href=live://property/move/" + ((string)i) + ">" +
			              strTable.GetString("html_description_lib_move") +
			            "</a>" +
			          "</font></td>" + 
			        "</tr>";
			      
			
			      text = text + "<tr bgcolor="+bgcolor+"><td colspan=3><trainz-object style='driver-order-bar' width=100% height=80 id='dcb"
			        + (string)i + "'></trainz-object></td></tr>";
		      }
		    }
		}
    	if (g>=0)
    	{
		     text = text + "</table></td></tr>";
    	}
    }

    text = text + "</table>";
    
    text = text + "<a href=live://property/add-object>"+strTable.GetString("html_description_add_lib")+"</a>&nbsp;|&nbsp";
    text = text + "<a href=live://property/add-group>"+strTable.GetString("html_description_add_group")+"</a><br>";

    return  "<html><body><font color=#000000>" + strTable.GetString("html_description") +"<br>"+ text + "<br><br>(For usage tips visit my web pages http://www.js-home.org/trainz)<br><br></font></body></html>";
  }


  public void PropertyBrowserRefresh(Browser browser)
  {
    inherited(browser);
    
    int i;
    for (i = 0; i < driverCommands.size(); i++)
      browser.SetElementObjectProperty("dcb" + (string)i, "driver-commands", cast<object> driverCommands[i]);
  }
  
  
  string GetPropertyName(string propertyID)
  {
    StringTable strTable = GetAsset().GetStringTable();
  
    if (propertyID == "add-object")
      return strTable.GetString("str_property_name1");
      
    if (propertyID == "add-group")
      return strTable.GetString("str_property_name2");
    
    if (propertyID[0, 5] == "name/")
      return strTable.GetString("str_property_name1");

    if (propertyID[0, 6] == "gname/")
      return strTable.GetString("str_property_name2");

    if (propertyID[0, 5] == "move/")
      return strTable.GetString("str_property_name2");

    return "<null>";
  }


  string GetPropertyDescription(string propertyID)
  {
    StringTable strTable = GetAsset().GetStringTable();

    if (propertyID == "add-object")
      return strTable.GetString("str_property_desc1");

    if (propertyID == "add-group")
      return strTable.GetString("str_property_desc2");

    if (propertyID[0, 5] == "name/")
      return strTable.GetString("str_property_desc1");

    if (propertyID[0, 6] == "gname/")
      return strTable.GetString("str_property_desc2");

    if (propertyID[0, 5] == "move/")
      return strTable.GetString("str_property_desc2");

    return "<null>";
  }


  string GetPropertyType(string propertyID)
  {
    if (propertyID == "add-object")
      return "string";

    if (propertyID == "add-group")
      return "string";

    if (propertyID[0, 5] == "name/")
      return "string";

    if (propertyID[0, 5] == "move/")
      return "list";

    if (propertyID[0, 6] == "gname/")
      return "string";

    return "link";
  }


  void SetPropertyValue(string propertyID, string value)
  {
    if (propertyID == "add-object")
    {
    	if (!value or value.size()==0)
    		value="entry "+(libName.size()+1);
      	libName[libName.size()] = value;
      	libGroupName[libGroupName.size()]=-1;
      	driverCommands[driverCommands.size()] = Constructors.NewDriverCommands();
      	return;
    }
    else if (propertyID == "add-group")
    {
    	if (!value or value.size()==0)
    		value="group "+(groupsName.size()+1);
      	groupsName[groupsName.size()] = value;
      	groupsOpen[groupsOpen.size()] = true;
      	return;
    }
    else if (propertyID[0, 5] == "name/")
    {
      string strIndex = propertyID;
      strIndex[0, 5] = null;
      int index = Str.ToInt(strIndex);

      libName[index] = value;
    }
    else if (propertyID[0, 6] == "gname/")
    {
      string strIndex = propertyID;
      strIndex[0, 6] = null;
      int index = Str.ToInt(strIndex);

      groupsName[index] = value;
    }
  }

  string GetPropertyValue(string propertyID)
  {
  	string value="";
    if (propertyID == "add-object")
    {
  		value="entry "+(libName.size()+1);
    }
    else if (propertyID == "add-group")
    {
  		value="group "+(groupsName.size()+1);
    }
    else if (propertyID[0, 5] == "name/")
    {
      string strIndex = propertyID;
      strIndex[0, 5] = null;
      int index = Str.ToInt(strIndex);

      value=libName[index];
    }
    else if (propertyID[0, 6] == "gname/")
    {
      string strIndex = propertyID;
      strIndex[0, 6] = null;
      int index = Str.ToInt(strIndex);

      value=groupsName[index];
    }
   	return value;
  }


  void SetPropertyValue(string propertyID, string value, int valueIndex)
  {
    if (propertyID[0,5]=="move/")
    {
      	string strIndex = propertyID;
      	strIndex[0, 5] = null;
		int index = Str.ToInt(strIndex);
		libGroupName[index]=valueIndex;
		groupsOpen[valueIndex]=true;
	}
  }


  void LinkPropertyValue(string propertyID)
  {
    if (propertyID[0, 7] == "remove/")
    {
      string strIndex = propertyID;
      strIndex[0, 7] = null;
      int index = Str.ToInt(strIndex);

      libName[index, index+1] = null;
      libGroupName[index, index+1] = null;
      driverCommands[index, index+1] = null;
    }
    else if (propertyID[0,5]=="copy/")
    {
      	string strIndex = propertyID;
      	strIndex[0, 5] = null;
		int index = Str.ToInt(strIndex);

		libName[libName.size()] = libName[index]+" copy";
		libGroupName[libGroupName.size()] = -1;
		DriverCommands dcd=Constructors.NewDriverCommands();
		DriverScheduleCommand [] dsc=driverCommands[index].GetDriverScheduleCommands();

		int j,dscCount=dsc.size();
		for(j=0;j<dscCount;j++)
		{
			DriverScheduleCommand w_dsc=dsc[j];
			DriverCommand w_dc=w_dsc.GetDriverCommand();
			Soup soup = w_dsc.GetProperties();

			DriverScheduleCommand cmd = w_dc.CreateScheduleCommand(null, soup);
			dcd.AddDriverScheduleCommand(cmd);
		}
      	driverCommands[driverCommands.size()] = dcd;
	}
    else if (propertyID[0, 8] == "gremove/")
    {
      string strIndex = propertyID;
      strIndex[0, 8] = null;
      int index = Str.ToInt(strIndex);
      int i;
      for(i=0;i<libGroupName.size();i++)
      {
      	if (libGroupName[i]==index)
	  		libGroupName[i]=-1;
	  	else if (libGroupName[i]>index)
	  		libGroupName[i]--;
      }
      groupsName[index, index+1] = null;
      groupsOpen[index, index+1] = null;
    }
    else if (propertyID[0, 6] == "gopen/")
    {
      string strIndex = propertyID;
      strIndex[0, 6] = null;
      int index = Str.ToInt(strIndex);
      groupsOpen[index] = true;
    }
    else if (propertyID[0, 7] == "gclose/")
    {
      string strIndex = propertyID;
      strIndex[0, 7] = null;
      int index = Str.ToInt(strIndex);
      groupsOpen[index] = false;
    }
  }


  public string[] GetPropertyElementList(string propertyID)
  {
    string[] ret = new string[0];
    if (propertyID[0,5]=="move/")
    {
      	string strIndex = propertyID;
      	strIndex[0, 5] = null;
		int index = Str.ToInt(strIndex);

		int j;
		for(j=0;j<groupsName.size();j++)
		{
			ret[j]=groupsName[j];
		}
	}
    return ret;
  }

  public string[] GetEntries(void)
  {
    string[] ret = new string[0];
    int i;
    for (i = 0; i < libName.size(); i++)
    {
      	ret[i] = libName[i];
    }
    return ret;
  }

  public void AppendDependencies(KUIDList io_dependencies)
  {
    inherited(io_dependencies);
    
/*    int i;
    for (i = 0; i < driverKuid.size(); i++)
    {
      io_dependencies.AddKUID(driverKuid[i]);
      driverCommands[i].AppendDependencies(io_dependencies);
    } */
  }
  //=============================================================================
  // Name: GetChildRelationshipIcon
  // Desc: Get an icon style for a childs relationship to its parent
  //=============================================================================
  public string GetChildRelationshipIcon(ScenarioBehavior child)
  {
    // This rule does not support children, return none
    return "none";
  }

};


