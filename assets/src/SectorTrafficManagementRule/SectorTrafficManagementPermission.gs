include "Soup.gs"
include "Constructors.gs"

class SectorTrafficManagementPermission
{
	define string identifierSoupName = "id";
	define string isSharedSoupName = "shared";

	public string identifier;
	public bool isShared;

	public void SetProperties(Soup soup)
	{
		if (!soup)
		{
			return;
		}

		if (soup.GetIndexForNamedTag(identifierSoupName) >= 0)
		{
			identifier = soup.GetNamedTag(identifierSoupName);
		}
		if (soup.GetIndexForNamedTag(isSharedSoupName) >= 0)
		{
			isShared = soup.GetNamedTagAsBool(isSharedSoupName, isShared);
		}
	}

	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(identifierSoupName, identifier);
		soup.SetNamedTag(isSharedSoupName, isShared);

		return soup;
	}
};
