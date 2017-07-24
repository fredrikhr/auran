include "drivercommandshared.gs"
include "permitbasicschedulecommand.gs"
include "namedschedulelabeljumpifpermitacquireimmediatecustomcommand.gs"

class NamedScheduleLabelJumpIfPermitAcquireImmediateScheduleCommand isclass PermitBasicScheduleCommand
{
	define string KUID_LABEL_COMMAND_ENTRY = "NamedScheduleLabelInsertCommand";

	public KUID labelKuid;
	public string labelName;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		labelKuid = DriverCommandShared.GetDepdendantKUID(GetDriverCommand(), KUID_LABEL_COMMAND_ENTRY);
	}

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		NamedScheduleLabelJumpIfPermitAcquireImmediateCustomCommand cmd = new NamedScheduleLabelJumpIfPermitAcquireImmediateCustomCommand();
		cmd.Init(driver, labelKuid, labelName, permitManagerRule, permitType, permitObject);
		return cast<CustomCommand>(cmd);
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();

		soup.SetNamedTag("label", labelName);

		return soup;
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);
		if (!soup)
			return;

		labelName = soup.GetNamedTag("label");
	}

	public string GetTooltip(void)
	{
		return GetAsset().GetStringTable().GetString3("jumplabeltooltip", permitType, permitObject, labelName);
	}
};
