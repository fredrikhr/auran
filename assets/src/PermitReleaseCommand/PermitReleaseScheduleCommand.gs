include "permitbasicschedulecommand.gs"

include "permitreleasecustomcommand.gs"

class PermitReleaseScheduleCommand isclass PermitBasicScheduleCommand
{
	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		PermitReleaseCustomCommand cmd = new PermitReleaseCustomCommand();
		cmd.Init(driver, permitManagerRule, permitType, permitObject);
		return cast<CustomCommand>(cmd);
	}

	public string GetTooltip(void)
	{
		return GetAsset().GetStringTable().GetString2("PermitReleaseTooltip", permitType, permitObject);
	}
};
