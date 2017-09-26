include "schedule.gs"
include "permitmanagerclient.gs"

class PermitReleaseCustomCommand isclass CustomCommand, PermitManagerClient
{
	public bool Execute(Train train, int px, int py, int pz)
	{
		train.Sniff(state.permitManagerRule, "PermitManager", null, true);
		SendMessage(train, "Release");

		Message msg;
		wait()
		{
			on "PermitManager", "Released", msg:
			{
				if (ValidatePermitManagerMessage(msg))
					break;
				ResendMessage(msg);
				continue;
			}
			on "PermitManager", "Removed", msg:
			{
				if (ValidatePermitManagerMessage(msg))
					break;
				ResendMessage(msg);
				continue;
			}
			on "Schedule", "Abort": { break; }
		}
		train.Sniff(state.permitManagerRule, "PermitManager", null, false);

		return true;
	}

	public bool ShouldStopTrainOnCompletion() { return false; }
};
