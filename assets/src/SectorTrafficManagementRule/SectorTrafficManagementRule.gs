include "ScenarioBehavior.gs"
include "Soup.gs"
include "TrainzGameObject.gs"
include "Asset.gs"
include "StringTable.gs"

class SectorTrafficManagementRule isclass ScenarioBehavior
{
	define string sectorAddPropertyId = "sector-add";
	define string sectorAddPropertyName = "sectorAddPropertyName";
	define string sectorAddPropertyDesc = "sectorAddPropertyDesc";

	public void Init(Asset asset)
	{
		inherited(asset);

		SetPropertyHandler(null);
	}

	public void Pause(bool shouldPause)
	{
	
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);


	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();



		return soup;
	}

	public string GetPropertyName(string propertyID)
	{
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();
		if (propertyID == sectorAddPropertyId)
		{
			return stringTable.GetString(sectorAddPropertyName);
		}
		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();
		if (propertyID == sectorAddPropertyId)
		{
			return stringTable.GetString(sectorAddPropertyDesc);
		}
		return inherited(propertyID);
	}

	public string GetPropertyType(string propertyID)
	{
		if (propertyID == sectorAddPropertyId)
		{
			return "string,0,512";
		}
		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, string value)
	{
		if (propertyID == sectorAddPropertyId)
		{
			
			return;
		}
		inherited(propertyID, value);
	}

	public string GetDescriptionHTML(void)
	{
		Asset asset = GetAsset();
		StringTable stringTable = asset.GetStringTable();
		string htmlStart = "<html><body>";
		string htmlEnd = "</body></html>";
		string headingSection = 
			"<h1>" + 
			asset.GetLocalisedName() + 
			"</h1>" + 
			"<br/>" + 
			"<p>" + 
			asset.GetLocalisedDescription() + 
			"</p>" + 
			"<hr/>";
		string addSectorLinkSection =
			"<p>" +
			"<a href=\"live://property/\" + sectorAddPropertyId + "\">" + stringTable.GetString(sectorAddPropertyName) + "</a>" + "<br/>" +
			"<em>" + stringTable.GetString(sectorAddPropertyDesc) + "</em>" +
			"</p>" +
			"<hr/>";
		return 
			htmlStart + 
			headingSection + 
			htmlEnd;
	}
};
