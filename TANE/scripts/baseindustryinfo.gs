//
// BaseIndustryInfo.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "HTMLPropertyHandler.gs"
include "BaseIndustry.gs"
include "Log.gs"


//! Property handler for the BaseIndustry class.
//
// This class is a property handler for BaseIndustry that allows industry attributes like queues,
// products and processes to be set through the industry's properties window.
//
// Note:
//     This class has only recently become a subclass of HTMLPropertyHandler, and does not yet 
//     support prefix naming.  
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class 
//     definition and implementation however can be found in the <b \Trainz\scripts\BaseIndustryInfo.gs>
//     script file.  Extensive comments were done for this class but due it since being converted to
//     a property handler and the transfer of the actual data to the IndustryProductInfoComplete class,
//     the comments in the source file are out of date.  It is best to rely on the actual script 
//     implementation and not the main method comments in the source file.
//
// See Also:
//     BaseIndustry, IndustryProductInfoComplete, IndustryProductInfoCollection
//
class BaseIndustryInfo isclass HTMLPropertyHandler
{
	public BaseIndustry industry;  //! Industry this handler is associated with.


  //
  // PropertyObject methods
  //

  //! Gets a description of this industry as a HTML page to be displayed to a Surveyor properties window.
  //
  // This method overrides PropertyObject::GetDescriptionHTML() so that all the processes along
  // with the products they consume and produce are listed such that the initial value and 
  // consumption/production rate can be edited for every single process through property links.
  //
  // Returns:
  //     Returns a HTML description of this industry listing all the processes and their respective
  //     consumption and production rates and initial defaults.
  //
  public string GetDescriptionHTML(void)
  {
    StringTable strTable = Constructors.GetTrainzStrings();

    string retString;
    retString = "<font color=#FFFFFF>";
    retString = retString + "<p><b><font size=3 color=#FFFFFF>" + BrowserInterface.Quote(industry.GetLocalisedName()) + "</font></b></p>";

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
          retString = retString + "<table><tr><td width=10></td><td width=64></td><td></td><td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html0") + "</b></font></td>";
          retString = retString + "<td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html1") + "</b></font></td></tr>";
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
          retString = retString + "<table><tr><td width=10></td><td width=64></td><td></td><td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html0") + "</b></font></td>";
          retString = retString + "<td><font color=#FFFFFF><b>" + strTable.GetString("interface-common-html1") + "</b></font></td></tr>";
          retString = retString + HTMLWindow.GetInputOutputPropertyHTMLCode(me, ipip.GetProcessName(), ipip.GetOutputQueue().GetProductQueue(), ipic.GetProduct(), (string)k, false);
          retString = retString + "</table><BR>";
        }
      }
    }

    retString = retString + "</font>";

    return retString;
  
  }


  //@ Gets a readable name of a product asset as specified by the given property name.
  //
  // Param:  propertyID  Name of the property to get a readable name for.  Must be prefixed
  //                     with <m "input-amount/">, <m "output-amount/">, <m "initial-count/">
  //                     or <m "ouitial-count/"> followed by the index of the asset in 
  //                     <l BaseIndustry::industryProductList  industryProductList> to get the 
  //                     name of.
  //                     
  //
  // Returns:
  //     Returns the string <m"Amount of &lt;name&gt;"> where <n &lt;name&gt;> is the 
  //     <l Asset::GetLocalisedName  localised name> of the product asset requested if a valid
  //     asset for it can be found, an empty string otherwise.
  //
  // See Also:
  //     Asset::GetLocalisedName()
  //
  public string GetPropertyName(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    bool isInitialCount = false;
    bool isConsuming = false;   // else producing
		string type = "";
    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
      isConsuming = true;
    }
    if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
      isConsuming = false;
    }
    if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    if (PropMatchesPrefix(propertyID, "ouitial-count/"))
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

				string ret;
				if (isInitialCount)
					ret = strTable.GetString1("interface-industryinfo-name0", productName);
				else
				{
					if (isConsuming)
						ret = strTable.GetString1("interface-industryinfo-name1", productName);
					else
						ret = strTable.GetString1("interface-industryinfo-name2", productName);
				}

				return ret;
			}
		}

    return "";
  }


  //@ Gets a readable description of a product asset as specified in the given property name.
  //
  // Param:  propertyID  Name of the property to get a readable description for.  Must be prefixed
  //                     with <m"input-amount/">, <m"output-amount/">, or <m"initial-count/">
  //                     followed by the index of the product in 
  //                     <l BaseIndustry::industryProductList  industryProductList> to get the description of.
  //
  // Returns:
  //     If <m"initial-count/"> is requested, the string <m"Initial Amount of &lt;name&gt;"> is
  //     returned, where <n &lt;name&gt;> is the <l Asset::GetLocalisedName  localised name> of the
  //     product asset requested.
  //
  //     When <m"input-amount/"> or <m"output-amount/">, one of two possible strings is returned,
  //     either <m"Amount of &lt;name&gt; to consume"> or <m"Amount of &lt;name&gt; to produce">,
  //     depending on the <l IndustryProductInfo::isInput  isInput> flag for the indexed product.
  //
  //     An empty string will be returned otherwise.
  //
  // See Also:
  //     Asset::GetLocalisedName()
  //
  public string GetPropertyDescription(string propertyID)
  {
    StringTable strTable = Constructors.GetTrainzStrings();
    bool isInitialCount = false;
    bool isConsuming = false;   // else producing
		string type = "";
		
    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
      isConsuming = true;
    }
    if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
      isConsuming = false;
    }
    if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    if (PropMatchesPrefix(propertyID, "ouitial-count/"))
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

				string ret;
				if (isInitialCount)
					ret = strTable.GetString1("interface-industryinfo-name0", productName);
				else
				{
					if (isConsuming)
						ret = strTable.GetString1("interface-industryinfo-name1", productName);
					else
						ret = strTable.GetString1("interface-industryinfo-name2", productName);
				}

				return ret;
			}
		}

    return "";
  }


  //@ Gets the type of the named property.
  //
  // Param:  propertyID  Name of the property to get the type for.  Must be prefixed with <m "input-amount/">,
  //                     <m "output-amount/">, <m "initial-count/"> or <m "ouitial-count/"> followed by a valid
  //                     index value for the <l IndustryProductInfoCollection::ipicCollection  ipicCollection>
  //                     array of the industry's <l BaseIndustry::industryProductInfoCollection  product info collection>.
  //
  // Returns:
  //     If <i propertyID> refers to a valid property for this industry (i.e. correct prefix name and array
  //     index), <m "int,0,&lt;queue size&gt;,10"> is returned.  This indicates that the property value is an
  //     integer in the range of 0 to its <l IndustryProductInfo::queue  queue's> maximum size and edited in 
  //     increments of 10.  An empty string will be returned otherwise.
  //
  // See Also:
  //     ProductQueue::GetQueueSize()
  //
  public string GetPropertyType(string propertyID)
  {
    string type = "";
    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
    }
    if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
    }
    if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
    }
    if (PropMatchesPrefix(propertyID, "ouitial-count/"))
    {
      type = "ouitial-count/";
      propertyID = PropStripPrefix(propertyID, "ouitial-count/");
    }

		Interface.Log("DEBUG: GetPropertyType(" + propertyID + ") Type: '" + type + "'");

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

      ProductQueue queue;
      IndustryProductInfoComplete ipic = industry.industryProductInfoCollection.ipicCollection[productIndex];
      IndustryProductInfoProcess ipip = ipic.processes[processIndex];
      if (type == "input-amount/" or type == "initial-count/")
        queue = ipip.GetInputQueue().GetProductQueue();
      if (type == "output-amount/" or type == "ouitial-count/")
        queue = ipip.GetOutputQueue().GetProductQueue();

      if (queue)
      {
        string ret = "int,0," + (string)queue.GetQueueSize() + ",10";
        return ret;
      }
    }

    return "";
  }


  //@ Sets the value of the named property to the given int.
  //
  // There are four types different types of properties in a BaseIndustryInfo object:
  //  - process output amount
  //  - process input amount
  //  - input initial count
  //  - output queue initial count
  //
  // The properties are used to refer to a quantity of products for an industry process' input/output 
  // requirements of a certain product.  All of these properties are integer values and a set of these 
  // properties is used for each member of the <l IndustryProductInfoCollection::ipicCollection  ipicCollection>
  // array of the industry's <l BaseIndustry::industryProductInfoCollection  product info collection>.
  //
  // <l BaseIndustry::industryProductList  industryProductList>.
  // This means these properties are present for each product that this industry supports.
  //
  // The properties string will be prefixed with <m "input-amount/">, <m "output-amount/">, <m "initial-count/">,
  // <m "initial-count/"> or <m "ouitial-count/"> and after the slash, a number that corresponds to an index
  // in the <l BaseIndustry::industryProductList  industryProductList> array is required.  For example,
  // <m "initial-count/2"> refers to the initial count of the product in the 3rd position of 
  // <l BaseIndustry::industryProductList  industryProductList>.
  //
  // If <i propetyID> is <m"initial-count/&lt;x&gt;">, the initial count of the <l IndustryProductInfo::queue  queue>
  // in position <n x> of <l BaseIndustry::industryProductList  industryProductList> will have its initial
  // count set to <i value> through SetQueueInitialCount().
  //
  // When <i propertyID> is <m"input-amount/&lt;x&gt;">, the input amount per cycle for the product transfer
  // described by <l BaseIndustry::industryProductList  industryProductList> is set to <i value> by calling 
  // Industry::SetProcessInput().  The same applies for <m"input-amount/&lt;x&gt;"> except the output amount
  // per cycle will be set to <i value> by calling Industry::SetProcessOutput() instead.
  //
  // Param:  propertyID  Name of the property to set the value of.  See method description just above for
  //                     details on BaseIndustry prorpeties and what they are used for.
  // Param:  value       Value to set the property named by <i propertyID> to.  GetPropertyType()
  //                     will provide a valid range of properties.
  //
  // See Also:
  //     Industry::SetProcessInput(), Industry::SetProcessOutput()
  //
  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    string type = "";
    bool isInitialCount = false;
    if (PropMatchesPrefix(propertyID, "input-amount/"))
    {
      type = "input-amount/";
      propertyID = PropStripPrefix(propertyID, "input-amount/");
    }
    if (PropMatchesPrefix(propertyID, "output-amount/"))
    {
      type = "output-amount/";
      propertyID = PropStripPrefix(propertyID, "output-amount/");
    }
    if (PropMatchesPrefix(propertyID, "initial-count/"))
    {
      type = "initial-count/";
      propertyID = PropStripPrefix(propertyID, "initial-count/");
      isInitialCount = true;
    }
    if (PropMatchesPrefix(propertyID, "ouitial-count/"))
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

      if (isInitialCount)
      {
        // we use value.AsInt() instead of theValue, as Initial Amount should not be affected by the process duration.
        if (type == "initial-count/")
          ipip.GetInputIPIQ().SetInitialAmount(value.AsInt());
        if (type == "ouitial-count/")
          ipip.GetOutputIPIQ().SetInitialAmount(value.AsInt());
      }
      else
      {
        if (type == "input-amount/")
        {
          industry.SetProcessInput(processName, queue, asset, value.AsInt());
          ipic.processes[processIndex].SetInputAmount(value.AsInt());
        }
        if (type == "output-amount/")
        {
          industry.SetProcessOutput(processName, queue, asset, value.AsInt());
          ipic.processes[processIndex].SetOutputAmount(value.AsInt());
        }
      }
    }

  }
};

