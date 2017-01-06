//
// ObjectiveList.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "ScenarioBehavior.gs"
include "World.gs"
include "World1.gs"
include "Browser.gs"


//
// WARNING: Don't use this class as it will be moved!
// WARNING: Don't use this class as it will be moved!
// WARNING: Don't use this class as it will be moved!
// WARNING: Don't use this class as it will be moved!
// WARNING: Don't use this class as it will be moved!
// WARNING: Don't use this class as it will be moved!
// WARNING: Don't use this class as it will be moved!
//

// Objective class is not documented and shouldn't be used or relied on.
class Objective
{
  public string name;
  public Asset asset;
  public string uniqueID;
};


// ObjectiveList class is not documented and isn't part of the API.
class ObjectiveList isclass Library
{
	public void Init(Asset asset);

	public Soup GetProperties(void);

	public void SetProperties(Soup soup);

  Objective[] objectives;

  Browser objectiveList;

	//
	// PRIVATE IMPLEMENTATION
	//
	public void Init(Asset asset)
	{
    inherited(asset);

    objectives = new Objective[0];

		AddHandler(me, "ObjectiveList", "ShowHideToggle", "ShowHideToggle");
		AddHandler(me, "Browser-Closed", "", "CloseBrowser");

    KUID kuid = GetAsset().LookupKUIDTable("button-bar");
		Asset iconAsset = GetAsset().FindAsset("icon");
    Library libButtonBar = World.GetLibrary(kuid);
    if (libButtonBar)
    {
      string[] stringParam = new string[0];
      GSObject[] objectParam = new GSObject[0];

      stringParam[stringParam.size()] = "ObjectiveListShowHideButton";
      objectParam[objectParam.size()] = me;
      objectParam[objectParam.size()] = iconAsset;
      stringParam[stringParam.size()] = "ObjectiveList";
      stringParam[stringParam.size()] = "ShowHideToggle";

      libButtonBar.LibraryCall("add-button", stringParam, objectParam);
    }

	}

	public Soup GetProperties(void)
	{
    Soup soup = inherited();

		soup.SetNamedTag("Objectives.objectiveCount", objectives.size());
    int k;
		for (k = 0; k < objectives.size(); k++)
    {
      Objective obj = objectives[k];
			Soup objSoup = Constructors.NewSoup();

			objSoup.SetNamedTag("Objective.uniqueID", obj.uniqueID);
			objSoup.SetNamedTag("Objective.name", obj.name);
      objSoup.SetNamedTag("Objective.asset", obj.asset.GetKUID());
      
      soup.SetNamedSoup("Objectives.objectives" + (string)k, objSoup);
    }
    
    return soup;
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);

		if (!soup.CountTags())
		{

		  int objectiveCount;
      int k;
		  objectiveCount = soup.GetNamedTagAsInt("Objectives.objectiveCount");
		  for (k = 0; k < objectiveCount; k++)
      {
        Objective obj = new Objective();
			  Soup objSoup = soup.GetNamedSoup("Objectives.objectives" + (string)k);

			  obj.uniqueID = objSoup.GetNamedTag("Objective.uniqueID");
			  obj.name = objSoup.GetNamedTag("Objective.name");
        KUID kuid = objSoup.GetNamedTagAsKUID("Objectives.asset");
        obj.asset = World.FindAsset(kuid);

        objectives[objectives.size()] = obj;
      }
    }
	}

  public void UpdateObjectiveList()
  {
    // Display all the buttons in the button bar.
    if (!objectiveList)
    {
      objectiveList = Constructors.NewBrowser();
    
			objectiveList.SetWindowRect(100, 100, 500, 500);
    }

    string htmlString = "";

    int i = 0;
    for (i = 0; i < objectives.size(); i++)
    {
	    KUID kuid = objectives[i].asset.GetKUID();
	    string assetIcon = kuid.GetHTMLString();
      htmlString = htmlString + HTMLWindow.MakeImage(assetIcon, true, 32, 32) + " <font color=#FFFFFF>" + objectives[i].name + "</font>";
    }

    objectiveList.LoadHTMLString(htmlString);
  }

  void ShowHideToggle(Message msg)
  {
    // Display all the buttons in the button bar.
    if (!objectiveList)
    {
      UpdateObjectiveList();
    }
    else
    {
      objectiveList = null;
    }

  }

  public void AddObjective(string uniqueID, string name, Asset asset)
  {
    // Ensure it doesn't exist. If it doesn, then just update it.
    int k;
    for (k = 0; k < objectives.size(); k++)
    {
      if (objectives[k].uniqueID == uniqueID)
      {
        objectives[k].name = name;
        objectives[k].asset = asset;
        return;
      }
    }

    Objective obj = new Objective();
    
    obj.name = name;
    obj.uniqueID = uniqueID;
    obj.asset = asset;

    objectives[objectives.size()] = obj;

    if (objectiveList)
      UpdateObjectiveList();
  }

  public void ClearObjectives()
  {
    objectives[0, objectives.size()] = null;

    if (objectiveList)
      UpdateObjectiveList();
  }

  public void RemoveObjective(string uniqueID)
  {
    int k;
    for (k = 0; k < objectives.size(); k++)
    {
      if (objectives[k].uniqueID == uniqueID)
      {
        objectives[k, k+1] = null;
        break;
      }
    }

    if (objectiveList)
      UpdateObjectiveList();
  }

  void CloseBrowser(Message msg)
  {
    objectiveList = null;
  }

};