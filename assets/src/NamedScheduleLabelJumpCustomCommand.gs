include "schedule.gs"

class NamedScheduleLabelJumpCustomCommand isclass CustomCommand
{
	public string labelName;
	public KUID labelKuid;
	public DriverCharacter driver;

	public mandatory void Init(DriverCharacter driver, KUID labelKuid, string labelName);
	public bool ShouldExecuteJump(Train train, int px, int py, int pz) { return true; }

	public mandatory void Init(DriverCharacter driver, KUID labelKuid, string labelName)
	{
		me.driver = driver;
		me.labelKuid = labelKuid;
		me.labelName = labelName;
	}

	bool MatchesBaseKuid(KUID testKuid)
	{
		string labelKuidBase = labelKuid.GetBaseString();
		string testKuidBase = testKuid.GetBaseString();
		return labelKuidBase == testKuidBase;
	}

	public bool Execute(Train train, int px, int py, int pz)
	{
		if (train)
			train.SetAutopilotMode(Train.CONTROL_AUTOPILOT);

		if (!ShouldExecuteJump(train, px, py, pz))
			return true;

		DriverCommands cmds = driver.GetDriverCommands();
		bool dsRepeat = cmds.GetDriverScheduleRepeat();
		DriverScheduleCommand[] dscmds = cmds.GetDriverScheduleCommands();

		cmds.ClearDriverScheduleCommands();

		int i;
		for (i = 1; i < dscmds.size(); i++)
		{
			DriverScheduleCommand dscmdItem = dscmds[i];
			bool isLabelDsCmd = MatchesBaseKuid(dscmdItem.GetAsset().GetKUID());
			if (!isLabelDsCmd)
				continue;
			Soup dscmdSoup = dscmds[i].GetProperties();
			string dsLabelName = dscmdSoup.GetNamedTag("label");
			if (dsLabelName != labelName)
				continue;
			break;
		}

		int j;
		for (j = i; j < dscmds.size(); j++)
		{
			driver.AddDriverScheduleCommand(dscmds[j]);
		}
		if (dsRepeat)
		{
			for (j = 0; j < i; j++)
			{
				driver.AddDriverScheduleCommand(dscmds[j]);
			}
		}
		driver.GetDriverCommands().SetDriverScheduleRepeat(dsRepeat);
		driver.DriverIssueSchedule();

		return true;
	}
};
