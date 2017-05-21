include "DriverCommand.gs"
include "InsertLabelScheduleCommand.gs"
/*
    InsertLabel command works in conjunction with "Skip to label" commands.

    Function:   a    Insert a label command into the driver schedule.
                b    The command is instrumental in determining how many commands to skip when skipping is active
                c    Label is ignored when encountered in schedule.

    Note:  Label commands take a number from 1 to Max_labels as defined in config.txt
   
*/
class InsertLabelCommand isclass DriverCommand
{
  // Object initializer - adds handler methods.
    public DriverCharacter dvr;
    Soup ext;
        
    public void Init(Asset asset) {
        inherited(asset);
        AddHandler(me, "mCreateLabel", null, "InsertLabel");
        ext = me.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
    }

      // Adds entry to the given menu along with submenus of drivers
    public void AddCommandMenuItem(DriverCharacter driver, Menu menu) {
        int i;
        StringTable strTable = GetAsset().GetStringTable();
        if (driver and !driver.GetTrain())
            return;
        dvr = driver;
        // Set up submenu for Create Label command
        Menu clMenu = Constructors.NewMenu();
        
        // Build the menu
        int limit = 1 + ext.GetNamedTagAsInt("max_labels-160293");
        for (i=1; i<limit; i++) { // Right menu 
            clMenu.AddItem((string)i, me, "mCreateLabel", (string)i);            
        }
      // Main menu items
        menu.AddSubmenu(strTable.GetString("insert_label"),clMenu);   // Create Label menu
    }
        //   InsertLabel Handler
    void InsertLabel(Message msg) {
        int labelNumber=0;
        DriverCommands commands=GetDriverCommands(msg);
        DriverCharacter driver = cast<DriverCharacter>(msg.src);
        if (msg.major == "mCreateLabel") 
            labelNumber = Str.ToInt(msg.minor);
            
        //      Schedule the command
        Soup soup = Constructors.NewSoup();
        soup.SetNamedTag("label_number", labelNumber);
        InsertLabelScheduleCommand cmd = cast<InsertLabelScheduleCommand>CreateScheduleCommand(driver, soup);
        commands.AddDriverScheduleCommand(cmd);
    }

        //CreateScheduleCommand - creates a new InsertLabelScheduleCommand and initialises it
    DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup) {
        InsertLabelScheduleCommand cmd = new InsertLabelScheduleCommand();
        cmd.Init(driver, me);
        cmd.SetParent(me);
        cmd.SetProperties(soup);
        return cast<DriverScheduleCommand>cmd;
    }
};
