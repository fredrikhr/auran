include "Soup.gs"
include "Constructors.gs"

include "SectorTrafficManagementConstants.gs"

class SectorTrafficManagementSector
{
	define string sectorIdProp = SectorTrafficManagementSectorConst.sectorIdProp;

	public string identifier;

    public void SetProperties(Soup soup)
	{
		if (!soup)
			return;

		if (soup.GetIndexForNamedTag(sectorIdProp) >= 0)
			identifier = soup.GetNamedTag(sectorIdProp);
	}

	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(sectorIdProp, identifier);

		return soup;
	}
};