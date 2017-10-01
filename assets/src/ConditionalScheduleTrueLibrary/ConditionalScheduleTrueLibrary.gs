include "library.gs"
include "ConditionalScheduleLibrary.gs"

class ConditionalScheduleTrueLibrary isclass ConditionalScheduleLibrary
{
	public bool EvaluateCondition(DriverCharacter driver, Soup executeSoup)
	{ return true; }
};
