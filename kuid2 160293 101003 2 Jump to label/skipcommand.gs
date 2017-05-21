include "DriverCommand.gs"
include "SkipScheduleCommand.gs"
/*
    Skip Commands (unconditionally)

    Function:       Direct the driver to skip over his commands until he encounters a Label command.
    
    Associated Commands: Insert buff label command, Skip If ... command
    
    Updated by trev999 18th Aug 2012 to fix bug when using repeat. Label numbers 1-10 (buff) and 11-20 (green)
*/
class SkipCommand isclass DriverCommand
{
  // Object initializer - adds handler methods.
    Soup ext;
    StringTable ST;
        
    public void Init(Asset asset) {
        inherited(asset);
        AddHandler(me, "mSkipCommand", null, "HandleSkip");
        ext = me.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
        ST = GetAsset().GetStringTable();
    }

      // Adds entry to the menu
    public void AddCommandMenuItem(DriverCharacter driver, Menu menu) {
        int i;
        
        if (driver and !driver.GetTrain())
            return;
        
        //dvr = driver;
        // Set up submenu
        Menu skipMenu = Constructors.NewMenu();
        
        // Build the menus from right to left (last menu first) 
        int limit = 1 + ext.GetNamedTagAsInt("max_labels-160293");
        int boundary = ext.GetNamedTagAsInt("change_to_green_at-160293");
        if (boundary < 1) boundary = 11; // default changeover if no boundary set
            
        string text = ST.GetString(" (buff)");
        for (i=1; i<limit; i++) {
            if (i == boundary) text = ST.GetString(" (green)");
            skipMenu.AddItem((string)i+text, me, "mSkipCommand", (string)i);  
        }
        menu.AddSubmenu(ST.GetString("jump_to_label"), skipMenu); // Skip to label #
    }
    
        //   SkipCommand Handler
    void HandleSkip(Message msg) {
        int labelNum=0;
        DriverCommands commands=GetDriverCommands(msg);
        DriverCharacter driver = cast<DriverCharacter>(msg.src);
        
        if (msg.major == "mSkipCommand") {      
            labelNum = Str.ToInt(msg.minor); // This will be the label number to skip to
        }
        //      Schedule the command
        Soup soup = Constructors.NewSoup();
        soup.SetNamedTag("label_num", labelNum);
        SkipScheduleCommand cmd = cast<SkipScheduleCommand>CreateScheduleCommand(driver, soup);
        commands.AddDriverScheduleCommand(cmd);
    }
        //CreateScheduleCommand - creates a new SkipScheduleCommand and initialises it
    DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup) {
        SkipScheduleCommand cmd = new SkipScheduleCommand();
        cmd.Init(driver, me);
        cmd.SetParent(me);
        cmd.SetProperties(soup);
        return cast<DriverScheduleCommand>cmd;
    }
    // =================================================================================================
    //  Function for Skip to Label Command .   Called from Skipschedulecommand.gs
    //  Examines the remaining commands in the driver schedule, looking for a "label_num" tag 
    //  Params:     LabelNumber - label to seek
    //             labNum is number of label under scrutiny  
    public void SkipTo(int labelNumber, DriverCharacter dvr) {
        int i,j,labNum=0;
        int sCount=0;
        Soup mySoup;
        
        //Interface.Log(dvr.GetLocalisedName()+ "   Skipping to label "+labelNumber);
        
        bool orepeat=dvr.GetDriverCommands().GetDriverScheduleRepeat();
        DriverCommands dc = dvr.GetDriverCommands();
        
        DriverScheduleCommand [] dsc=dc.GetDriverScheduleCommands();
        dvr.GetDriverCommands().ClearDriverScheduleCommands();  // so we can re-arrange the schedule
        
        for (i=1; i<dsc.size(); i++) { // Search the following commands for the requested label
            mySoup = dsc[i].GetProperties();    // get the tags for this cmd
            labNum = mySoup.GetNamedTagAsInt("label_number");
            
            if (labelNumber == labNum) {
                sCount = i;
                break;  // found our label, i contains number of commands to skip
            }
        }
        
        if (sCount > 0) {
            
            for (j=sCount; j<dsc.size(); j++) {       // don't add the first [sCount] commands
                dvr.AddDriverScheduleCommand(dsc[j]);   // move the rest of the commands to the schedule
            }    
            //Interface.Log(dvr.GetLocalisedName()+ ":  SC Skipping "+sCount+" commands");
            if (orepeat) {
                dvr.AddDriverScheduleCommand(dsc[0]);   // Add the Skip command next
                for (j = 1; j < sCount; j++)  {
                    dvr.AddDriverScheduleCommand(dsc[j]);// add the first [sCount-1] commands at the end
                }
                dvr.GetDriverCommands().SetDriverScheduleRepeat(orepeat);   // Set Repeat status
            }
            dc = dvr.GetDriverCommands();
        }
        else
            Interface.Print(dvr.GetLocalisedName()+ST.GetString1("error",labelNumber));
        return;
    }
};
             