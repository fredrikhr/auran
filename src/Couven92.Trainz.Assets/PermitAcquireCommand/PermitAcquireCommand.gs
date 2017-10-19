include "permitbasiccommand.gs"

include "permitacquireschedulecommand.gs"

class PermitAcquireCommand isclass PermitBasicCommand
{
	public DriverScheduleCommand CreateScheduleComamndInstance(void)
	{
		return cast<DriverScheduleCommand>(new PermitAcquireScheduleCommand());
	}
	public string GetMenuItemRootString() { return GetAsset().GetStringTable().GetString("PermitAcquireMenuItem"); }
};
