include "driverschedulecommand.gs"

class DefaultDriverScheduleCommand isclass DriverScheduleCommand
{
	public CustomCommand CreateCustomCommand(DriverCharacter driver);
	public void Exception(string reason);

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		Exception("DefaultDriverScheduleCommand.CreateCustomCommand> Not overridden!");
		return cast<CustomCommand>(null);
	}

	public bool BeginExecute(DriverCharacter driver)
	{
		if (!driver)
		{
			Exception("DefaultDriverScheduleCommand.BeginExecute> Driver argument is null.");
			return false;
		}
		CustomCommand cmd = CreateCustomCommand(driver);
		if (!cmd)
		{
			Exception("DefaultDriverScheduleCommand.BeginExecute> CreateCustomCommand returned an invalid custom command.");
			return false;
		}
		driver.DriverCustomCommand(cmd);
		driver.DriverIssueSchedule();

		return true;
	}

	public object GetIcon(void) { return cast<object>(GetDriverCommand()); }
	public void Exception(string reason) { GetDriverCommand().Exception(reason); }
};
