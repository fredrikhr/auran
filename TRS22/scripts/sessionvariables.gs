//
// SessionVariables.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "Soup.gs"
include "Constructors.gs"
include "Library.gs"


//
// VariableInfo is a private class.
// Don't use it, as it will change in future versions.
//
final class SessionVariable_VariableInfo
{
	public string name;
	public int minimum;
	public int maximum;
	public string value;
};


//
// NOTE:
//   Because Library.gs support is not complete as of writing this class,
//   this script is present in the core Scripts folder, and will be included
//   using the 'include "SessionVariables.gs"' syntax. Support for this usage
//   will be maintained in future versions of Trainz.
//
// HOWEVER:
//   You must still use World.GetLibrary(..) to access this library object.
//   The asset for this SessionVariables.gs script is <KUID:-3:10197>.
//
final game class SessionVariables isclass Library
{
	public define int NO_MINIMUM = -1000000;
	public define int NO_MAXIMUM = 1000000;


	public void SetVariableMinimum(string variableName, int minimum);
	public void ClearVariableMinimum(string variableName);
	public int GetVariableMinimum(string variableName);
	public bool HasVariableMinimum(string variableName);

	public void SetVariableMaximum(string variableName, int maximum);
	public void ClearVariableMaximum(string variableName);
	public int GetVariableMaximum(string variableName);
	public bool HasVariableMaximum(string variableName);
	

	public int GetVariableNumber(string variableName);
	public void SetVariableNumber(string variableName, int amount);
	public void IncVariableNumber(string variableName, int amount);
	public void DecVariableNumber(string variableName, int amount);

	public string GetVariableString(string variableName);
	public void SetVariableString(string variableName, string value);

	public void ClearVariable(string variableName);
	public bool HasVariable(string variableName);


		// load / save support
	public Soup GetProperties(void);
	public void SetProperties(Soup soup);


	//
	// PRIVATE IMPLEMENTATION
	//
	
	SessionVariable_VariableInfo[] variables = new SessionVariable_VariableInfo[0];



	SessionVariable_VariableInfo GetVariableInfo(string variableName)
	{
		int i;
		Str.ToLower(variableName);

		for (i = 0; i < variables.size(); i++)
			if (variables[i].name == variableName)
				return variables[i];

		return null;
	}


	
	SessionVariable_VariableInfo AddVariableInfo(string variableName)
	{
		SessionVariable_VariableInfo info;

		if (!variableName or !variableName.size())
		{
			Exception("SessionVariables.AddVariableInfo> empty variable name");
			return null;
		}

		info = GetVariableInfo(variableName);
		if (info)
			return info;

		Str.ToLower(variableName);
		
		info = new SessionVariable_VariableInfo();
		info.name = variableName;
		info.minimum = NO_MINIMUM;
		info.maximum = NO_MAXIMUM;

		variables[variables.size()] = info;

		return info;
	}

	

	public void SetVariableMinimum(string variableName, int minimum)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		info.minimum = minimum;
	}

	public void ClearVariableMinimum(string variableName)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		info.minimum = NO_MINIMUM;
	}

	public int GetVariableMinimum(string variableName)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		return info.minimum;
	}

	public bool HasVariableMinimum(string variableName)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		return info.minimum != NO_MINIMUM;
	}



	public void SetVariableMaximum(string variableName, int maximum)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		info.maximum = maximum;
	}

	public void ClearVariableMaximum(string variableName)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		info.maximum = NO_MAXIMUM;
	}

	public int GetVariableMaximum(string variableName)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		return info.maximum;
	}

	public bool HasVariableMaximum(string variableName)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		return info.maximum != NO_MAXIMUM;
	}
	


	public int GetVariableNumber(string variableName)
	{
		SessionVariable_VariableInfo info = GetVariableInfo(variableName);

		if (info)
			return Str.ToInt(info.value);

		return 0;
	}

	public void SetVariableNumber(string variableName, int number)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);

		if (number > info.maximum)
			number = info.maximum;
		else if (number < info.minimum)
			number = info.minimum;
		info.value = (string)number;
	}

	public void IncVariableNumber(string variableName, int amount)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);
		int number = Str.ToInt(info.value);

		number = number + amount;
		
		if (number > info.maximum)
			number = info.maximum;
		else if (number < info.minimum)
			number = info.minimum;
		info.value = (string)number;
	}

	public void DecVariableNumber(string variableName, int amount)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);
		int number = Str.ToInt(info.value);

		number = number - amount;

		if (number > info.maximum)
			number = info.maximum;
		else if (number < info.minimum)
			number = info.minimum;
		info.value = (string)number;
	}



	public string GetVariableString(string variableName)
	{
		SessionVariable_VariableInfo info = GetVariableInfo(variableName);

		if (info)
			return info.value;

		return "";
	}

	public void SetVariableString(string variableName, string value)
	{
		SessionVariable_VariableInfo info = AddVariableInfo(variableName);
		info.value = value;
	}

	public void ClearVariable(string variableName)
	{
		int i;
		for (i = 0; i < variables.size(); i++)
			if (variables[i].name == variableName)
			{
				variables[i, i+1] = null;
				break;
			}
	}

	public bool HasVariable(string variableName)
	{
		SessionVariable_VariableInfo info = GetVariableInfo(variableName);
		return (info != null);
	}



	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();
		int i;

		for (i = 0; i < variables.size(); i++)
		{
			SessionVariable_VariableInfo info = variables[i];
			Soup out = Constructors.NewSoup();
			
			out.SetNamedTag("name", info.name);
			
			if (info.minimum != NO_MINIMUM)
				out.SetNamedTag("minimum", info.minimum);
			
			if (info.maximum != NO_MAXIMUM)
				out.SetNamedTag("maximum", info.maximum);

			out.SetNamedTag("value", info.value);

			soup.SetNamedSoup((string)i, out);
		}

		return soup;
	}
	

	public void SetProperties(Soup soup)
	{
    // Ensure that we always reload from scratch.
    variables = new SessionVariable_VariableInfo[0];

    //
		int i = 0;
		while (1)
		{
			Soup vari = soup.GetNamedSoup((string)(i++));
			if (!vari.CountTags())
				break;

			string variableName = vari.GetNamedTag("name");
			SessionVariable_VariableInfo info = AddVariableInfo(variableName);
			
			if (!info)
				continue;
			
			info.minimum = vari.GetNamedTagAsInt("minimum", NO_MINIMUM);
			info.maximum = vari.GetNamedTagAsInt("maximum", NO_MAXIMUM);
			info.value = vari.GetNamedTag("value");
		}
	}

};



