//
// StringTable.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//
include "gs.gs"


//! StringTable provides access to an asset's string table.
// \anchor strTab
//
// Any asset can have string table defined in its <n config.txt> file.  String tables are defined
// in a <b string-table> section as follows:
//
//<code>
//string-table
//{
//  guardAnnounce  "All aboard for the train to %0 on platform %1"
//}
//</code>
//
// A string can have up to 10 parameters in the range of [0 - 9].  A string table parameter is 
// identified by the percentage character (<b '%'>) followed by the parameter number.  The methods
// in this class allow a string to be retrieved such that its parameters are substituted with the
// desired string.
//
// For example, consider the <m guardAnnounce> string listed above:
//
//<code>
//StringTable guardStr = anAsset.GetStringTable();
//
//string announce = guardStr.GetString2("guardAnnounce", "Brisvegas", "3");
//</code>
//
// The <m announce> string will be set to <m "All aboard for the train to Brisvegas on platform 3">
// as returned by GetString2().
//
// One useful application of string tables is to use them to store segments of HTML code that can be
// heavily reused with the right parameters such as a generic table row for example.  The Browser
// class also supports the use of string parameters through its Browser::SetParam() method.
//
// See Also:
//     Asset, Browser, HTMLWindow, Interface, ScenarioStringTable, Str, Asset::GetStringTable(),
//     Constructors::GetTrainzStrings()
//
final game class StringTable isclass GSObject
{
	//! Gets the current language version of %Trainz.
	//
	// Returns:
	//     Returns the current language version of %Trainz.
	//
	public native string GetLanguage();

	//! Resets the parameter list of this string table.
	public native void ClearParams();

	//! Sets a parameter to the given text.
	//
	// Note:
	//     See the \ref strTab "class description" for further details on string parameters.
	//
	// Param:  param  Number of the parameter to set.  Must be in the range of [0 - 9].
	// Param:  text   Text to substitute for the parameter specified by <i param>.
	//
	public native void SetParam(int param, string text);

	//! Retrieves a string from the string table with no parameters.
	//
	// Param:  str  Name of the string to retrieve.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public native string GetString(string str);

	//! Helper function to retrieve a string with no parameters from the string table.
	//
	// Param:  str  Name of the string to retrieve.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString0(string str)
	{
		ClearParams();
		return GetString(str);
	}

	//! Helper function to retrieve a string with 1 parameter from the string table.
	//
	// Param:  str   Name of the string to retrieve.
	// Param:  parm  String to replace the first parameter in the retrieved string with.  First
	//               parameter is identified by <m %0> in the source string.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString1(string str, string parm)
	{
		ClearParams();
		SetParam(0, parm);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 2 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString2(string str, string parm0, string parm1)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 3 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString3(string str, string parm0, string parm1, string parm2)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 4 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString4(string str, string parm0, string parm1, string parm2, string parm3)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 5 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	// Param:  parm4  String to replace the fifth parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString5(string str, string parm0, string parm1, string parm2, string parm3, string parm4)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		SetParam(4, parm4);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 6 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	// Param:  parm4  String to replace the fifth parameter in the retrieved string with.
	// Param:  parm5  String to replace the sixth parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString6(string str, string parm0, string parm1, string parm2, string parm3, string parm4, string parm5)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		SetParam(4, parm4);
		SetParam(5, parm5);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 7 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	// Param:  parm4  String to replace the fifth parameter in the retrieved string with.
	// Param:  parm5  String to replace the sixth parameter in the retrieved string with.
	// Param:  parm6  String to replace the seventh parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString7(string str, string parm0, string parm1, string parm2, string parm3, string parm4, string parm5, string parm6)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		SetParam(4, parm4);
		SetParam(5, parm5);
		SetParam(6, parm6);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 8 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	// Param:  parm4  String to replace the fifth parameter in the retrieved string with.
	// Param:  parm5  String to replace the sixth parameter in the retrieved string with.
	// Param:  parm6  String to replace the seventh parameter in the retrieved string with.
	// Param:  parm7  String to replace the eighth parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString8(string str, string parm0, string parm1, string parm2, string parm3, string parm4, string parm5, string parm6, string parm7)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		SetParam(4, parm4);
		SetParam(5, parm5);
		SetParam(6, parm6);
		SetParam(7, parm7);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 9 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	// Param:  parm4  String to replace the fifth parameter in the retrieved string with.
	// Param:  parm5  String to replace the sixth parameter in the retrieved string with.
	// Param:  parm6  String to replace the seventh parameter in the retrieved string with.
	// Param:  parm7  String to replace the eighth parameter in the retrieved string with.
	// Param:  parm8  String to replace the ninth parameter in the retrieved string with.
	//
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString9(string str, string parm0, string parm1, string parm2, string parm3, string parm4, string parm5, string parm6, string parm7, string parm8)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		SetParam(4, parm4);
		SetParam(5, parm5);
		SetParam(6, parm6);
		SetParam(7, parm7);
		SetParam(8, parm8);
		return GetString(str);
	}

	//! Helper function to retrieve a string with 10 parameters from the string table.
	//
	// Param:  str    Name of the string to retrieve.
	// Param:  parm0  String to replace the first parameter in the retrieved string with.
	// Param:  parm1  String to replace the second parameter in the retrieved string with.
	// Param:  parm2  String to replace the third parameter in the retrieved string with.
	// Param:  parm3  String to replace the fourth parameter in the retrieved string with.
	// Param:  parm4  String to replace the fifth parameter in the retrieved string with.
	// Param:  parm5  String to replace the sixth parameter in the retrieved string with.
	// Param:  parm6  String to replace the seventh parameter in the retrieved string with.
	// Param:  parm7  String to replace the eighth parameter in the retrieved string with.
	// Param:  parm8  String to replace the ninth parameter in the retrieved string with.
	// Param:  parm9  String to replace the tenth parameter in the retrieved string with.
	// 
	// Returns:
	//     Returns the named string retrieved from this string table if possible, an empty string
	//     otherwise.
	//
	public string GetString10(string str, string parm0, string parm1, string parm2, string parm3, string parm4, string parm5, string parm6, string parm7, string parm8, string parm9)
	{
		ClearParams();
		SetParam(0, parm0);
		SetParam(1, parm1);
		SetParam(2, parm2);
		SetParam(3, parm3);
		SetParam(4, parm4);
		SetParam(5, parm5);
		SetParam(6, parm6);
		SetParam(7, parm7);
		SetParam(8, parm8);
		SetParam(9, parm9);
		return GetString(str);
	}
};
