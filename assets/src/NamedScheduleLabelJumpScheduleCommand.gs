include "defaultdriverschedulecommand.gs"
include "drivercommandshared.gs"

class NamedScheduleLabelJumpStateContainer
{
	public define int JUMP_NOT_STARTED = 0;
	public define int JUMP_STARTED = 1;
	public define int JUMP_CONDITION_CHECK = 2;
	public define int JUMP_REBUILD_SCHEDULE = 3;
	public define int JUMP_COMPLETE = 4;

	int jumpState;

	public void SetJumpState(int jumpState)
	{ me.jumpState = jumpState; }

	public int GetJumpState(void) { return jumpState; }

	public string GetJumpStateString(StringTable stringTable)
	{
		string result;
		switch (jumpState)
		{
			case JUMP_NOT_STARTED:
				if (stringTable)
					result = stringTable.GetString("JUMP_NOT_STARTED");
				if (!result)
					result = "JUMP_NOT_STARTED";
				break;
			case JUMP_STARTED:
				if (stringTable)
					result = stringTable.GetString("JUMP_STARTED");
				if (!result)
					result = "JUMP_STARTED";
				break;
			case JUMP_CONDITION_CHECK:
				if (stringTable)
					result = stringTable.GetString("JUMP_CONDITION_CHECK");
				if (!result)
					result = "JUMP_CONDITION_CHECK";
				break;
			case JUMP_REBUILD_SCHEDULE:
				if (stringTable)
					result = stringTable.GetString("JUMP_REBUILD_SCHEDULE");
				if (!result)
					result = "JUMP_REBUILD_SCHEDULE";
				break;
			case JUMP_COMPLETE:
				if (stringTable)
					result = stringTable.GetString("JUMP_COMPLETE");
				if (!result)
					result = "JUMP_COMPLETE";
				break;
			default:
				result = (string)jumpState;
				break;
		}
		return result;
	}
};

class NamedScheduleLabelJumper
{
	NamedScheduleLabelJumpStateContainer jumpStateContainer;
	string labelName;
	KUID labelKuid;

	public void Init(NamedScheduleLabelJumpStateContainer jumpStateContainer, string labelName, KUID labelKuid)
	{
		me.jumpStateContainer = jumpStateContainer;
		me.labelName = labelName;
		me.labelKuid = labelKuid;
	}

	bool MatchesBaseKuid(KUID testKuid)
	{
		string labelKuidBase = labelKuid.GetBaseString();
		string testKuidBase = testKuid.GetBaseString();
		return labelKuidBase == testKuidBase;
	}

	public void SetJumpState(int jumpState)
	{
		if (jumpStateContainer)
			jumpStateContainer.SetJumpState(jumpState);
	}

	public bool ShouldExecuteJump(DriverCharacter driver) { return true; }

	public void PerformJumpOperation(DriverCharacter driver)
	{
		SetJumpState(NamedScheduleLabelJumpStateContainer.JUMP_CONDITION_CHECK);
		if (ShouldExecuteJump(driver))
		{
			SetJumpState(NamedScheduleLabelJumpStateContainer.JUMP_REBUILD_SCHEDULE);

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

			cmds.SetDriverScheduleRepeat(dsRepeat);
		}

		SetJumpState(NamedScheduleLabelJumpStateContainer.JUMP_COMPLETE);
	}
};

class NamedScheduleLabelJumpCustomCommand isclass CustomCommand, NamedScheduleLabelJumper
{
	public define float continueDrivingThreshhold = 0.8; // 0.8 m/s -> ~3 kph

	DriverCharacter driver;

	public void Init(DriverCharacter driver, NamedScheduleLabelJumpStateContainer jumpStateContainer, string labelName, KUID labelKuid)
	{
		me.driver = driver;
		Init(jumpStateContainer, labelName, labelKuid);
	}

	public bool Execute(Train train, int px, int py, int pz)
	{
		if (train.GetTrainVelocity() > continueDrivingThreshhold)
			train.SetAutopilotMode(Train.CONTROL_AUTOPILOT);

		PerformJumpOperation(driver);

		train.SetAutopilotMode(Train.CONTROL_SCRIPT);
		return true;
	}

	public bool ShouldStopTrainOnCompletion() { return false; }
};

class NamedScheduleLabelJumpScheduleCommand isclass DefaultDriverScheduleCommand, NamedScheduleLabelJumpStateContainer
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
		NamedScheduleLabelJumpCustomCommand cmd = new NamedScheduleLabelJumpCustomCommand();
		cmd.Init(driver, me, labelName, labelKuid);
		return cast<CustomCommand>(cmd);
	}

	public bool BeginExecute(DriverCharacter driver)
	{
		SetJumpState(JUMP_STARTED);

		return inherited(driver);
	}

	public bool EndExecute(DriverCharacter driver)
	{
		SetJumpState(JUMP_NOT_STARTED);

		return inherited(driver);
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

	public string GetTooltipStringTableEntry(void)
	{
		switch (GetJumpState())
		{
			default: return "JumpLabelTooltip";
			case JUMP_STARTED: return "JumpLabelTooltipStarted";
			case JUMP_CONDITION_CHECK: return "JumpLabelTooltipCheck";
			case JUMP_REBUILD_SCHEDULE: return "JumpLabelTooltipRebuild";
			case JUMP_COMPLETE: return "JumpLabelTooltipComplete";
		}

		// Never executed because of default statement with return in switch above
		return (string)null;
	}

	public string GetTooltip(void)
	{
		return GetStringTable()
			.GetString1(
				GetTooltipStringTableEntry(),
				labelName
				);
	}
};
