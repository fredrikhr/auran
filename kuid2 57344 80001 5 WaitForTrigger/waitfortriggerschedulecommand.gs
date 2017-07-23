//
// WaitForTriggerScheduleCommand.gs
// Class: WaitForTriggerCustomCommand
//        Handles the Wait for Trigger algorithm.
// Class: WaitForTriggerScheduleCommand
//        Handles the Schedule entry of the WaitForTrigger Command
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
include "WaitForTriggerCommand.gs"
include "Schedule.gs"

//****************************************************************************************************

class WaitForTriggerCustomCommand isclass CustomCommand
{
  public string triggerId,trainId;       //Id of the Trigger that is waited on, and train that must hit it
  public DriverCharacter driver;


  // Handles the Waiting for a Trigger
  public void HandleWaitForTriggerCommand(Train train)
  {
    // 1. 'me' is this CustomCommand
    // 2. The thread is running on the Train GameObject,
    //    therefore all wait() calls, etc receive messages through the Train GameObject.
    // 3. 'Sniff()' works on the GameObject upon which it is called, which is not necessarily
    //    the same GameObject as the one upon which the current thread is running.
    //
    // This means that when we want to receive a message, it must go to the Train.
    // Any messages we want to send may as well come from the Train as well, but the DriverCharacter is also a GameObject.
    // And any Sniff() calls we make will want to be made on the Train.
    //

    Trigger trig = cast<Trigger>Router.GetGameObject(triggerId);
    train.SetAutopilotMode(Train.CONTROL_SCRIPT);
    train.SetDCCThrottle(0.0);

    if (trig)
    {
      // We want to know if our trigger was entered by a train since CustomCommands cannot
      // listen to messages, we have to use our train (which the custom Command is running on)
      train.Sniff(trig, "Object", "", true);
    }
    else
    {
      // The command isn't configured correctly, oh well
      Interface.Exception("WaitForTrigger Driver Command> Trigger '" + triggerId + "' not found, command failure");
    }


    Message msg;
    wait()
    {
      on "Object", "Enter", msg:
      {
        Train t_source;
        Locomotive l_source;
        t_source = cast<Train>msg.src;  //Get the train that entered the trigger
        l_source = t_source.GetFrontmostLocomotive(); //gets the front loco of this train
        if(l_source) //Has the Object that entered a loco?
        {
          if(l_source.GetName() == trainId or trainId == "") //Check if we were waiting for this train
            break; //If it was the right train exit the wait block
        }
        else
        {
          if(trainId == "") //if any train also break on a train without loco
            break;
        }
        continue; //Continue to wait
      }
      on "Schedule", "Abort":
        break; //Exit the wait block if the Schedule was aborted
    }
    train.Sniff(trig, "Object", "", false);
   }


  public bool Execute(Train train, int px, int py, int pz)
  {
    train.SetAutopilotMode(Train.CONTROL_AUTOPILOT);
    HandleWaitForTriggerCommand(train);
    return true;
  }
};

//****************************************************************************************************

class WaitForTriggerScheduleCommand isclass DriverScheduleCommand
{
  public string triggerId, trainId;
  WaitForTriggerCommand parent;

  public void SetParent(WaitForTriggerCommand newParent)
  {
    parent = newParent;
  }

  //If the Schedule reaches our WaitForTriggerCommand this Function is executed
  public bool BeginExecute(DriverCharacter driver)
  {
    Train train = driver.GetTrain();
    if (!train)
        // cant Wait for a Trigger if we dont have a train
      return false;

    WaitForTriggerCustomCommand command = new WaitForTriggerCustomCommand();

        //Create a new WaitForTriggerCustomCommand that handles the actual waiting for a trigger
    command.driver = driver;
    command.triggerId = triggerId;
    command.trainId = trainId;

      // get the driver executing this command
    driver.DriverCustomCommand(command); //Tell the driver to execute our WaitForTriggerCustomCommand
    driver.DriverIssueSchedule(); //Continue with the Schedule

    return true;
  }

  public object GetIcon(void)
  {
    return cast<object>parent; //returns the icon specified in the config.txt File
  }

  public string GetTooltip(void)
  {
    string ret = GetAsset().GetStringTable().GetString1("driver_tooltip", triggerId);
    if (trainId == "")
      ret = ret + "'Any Train'";
    else
      ret = ret + "'" + trainId + "'";
    return ret;
  }

  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();
    // Save support
    // Save the properties to the soup, then return the soup
    soup.SetNamedTag("TriggerId", triggerId);

    soup.SetNamedTag("TrainId",trainId);
    return soup;
  }

  public void SetProperties(Soup soup)
  {
    // Load support
    // Setup the properties from the passed in soup
    triggerId = soup.GetNamedTag("TriggerId");
    trainId = soup.GetNamedTag("TrainId");
  }
};

