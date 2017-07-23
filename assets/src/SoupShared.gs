include "constructors.gs"
include "soup.gs"
include "propertyobject.gs"

static class SoupShared
{
	public string[] GetStringArrayFromArraySoup(Soup arraySoup, string itemTagName, bool skipEmpty);
	public string[] GetStringArrayFromArraySoup(Soup arraySoup, string itemTagName) { return GetStringArrayFromArraySoup(arraySoup, itemTagName, false); }
	public string[] GetStringArrayFromArraySoup(Soup arraySoup, bool skipEmpty) { return GetStringArrayFromArraySoup(arraySoup, (string)null, false); }
	public string[] GetStringArrayFromArraySoup(Soup arraySoup) { return GetStringArrayFromArraySoup(arraySoup, false); }

	public Soup[] GetSoupArrayFromArraySoup(Soup arraySoup);

	public Soup GetArraySoupFromSoupArray(Soup rootSoup, Soup[] soupArray);
	public Soup GetArraySoupFromSoupArray(Soup[] soupArray) { return GetArraySoupFromSoupArray(cast<Soup>(null), soupArray); }

	public string[] GetStringArrayFromArraySoup(Soup arraySoup, string itemTagName, bool skipEmpty)
	{
		if (!arraySoup)
			return cast<string[]>(null);
		int cnt = arraySoup.CountTags();
		int i;
		string[] strings = new string[0];
		for (i = 0; i < cnt; i++)
		{
			string tagName = arraySoup.GetIndexedTagName(i);
			if (!tagName)
				continue;
			string item;
			if (itemTagName)
			{
				Soup itemSoup = arraySoup.GetNamedSoup(tagName);
				if (!itemSoup)
					continue;
				item = itemSoup.GetNamedTag(itemTagName);
			}
			else
				item = arraySoup.GetNamedTag(tagName);

			if (skipEmpty and !item)
				continue;
			strings[strings.size()] = item;
		}
		return strings;
	}

	public Soup[] GetSoupArrayFromArraySoup(Soup arraySoup)
	{
		if (!arraySoup)
			return cast<Soup[]>(null);
		int cnt = arraySoup.CountTags();
		int i;
		Soup[] soups = new Soup[0];
		for (i = 0; i < cnt; i++)
		{
			string tagName = arraySoup.GetIndexedTagName(i);
			if (!tagName)
				continue;
			Soup itemSoup = arraySoup.GetNamedSoup(tagName);

			if (!itemSoup)
				continue;
			soups[soups.size()] = itemSoup;
		}
		return soups;
	}

	public Soup GetArraySoupFromSoupArray(Soup rootSoup, Soup[] soupArray)
	{
		if (!rootSoup)
			rootSoup = Constructors.NewSoup();
		if (!soupArray)
			return rootSoup;
		int i;
		for (i = 0; i < soupArray.size(); i++)
			rootSoup.AddUniqueNamedSoup(soupArray[i]);
		return rootSoup;
	}
};
