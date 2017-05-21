include "InsertLabelCommand.gs"

class InsertLabelCustomCommand isclass CustomCommand 
{
    public InsertLabelCommand parent;
    //public int labelNumber,i;
    DriverCommands dc;
    public DriverCharacter driver;
        
    public bool  Execute(Train train, int px, int py, int pz) {
        /*
        if (labelNumber>0) {
            Interface.Log(train.GetActiveDriver().GetLocalisedName()+":  Label "+labelNumber+" ignored: ");
        }
        */
        return true;
    }
};
//  =======================================================================================
//
// Driver schedule command used by InsertLabelCommand 
//
class InsertLabelScheduleCommand isclass DriverScheduleCommand
{  
    public int labelNumber;
        
    InsertLabelCommand parent;

    public void SetParent(InsertLabelCommand newParent) {
        parent = newParent;
    }

    public bool BeginExecute(DriverCharacter driver) {
        Train train = driver.GetTrain();
        if (!train)        // can't drive if we don't have a train
            return false;
        
        InsertLabelCustomCommand command = new InsertLabelCustomCommand();
        //command.labelNumber = labelNumber;
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
        StringTable strTable = GetAsset().GetStringTable();
        return strTable.GetString1("label",labelNumber);
    }
  //
  // Save label number to database.
  //
    public Soup GetProperties(void) {
        Soup soup = Constructors.NewSoup();
        soup.SetNamedTag("label_number", labelNumber);
        return soup;
    }
  //
  // Load the label number from database.
  //
    public void SetProperties(Soup soup) {
        labelNumber = Str.ToInt(soup.GetNamedTag("label_number"));
    }
};

