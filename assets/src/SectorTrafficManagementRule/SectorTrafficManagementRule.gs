include "ScenarioBehavior.gs"
include "Soup.gs"
include "TrainzGameObject.gs"
include "Asset.gs"
include "StringTable.gs"
include "Constructors.gs"

include "SectorTrafficManagementConstants.gs"
include "SectorTrafficManagementPermission.gs"
include "SectorTrafficManagementSector.gs"

class SectorTrafficManagementRule isclass ScenarioBehavior
{
    define string listItemAddProp = SectorTrafficManagementConst.listItemAddProp;

    define string listItemRemoveProp = SectorTrafficManagementConst.listItemRemoveProp;
	define string listItemRemoveHeading = SectorTrafficManagementConst.listItemRemoveHeading;

    define string permissionProp = SectorTrafficManagementPermissionConst.permissionProp;

	define string permissionHeadingEntry = SectorTrafficManagementPermissionConst.permissionHeadingEntry;
	define string permissionDescEntry = SectorTrafficManagementPermissionConst.permissionDescEntry;

	define string permissionAddDescEntry = SectorTrafficManagementPermissionConst.permissionAddDescEntry;
	define string permissionRemoveDescEntry = SectorTrafficManagementPermissionConst.permissionRemoveDescEntry;

	define string permissionIdHeadingEntry = SectorTrafficManagementPermissionConst.permissionIdHeadingEntry;
	define string permissionIdDescEntry = SectorTrafficManagementPermissionConst.permissionIdDescEntry;
	define string permissionIdProp = SectorTrafficManagementPermissionConst.permissionIdProp;

	define string permissionIsSharedHeadingEntry = SectorTrafficManagementPermissionConst.permissionIsSharedHeadingEntry;
	define string permissionIsSharedDescEntry = SectorTrafficManagementPermissionConst.permissionIsSharedDescEntry;
	define string permissionIsSharedProp = SectorTrafficManagementPermissionConst.permissionIsSharedProp;
	define string permissionIsSharedValueEntryTrue = SectorTrafficManagementPermissionConst.permissionIsSharedValueEntryTrue;
	define string permissionIsSharedValueEntryFalse = SectorTrafficManagementPermissionConst.permissionIsSharedValueEntryFalse;

	define string defaultPermissionIdentifier = "defaultPermissionIdentifier";

    define string sectorProp = SectorTrafficManagementSectorConst.sectorProp;

	define string sectorHeadingEntry = SectorTrafficManagementSectorConst.sectorHeadingEntry;
	define string sectorDescEntry = SectorTrafficManagementSectorConst.sectorDescEntry;

    define string sectorAddDescEntry = SectorTrafficManagementSectorConst.sectorAddDescEntry;
    define string sectorRemoveDescEntry = SectorTrafficManagementSectorConst.sectorRemoveDescEntry;

	define string sectorIdHeadingEntry = SectorTrafficManagementSectorConst.sectorIdHeadingEntry;
	define string sectorIdDescEntry = SectorTrafficManagementSectorConst.sectorIdDescEntry;
	define string sectorIdProp = SectorTrafficManagementSectorConst.sectorIdProp;	

	SectorTrafficManagementPermission[] permissions;
	SectorTrafficManagementSector[] sectors;

	public void Init(Asset asset)
	{
		inherited(asset);

		StringTable stringTable = asset.GetStringTable();

		SetPropertyHandler(null);

		permissions = new SectorTrafficManagementPermission[1];

		SectorTrafficManagementPermission defaultPermission = new SectorTrafficManagementPermission();
		defaultPermission.identifier = stringTable.GetString(defaultPermissionIdentifier);
		defaultPermission.isShared = false;

		permissions[0] = defaultPermission;

		sectors = new SectorTrafficManagementSector[0];
	}

	public void Pause(bool shouldPause)
	{
		if (shouldPause == IsPaused())
			return;
		SetStateFlags(PAUSED, shouldPause);
	}

	public void SetProperties(Soup soup)
	{
		int i, j;
		
		inherited(soup);

		Soup permissionListSoup = soup.GetNamedSoup(permissionProp);
		if (permissionListSoup)
		{
			int permissionListIndexCount = permissionListSoup.CountTags();
			for (i = 0; i < permissionListIndexCount; i++)
			{
				Soup permissionSoup = permissionListSoup.GetNamedSoup(permissionListSoup.GetIndexedTagName(i));
				if (!permissionSoup or permissionSoup.GetIndexForNamedTag(permissionIdProp) < 0)
					continue;
				string permissionIdentifier = permissionSoup.GetNamedTag(permissionIdProp);
				bool removeMatchedPermission = permissionSoup.GetIndexForNamedTag(listItemRemoveProp) >= 0;
				for (j = 0; j < permissions.size(); j++)
				{
					if (permissions[j].identifier == permissionIdentifier)
						break;
				}
				if (j < permissions.size())
				{
					if (removeMatchedPermission)
					{
						permissions[j, j + 1] = null;
					}
					else
					{
						SectorTrafficManagementPermission targetPermission = permissions[j];
						targetPermission.SetProperties(permissionSoup);
					}
				}
				else if (!removeMatchedPermission)
				{
					SectorTrafficManagementPermission targetPermission = new SectorTrafficManagementPermission();
					permissions[permissions.size()] = targetPermission;
					targetPermission.SetProperties(permissionSoup);
				}
			}
		}


	}

	public Soup GetProperties(void)
	{
		int i;
		Soup soup = inherited();

		Soup permissionListSoup = Constructors.NewSoup();
		for (i = 0; i < permissions.size(); i++)
		{
			permissionListSoup.SetNamedSoup(i, permissions[i].GetProperties());
		}
		soup.SetNamedSoup(permissionProp, permissionListSoup);

		return soup;
	}

	string GetSetPermissionPropertyText(string[] propertyIdComponents, int textType, string value)
	{
		int i;

		if (!propertyIdComponents or propertyIdComponents.size() < 1)
			return GetPropertyName(null);

		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();

		if (propertyIdComponents[0] == listItemAddProp)
		{
			switch (textType)
			{
				case -1:	return "string,1,512";
				case 1:		return stringTable.GetString(permissionIdHeadingEntry);
				case 2:		return stringTable.GetString(permissionAddDescEntry);
				case 100:
				{
					for (i = 0; i < permissions.size(); i++)
					{
						if (permissions[i].identifier == value)
							break;
					}
					if (i < permissions.size())
						return "";
					SectorTrafficManagementPermission addPermission = new SectorTrafficManagementPermission();
					addPermission.identifier = value;
					permissions[permissions.size()] = addPermission;
					return value;
				}
				default:	break;
			}
		}
		else if (propertyIdComponents.size() > 1)
		{
			if (propertyIdComponents[1] == listItemRemoveProp)
			{
				switch (textType)
				{
					case -1:	return "link";
					case 2:		return stringTable.GetString(permissionRemoveDescEntry);
					case 99:
					{
						int permissionIdx = Str.ToInt(propertyIdComponents[0]);
						if (permissionIdx < permissions.size())
						{
							permissions[permissionIdx, permissionIdx + 1] = null;
							return cast<string> null;
						}
					}
					default:	break;
				}
			}
			else if (propertyIdComponents[1] == permissionIdProp)
			{
				switch (textType)
				{
					case -1:	return "string,1,512";
					case 0:
					{
						int permissionIdx = Str.ToInt(propertyIdComponents[0]);
						if (permissionIdx < permissions.size())
							return permissions[permissionIdx].identifier;
					}
					case 100:
					{
						int permissionIdx = Str.ToInt(propertyIdComponents[0]);
						if (permissionIdx < permissions.size())
						{
							for (i = 0; i < permissions.size(); i++)
							{
								if (permissions[i].identifier == value)
									return "";
							}
							permissions[permissionIdx].identifier = value;
							return permissions[permissionIdx].identifier;
						}
					}
					case 1:		return stringTable.GetString(permissionIdHeadingEntry);
					case 2:		return stringTable.GetString(permissionIdDescEntry);
					default:	break;
				}
			}
			else if (propertyIdComponents[1] == permissionIsSharedProp)
			{
				switch (textType)
				{
					case -1:	return "link";
					case 0:
					{
						int permissionIdx = Str.ToInt(propertyIdComponents[0]);
						if (permissionIdx < permissions.size())
						{
							if (permissions[permissionIdx].isShared)
								return stringTable.GetString(permissionIsSharedValueEntryTrue);
							else
								return stringTable.GetString(permissionIsSharedValueEntryFalse);
						}
					}
					case 99:
					{
						int permissionIdx = Str.ToInt(propertyIdComponents[0]);
						if (permissionIdx < permissions.size())
						{
							permissions[permissionIdx].isShared = !(permissions[permissionIdx].isShared);
							return GetSetPermissionPropertyText(propertyIdComponents, 0, null);
						}
					}
					case 100:
					{
						int permissionIdx = Str.ToInt(propertyIdComponents[0]);
						if (permissionIdx < permissions.size())
						{
							permissions[permissionIdx].isShared = Str.ToInt(value);
							return GetSetPermissionPropertyText(propertyIdComponents, 0, null);
						}
					}
					case 1:		return stringTable.GetString(permissionIsSharedHeadingEntry);
					case 2:		return stringTable.GetString(permissionIsSharedDescEntry);
					default:	break;
				}
			}
		}

		switch (textType)
		{
			case -1:	return GetPropertyType(null);
			case 0:		return GetPropertyValue(null);
			case 1:		return GetPropertyName(null);
			case 2:		return GetPropertyDescription(null);
			case 99:	LinkPropertyValue(null); return GetPropertyValue(null);
			case 100:	SetPropertyValue(null, value); return GetPropertyValue(null);
			default: 	break;
		}

		return cast<string>(null);
	}

	string GetSetSectorPropertyText(string[] propertyIdComponents, int textType, string value)
	{
		int i;

		if (!propertyIdComponents or propertyIdComponents.size() < 1)
			return GetPropertyName(null);

		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();

		if (propertyIdComponents[0] == listItemAddProp)
		{
			switch (textType)
			{
				case -1:	return "string,1,512";
				case 1:		return stringTable.GetString(sectorIdHeadingEntry);
				case 2:		return stringTable.GetString(sectorIdDescEntry);
				case 100:
				{
					for (i = 0; i < sectors.size(); i++)
					{
						if (sectors[i].identifier == value)
							break;
					}
					if (i < sectors.size())
						return cast<string>(null);
					SectorTrafficManagementSector addsector = new SectorTrafficManagementSector();
					addsector.identifier = value;
					sectors[sectors.size()] = addsector;
					return value;
				}
				default:	break;
			}
		}
		else if (propertyIdComponents.size() > 1)
		{
			if (propertyIdComponents[0] == listItemRemoveProp)
			{
				switch (textType)
				{
					case -1:	return "link";
					case 99:
					{
						int sectorIdx = Str.ToInt(propertyIdComponents[0]);
						if (sectorIdx < sectors.size())
						{
							sectors[sectorIdx, sectorIdx + 1] = null;
							return cast<string>(null);
						}
					}
					default:	break;
				}
			}
			else if (propertyIdComponents[1] == sectorIdProp)
			{
				switch (textType)
				{
					case -1:	return "string,1,512";
					case 0:
					{
						int sectorIdx = Str.ToInt(propertyIdComponents[0]);
						if (sectorIdx < sectors.size())
							return sectors[sectorIdx].identifier;
					}
					case 100:
					{
						int sectorIdx = Str.ToInt(propertyIdComponents[0]);
						if (sectorIdx < sectors.size())
						{
							for (i = 0; i < sectors.size(); i++)
							{
								if (sectors[i].identifier == value)
									return cast<string>(null);
							}
							sectors[sectorIdx].identifier = value;
							return sectors[sectorIdx].identifier;
						}
					}
					case 1:		return stringTable.GetString(sectorIdHeadingEntry);
					case 2:		return stringTable.GetString(sectorIdDescEntry);
					default:	break;
				}
			}
		}

		switch (textType)
		{
			case -1:	return GetPropertyType(null);
			case 0:		return GetPropertyValue(null);
			case 1:		return GetPropertyName(null);
			case 2:		return GetPropertyDescription(null);
			case 99:	LinkPropertyValue(null); return GetPropertyValue(null);
			case 100:	SetPropertyValue(null, value); return GetPropertyValue(null);
			default: 	break;
		}

		return cast<string>(null);
	}

	public string GetPropertyName(string propertyID)
	{
		if (!propertyID)
			return inherited(propertyID);

		string[] propertyIdComponents = Str.Tokens(propertyID, "/");
		if (propertyIdComponents.size() < 1)
			return inherited(propertyID);
		
		if (propertyIdComponents[0] == permissionProp)
			return GetSetPermissionPropertyText(propertyIdComponents[1,], 1, null);
		else if (propertyIdComponents[0] == sectorProp)
			return GetSetSectorPropertyText(propertyIdComponents[1,], 1, null);

		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		if (!propertyID)
			return inherited(propertyID);

		string[] propertyIdComponents = Str.Tokens(propertyID, "/");
		if (propertyIdComponents.size() < 1)
			return inherited(propertyID);
		
		if (propertyIdComponents[0] == permissionProp)
			return GetSetPermissionPropertyText(propertyIdComponents[1,], 2, null);
		else if (propertyIdComponents[0] == sectorProp)
			return GetSetSectorPropertyText(propertyIdComponents[1,], 2, null);

		return inherited(propertyID);
	}

	public string GetPropertyType(string propertyID)
	{
		if (!propertyID)
			return inherited(propertyID);

		string[] propertyIdComponents = Str.Tokens(propertyID, "/");
		if (propertyIdComponents.size() < 1)
			return inherited(propertyID);
		
		if (propertyIdComponents[0] == permissionProp)
			return GetSetPermissionPropertyText(propertyIdComponents[1,], -1, null);
		else if (propertyIdComponents[0] == sectorProp)
			return GetSetSectorPropertyText(propertyIdComponents[1,], -1, null);

		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		if (!propertyID)
			return inherited(propertyID);

		string[] propertyIdComponents = Str.Tokens(propertyID, "/");
		if (propertyIdComponents.size() < 1)
			return inherited(propertyID);
		
		if (propertyIdComponents[0] == permissionProp)
			return GetSetPermissionPropertyText(propertyIdComponents[1,], 0, null);
		else if (propertyIdComponents[0] == sectorProp)
			return GetSetSectorPropertyText(propertyIdComponents[1,], 0, null);

		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, string value)
	{
		if (!propertyID)
			inherited(propertyID, value);

		string[] propertyIdComponents = Str.Tokens(propertyID, "/");
		if (propertyIdComponents.size() < 1)
			inherited(propertyID, value);
		
		if (propertyIdComponents[0] == permissionProp)
			GetSetPermissionPropertyText(propertyIdComponents[1,], 100, value);
		else if (propertyIdComponents[0] == sectorProp)
			GetSetSectorPropertyText(propertyIdComponents[1,], 100, value);

		inherited(propertyID, value);
	}

	public void LinkPropertyValue(string propertyID)
	{
		if (!propertyID)
			inherited(propertyID);

		string[] propertyIdComponents = Str.Tokens(propertyID, "/");
		if (propertyIdComponents.size() < 1)
			inherited(propertyID);
		
		if (propertyIdComponents[0] == permissionProp)
			GetSetPermissionPropertyText(propertyIdComponents[1,], 99, null);
		else if (propertyIdComponents[0] == sectorProp)
			GetSetSectorPropertyText(propertyIdComponents[1,], 99, null);

		inherited(propertyID);
	}

	public string GetDescriptionHTML(void)
	{
		int i;
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();

		string htmlStart = "<html><body>";
		string headingSection = 
			"<b>" + 
			asset.GetLocalisedName() + 
			"</b>" + 
			"<br>" + 
			"<p>" + 
			asset.GetLocalisedDescription() + 
			"</p>" + 
			"<br>--------------------<br>";
		string permissionsSection = 
			"<b>" + stringTable.GetString(permissionHeadingEntry) + "</b>" +
			"<p>" + stringTable.GetString(permissionDescEntry) + "</p>" +
			"<table><tr><td><b>" +
			stringTable.GetString(permissionIdHeadingEntry) +
			"</b></td><td><b>" +
			stringTable.GetString(permissionIsSharedHeadingEntry) +
			"</b></td><td></td></tr>";
		for (i = 0; i < permissions.size(); i++)
		{
			permissionsSection = permissionsSection +
				"<tr>" +
				"<td><a href=\"live://property/" + permissionProp + "/" + i + "/" + permissionIdProp + "\">" + permissions[i].identifier + "</a></td>" +
				"<td>" + "<a href=\"live://property/" + permissionProp + "/" + i + "/" + permissionIsSharedProp + "\">"
				;
			if (permissions[i].isShared)
				permissionsSection = permissionsSection + stringTable.GetString(permissionIsSharedValueEntryTrue);
			else
				permissionsSection = permissionsSection + stringTable.GetString(permissionIsSharedValueEntryFalse);
			permissionsSection = permissionsSection +
				"</a>" +
				"</td>" +
				"<td>" +
				"<a href=\"live://property/" + permissionProp + "/" + i + "/" + listItemRemoveProp + "\">" + stringTable.GetString(listItemRemoveHeading) + "</a>" +
				"</td>" +
				"</tr>";
		}
		permissionsSection = permissionsSection +
			"</table>" +
			"<a href=\"live://property/" + permissionProp + "/" + listItemAddProp + "\">" + stringTable.GetString(permissionAddDescEntry) + "</a>" +
			"<br>--------------------<br>";
		string sectorsSection = 
			"<b>" + stringTable.GetString(sectorHeadingEntry) + "</b>" +
			"<p>" + stringTable.GetString(sectorDescEntry) + "</p>" +
			"<table>" +
			"<tr>" +
			"<td><b>" +
			stringTable.GetString(sectorIdHeadingEntry) +
			"</b></td>" +
			"<td></td>" +
			"</tr>";
		for (i = 0; i < sectors.size(); i++)
		{
			sectorsSection = sectorsSection +
				"<tr>" +
				"<td><a href=\"live://property/" + sectorProp + "/" + i + "/" + sectorIdProp + "\">" + sectors[i].identifier + "</a></td>" +
				"<td>" +
				"<a href=\"live://property/" + sectorProp + "/" + i + "/" + listItemRemoveProp + "\">" + stringTable.GetString(listItemRemoveHeading) + "</a>" +
				"</td>" +
				"</tr>";
		}
		sectorsSection = sectorsSection +
			"</table>" +
			"<a href=\"live://property/" + sectorProp + "/" + listItemAddProp + "\">" + stringTable.GetString(sectorAddDescEntry) + "</a>" +
			"<br>--------------------<br>";
		string htmlEnd = "</body></html>";
		
		return 
			htmlStart + 
			headingSection +
			permissionsSection +
			htmlEnd;
	}
};
