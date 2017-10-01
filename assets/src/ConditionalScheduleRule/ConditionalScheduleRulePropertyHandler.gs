include "htmlpropertyhandler.gs"
include "ConditionalScheduleRule.gs"

class ConditionalScheduleRulePropertyHandlerInitializer
{
	ConditionalScheduleRule host_rule;

	public void Init(ConditionalScheduleRule host_rule)
	{
		me.host_rule = host_rule;
	}

	public ConditionalScheduleRule GetHostRule(void) { return host_rule; }
	public StringTable GetStringTable(void) { return host_rule.GetAsset().GetStringTable(); }
};

class ConditionalScheduleRuleEvaluatorRemovePropertyHandler isclass HTMLPropertyHandler, ConditionalScheduleRulePropertyHandlerInitializer
{
	define string entry_removePropertyName = "EvaluatorRemoveProperyName";
	define string entry_removePropertyDescription = "EvaluatorRemoveProperyDescription";

	public string GetPropertyName(string propertyID)
	{
		return GetStringTable().GetString(entry_removePropertyName);
	}

	public string GetPropertyDescription(string propertyID)
	{
		return GetStringTable().GetString(entry_removePropertyDescription);
	}

	public string GetPropertyType(string propertyID) { return "link"; }

	public void SetPropertyValue(string propertyID, PropertyValue value)
	{
		string property = PropStripPrefix(propertyID, "");
		int propertyIndex = Str.ToInt(property);
		if (propertyIndex < 0)
			return;
		ConditionalScheduleRule host = GetHostRule();
		Library[] libs = host.GetEvaluators();
		if (propertyIndex >= libs.size())
			return;
		libs.copy(libs);
		int i;
		libs[propertyIndex, (propertyIndex + 1)] = null;
		host.SetEvaluators(libs);
	}
};

class ConditionalScheduleRuleEvaluatorPropertyHandler isclass HTMLPropertyGroup, ConditionalScheduleRulePropertyHandlerInitializer
{
	define string prefix_remove = "remove/";

	ConditionalScheduleRuleEvaluatorRemovePropertyHandler removeHandler;

	public void Init(ConditionalScheduleRule host_rule)
	{
		inherited(host_rule);
		removeHandler = new ConditionalScheduleRuleEvaluatorRemovePropertyHandler();
		removeHandler.Init(host_rule);

		AddHandler(removeHandler, prefix_remove);
	}

	define public string addPropertyId = "add";
	define public string addWithValuePropertyId = "add/";
	define string entry_addPropertyName = "EvaluatorAddProperyName";
	define string entry_addPropertyDescription = "EvaluatorAddProperyDescription";

	public string GetPropertyName(string propertyID)
	{
		if (PropMatchesPrefix(propertyID, addPropertyId))
			return GetStringTable().GetString(entry_addPropertyName);
		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		if (PropMatchesPrefix(propertyID, addPropertyId))
			return GetStringTable().GetString(entry_addPropertyDescription);
		return inherited(propertyID);
	}

	public string GetPropertyType(string propertyID)
	{
		if (PropMatchesPrefix(propertyID, addPropertyId))
			return "string";
		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		if (PropMatchesPrefix(propertyID, addWithValuePropertyId))
			return PropStripPrefix(propertyID, addWithValuePropertyId);
		else if (PropStripPrefix(propertyID, "") == propertyID)
			return "<kuid:0:0>";
		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, PropertyValue value)
	{
		if (PropMatchesPrefix(propertyID, addPropertyId))
		{
			GetHostRule().AddEvaluatorFromKUIDString(value.AsString());
			return;
		}
		inherited(propertyID, value);
	}

	public string GetDescriptionHTML(void)
	{
		string html = "";

		int i;
		string[] loadErrors = GetHostRule().GetEvaluatorLoadErrors();
		if (loadErrors and loadErrors.size() > 0)
		{
			html = html
				+ HTMLWindow.MakeFontSizeMedium(
					HTMLWindow.MakeBold(GetStringTable().GetString("EvaluatorFailuresHeading"))
					)
				+ "<br>"
				;
			string e_tableContent = "";
			for (i = 0; i < loadErrors.size(); i++)
			{
				e_tableContent = e_tableContent
					+ loadErrors[i];
			}
			html = html
				+ HTMLWindow.MakeTable(e_tableContent);
		}

		html = html
			+ HTMLWindow.MakeFontSizeLarge(
				HTMLWindow.MakeBold(GetStringTable().GetString("EvaluatorHeading"))
				)
			+ "<br>"
			;
		html = html
			+ HTMLWindow.MakeLink(Link(addPropertyId), GetPropertyName(Prop(addPropertyId)), GetPropertyDescription(Prop(addPropertyId)))
			+ "<br>"
			;

		string tableContent = "";
		Library[] libraries = GetHostRule().GetEvaluators();
		for (i = 0; i < libraries.size(); i++)
		{
			string propertyID = removeHandler.Prop((string)i);
			string rowContent = ""
				+ HTMLWindow.MakeCell(
					HTMLWindow.MakeFontSizeMedium(
						BrowserInterface.Quote(libraries[i].GetAsset().GetLocalisedName())
						)
					)
				+ HTMLWindow.MakeCell("")
				+ HTMLWindow.MakeCell(libraries[i].GetAsset().GetKUID().GetHTMLString(), "valign=\"center\"")
				+ HTMLWindow.MakeCell("")
				+ HTMLWindow.MakeCell(
					HTMLWindow.MakeLink(removeHandler.Link(propertyID), removeHandler.GetPropertyName(propertyID), removeHandler.GetPropertyDescription(propertyID)),
					"valign=\"center\""
					)
				;
			tableContent = HTMLWindow.MakeRow(rowContent);
		}
		html = html
			+ HTMLWindow.MakeTable(tableContent)
			+ "<br>"
			;

		return html;
	}
};

class ConditionalScheduleRulePropertyHandler isclass HTMLPropertyGroup, ConditionalScheduleRulePropertyHandlerInitializer
{
	define string prefix_evaluators = "evaluators/";

	ConditionalScheduleRule host_rule;
	ConditionalScheduleRuleEvaluatorPropertyHandler evaluatorHandler;

	public void Init(ConditionalScheduleRule host_rule)
	{
		me.host_rule = host_rule;

		evaluatorHandler = new ConditionalScheduleRuleEvaluatorPropertyHandler();
		evaluatorHandler.Init(host_rule);

		AddHandler(evaluatorHandler, prefix_evaluators);
	}

	public string GetDescriptionHTML(void)
	{
		string html = "";

		int i;
		string spacer = "";
		for (i = 0; i < 50; i++)
			spacer = spacer + "_";
		spacer = spacer
			+ "<br>"
			;

		html = html
			+ evaluatorHandler.GetDescriptionHTML()
			+ spacer
			;

		return html;
	}

	public ConditionalScheduleRuleEvaluatorPropertyHandler GetEvaluatorHandler(void)
	{ return evaluatorHandler; }
};
