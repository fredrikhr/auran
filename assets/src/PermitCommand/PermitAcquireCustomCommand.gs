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
		go.SendMessage(manager,
			PermitManagerConst.PermitManagerMessageMajor,
			PermitManagerConst.PermitScheduleCommandOpCodeAcquire,
			soup
			);

		Message msg;
		Soup msgSoup;
		wait()
		{
			// Define Constants syntactically not allowed, inlining string literals
			//on PermitManagerConst.PermitManagerMessageMajor, PermitManagerConst.PermitScheduleCommandOpCodeGranted, msg:
			on "PermitManager", "Granted", msg:
			{
				msgSoup = cast<Soup>(msg.paramSoup);
				break;
			}
		}
		go.Sniff(go, PermitManagerConst.PermitManagerMessageMajor, null, false);
		return true;
	}
};
