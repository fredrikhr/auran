include "scenariobehavior.gs"
include "ConditionalScheduleRulePropertyHandler.gs"

class ConditionalScheduleRule isclass ScenarioBehavior
{
	ConditionalScheduleRulePropertyHandler handler;
	string[] evaluator_load_errors;
	Library[] evaluators;

	public void Init(Asset asset)
	{
		inherited(asset);

		evaluator_load_errors = new string[0];
		evaluators = new Library[0];

		handler = new ConditionalScheduleRulePropertyHandler();
		handler.Init(me);
		SetPropertyHandler(handler);
	}

	public bool AddEvaluator(Library lib)
	{
		if (!lib)
			return false;
		int i;
		bool newLib = true;
		for (i = 0; i < evaluators.size(); i++)
		{
			if (evaluators[i] == lib)
			{
				newLib = false;
				break;
			}
		}
		if (newLib)
		{
			evaluators[evaluators.size()] = lib;
			evaluator_load_errors = new string[0];
		}
		return newLib;
	}

	define string entry_kuidParseErrorText = "KuidParseErrorText";
	define string entry_kuidParseErrorDesc = "KuidParseErrorDescription";
	define string entry_libLoadErrorText = "EvaluatorLibraryLoadErrorText";
	define string entry_libLoadErrorDesc = "EvaluatorLibraryLoadErrorDescription";
	define string entry_retryText = "EvaluatorRetryAddText";
	define string entry_retryDesc = "EvaluatorRetryAddTooltip";

	public StringTable GetStringTable(void) { return GetAsset().GetStringTable(); }

	void AddEvaluatorLoadError(string textEntry, string tooltipEntry, string kuidString)
	{
		string kuidStringQuoted = BrowserInterface.Quote(kuidString);
		StringTable strings = GetStringTable();
		ConditionalScheduleRuleEvaluatorPropertyHandler evalHandler = handler.GetEvaluatorHandler();
		string retryPropertyId = ConditionalScheduleRuleEvaluatorPropertyHandler.addWithValuePropertyId + kuidString;

		string spacerCell = HTMLWindow.MakeCell("");
		string errorText = HTMLWindow.MakeLink("", strings.GetString1(textEntry, kuidStringQuoted), strings.GetString(tooltipEntry));
		string errorCell = HTMLWindow.MakeCell(errorText);

		string retryText = HTMLWindow.MakeLink(evalHandler.Link(retryPropertyId), strings.GetString(entry_retryText), strings.GetString(entry_retryDesc));
		string retryCell = HTMLWindow.MakeCell(retryText);

		string errorRow = HTMLWindow.MakeRow(""
			+ errorCell
			+ spacerCell
			+ retryCell
		);

		evaluator_load_errors[evaluator_load_errors.size()] = errorRow;
	}

	public bool AddEvaluatorFromKUIDString(string kuidString)
	{
		Soup kuidSoup = Constructors.NewSoup();
		kuidSoup.SetNamedTag("kuid", kuidString);
		KUID kuidValue = kuidSoup.GetNamedTagAsKUID("kuid");
		if (!kuidValue)
		{
			AddEvaluatorLoadError(entry_kuidParseErrorText, entry_kuidParseErrorDesc, kuidString);
			return false;
		}
		Library lib = World.GetLibrary(kuidValue);
		if (!lib)
		{
			AddEvaluatorLoadError(entry_libLoadErrorText, entry_libLoadErrorDesc, kuidString);
			return false;
		}
		return AddEvaluator(lib);
	}

	public Library[] GetEvaluators(void) { return evaluators; }

	public void SetEvaluators(Library[] libraries)
	{
		if (!libraries)
			evaluators = new Library[0];
		else
			evaluators = libraries;
	}

	public string[] GetEvaluatorLoadErrors(void)
	{ return evaluator_load_errors; }

	public void AppendDependencies(KUIDList io_dependencies)
	{
		if (!io_dependencies)
			return;
		int i;
		for (i = 0; i < evaluators.size(); i++)
		{
			io_dependencies.AddKUID(evaluators[i].GetAsset().GetKUID());
		}
	}

	define string evaluatorsSoupTag = "evaluators";

	public Soup GetProperties(void)
	{
		Soup soup = inherited();
		if (!soup)
			soup = Constructors.NewSoup();

		int i;
		Soup evaluatorsSoup = Constructors.NewSoup();
		for (i = 0; i < evaluators.size(); i++)
		{
			evaluatorsSoup.SetNamedTag(i, evaluators[i].GetAsset().GetKUID());
		}
		soup.SetNamedSoup(evaluatorsSoupTag, evaluatorsSoup);

		return soup;
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);
		if (!soup)
			return;

		Soup evaluatorsSoup = soup.GetNamedSoup(evaluatorsSoupTag);
		if (evaluatorsSoup)
		{
			int cnt = evaluatorsSoup.CountTags();
			int i;
			for (i = 0; i < cnt; i++)
			{
				string tagName = evaluatorsSoup.GetIndexedTagName(i);
				if (!tagName)
					continue;
				KUID evaluatorKuid = evaluatorsSoup.GetNamedTagAsKUID(tagName);
				if (!evaluatorKuid)
					continue;
				Library lib = World.GetLibrary(evaluatorKuid);
				AddEvaluator(lib);
			}
		}
	}
};
