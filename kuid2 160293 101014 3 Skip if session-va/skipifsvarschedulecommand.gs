include "SessionVariables.gs"
include "DriverCommand.gs"
include "World.gs"
//include "Browser.gs"
include "KUID.gs"
include "SkipIfSvarCommand.gs"
include "Schedule.gs"
//  Version 1.3  Compatible with 131986:1005 ChangeSVariables
//  Support for literal string values in variables
//  Version 1.0f  New Format .  Handles variable comparisons as well as constants
//  Skip messages are not sent to message console

class SkipIfSvarCustomCommand isclass CustomCommand
{
	public string svname;
	public string svoper;
	public string svparam;
    public int labelNum ;
	public DriverCharacter driver;
	public KUID kuid;
    public Asset libasset;
	public SkipIfSvarCommand parent;
        
    public string [] libs_str=new string[0];  // list of operations
    public string [] libn_str=new string[0];  // list of svNames        
 
  	public bool Execute(Train train, int px, int py, int pz)
  	{   bool skip= false;
        string svstring,kString;/// new variables 
        SessionVariables lib = cast<SessionVariables> World.GetLibrary(kuid); 
        int constant, svalue=0;
        
        constant=Str.ToInt(svparam);
        
            // Addition 2012-11-27 to deal with string values
        if (svname[,1] == "$") { /// this is a string variable
            
            if (svparam[0] == 34) {// 34 means quote (")
                int n = svparam.size();
                if (svparam[n-1] == 34) n--; /// decrease size of svparam to remove quotes
                    
                kString = svparam[1,n]; /// literal comparison
            }
            else
                kString = lib.GetVariableString(svparam);  ///
        }
        else {   // Addition 2012-11-03 to cater for variable values as well as contant values
            if (constant == 0 and svparam.size() > 1) {///  this is a variable name, not a constant
                 constant = Str.ToInt(lib.GetVariableNumber(svparam)); 
            }
        }
        
        if (lib.HasVariable(svname)) {
            if (svname[,1] == "$") {  ///  this is a string variable
                svstring = lib.GetVariableString(svname);
                int n = svstring.size();
                
                if (svstring[0] == 34) { // contains a quote
                    if (svstring[n-1] == 34) n--; // delete the last quote (if present)
                        
                    svstring = svstring[1,n]; // delete the first quote
                }
                Interface.Log("Skip if s-variable:  Variable name "+svname+" having value of "+svstring+" is compared to "+kString);
            }
            else {
		        svalue=Str.ToInt(lib.GetVariableNumber(svname));   // The current s-var value (corrected by trev999)
                Interface.Log("Skip if s-variable:  Variable name "+svname+" having value of "+svalue+" is compared to "+constant);
            }
            //Router.PostMessage(train.GetId(),0,"MCAddMessage",driver.GetLocalisedName()+" S-var "+svname+" = "+svalue,0.0 );
            if (svstring and kString) { /// string comparison tests
                if (svoper=="eq" and svstring == kString) skip = true;
                else if (svoper == "ne" and svstring != kString) skip = true;
            }
            else {
                if(svoper=="eq" and svalue==constant)  skip = true; 
                else if(svoper=="gt" and svalue > constant)  skip = true; 
                else if(svoper=="lt" and svalue < constant)  skip = true; 
                else if(svoper=="ge" and svalue >=constant)  skip = true; 
                else if(svoper=="le" and svalue <=constant)  skip = true; 
                else if(svoper=="ne" and svalue !=constant)  skip = true;
            }
                // Skip operation takes place in parent command            
            if (skip) {
                //Router.PostMessage(train.GetId(),0,"MCAddMessage",driver.GetLocalisedName()+" Skipping to label "+labelNum,0.0 );
                parent.SkipTo(labelNum, driver);
                driver.DriverIssueSchedule();
                //}                
                //else 
                    //Router.PostMessage(train.GetId(),0,"MCAddMessage",driver.GetLocalisedName()+" Not skipping to label "+labelNum,0.0 );
            }
            //else Interface.Print("Skip If : not skipping");
        }
        //else
        //    Interface.Print("SKIP IF 94");
        return true;
  	}
};

//  ====================================================================================
class SkipIfSvarScheduleCommand isclass DriverScheduleCommand
{
	public string svname;
	public string svoper;
	public string svparam;
    public int labelNum;
	SkipIfSvarCommand parent;

  	public void Init(DriverCharacter driver, DriverCommand newParent)
  	{
    	inherited(driver, newParent);
    	parent=cast<SkipIfSvarCommand>(newParent);
  	}

  	public bool BeginExecute(DriverCharacter driver)
  	{
    	Train train = driver.GetTrain();
    	if (!train) return false;
            
        Asset libasset=World.FindAsset(GetAsset().LookupKUIDTable("post2inputtable"));
	    KUID kuid = GetAsset().LookupKUIDTable("sessionvariables");
    	SkipIfSvarCustomCommand command = new SkipIfSvarCustomCommand();
        
    	command.svoper=svoper;
    	command.svname=svname;
    	command.svparam=svparam;
        command.labelNum=labelNum;
    	command.driver=driver;
    	command.parent=parent;
    	command.kuid= kuid;
        command.libasset=libasset;
//
    	driver.DriverCustomCommand(command);
    	driver.DriverIssueSchedule();
    	return true;
  	}


  	public object GetIcon(void)
  	{
   		 return cast<object> GetDriverCommand();
  	}

  	public Soup GetProperties(void)
  	{
    	Soup soup = Constructors.NewSoup();
    	soup.SetNamedTag("svoper", svoper);
    	soup.SetNamedTag("svname", svname);
    	soup.SetNamedTag("svnum", svparam);
        soup.SetNamedTag("label_num",labelNum);
    	return soup;
  	}

  	public string GetTooltip(void)
  	{   string statement;
        StringTable ST = GetAsset().GetStringTable();
		statement=ST.GetString1("tt1",labelNum); // Skip to label $0 if
		if(svoper=="eq")
			statement=statement+svname+" = "+svparam;
		else if(svoper=="gt")
			statement=statement+svname+" > "+svparam;
		else if(svoper=="lt")
			statement=statement+svname+" < "+svparam;
		else if(svoper=="ge")
			statement=statement+svname+" >= "+svparam;
		else if(svoper=="le")
			statement=statement+svname+" <=  "+svparam;
		else if(svoper=="ne")
			statement=statement+svname+" not= "+svparam;
        else 
            statement = ST.GetString("tt2"); //Invalid command
		   
		return statement;
  	}
    
    
  	public void SetProperties(Soup soup)
  	{
    	svoper = soup.GetNamedTag("svoper");
    	svname = soup.GetNamedTag("svname");
    	svparam = soup.GetNamedTag("svnum");
        labelNum = soup.GetNamedTagAsInt("label_num");
        
  	}
};

