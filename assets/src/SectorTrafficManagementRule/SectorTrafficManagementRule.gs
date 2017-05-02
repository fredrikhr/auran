include "ScenarioBehavior.gs"
include "Soup.gs"
include "TrainzGameObject.gs"
include "Asset.gs"
include "StringTable.gs"
include "Constructors.gs"

include "SectorTrafficManagementPermission.gs"

class SectorTrafficManagementRule isclass ScenarioBehavior
{
	define string exclusivePermissionIdStringTableEntry = "exclusivePermssionIdentifier";

	define string identifierSoupName = "id";
	define string permissionListSoupName = "permissions";

	define string removedSoupName = "remove";
	define string removeStringTableEntry = "removeText";

	define string toggleIsSharedPropertyId = "toggle-shared";

	define string permissionAddPropertyId = "permission-add";
	define string permissionAddPropertyName = "permissionAddPropertyName";
	define string permissionAddPropertyDesc = "permissionAddPropertyDesc";

	define string sectorAddPropertyId = "sector-add";
	define string sectorAddPropertyName = "sectorAddPropertyName";
	define string sectorAddPropertyDesc = "sectorAddPropertyDesc";

	define string permissionHeadingStringTableEntry = "permissionsHeading";
	define string permissionTextStringTableEntry = "permissionsHtmlText";
	define string permissionIdHeadingStringTableEntry = "permissionIdHeading";
	define string permissionTypeHeadingStringTableEntry = "permissionTypeHeading";
	define string permissionTypeExclusiveStringTableEntry = "permissionTypeExclusiveText";
	define string permissionTypeSharedStringTableEntry = "permissionTypeSharedText";

	SectorTrafficManagementPermission[] permissions;

	public void Init(Asset asset)
	{
		inherited(asset);

		StringTable stringTable = asset.GetStringTable();

		SetPropertyHandler(null);

		permissions = new SectorTrafficManagementPermission[1];

		SectorTrafficManagementPermission exclusivePermission = new SectorTrafficManagementPermission();
		exclusivePermission.identifier = stringTable.GetString(exclusivePermissionIdStringTableEntry);
		exclusivePermission.isShared = false;

		permissions[0] = exclusivePermission;
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
		string permissionIdSoupName = identifierSoupName;

		inherited(soup);

		Soup permissionListSoup = soup.GetNamedSoup(permissionListSoupName);
		if (permissionListSoup)
		{
			int permissionListIndexCount = permissionListSoup.CountTags();
			for (i = 0; i < permissionListIndexCount; i++)
			{
				Soup permissionSoup = permissionListSoup.GetNamedSoup(permissionListSoup.GetIndexedTagName(i));
				if (!permissionSoup or permissionSoup.GetIndexForNamedTag(permissionIdSoupName) < 0)
					continue;
				string permissionIdentifier = permissionSoup.GetNamedTag(permissionIdSoupName);
				for (j = 0; j < permissions.size(); j++)
				{
					if (permissions[j].identifier == permissionIdentifier)
						break;
				}
				if ((permissionSoup.GetIndexForNamedTag(removedSoupName) >= 0) and (j < permissions.size()))
				{
					permissions[j, j + 1] = null;
				}
				else
				{
					SectorTrafficManagementPermission targetPermission;
					if (j < permissions.size())
						targetPermission = permissions[j];
					else
					{
						targetPermission = new SectorTrafficManagementPermission();
						permissions[permissions.size()] = targetPermission;
					}
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
		soup.SetNamedSoup(permissionListSoupName, permissionListSoup);

		return soup;
	}

	public string GetPropertyName(string propertyID)
	{
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();

		if (propertyID == permissionAddPropertyId)
			return stringTable.GetString(permissionAddPropertyName);
		else if (propertyID == sectorAddPropertyId)
			return stringTable.GetString(sectorAddPropertyName);
		
		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();

		if (propertyID == permissionAddPropertyId)
			return stringTable.GetString(permissionAddPropertyDesc);
		else if (propertyID == sectorAddPropertyId)
			return stringTable.GetString(sectorAddPropertyDesc);

		return inherited(propertyID);
	}

	public string GetPropertyType(string propertyID)
	{
		if (propertyID == permissionAddPropertyId)
			return "string,0,512";
		else if (propertyID == sectorAddPropertyId)
			return "string,0,512";
		else if (propertyID)
		{
			string[] propertyIdComponents = Str.Tokens(propertyID, "/");
			if (propertyIdComponents[0] == "permission")
			{
				if (propertyIdComponents.size() == 3)
				{
					int permissionId = Str.ToInt(propertyIdComponents[1]);
					if (propertyIdComponents[2] == toggleIsSharedPropertyId)
					{
						return "link";
					}
					else if (propertyIdComponents[2] == identifierSoupName)
					{
						return "string,0,512";
					}
					else if (propertyIdComponents[2] == removedSoupName)
					{
						return "link";
					}
				}
			}
		}

		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, string value)
	{
		if (propertyID == permissionAddPropertyId)
		{
			SectorTrafficManagementPermission addPermission = new SectorTrafficManagementPermission();
			addPermission.identifier = value;
			permissions[permissions.size()] = addPermission;
			return;
		}
		else if (propertyID == sectorAddPropertyId)
		{
		}
		else if (propertyID)
		{
			string[] propertyIdComponents = Str.Tokens(propertyID, "/");
			if (propertyIdComponents[0] == "permission")
			{
				if (propertyIdComponents.size() == 3)
				{
					int permissionId = Str.ToInt(propertyIdComponents[1]);
					if (propertyIdComponents[2] == identifierSoupName)
					{
						if (permissionId < permissions.size())
						{
							permissions[permissionId].identifier = value;
							return;
						}
					}
				}
			}
		}

		inherited(propertyID, value);
	}

	public void LinkPropertyValue(string propertyID)
	{
		if (propertyID)
		{
			string[] propertyIdComponents = Str.Tokens(propertyID, "/");
			if (propertyIdComponents[0] == "permission")
			{
				if (propertyIdComponents.size() == 3)
				{
					int permissionId = Str.ToInt(propertyIdComponents[1]);
					if (propertyIdComponents[2] == toggleIsSharedPropertyId)
					{
						if (permissions.size() > permissionId)
						{
							permissions[permissionId].isShared = !(permissions[permissionId].isShared);
							return;
						}
					}
					else if (propertyIdComponents[2] == removedSoupName)
					{
						if (permissions.size() > permissionId)
						{
							permissions[permissionId, permissionId + 1] = null;
							return;
						}
					}
				}
			}
		}

		inherited(propertyID);
	}

	public string GetDescriptionHTML(void)
	{
		int i;
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();

		string htmlStart = "<html><body>";
		string headingSection = 
			"<h1>" + 
			asset.GetLocalisedName() + 
			"</h1>" + 
			"<br>" + 
			"<p>" + 
			asset.GetLocalisedDescription() + 
			"</p>" + 
			"<br>--------------------<br>";
		string permissionsSection = 
			"<b>" + stringTable.GetString(permissionHeadingStringTableEntry) + "</b>" +
			"<p>" + stringTable.GetString(permissionTextStringTableEntry) + "</p>" +
			"<table><tr><td><b>" +
			stringTable.GetString(permissionIdHeadingStringTableEntry) +
			"</b></td><td><b>" +
			stringTable.GetString(permissionTypeHeadingStringTableEntry) +
			"</b></td><td></td></tr>";
		for (i = 0; i < permissions.size(); i++)
		{
			permissionsSection = permissionsSection +
				"<tr>" +
				"<td><a href=\"live://property/permission/" + i + "/" + identifierSoupName + "\">" + permissions[i].identifier + "</a></td>" +
				"<td>" + "<a href=\"live://property/permission/" + i + "/" + toggleIsSharedPropertyId + "\">"
				;
			if (permissions[i].isShared)
				permissionsSection = permissionsSection + stringTable.GetString(permissionTypeSharedStringTableEntry);
			else
				permissionsSection = permissionsSection + stringTable.GetString(permissionTypeExclusiveStringTableEntry);
			permissionsSection = permissionsSection +
				"</a>" +
				"</td>" +
				"<td>" +
				"<a href=\"live://property/permission/" + i + "/" + removedSoupName + "\">" + stringTable.GetString(removeStringTableEntry) + "</a>" +
				"</td>" +
				"</tr>";
		}
		permissionsSection = permissionsSection +
			"</table>" +
			"<a href=\"live://property/" + permissionAddPropertyId + "\">" + "Add new Permission" + "</a>" +
			"<br>--------------------<br>";
		string htmlEnd = "</body></html>";
		
		return 
			htmlStart + 
			headingSection +
			permissionsSection +
			htmlEnd;
	}
};
