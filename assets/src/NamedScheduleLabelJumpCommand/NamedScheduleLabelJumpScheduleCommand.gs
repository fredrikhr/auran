include "defaultdriverschedulecommand.gs"
include "namedschedulelabeljumpcustomcommand.gs"
include "drivercommandshared.gs"

class NamedScheduleLabelJumpScheduleCommand isclass DefaultDriverScheduleCommand
{
	define string KUID_LABEL_COMMAND_ENTRY = "NamedScheduleLabelInsertCommand";

	string labelName;
	KUID labelKuid;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		labelKuid = DriverCommandShared.GetDepdendantKUID(GetDriverCommand(), KUID_LABEL_COMMAND_ENTRY);
	}

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		NamedScheduleLabelJumpCustomCommand command = new NamedScheduleLabelJumpCustomCommand();
		command.Init(driver, labelKuid, labelName);
		return cast<CustomCommand>(command);
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

	public string GetTooltip(void) { return GetAsset().GetStringTable().GetString1("JumpLabelTooltip", labelName); }
};
