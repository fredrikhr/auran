include "gs.gs"
include "Constructors.gs"
include "Soup.gs"
include "Train.gs"
include "Schedule.gs"

include "PermitManagerShared.gs"

class PermitReleaseCustomCommand isclass CustomCommand
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

		StringTable stringTable;
		if (tooltipInterface)
		{
			stringTable = tooltipInterface.GetStringTable();
			if (stringTable)
				tooltipInterface.SetTooltip(stringTable.GetString(PermitManagerConst.PermitCommandReleaseRequestTooltipStringTable));
		}
		go.Sniff(go, PermitManagerConst.PermitManagerMessageMajor, null, true);
		go.SendMessage(manager,
			PermitManagerConst.PermitManagerMessageMajor,
			PermitManagerConst.PermitScheduleCommandOpCodeRelease,
			soup
			);
		Message msg;
		wait()
		{
			//on PermitManagerConst.PermitManagerMessageMajor, PermitManagerConst.PermitScheduleCommandOpCodeReleased, msg:
			on "PermitManager", "Released", msg:
			{
				if (tooltipInterface and stringTable)
					tooltipInterface.SetTooltip(stringTable.GetString(PermitManagerConst.PermitCommandReleaseReleasedTooltipStringTable));
				break;
			}
			//on PermitManagerConst.PermitManagerMessageMajor, PermitManagerConst.PermitScheduleCommandOpCodeRemoved, msg:
			on "PermitManager", "Removed", msg:
			{
				if (tooltipInterface and stringTable)
					tooltipInterface.SetTooltip(stringTable.GetString(PermitManagerConst.PermitCommandReleaseRemovedTooltipStringTable));
				break;
			}
		}
		go.Sniff(go, PermitManagerConst.PermitManagerMessageMajor, null, false);

		return true;
	}
};
