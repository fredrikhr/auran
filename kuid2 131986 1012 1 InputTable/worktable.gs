include "ScenarioBehavior.gs"
include "World.gs"
include "Browser.gs"

//
//  "WorkTable" rule is the stripped and modified version of the
//  Schedule library rule written by Brummfondel.  Hence, this person receives
//  the full.
//
class WorkTable isclass ScenarioBehavior
{
  string[] libName;  // array of vehicles to assign drivers to

  //
  // ScenarioBehavior methods
  //

  public void Init(Asset p_self)
  {
    inherited(p_self);
    libName = new string[0];
  }

  //
  // PropertyObject methods
  //

  public void SetProperties(Soup soup)
  {
    inherited(soup);

    //
    // Clear any existing data
    //
    libName = new string[0];

    //
    // Reload from the specified soup
    //
    Soup libs = soup.GetNamedSoup("library");

    int i, count = libs.CountTags();
    for (i = 0; i < count; i++)
    {
      libName[i] = libs.GetNamedTag((string)i);
     }
  }


  public void Pause(bool paused)
  {
    if (paused == IsPaused())
      return;

    SetStateFlags(PAUSED, paused);
  }


  public Soup GetProperties(void)
  {
    Soup soup = inherited();
//Interface.Log ("CreateTTMessage::GetProperties()");

    Soup libs = Constructors.NewSoup();
    int i, count = libName.size();
    for (i = 0; i < count; i++)
    {
      libs.SetNamedTag((string)i, libName[i]);
    }


    soup.SetNamedSoup("library", libs);
    return soup;
  }


  public string GetDescriptionHTML(void)
  {
    StringTable strTable = GetAsset().GetStringTable();
	string text = "<br><table width=100%>";
    int i;

    if (libName.size() == 0)
      text = strTable.GetString("html_warning_1") + "<br>"+text;

    for (i = 0; i < libName.size(); i++)
    {
      string name = libName[i];

      if (!name or name.size() == 0)
        name = strTable.GetString("html_description_unnamed");
      else
        name = BrowserInterface.Quote(name);

      string bgcolor;
      if (i % 2)
        bgcolor = "#DDDDDD80";
      else
        bgcolor = "#FFFFBB80";

      text = text +
        "<tr bgcolor="+bgcolor+">" +
          "<td width=320><font color=#000000>" +
            "<a href=live://property/name/" + ((string)i) + ">" +
              name +
            "</a>" +
          "</font></td>" +
          "<td width=5></td>" +
          "<td><font color=#000000>" +
            "<a href=live://property/copy/" + ((string)i) + ">" +
              "cp" +
            "</a>" +
          "</font></td>" +
          "<td><font color=#000000>" +
            "<a href=live://property/up/" + ((string)i) + ">" +
              "up" +
            "</a>" +
          "</font></td>" +
          "<td><font color=#000000>" +
            "<a href=live://property/down/" + ((string)i) + ">" +
              "dn" +
            "</a>" +
          "</font></td>" +
          "<td><font color=#000000>" +
            "<a href=live://property/remove/" + ((string)i) + ">" +
              "rm" +
            "</a>" +
          "</font></td>" +
        "</tr>";
    }

    text = text + "</table>";

    text = text + "<a href=live://property/add-object>"+strTable.GetString("html_description_addmessage")+"</a><br>";

    return  "<html><body><font color=#000000>" + strTable.GetString("html_description") +"<br>"+ text + "<br><br><br><br></font></body></html>";
  }


  string GetPropertyName(string propertyID)
  {
    StringTable strTable = GetAsset().GetStringTable();

    if (propertyID == "add-object")
      return strTable.GetString("str_property_name1");

    if (propertyID[0, 5] == "name/")
      return strTable.GetString("str_property_name1");

    return "<null>";
  }


  string GetPropertyDescription(string propertyID)
  {
    StringTable strTable = GetAsset().GetStringTable();

    if (propertyID == "add-object")
      return strTable.GetString("str_property_desc1");

    if (propertyID[0, 5] == "name/")
      return strTable.GetString("str_property_desc1");

    return "<null>";
  }


  string GetPropertyType(string propertyID)
  {
    if (propertyID == "add-object")
      return "string";

    if (propertyID[0, 5] == "name/")
      return "string";

    return "link";
  }


  void SetPropertyValue(string propertyID, string value)
  {
    if (propertyID == "add-object")
    {
    	if (!value or value.size()==0)
    		value="message "+(libName.size()+1);
      	libName[libName.size()] = value;
      	return;
    }

    if (propertyID[0, 5] == "name/")
    {
      string strIndex = propertyID;
      strIndex[0, 5] = null;
      int index = Str.ToInt(strIndex);

      libName[index] = value;
    }
  }

  string GetPropertyValue(string propertyID)
  {
  	string value="";
    if (propertyID == "add-object")
    {
  		value="message "+(libName.size()+1);
    }

    if (propertyID[0, 5] == "name/")
    {
      string strIndex = propertyID;
      strIndex[0, 5] = null;
      int index = Str.ToInt(strIndex);

      value=libName[index];
    }
   	return value;
  }


  void SetPropertyValue(string propertyID, string value, int valueIndex)
  {
  }


  void LinkPropertyValue(string propertyID)
  {
    if (propertyID[0, 7] == "remove/")
    {
      string strIndex = propertyID;
      strIndex[0, 7] = null;
      int index = Str.ToInt(strIndex);

      libName[index, index+1] = null;
    }
    if (propertyID[0, 5] == "copy/")
    {
      string strIndex = propertyID;
      strIndex[0, 5] = null;
      int index = Str.ToInt(strIndex);
      libName[libName.size()] = libName[index];
  	}

    if (propertyID[0, 3] == "up/")
    {
      string strIndex = propertyID;
      strIndex[0, 3] = null;
      int index = Str.ToInt(strIndex);
	  if(index)
	  {
      	string namePrev=libName[index-1];
      	libName[index-1] = libName[index];
      	libName[index] = namePrev;
  	  }
  	}

    if (propertyID[0, 5] == "down/")
    {
      string strIndex = propertyID;
      strIndex[0, 5] = null;
      int index = Str.ToInt(strIndex);
      int indexNext=index+1;
      if(libName.size()-indexNext)
      {
      	string nameNext=libName[index+1];
      	libName[index+1] = libName[index];
      	libName[index] = nameNext;
	  }
  	}
  }


  public string[] GetPropertyElementList(string propertyID)
  {
    string[] ret = new string[0];
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


