include "DriverCommand.gs"
include "World.gs"
include "Browser.gs"
include "KUID.gs"
include "Industry.gs"
include "EnableRepeatCommand.gs"
include "Schedule.gs"

class EnableRepeatCustom isclass CustomCommand
{
	public bool  Execute (Train train, int px, int py, int pz) 
	{
		return true;
	}
};

//
// Driver schedule command used by EnableRepeatCommand 
//
class EnableRepeatScheduleCommand isclass DriverScheduleCommand
{
  EnableRepeatCommand parent;

  public void SetParent(EnableRepeatCommand newParent)
  {
    parent = newParent;
  }

  //
  // Starts executing this schedule command on the given driver character.
  //
  public bool BeginExecute(DriverCharacter driver)
  {
	DriverCommands dc=driver.GetDriverCommands();
//	dc.SetDriverScheduleRepeat(true);
	//driver.IssueNextCommand();
	dc.SetDriverScheduleRepeat(true);
	driver.DriverCustomCommand(new EnableRepeatCustom());
    driver.DriverIssueSchedule();
	return true;
  }
  public bool EndExecute(DriverCharacter driver)
  {
	DriverCommands dc=driver.GetDriverCommands();
	return true;
  }

  //
  // Provides an icon for this command so it can be seen on the driver's schedule.  Uses the industry
  // icon to indicate the destination.
  //
  public object GetIcon(void)
  {
	return cast<object>parent; //returns the icon specified in the config.txt File
  }

  //
  // Text to display when mouse hovers over rule.
  //
  public string GetTooltip(void)
  {
    return "Enable Repeat";
  }

  //
  // Save the industry and track names to a database.
  //
  public Soup GetProperties(void)
  {
    Soup soup = Constructors.NewSoup();
    return soup;
  }

  //
  // Load the industry and track names from a database.
  //
  public void SetProperties(Soup soup)
  {
  }
};

