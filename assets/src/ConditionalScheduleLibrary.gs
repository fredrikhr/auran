include "library.gs"

class ConditionalScheduleLibrary isclass Library
{
	public bool EvaluateCondition(DriverCharacter driver, Soup executeSoup)
	{
		string __func__ = "ConditionalScheduleLibrary.EvaluateCondition";
		Exception(__func__ + "> Function not overridden.");
		return false;
	}

	public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
	{
		if (function == "EvaluateCondition" and objectParam and objectParam.size() >= 2)
		{
			DriverCharacter driver = cast<DriverCharacter>(objectParam[0]);
			Soup soup = cast<Soup>(objectParam[1]);
			return (string)((int)EvaluateCondition(driver, soup));
		}
		return inherited(function, stringParam, objectParam);
	}
};
