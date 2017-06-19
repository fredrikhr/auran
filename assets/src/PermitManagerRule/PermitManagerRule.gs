include "gs.gs"
include "Soup.gs"
include "Asset.gs"
include "StringTable.gs"
include "ScenarioBehavior.gs"
include "PropertyObject.gs"

include "PermitManagerShared.gs"

class PermitManagerRule isclass ScenarioBehavior
{
	StringTable stringTable;
	PermitType[] types;
	PermitObject[] objects;

	public string GetPropertyName(string propertyID)
	{
		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		return inherited(propertyID);
	}

	public string GetPropertyType(string propertyID)
	{
		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, string value, int index)
	{
		inherited(propertyID, value, index);
	}

	public void SetPropertyValue(string propertyID, string value)
	{
		inherited(propertyID, value);
	}

	public void SetPropertyValue(string propertyID, float value)
	{
		inherited(propertyID, value);
	}

	public void SetPropertyValue(string propertyID, int value)
	{
		inherited(propertyID, value);
	}

	public void LinkPropertyValue(string propertyID)
	{
		inherited(propertyID);
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);

		if (!soup)
			return;
		types = PermitConverter.GetPermitTypesFromSoup(soup.GetNamedSoup(PermitManagerConst.PermitTypesSoupTag));
		objects = PermitConverter.GetPermitObjectsFromSoup(soup.GetNamedSoup(PermitManagerConst.PermitObjectsSoupTag), types);
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();

		if (types)
			soup.SetNamedSoup(PermitManagerConst.PermitTypesSoupTag, PermitConverter.GetSoupFromPermitTypes(types));
		if (objects)
			soup.SetNamedSoup(PermitManagerConst.PermitObjectsSoupTag, PermitConverter.GetSoupFromPermitObjects(objects));

		return soup;
	}

	thread void MessageLoop()
	{
		GameObject src, dst;
		Soup soup;
		Message msg;
		while (true)
		{
			wait()
			{
				on "PermitManager", "Acquire", msg:
				{
					src = cast<GameObject>(msg.src);
					dst = cast<GameObject>(msg.dst);
					soup = cast<Soup>(msg.paramSoup);
				}
				on "PermitManager", "Release", msg:
				{
					src = cast<GameObject>(msg.src);
					dst = cast<GameObject>(msg.dst);
					soup = cast<Soup>(msg.paramSoup);
				}
			}
		}
	}

	public void Init(Asset asset)
	{
		inherited(asset);

		stringTable = asset.GetStringTable();

		SetPropertyHandler(null);

		MessageLoop();
	}
};
