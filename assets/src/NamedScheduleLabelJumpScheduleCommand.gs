include "defaultdriverschedulecommand.gs"
include "drivercommandshared.gs"

class NamedScheduleLabelJumpScheduleCommand isclass DefaultDriverScheduleCommand
{
	define string KUID_LABEL_COMMAND_ENTRY = "NamedScheduleLabelInsertCommand";
	define int JUMP_NOT_STARTED = 0;
	define int JUMP_STARTED = 1;
	define int JUMP_CONDITION_CHECK = 2;
	define int JUMP_REBUILD_SCHEDULE = 3;
	define int JUMP_COMPLETE = 4;

	define float continueDrivingThreshhold = 0.8; // 0.8 m/s -> ~3 kph

	int jumpState;

	public string GetJumpStateString(void)
	{
		StringTable stringTable = GetStringTable();
		string result;
		switch (jumpState)
		{
			case JUMP_NOT_STARTED:
				result = stringTable.GetString("JUMP_NOT_STARTED");
				if (!result)
					result = "JUMP_NOT_STARTED";
				break;
			case JUMP_STARTED:
				result = stringTable.GetString("JUMP_STARTED");
				if (!result)
					result = "JUMP_STARTED";
				break;
			case JUMP_CONDITION_CHECK:
				result = stringTable.GetString("JUMP_CONDITION_CHECK");
				if (!result)
					result = "JUMP_CONDITION_CHECK";
				break;
			case JUMP_REBUILD_SCHEDULE:
				result = stringTable.GetString("JUMP_REBUILD_SCHEDULE");
				if (!result)
					result = "JUMP_REBUILD_SCHEDULE";
				break;
			case JUMP_COMPLETE:
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

	string labelName;
	KUID labelKuid;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		labelKuid = DriverCommandShared.GetDepdendantKUID(GetDriverCommand(), KUID_LABEL_COMMAND_ENTRY);
	}

	bool MatchesBaseKuid(KUID testKuid)
	{
		string labelKuidBase = labelKuid.GetBaseString();
		string testKuidBase = testKuid.GetBaseString();
		return labelKuidBase == testKuidBase;
	}

	public bool ShouldExecuteJump(DriverCharacter driver) { return true; }

	thread void PerformJumpOperation(DriverCharacter driver)
	{
		jumpState = JUMP_CONDITION_CHECK;
		if (ShouldExecuteJump(driver))
		{
			jumpState = JUMP_REBUILD_SCHEDULE;

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

		jumpState = JUMP_COMPLETE;
	}

	public bool BeginExecute(DriverCharacter driver)
	{
		if (!driver)
		{
			Exception("NamedScheduleLabelJumpScheduleCommand.BeginExecute> Driver argument is null.");
			return false;
		}
		else if (jumpState != JUMP_NOT_STARTED)
		{
			Exception("NamedScheduleLabelJumpScheduleCommand.BeginExecute> Unable to start, already a jump operation in progress: " + GetJumpStateString() + ".");
			return false;
		}

		jumpState = JUMP_STARTED;
		PerformJumpOperation(driver);

		return true;
	}

	public bool UpdateExecute(DriverCharacter driver)
	{
		switch (jumpState)
		{
			case JUMP_STARTED:
			case JUMP_CONDITION_CHECK:
			case JUMP_REBUILD_SCHEDULE:
				return true;
			case JUMP_COMPLETE: return false;
			default:
				Exception("NamedScheduleLabelJumpScheduleCommand.UpdateExecute> Illegal jump operation status: " + GetJumpStateString());
				return false;
		}

		return inherited(driver);
	}

	public bool EndExecute(DriverCharacter driver)
	{
		jumpState = JUMP_NOT_STARTED;

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
		switch (jumpState)
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
