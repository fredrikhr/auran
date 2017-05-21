include "DriverCommand.gs"
include "World.gs"
include "KUID.gs"
include "SkipIfSvarScheduleCommand.gs"
//  Version 1.3  Compatible with format of <kuid:131986:1005> ChangeSVariables
//  Support for literal string values in variables
//  Version 1.0d  New Format includes test for operator type
//  Includes restriction of number of input tables to scan

class SkipIfSvarCommand isclass DriverCommand
{
    public string [] svname=new string[0];  // list of svNames
    public string [] operation=new string[0];  // list of operations
    public int op_count;     //count of operations
    public int name_count;  // count of svNames
    public StringTable  ST;
    public int table_count; // how many input tables to read
    Soup ext;
        
    public void Init(Asset asset) {
        inherited(asset);
        AddHandler(me, "SkipIfSvar", null, "HandleSkipIfSvar");
        ST = GetAsset().GetStringTable();
        ext = GetAsset().GetConfigSoup().GetNamedSoup("extensions");
        table_count = Str.ToInt(ST.GetString("how_many_tables-160293"));
    }

    // Search for list name in session variables library
    // Param1 = svar; param2 = svname
    
    // Returns op_count and name_count in global variable
    // Returns svname list and operation list in global string[]
    
    public void  GetSvList (string param1, string param2) {
	    ScenarioBehavior [] beh=World.GetBehaviors();
        int i, j, k=0,tab_count=1;
        op_count=0;name_count=0;
	    if (beh){
            Asset libasset=World.FindAsset(GetAsset().LookupKUIDTable("post2inputtable"));
 		    if (libasset){
			    int count=beh.size();
			    for(i=0;i<count;i++){
			  	    if (beh[i].GetAsset().GetLocalisedName()==libasset.GetLocalisedName()){
			  		    Soup slibsoup=beh[i].GetProperties();
	  				    if (slibsoup){
			    		    Soup libs = slibsoup.GetNamedSoup("library");
					        int count = libs.CountTags();
					        string lName;
			    		    for (k = 0; k < count; k++){
							    string msgTag=libs.GetNamedTag((string)k);
							    string[] tokens = Str.Tokens(msgTag,",");
							    if(tokens.size()>1){
								    Str.TrimLeft(tokens[0]," ");
								    Str.TrimRight(tokens[0]," ");
								    if(tokens[0] == param1) { //"svar"
                                        if (tokens.size()>3) {            // original format
                                            svname[name_count]=tokens[1];  // svname
									        name_count++;
                                            
                                            if (tokens[2] != "set" and tokens[2] != "inc" and tokens[2] != "dec" and tokens[2] != "rnd" ) {
                                                operation[op_count]=tokens[2]+","+tokens[3]; // svoper + svparam
                                                op_count++;
                                            }
                                        }
                                        else if (tokens.size()>2) {           // new format
                                            if (tokens[1] != "set" and tokens[1] != "inc" and tokens[1] != "dec") { // is an operator
                                                operation[op_count]=tokens[1]+","+tokens[2]; // svoper + svparam
                                                op_count++;
                                            }
                                        }
                                        else Interface.Print(ST.GetString1("error1",tab_count)); // parameter missing
								    }
								    else if(tokens[0]==param2) {
									    svname[name_count]=tokens[1];  // svname
									    name_count++;
								    }                                    
							    }
				    	    }
                            tab_count++;
                            if (tab_count > table_count) return; // don't read any more input tables
			    	    }
			        }
	    	    }
	        }
        }
    }
        
    public void AddCommandMenuItem(DriverCharacter driver, Menu menu) {
	    int i, j, k;
        string op = ext.GetNamedTag("svop-160293");
        string name = ext.GetNamedTag("svname-160293");
        GetSvList(op,name);    // builds lists of variable names and operations
        //Interface.Log("Name Count = "+name_count+"; Op count = "+op_count);////
        Menu labMenu = Constructors.NewMenu();
        Menu nameMenu;
        
        for (k=1;k<21;k++) { // twenty labels
            nameMenu = Constructors.NewMenu();   
            for(j=0;j < name_count;j++) {  // svNameList
                Menu opMenu = Constructors.NewMenu();
                for(i=0;i < op_count;i++) {   // operation 
                    opMenu.AddItem(operation[i],me,"SkipIfSvar",svname[j]+","+operation[i]+", "+k);
                }
                nameMenu.AddSubmenu(svname[j]+" >", opMenu);
                nameMenu.SubdivideItems();
            }
            labMenu.AddSubmenu(ST.GetString1("label",k),nameMenu); // Skip to label $0 if condition
        }
        nameMenu.SubdivideItems();
        
        menu.AddSubmenu(ST.GetString("skip_to")+" >",labMenu);
    }

  void PlayConfirmation(void)
  {
    KUID kuid = GetAsset().LookupKUIDTable("command-sounds");
    Library libCommandSounds = World.GetLibrary(kuid);
    if (libCommandSounds)
    {
      libCommandSounds.LibraryCall("PlayConfirmation", null, null);
    }
  }


  DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
  {
    SkipIfSvarScheduleCommand cmd = new SkipIfSvarScheduleCommand();
    cmd.Init(driver, me);
    cmd.SetProperties(soup);
    return cast<DriverScheduleCommand>cmd;
  }

  void HandleSkipIfSvar(Message msg){
    int label_num=0;
	string svname;
	string svoper;
	string svparam;
    
    DriverCommands commands = GetDriverCommands(msg);
    DriverCharacter driver = cast<DriverCharacter>(msg.src);
    Soup soup = Constructors.NewSoup();
    if (msg.minor == " 0") {
        label_num=0;
    }
    else {
        string[] tokens=Str.Tokens(msg.minor,",");
        svname=tokens[0];
        svoper=tokens[1];
        svparam=tokens[2];
        label_num=Str.ToInt(tokens[3]);
        
        if (svoper == "set" or svoper == "inc" or svoper == "dec") 
            return;  // Invalid choice of operator
        
        // schedule our command
        soup.SetNamedTag("svoper", svoper);
        soup.SetNamedTag("svname", svname);
        soup.SetNamedTag("svnum", svparam);
    }
    soup.SetNamedTag("label_num",label_num);
    SkipIfSvarScheduleCommand cmd = cast<SkipIfSvarScheduleCommand>CreateScheduleCommand(driver, soup);
    commands.AddDriverScheduleCommand(cmd);

    if (driver)
      PlayConfirmation();
  }
    // =================================================================================================
    //  Function for Skip to Label Command .     Method might also be of use to backspace the schedule
    //  Examines the remaining commands in the driver schedule, looking for a "label_num" tag 
    //  Params:     LabelNumber is label to seek
    //             labNum is number of label under scrutiny  
    public void SkipTo(int labelNumber, DriverCharacter dvr) {
        int i,j,labNum=0;
        int sCount=0;
        Soup mySoup;
        
        bool orepeat=dvr.GetDriverCommands().GetDriverScheduleRepeat();
        DriverCommands dc = dvr.GetDriverCommands();
        
        DriverScheduleCommand [] dsc=dc.GetDriverScheduleCommands();
        dvr.GetDriverCommands().ClearDriverScheduleCommands();  // so we can re-arrange the schedule
        
        //Interface.Log(dvr.GetLocalisedName()+":  'Skipping If to label "+labelNumber);
        for (i=1; i<dsc.size(); i++) { // Search the following commands for the requested label
            mySoup = dsc[i].GetProperties();    // get the soup tags for this cmd
            labNum = mySoup.GetNamedTagAsInt("label_number");
            if (labelNumber == labNum) {
                sCount = i;
                break;  // found our label, i contains number of commands to skip
            }
        }
        
        if (sCount > 0) {
            for (j=sCount; j<dsc.size(); j++) {       // don't add the first [sCount] commands
                dvr.AddDriverScheduleCommand(dsc[j]);   // move the rest of the commands to the new schedule
            }    
            
            if (orepeat) {                
                dvr.AddDriverScheduleCommand(dsc[0]);   // Add the Skip command at the end
                for (j=1; j < sCount; j++) 
                    dvr.AddDriverScheduleCommand(dsc[j]);// add the first [sCount] commands behind the Skip cmd
                
                dvr.GetDriverCommands().SetDriverScheduleRepeat(orepeat);   // Set Repeat status
            }
            dc = dvr.GetDriverCommands();   // assemble the commands 
        }
        else
            Interface.Print(dvr.GetLocalisedName()+": "+ST.GetString1("cannot_find_label",labelNumber));
        return;
    } 
};
