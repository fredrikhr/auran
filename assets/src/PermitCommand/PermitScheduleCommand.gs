include "Soup.gs"
include "Constructors.gs"
include "ScenarioBehavior.gs"
include "DriverScheduleCommand.gs"

include "PermitManagerShared.gs"
include "PermitAcquireCustomCommand.gs"
include "PermitReleaseCustomCommand.gs"

class PermitScheduleCommand isclass DriverScheduleCommand
{
	string opcode;
	ScenarioBehavior manager;
	Soup typeSoup;
	Soup objectSoup;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);
	}

	public bool BeginExecute(DriverCharacter driver)
	{
		if (!driver)
		{
			driver = GetDriverCharacter();
			if (!driver)
				return false;
		}

		CustomCommand cmd;
		if (opcode == PermitManagerConst.PermitScheduleCommandOpCodeAcquire)
		{
			PermitAcquireCustomCommand acquireCmd = new PermitAcquireCustomCommand();
			acquireCmd.manager = manager;
			acquireCmd.typeSoup = typeSoup;
			acquireCmd.objectSoup = objectSoup;

			cmd = acquireCmd;
		}
		else if (opcode == PermitManagerConst.PermitScheduleCommandOpCodeRelease)
		{
			PermitReleaseCustomCommand releaseCmd = new PermitReleaseCustomCommand();
			releaseCmd.manager = manager;
			releaseCmd.typeSoup = typeSoup;
			releaseCmd.objectSoup = objectSoup;

			cmd = releaseCmd;
		}
		else
			return false;

		driver.DriverCustomCommand(cmd);
		driver.DriverIssueSchedule();
		return true;
	}

	public object GetIcon(void)
	{
		return cast<object>(GetDriverCommand());
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();
		if (!soup)
			soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitScheduleCommandOpCodeSoupTag, opcode);
		if (manager)
			soup.SetNamedTag(PermitManagerConst.PermitManagerRuleSoupTag, manager.GetId());
		soup.SetNamedSoup(PermitManagerConst.PermitTypeSoupTag, typeSoup);
		soup.SetNamedSoup(PermitManagerConst.PermitObjectSoupTag, objectSoup);

		return soup;
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);
		if (!soup)
			return;

		opcode = soup.GetNamedTag(PermitManagerConst.PermitScheduleCommandOpCodeSoupTag);
		int managerId = soup.GetNamedTagAsInt(PermitManagerConst.PermitManagerRuleSoupTag);
		manager = cast<ScenarioBehavior>(Router.GetGameObject(managerId));
		typeSoup = soup.GetNamedSoup(PermitManagerConst.PermitTypeSoupTag);
		objectSoup = soup.GetNamedSoup(PermitManagerConst.PermitObjectSoupTag);
	}
};