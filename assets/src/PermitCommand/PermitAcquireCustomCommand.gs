include "gs.gs"
include "Constructors.gs"
include "Soup.gs"
include "Train.gs"
include "Schedule.gs"

include "PermitManagerShared.gs"

class PermitAcquireCustomCommand isclass CustomCommand
{
	public GameObject manager;
	public Soup typeSoup;
	public Soup objectSoup;
	public PermitScheduleCommandTooltipInterface tooltipInterface;

	public bool Execute(Train train, int px, int py, int pz)
	{
		if (!train)
			return false;
		GameObject go = train.GetActiveDriver();
		if (go == null)
			go = train;

		Soup soup = Constructors.NewSoup();
		soup.SetNamedSoup(PermitManagerConst.PermitTypeSoupTag, typeSoup);
		soup.SetNamedSoup(PermitManagerConst.PermitObjectSoupTag, objectSoup);

		go.Sniff(go, PermitManagerConst.PermitManagerMessageMajor, null, true);
		StringTable stringTable;
		if (tooltipInterface)
		{
			stringTable = tooltipInterface.GetStringTable();
			if (stringTable)
				tooltipInterface.SetTooltip(stringTable.GetString(PermitManagerConst.PermitCommandAcquireRequestTooltipStringTable));
		}
		go.SendMessage(manager,
			PermitManagerConst.PermitManagerMessageMajor,
			PermitManagerConst.PermitScheduleCommandOpCodeAcquire,
			soup
			);

		Message msg;
		Soup msgSoup;
		while (true)
		{
			wait()
			{
				//on PermitManagerConst.PermitManagerMessageMajor, PermitManagerConst.PermitScheduleCommandOpCodeEnqueued, msg:
				on "PermitManager", "Enqueued", msg:
				{
					if (tooltipInterface and stringTable)
						tooltipInterface.SetTooltip(stringTable.GetString(PermitManagerConst.PermitCommandAcquireEnqueuedTooltipStringTable));
					continue;
				}

				// Define Constants syntactically not allowed, inlining string literals
				//on PermitManagerConst.PermitManagerMessageMajor, PermitManagerConst.PermitScheduleCommandOpCodeGranted, msg:
				on "PermitManager", "Granted", msg:
				{
					msgSoup = cast<Soup>(msg.paramSoup);
					if (tooltipInterface and stringTable)
						tooltipInterface.SetTooltip(stringTable.GetString(PermitManagerConst.PermitCommandAcquireGrantedTooltipStringTable));
					break;
				}
			}
		}
		go.Sniff(go, PermitManagerConst.PermitManagerMessageMajor, null, false);
		return true;
	}
};
