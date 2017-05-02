include "Soup.gs"
include "Constructors.gs"

include "SectorTrafficManagementConstants.gs"

class SectorTrafficManagementPermission
{
	define string permissionIdProp = SectorTrafficManagementPermissionConst.permissionIdProp;
	define string permissionIsSharedProp = SectorTrafficManagementPermissionConst.permissionIsSharedProp;

	public string identifier;
	public bool isShared;

	public void SetProperties(Soup soup)
	{
		if (!soup)
		{
			return;
		}

		if (soup.GetIndexForNamedTag(permissionIdProp) >= 0)
		{
			identifier = soup.GetNamedTag(permissionIdProp);
		}
		if (soup.GetIndexForNamedTag(permissionIsSharedProp) >= 0)
		{
			isShared = soup.GetNamedTagAsBool(permissionIsSharedProp, isShared);
		}
	}

	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(permissionIdProp, identifier);
		soup.SetNamedTag(permissionIsSharedProp, isShared);

		return soup;
	}
};
