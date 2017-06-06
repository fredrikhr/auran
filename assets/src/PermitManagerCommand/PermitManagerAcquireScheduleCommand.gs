include "Soup.gs"
include "Schedule.gs"
include "DriverScheduleCommand.gs"

include "PermitManagerCommand.gs"

class PermitManagerAcquireCustomCommand isclass CustomCommand
{
	public bool Execute(Train train, int px, int py, int pz)
	{
	    return false;
	}
};

class PermitManagerAcquireScheduleCommand isclass DriverScheduleCommand
{
	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		if (parent and parent.isclass(PermitManagerCommand))
		{
			PermitManagerCommand permitCommand = cast<PermitManagerCommand>(parent);

		}
	}

	public bool BeginExecute(DriverCharacter driver)
	{
		if (!driver)
		{
			driver = GetDriverCharacter();
			if (!driver)
				return false;
		}

		PermitManagerAcquireCustomCommand cmd = new PermitManagerAcquireCustomCommand();


		driver.DriverCustomCommand(cmd);
		driver.DriverIssueSchedule();
		return true;
	}

	public object GetIcon(void)
	{
		return GetDriverCommand();
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();



		return soup;
	}

	public Soup SetProperties(Soup soup)
	{
		inherited(soup);


	}
};
