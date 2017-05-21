include "SkipCommand.gs"

class SkipCustomCommand isclass CustomCommand {
    public SkipCommand parent;
    public int labelNum,i,debugLevel=0;
    DriverCommands dc;
    public DriverCharacter driver;
        
    public bool  Execute(Train train, int px, int py, int pz) {
        if (debugLevel>0) { 
            string dvr = train.GetActiveDriver().GetLocalisedName();
            Interface.Log(dvr+": Performing Skip to label "+labelNum);
        }
        if (labelNum>0) {
            parent.SkipTo(labelNum, driver);  // Skip to label # [labelNum]
                // do next command
            driver.DriverIssueSchedule();
        }    
        return true;
    }
};
//  =======================================================================================
//
// Driver schedule command used by SkipCommand 
//
class SkipScheduleCommand isclass DriverScheduleCommand
{
    public int labelNum;
    
        
    SkipCommand parent;

    public void SetParent(SkipCommand newParent) {
        parent = newParent;
    }
        //
        // Starts executing this schedule command on the given driver character.
        //
    public bool BeginExecute(DriverCharacter driver) {
        Train train = driver.GetTrain();
        if (!train)        // can't drive if we dont have a train
            return false;
        
        SkipCustomCommand command = new SkipCustomCommand();
        command.labelNum = labelNum;
        command.driver = driver;
        command.parent = parent;
        driver.DriverCustomCommand(command);
        driver.DriverIssueSchedule();
        return true;
    }
  //
  // Provides an icon for this command so it can be seen on the driver's schedule.
  //
    public object GetIcon(void) {
        return cast<object>parent; //returns the icon specified in the config.txt File
    }
  //
  // Text to display when mouse hovers over rule.
  
    public string GetTooltip(void) {
        StringTable ST = GetAsset().GetStringTable();
        return ST.GetString("jump_to_label")+labelNum;
    }
  //
  // Save command values to database.
  //
    public Soup GetProperties(void) {
        Soup soup = Constructors.NewSoup();
        soup.SetNamedTag("label_num", labelNum);
        return soup;
    }
  //
  // Load the command values from database.
  //
    public void SetProperties(Soup soup) {
        labelNum = soup.GetNamedTagAsInt("label_num");
    }
};

