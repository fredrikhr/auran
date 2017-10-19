include "scenariobehavior.gs"

class NamedScheduleLabelRule isclass ScenarioBehavior
{
	StringTable stringTable;
	string[] labels;

	public void FillDefaultLabels(void)
	{
		int i;
		int max = 20;
		int max_size = ((string)max).size();
		for (i = 1; i <= max; i++)
		{
			labels[labels.size()] = HTMLWindow.PadZerosOnFront((string)i, max_size);
		}
	}

	public void Init(Asset asset)
	{
		inherited(asset);

		stringTable = asset.GetStringTable();

		SetPropertyHandler(null);

		labels = new string[0];
		FillDefaultLabels();
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);

		if (!soup)
			return;

		Soup labelsSoup = soup.GetNamedSoup("labels");
		if (labelsSoup)
		{
			int cnt = labelsSoup.CountTags();
			int i;
			for (i = 0; i < cnt; i++)
			{
				string tagName = labelsSoup.GetIndexedTagName(i);
				if (!tagName)
					continue;
				string itemValue = labelsSoup.GetNamedTag(tagName);
				if (!TrainUtil.AlreadyThereStr(labels, itemValue))
					labels[labels.size()] = itemValue;
			}
		}
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();

		Soup labelsSoup = Constructors.NewSoup();
		int i;
		for (i = 0; i < labels.size(); i++)
			labelsSoup.SetNamedTag(i, labels[i]);
		soup.SetNamedSoup("labels", labelsSoup);

		return soup;
	}

	public string GetPropertyType(string propertyID)
	{
		if (propertyID == "add-label")
			return "string";
		string prefix;
		prefix = "set-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
				return "string";
		}
		prefix = "remove-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
				return "link";
		}

		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		string prefix;
		prefix = "set-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
				return labels[idxValue];
		}

		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, string value)
	{
		if (propertyID == "add-label")
		{
			if (value and !TrainUtil.AlreadyThereStr(labels, value))
				labels[labels.size()] = value;
			return;
		}
		string prefix;
		prefix = "set-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
			{
				if (!value)
					labels[idxValue, idxValue + 1] = null;
				else
					labels[idxValue] = value;
				return;
			}
		}

		inherited(propertyID, value);
	}

	public void LinkPropertyValue(string propertyID)
	{
		string prefix;
		prefix = "remove-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
			{
				labels[idxValue, idxValue + 1] = null;
				return;
			}
		}

		inherited(propertyID);
	}

	public string GetPropertyName(string propertyID)
	{
		if (propertyID == "add-label")
			return stringTable.GetString("AddLabelText");
		string prefix;
		prefix = "set-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
				return stringTable.GetString("SetLabelText");
		}

		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		if (propertyID == "add-label")
			return stringTable.GetString("AddLabelTooltip");
		string prefix;
		prefix = "set-label/";
		if (TrainUtil.HasPrefix(propertyID, prefix))
		{
			string idxString = propertyID[prefix.size(),];
			int idxValue = Str.ToInt(idxString);
			if (idxValue >= 0 and idxValue < labels.size())
				return stringTable.GetString("SetLabelTooltip");
		}

		return inherited(propertyID);
	}

	public string GetDescriptionHTML(void)
	{
		string html = "";
		html = html + HTMLWindow.MakeFontSizeLarge(stringTable.GetString("AssetHeadingText"));
		html = html + "<BR>";
		html = html + HTMLWindow.MakeItalic(GetDescription());
		html = html + "<BR>";
		html = html + "________________________________________________________________________________";
		html = html + "<BR>";
		html = html + HTMLWindow.MakeLink("live://property/add-label", stringTable.GetString("AddLabelText"), stringTable.GetString("AddLabelTooltip"));
		html = html + "<BR>";
		//html = html + HTMLWindow.MakeLink("live://property/remove-all", stringTable.GetString("ClearAllText"));
		if (labels.size() > 0)
		{
			html = html + HTMLWindow.StartTable();
			int i;
			for (i = 0; i < labels.size(); i++)
			{
				html = html + HTMLWindow.StartRow();
				html = html + HTMLWindow.MakeCell(HTMLWindow.RadioButton("", true));
				html = html + HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/set-label/" + (string)i, labels[i], stringTable.GetString("SetLabelTooltip")));
				html = html + HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/remove-label/" + (string)i, stringTable.GetString("RemoveLabelText"), stringTable.GetString("RemoveLabelTooltip")));
				html = html + HTMLWindow.EndRow();
			}
			html = html + HTMLWindow.EndTable();
		}

		return html;
	}
};
