include "schedule.gs"

class NamedScheduleLabelInsertCustomCommand isclass CustomCommand
{
	public bool Execute(Train train, int px, int py, int pz) { return true; }
};
