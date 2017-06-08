include "gs.gs"
include "Constructors.gs"
include "Soup.gs"
include "Train.gs"
include "Schedule.gs"

include "PermitManagerShared.gs"

class PermitManagerReleaseCustomCommand isclass CustomCommand
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

		train.SendMessage(manager,
			PermitManagerConst.PermitManagerMessageMajor,
			PermitManagerConst.PermitManagerScheduleCommandOpCodeRelease,
			soup
			);

		return true;
	}
};
