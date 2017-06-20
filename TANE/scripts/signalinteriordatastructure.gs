

include "locomotive.gs"

class SignalInteriorCabinData isclass CabinData
{
	public bool cd_atp_on = false;
	public bool cd_atp_penalty = false;
	public int cd_m_CurrentStatePassed = -1;
	public bool cd_m_stopped = true;
	public float cd_previousspd = 0.0f;
	public string cd_nextStation = "";
};