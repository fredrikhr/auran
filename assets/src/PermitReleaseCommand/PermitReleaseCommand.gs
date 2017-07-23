include "permitbasiccommand.gs"

include "permitreleaseschedulecommand.gs"

class PermitReleaseCommand isclass PermitBasicCommand
{
	public DriverScheduleCommand CreateScheduleComamndInstance(void)
	{
		return cast<DriverScheduleCommand>(new PermitReleaseScheduleCommand());
	}

	public string GetMenuItemRootString() { return GetAsset().GetStringTable().GetString("PermitReleaseMenuItem"); }
};
