include "DefaultDriverScheduleCommand.gs"
include "DriverCommandShared.gs"

class DisableRepeatScheduleCommand isclass DefaultDriverScheduleCommand
{
	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{ return cast<CustomCommand>(new NullCustomCommand()); }

	public bool BeginExecute(DriverCharacter driver)
	{
		string __func__ = "DisableRepeatScheduleCommand.BeginExecute";
		if (!driver)
		{
			Exception(__func__ + "> Driver argument is null.");
			return false;
		}

		DriverCommands cmds = driver.GetDriverCommands();
		if (cmds)
			cmds.SetDriverScheduleRepeat(false);

		return inherited(driver);
	}
};
