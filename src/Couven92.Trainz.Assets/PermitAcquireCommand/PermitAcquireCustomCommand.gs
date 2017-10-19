include "schedule.gs"
include "permitmanagerclient.gs"

class PermitAcquireCustomCommand isclass CustomCommand, PermitManagerClient
{
	public bool Execute(Train train, int px, int py, int pz)
	{
		train.Sniff(state.permitManagerRule, "PermitManager", null, true);
		SendMessage(train, "Acquire");

		Message msg;
		wait()
		{
			on "PermitManager", "Granted", msg:
			{
				if (ValidatePermitManagerMessage(msg))
					break;
				ResendMessage(msg);
				continue;
			}

			on "Schedule", "Abort":
			{
				SendMessage(train, "Release");
				break;
			}
		}
		train.Sniff(state.permitManagerRule, "PermitManager", null, false);

		return true;
	}
};
