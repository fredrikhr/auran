//
// WaitForTriggerCommand
//
// Class: WaitForTriggerCommand
//        Handles The DriverCommand "WaitForTrigger" like MenuCreation, EventHandler when the Command
//        is added to the Schedule by the user, etc.
//
// Author: David (Marinus) Hamann
// EMail:  trainz@marinus.org
//
// Note: This Script is based on the Driver Commands Source code provided by Auran

//****************************************************************************************************

include "DriverCommand.gs"
include "World.gs"
include "Browser.gs"
include "KUID.gs"
include "Industry.gs"
include "WaitForTriggerScheduleCommand.gs"

//****************************************************************************************************

class WaitForTriggerCommand isclass DriverCommand
{
  public void Init(Asset asset)
  {
    inherited(asset);
    AddHandler(me, "WaitForTriggerItem", null, "WaitForTrigger");  //If a WaitForTriggerItem Event
                                         //    happens the Function WaitForTrigger is called.
                                         //    A WaitForTriggerItem Message is sent if the user
                                         //    selects an item of the WaitForTrigger Command in Driver
  }

  //AddCommandMenuItem - Creates the Menu in Driver
  public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
  {
    if (driver and !driver.GetTrain())
      return;


    Menu triggerMenu = Constructors.NewMenu();
    Trigger[] triggerList = World.GetTriggerList();
    Trigger trig;
    Train[] trainList = World.GetTrainList();
    Train train;
    int i,j, triggerCount = triggerList.size(), trainCount = trainList.size();
    string localisedTriggerName, trainName, triggerName;
    
    string[] locoNameList = new string[0];
    for (j=0; j < trainCount; j++)
    {
      train = cast<Train>(trainList[j]);
     	Locomotive loco = train.GetFrontmostLocomotive(); //Gets the front Loco of the actual Train
     	if (loco)
     	{
        trainName = loco.GetName();
        if (trainName != "")
          locoNameList[locoNameList.size()] = trainName;
      }
    }
    int locoNameCount = locoNameList.size();

    if(triggerCount)
    {
      if (triggerCount * locoNameCount > 1793 * 43)
      {
        triggerCount = 1793 * 43 / locoNameCount;
      }
      for (i=0; i < triggerCount; i++) //For each Trigger
      {
      	trig = triggerList[i];
      	localisedTriggerName = trig.GetLocalisedName();
      	if(localisedTriggerName.size())
      	{
          triggerName = trig.GetName(); //unique Trigger Name
        	Menu trainMenu = Constructors.NewMenu();
          trainMenu.AddItem("Any Train", me, "WaitForTriggerItem", triggerName);
          for (j=0; j < locoNameCount; j++)
          {
            trainName = locoNameList[j];
            trainMenu.AddItem(trainName, me, "WaitForTriggerItem", triggerName + "¼" + trainName);
                                         //Adds a Train to the Trainlist, when the Item is selected by
                                         //the user, a Message is sent to the Function WaitForTrigger
                                         //The minor part of the message contains the last parameter of
                                         //the AddItem Function. A String containing triggername and
                                         //trainName seperated by ¼ (which is very unlikely to be used 
                                         //in a trigger name)
          }
     	    triggerMenu.AddSubmenu(localisedTriggerName + " >", trainMenu); //Add the Trainslist as submenu to an
        }                                                        //entry in the triggerMenu
      }
      triggerMenu.SubdivideItems();

      StringTable strTable = GetAsset().GetStringTable();
      menu.AddSubmenu(strTable.GetString("menu_command_name") + " >", triggerMenu); //Add the triggerMenu (including the Trains)
    }                                                      //to the MainMenu
  }
  //CreateScheduleCommand - creates a New WaitForTriggerScheduleCommand and initialises it
  DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
  {
    WaitForTriggerScheduleCommand cmd = new WaitForTriggerScheduleCommand();
    cmd.Init(driver, me);
    cmd.SetParent(me);
    cmd.SetProperties(soup);
    return cast<DriverScheduleCommand>cmd;
  }
  //Wait For Trigger
  //Message Handler for Messages that are sent when you select a trigger and Train from the Menu in
  //Driver
  void WaitForTrigger(Message msg)
  {
    string menuparam = (string)msg.minor; //Gets the minor Part of the Message (contains trigger an
                                          //trainName seperated by "¼"
    string[] tokens;
    DriverCharacter driver = cast<DriverCharacter>(msg.src);
    DriverCommands commands = GetDriverCommands(msg);
    tokens = Str.Tokens(menuparam, "¼"); //seperates menuparam in the two parts that where seperated
                                           //by "¼"
    Soup soup = Constructors.NewSoup();
    soup.SetNamedTag("TriggerId", tokens[0]); //There must have been a trigger Name in the message
    if(tokens.size() == 2)
      soup.SetNamedTag("TrainId", tokens[1]); //The Message contained a trainId
    else
      soup.SetNamedTag("TrainId", ""); //The Message contained no trainId (User selected Any Train)

    WaitForTriggerScheduleCommand cmd = cast<WaitForTriggerScheduleCommand>CreateScheduleCommand(driver, soup);
                                //Create a new Custom Schedule Command (WaitForTriggerScheduleCommand)
    commands.AddDriverScheduleCommand(cmd);    //Add the new command to the Schedule of the driver
  }
};
