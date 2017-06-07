include "gs.gs"
include "Constructors.gs"
include "Soup.gs"
include "Train.gs"
include "Schedule.gs"

include "PermitManagerShared.gs"

class PermitManagerAcquireCustomCommand isclass CustomCommand
{
	public GameObject manager;
	public Soup typeSoup;
	public Soup objectSoup;

	public bool Execute(Train train, int px, int py, int pz)
	{
		if (!train)
	    	return false;

		Soup soup = Constructors.NewSoup();
		soup.SetNamedSoup(PermitManagerConst.PermitTypeSoupTag, typeSoup);
		soup.SetNamedSoup(PermitManagerConst.PermitObjectSoupTag, objectSoup);

		train.Sniff(train, PermitManagerConst.PermitManagerMessageMajor, null, true);
		train.SendMessage(manager,
			PermitManagerConst.PermitManagerMessageMajor,
			PermitManagerConst.PermitManagerScheduleCommandOpCodeAcquire,
			soup
			);

		Message msg;
		Soup msgSoup;
		wait()
		{
			on PermitManagerConst.PermitManagerMessageMajor, PermitManagerConst.PermitManagerScheduleCommandOpCodeGranted, msg:
			{
				msgSoup = cast<Soup>(msg.paramSoup);
				break;
			}
		}
		train.Sniff(train, PermitManagerConst.PermitManagerMessageMajor, null, false);
		return true;
	}
};
