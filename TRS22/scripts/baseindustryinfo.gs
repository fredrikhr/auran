//=============================================================================
// Name: BaseIndustryInfo.gs
// Desc: 
//=============================================================================
include "HTMLPropertyHandler.gs"
include "BaseIndustry.gs"
include "Log.gs"



//=============================================================================
// Name: BaseIndustryInfo
// Desc: This class is a property handler for BaseIndustry that allows industry
//       attributes like queues, products and processes to be set through the
//       industry's property edit window in Surveyor.
//=============================================================================
class BaseIndustryInfo isclass HTMLPropertyHandler
{
  public BaseIndustry industry;  // Industry this handler is associated with.


  //=============================================================================
  // Name: GetDescriptionHTML
  // Desc: Gets a description of this industry as a HTML page to be displayed to
  //       a Surveyor properties window. The displayed html allows editing of the
  //       process consumption rates and initial product amounts.
  //=============================================================================
  public string GetDescriptionHTML(void)
  {
    StringTable strTable = Constructors.GetTrainzStrings();

    // Use the industry name as a heading.
    string retString = "<p><b><font size=3>" + BrowserInterface.Quote(industry.GetLocalisedName()) + "</font></b></p>";

    string consumeList = "";
    string produceList = "";

    int k;
    int i;

    // Loop through all the processes
    for (k = 0; k < industry.industryProductInfoCollection.ipicCollection.size(); k++)
    {
      IndustryProductInfoComplete ipic = industry.industryProductInfoCollection.ipicCollection[k];

      for (i = 0; i < ipic.processes.size(); i++)
      {
        IndustryProductInfoProcess ipip = ipic.processes[i];
        if (ipip.DoesUseInputForSurveyor() and ipip.GetVisibleInSurveyor(true))
        {
          retString = retString + "<b>" + strTable.GetString1("interface-baseindustryinfo-html0", (int)ipip.GetProcessDuration()) + "</b>";
          retString = retString + "<table><tr><td width=10></td><td width=64></td><td></td><td><b>" + strTable.GetString("interface-common-html0") + "</b></td>";
          retString = retString + "<td><b>" + strTable.GetString("interface-common-html1") + "</b></td></tr>";
          retString = retString + HTMLWindow.GetInputOutputPropertyHTMLCode(me, ipip.GetProcessName(), ipip.GetInputQueue().GetProductQueue(), ipic.GetProduct(), (string)k, true);
          retString = retString + "</table><BR>";
        }
      }
    }

    for (k = 0; k < industry.industryProductInfoCollection.ipicCollection.size(); k++)
    {
      IndustryProductInfoComplete ipic = industry.industryProductInfoCollection.ipicCollection[k];
      for (i = 0; i < ipic.processes.size(); i++)
      {
        IndustryProductInfoProcess ipip = ipic.processes[i];
        if (ipip.DoesUseOutputForSurveyor() and ipip.GetVisibleInSurveyor(false))
        {
          retString = retString + "<b>" + strTable.GetString1("interface-baseindustryinfo-html1", (int)ipip.GetProcessDuration()) + "</b>";
          retString = retString + "<table><tr><td width=10></td><td width=64></td><td></td><td><b>" + strTable.GetString("interface-common-html0") + "</b></td>";
          retString = retString + "<td><b>" + strTable.GetString("interface-common-html1") + "</b></td></tr>";
          retString = retString + HTMLWindow.GetInputOutputPropertyHTMLCode(me, ipip.GetProcessName(), ipip.GetOutputQueue().GetProductQueue(), ipic.GetProduct(), (string)k, false);
          retString = retString + "</table><BR>";
        }
      }
    }

    return retString;

  }


  //=============================================================================
  // Name: GetPropertyName
  // Desc: Returns the readable localised name for the given editable property.
  //       Note: Returned names are sourced from the base "Core Strings" asset.
  //=============================================================================
  public string GetPropertyName(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    bool isInitialCount = false;
    bool isConsuming = false; // else producing
    string type = "";

    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
      isConsuming = true;
    }
    else if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
      isConsuming = false;
    }
    else if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    else if (PropMatchesPrefix(propertyID, "ouitial-count/"))
    {
      type = "ouitial-count/";
      propertyID = PropStripPrefix(propertyID, "ouitial-count/");
      isInitialCount = true;
    }


    int productIndex = Str.ToInt(propertyID);

    if (productIndex >= 0 and productIndex < industry.industryProductInfoCollection.ipicCollection.size())
    {
      Asset productAsset = industry.industryProductInfoCollection.ipicCollection[productIndex].GetProduct();
      if (productAsset)
      {
        string productName = productAsset.GetLocalisedName();

        if (isInitialCount)
          return strTable.GetString1("interface-industryinfo-name0", productName);

        if (isConsuming)
          return strTable.GetString1("interface-industryinfo-name1", productName);

        return strTable.GetString1("interface-industryinfo-name2", productName);
      }
    }

    // Unknown property, fall through to base functionality.
    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Returns the readable localised description for the given editable
  //       property. Note: The returned descriptions are sourced from the base
  //       "Core Strings" asset.
  //=============================================================================
  public string GetPropertyDescription(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    bool isInitialCount = false;
    bool isConsuming = false; // else producing
    string type = "";

    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
      isConsuming = true;
    }
    else if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
      isConsuming = false;
    }
    else if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    else if (PropMatchesPrefix(propertyID, "ouitial-count/"))
    {
      type = "ouitial-count/";
      propertyID = PropStripPrefix(propertyID, "ouitial-count/");
      isInitialCount = true;
    }

    int productIndex = Str.ToInt(propertyID);

    if (productIndex >= 0 and productIndex < industry.industryProductInfoCollection.ipicCollection.size())
    {
      Asset productAsset = industry.industryProductInfoCollection.ipicCollection[productIndex].GetProduct();
      if (productAsset)
      {
        string productName = productAsset.GetLocalisedName();

        if (isInitialCount)
          return strTable.GetString1("interface-industryinfo-name0", productName);

        if (isConsuming)
          return strTable.GetString1("interface-industryinfo-name1", productName);

        return strTable.GetString1("interface-industryinfo-name2", productName);
      }
    }

    // Unknown property, fall through to base functionality.
    return inherited(propertyID);
  }


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Returns the "type" of the given editable property, so that Trainz can
  //       display an appropriate edit interface.
  //=============================================================================
  public string GetPropertyType(string propertyID)
  {
    string type = "";
    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
    }
    else if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
    }
    else if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
    }
    else if (PropMatchesPrefix(propertyID, "ouitial-count/"))
    {
      type = "ouitial-count/";
      propertyID = PropStripPrefix(propertyID, "ouitial-count/");
    }

    if (type != "")
    {
      // Find the separating slash to get the product index.
      int productIndex = -1;
      int i;
      for (i = 0; i < propertyID.size(); i++)
      {
        if (propertyID[i] == '/')
        {
          productIndex = Str.ToInt(propertyID[0, i]);
          propertyID[0, i + 1] = null;
          break;
        }
      }

      int processIndex = Str.ToInt(propertyID);

      IndustryProductInfoComplete ipic = industry.industryProductInfoCollection.ipicCollection[productIndex];
      IndustryProductInfoProcess ipip = ipic.processes[processIndex];

      ProductQueue queue;
      if (type == "input-amount/" or type == "initial-count/")
        queue = ipip.GetInputQueue().GetProductQueue();
      else if (type == "output-amount/" or type == "ouitial-count/")
        queue = ipip.GetOutputQueue().GetProductQueue();

      if (queue)
      {
        // All our properties are integer product amounts. Allow any value from 0
        // up to the queue size.
        string ret = "int,0," + (string)queue.GetQueueSize() + ",10";
        return ret;
      }
    }

    // Unknown property, fall through to base functionality.
    return inherited(propertyID);
  }


  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of one of out editable properties.
  //=============================================================================
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string type = "";
    bool isInitialCount = false;

    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
    }
    else if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
    }
    else if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    else if (PropMatchesPrefix(propertyID, "ouitial-count/"))
    {
      type = "ouitial-count/";
      propertyID = PropStripPrefix(propertyID, "ouitial-count/");
      isInitialCount = true;
    }


    if (type != "")
    {
      int productIndex = -1;

      // Find the separating slash to get the product index.
      int i;
      for (i = 0; i < propertyID.size(); i++)
      {
        if (propertyID[i] == '/')
        {
          productIndex = Str.ToInt(propertyID[0, i]);
          propertyID[0, i + 1] = null;
          break;
        }
      }

      int processIndex = Str.ToInt(propertyID);

      IndustryProductInfoComplete ipic = industry.industryProductInfoCollection.ipicCollection[productIndex];
      IndustryProductInfoProcess ipip = ipic.processes[processIndex];

      ProductQueue queue;
      if (type == "input-amount/" or type == "initial-count/")
        queue = ipip.GetInputQueue().GetProductQueue();
      else if (type == "output-amount/" or type == "ouitial-count/")
        queue = ipip.GetOutputQueue().GetProductQueue();

      if (isInitialCount)
      {
        // We use value.AsInt() instead of theValue, as initial amount should
        // not be affected by the process duration.
        if (type == "initial-count/")
        {
          ipip.GetInputIPIQ().SetInitialAmount(value.AsInt());
          return;
        }

        if (type == "ouitial-count/")
        {
          ipip.GetOutputIPIQ().SetInitialAmount(value.AsInt());
          return;
        }
      }
      else
      {
        string processName = ipic.processes[processIndex].GetProcessName();
        Asset asset = ipic.GetProduct();

        if (type == "input-amount/")
        {
          industry.SetProcessInput(processName, queue, asset, value.AsInt());
          ipic.processes[processIndex].SetInputAmount(value.AsInt());
          return;
        }

        if (type == "output-amount/")
        {
          industry.SetProcessOutput(processName, queue, asset, value.AsInt());
          ipic.processes[processIndex].SetOutputAmount(value.AsInt());
          return;
        }
      }
    } // if (type != "")


    // Unknown property, fall through to base functionality.
    inherited(propertyID, value);
  }


  //=============================================================================
  // Name: GetPropertyValue
  // Desc: Gets the value of the named property as a string.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will return what the handlers
  //       HTMLPropertyHandler::GetPropertyValue() method does. Otherwise, an
  //       empty string will be returned as a default.
  // Parm: propertyID - ID of the property to set the value of.
  // Retn: string - A string representation of the current value of the property,
  //       or an empty string if there is no such value or no valid conversion.
  //=============================================================================
  public string GetPropertyValue(string propertyID)
  {
    string type = "";
    bool isInitialCount = false;

    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
    }
    else if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
    }
    else if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    else if (PropMatchesPrefix(propertyID, "ouitial-count/"))
    {
      type = "ouitial-count/";
      propertyID = PropStripPrefix(propertyID, "ouitial-count/");
      isInitialCount = true;
    }


    if (type != "")
    {
      int productIndex = -1;

      // Find the separating slash.
      int i;
      for (i = 0; i < propertyID.size(); i++)
      {
        if (propertyID[i] == '/')
        {
          productIndex = Str.ToInt(propertyID[0, i]);
          propertyID[0, i + 1] = null;
          break;
        }
      }

      int processIndex = Str.ToInt(propertyID);

      IndustryProductInfoComplete ipic = industry.industryProductInfoCollection.ipicCollection[productIndex];
      IndustryProductInfoProcess ipip = ipic.processes[processIndex];
      ProductQueue queue;
      string processName = ipic.processes[processIndex].GetProcessName();
      Asset asset = ipic.GetProduct();

      if (type == "input-amount/" or type == "initial-count/")
        queue = ipip.GetInputQueue().GetProductQueue();
      if (type == "output-amount/" or type == "ouitial-count/")
        queue = ipip.GetOutputQueue().GetProductQueue();

      string rtn;

      if (isInitialCount)
      {
        // We use value.AsInt() instead of theValue, as initial amount should
        // not be affected by the process duration.
        if (type == "initial-count/")
          rtn = ipip.GetInputIPIQ().GetInitialAmount();
        else if (type == "ouitial-count/")
          rtn = (string)ipip.GetOutputIPIQ().GetInitialAmount();
      }
      else
      {
        if (type == "input-amount/")
          rtn = ipic.processes[processIndex].GetInputAmount();
        else if (type == "output-amount/")
          rtn = ipic.processes[processIndex].GetInputAmount();
      }

      //Interface.Log("BaseIndustryInfo.GetPropertyValue> " + propertyID + " = " + rtn);
      return rtn;

    } // if (type != "")


    // Unknown property, fall through to base functionality.
    return inherited(propertyID);
  }


};


