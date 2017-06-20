//=============================================================================
// Name: world.gs
// Desc: 
//=============================================================================
include "TrainzScript.gs"
include "Train.gs"
include "GameObjectID.gs"
include "ScenarioBehavior.gs"
include "DriverCharacter.gs"
include "DriverCommand.gs"
include "Crossing.gs"



//=============================================================================
// Name: NamedObjectInfo
// Desc: The result type used by AsyncObjectSearchResult, see below for more.
//=============================================================================
final class NamedObjectInfo
{
  public GameObject   objectRef;          // A reference to the object, if it's loaded
  public GameObjectID objectId;           // The unique ID of the object
  public string       localisedUsername;  // The display name for the object, in the current language
  public string       categoryString;     // The category code string for the object
};


//=============================================================================
// Name: AsyncObjectSearchResult
// Desc: Stores search parameters and results for an asynchronous asset search.
//       A message of type "ObjectSearch","AsyncResult" will be posted to this
//       object upon search completion. If the search fails for any reason a
//       message of type "ObjectSearch","Failure" will be posted.
//       See World.GetNamedObjectList() for more information about searches.
//=============================================================================
final class AsyncObjectSearchResult isclass GameObject
{
  // NOTE: Test implementation, do not use. This class *will* change.

  //===========================================================================
  // Name: GetResults
  // Desc: Returns the results of the search. If the search is not yet complete
  //       calling this will throw an exception.
  //===========================================================================
  public native NamedObjectInfo[] GetResults();


  //=============================================================================
  // Name: GetSearchErrorCode
  // Desc: Returns any relevant error code for this search.
  // Retn: int - An integer error/warning codes as defined on this object.
  //=============================================================================
  public native int GetSearchErrorCode();


  public define int ERROR_NONE          = 0;    // No error
  public define int ERROR_FLOOD         = 1;    // System is flooded, search was not run
  public define int WARN_MORE_RESULTS   = 100;  // Aborted early because result limit was hit
};



//=============================================================================
// Name: World
// Desc: This class is an interface to many miscellaneous items in the Trainz
//       world including assets, cameras, industries, track marks, vehicles,
//       weather, sound, time, routes, signals, driver commands and driver
//       characters to name a few.
//=============================================================================
final static class World isclass TrainzScriptBase
{
	//! \name   Camera View Modes
	//  \anchor camModes
	//@{
	//! Camera view mode constants.
	//
	// These values can be used to either choose the current camera viewing mode through 
	// World::SetCameraMode() or to restrict a certain camera modes from being accessed
	// through methods such as World::SetCamera(Train,int).
	//
	// See Also:
	//     World::SetCamera(Train,int), World::SetCamera(Vehicle,int), World::SetCameraFlags(),
	//     World::SetCameraMode(), \ref camViewFlags "Camera Flags"
	//

	public define int CAMERA_INTERNAL		= 1;   //!< Internal cabin camera view.
	public define int CAMERA_EXTERNAL		= 2;   //!< External train camera view.
	public define int CAMERA_TRACKING		= 4;   //!< Tracking camera view.
	public define int CAMERA_ROAMING		= 128; //!< Roaming camera view.

	//@}


	//! \name   Camera Flags
	//  \anchor camViewFlags
	//@{
	//! Camera flags are used to control what the user is allowed to do with the camera.
	//
	// These flags are used in addition to the \ref camModes "Camera Mode Flags" to allow/disallow
	// the user from performing certain actions with the camera.
	//
	// See Also:
	//     World::SetCamera(Vehicle,int), World::SetCameraFlags(), 
	//     World::SetCameraMode(), \ref camModes "Camera View Modes"
	//

	public define int CAMERA_SWITCH_VIEWS = 8;      //!< User permitted to swap between the camera views.
	public define int CAMERA_SWITCH_VEHICLES = 16;  //!< User permitted to swap vehicles within the current train.
	public define int CAMERA_SWITCH_TRAINS = 32;    //!< User permitted to swap to other trains which are in the consist menu.
	public define int CAMERA_LOCKED = 64;           //!< User is NOT permitted to adjust camera (i.e. zoom, pan etc.)
	public define int CAMERA_EXTERNAL_AVOID = 256;  //!< External train camera view camera will avoid objects with the camera collide flag.

	//! Normal camera mode where everything is permitted.
	public define int CAMERA_NORMAL = CAMERA_INTERNAL | CAMERA_EXTERNAL | CAMERA_TRACKING | CAMERA_ROAMING | CAMERA_SWITCH_VIEWS | CAMERA_SWITCH_VEHICLES | CAMERA_SWITCH_TRAINS;

	//! Camera mode where everything is permitted and the camera avoids Camera Collidable objects.
	public define int CAMERA_NORMAL_AVOID = CAMERA_NORMAL | CAMERA_EXTERNAL_AVOID;

	//@}


	//! \name   Time Values
	//  \anchor timeSecs
	//@{
	//! Time constants defined in seconds.
	//
	// See Also:
	//     World::GetGameTime(), World::SetGameTime(), World::SetGameTimeRate(),
	//     \ref timeRates "Time Rate Constants"
	//

	public define float TIME_SECOND = 1.0f;                 //!< One second.
	public define float TIME_MINUTE = TIME_SECOND * 60.0f;  //!< One minute defined as 60.0 seconds.
	public define float TIME_HOUR = TIME_MINUTE * 60.0f;    //!< One hour defined as 60.0 minutes (3600.0 seconds).
	public define float TIME_DAY = TIME_HOUR * 24.0f;       //!< One day defined as 24 hours (1440.0 minutes or 86400.0 seconds.

	//@}


	//! \name Weather Type Constants
	//  \anchor  wethrTypes
	//@{
	//! Defines the current state of the weather in %Trainz.
	//
	// A variety of weather conditions are supported and can be changed by using one of these values
	// with the World::SetWeather() method.  The \ref wthrChange "Weather Changeability" settings 
	// define how much the weather state can change during play.
	//
	// See Also:
	//     World::GetWeatherChangeability(), World::GetWeatherType(), World::SetWeather(),
	//     \ref wthrChange "Weather Changeability Constants"
	//

	public define int WEATHER_TYPE_CLEAR = 0;        //!< Clear weather, no clouds, rain or snow.
	public define int WEATHER_TYPE_CLOUDY = 1;       //!< Cloudy weather, no rain.
	public define int WEATHER_TYPE_DRIZZLE = 2;      //!< Drizzle, light rain.
	public define int WEATHER_TYPE_RAIN = 3;         //!< Rainy weather.
	public define int WEATHER_TYPE_STORMY = 4;       //!< Stormy weather that includes lightening and thunder.
	public define int WEATHER_TYPE_LIGHT_SNOW = 5;   //!< Snowing lightly.
	public define int WEATHER_TYPE_MEDIUM_SNOW = 6;  //!< Medium level snow fall.
	public define int WEATHER_TYPE_HEAVY_SNOW = 7;   //!< Heavy snow fall.

	//@}


	//! \name   Weather Changeability Constants
	//  \anchor wthrChange
	//@{
	//! Defines the changeability settings for the weather.
	//
	// The changeability of the weather determines how static or dynamic the weather is.  Weather
	// changeability  does not refer to a specific weather type, but rather if variation from the 
	// current type is allowable.
	//
	// See Also:
	//     World::GetWeatherChangeability(), World::GetWeatherType(), World::SetWeather(),
	//     \ref wethrTypes "Weather Type Constants"
	//

	public define int WEATHER_CHANGEABILITY_NONE = 0;      //!< Weather stays static and won't change.
	public define int WEATHER_CHANGEABILITY_PERIODIC = 1;  //!< Periodic changes in weather.
	public define int WEATHER_CHANGEABILITY_EXTREME = 2;   //!< Extreme and frequent changes in weather.

	//@}


	//! \name   Time Rate Constants
	//  \anchor timeRates
	//@{
	//! Values that define the time rates relative to normal time.  
	//
	// These constants can be used to set the time rate that %Trainz runs out through the 
	// World::SetGameTimeRate() method.
	//
	// See Also:
	//     World::GetGameTime(), World::SetGameTime(), World::SetGameTimeRate(),
	//     \ref timeSecs "Time Values"
	//

	public define int TIME_RATE_1X = 0;      //!< Normal time rate that is the same as real time (i.e. time in %Trainz passes at the same rate you experience it in the real world!).
	public define int TIME_RATE_2X = 1;      //!< 2 times faster than normal time (i.e. double speed).
	public define int TIME_RATE_4X = 2;      //!< 4 times faster than normal time.
	public define int TIME_RATE_8X = 3;      //!< 8 times faster than normal time.
	public define int TIME_RATE_16X = 4;     //!< 16 times faster than normal time.
	public define int TIME_RATE_32X = 5;     //!< 32 times faster than normal time.
	public define int TIME_RATE_60X = 6;     //!< 60 times faster than normal time.
	public define int TIME_RATE_120X = 7;    //!< 120 times faster than normal time.
	public define int TIME_RATE_240X = 8;    //!< 240 times faster than normal time.
	public define int TIME_RATE_360X = 9;    //!< 360 times faster than normal time.
	public define int TIME_RATE_480X = 10;   //!< 480 times faster than normal time.
	public define int TIME_RATE_720X = 11;   //!< 720 times faster than normal time.
	public define int TIME_RATE_960X = 12;   //!< 960 times faster than normal time.
	public define int TIME_RATE_1200X = 13;  //!< 1200 times faster than normal time.
	public define int TIME_RATE_1440X = 14;  //!< 1440 times faster than normal time.

	//@}


  //=============================================================================
  // Name: PERMIT_EDIT_*
  // Desc: Defines the possible world editing modes which can be enabled/disabled
  //       See also: SetWorldEditModeEnabled();
  //=============================================================================
  public define int PERMIT_EDIT_NONE                = 0x0;
  public define int PERMIT_EDIT_TOPOLOGY            = 0x1;
  public define int PERMIT_EDIT_PAINT               = 0x2;
  public define int PERMIT_EDIT_SCENERYOBJECTS      = 0x4;
  public define int PERMIT_EDIT_SCENERYSPLINES      = 0x8;
  public define int PERMIT_EDIT_TRACKSPLINES        = 0x10;
  public define int PERMIT_EDIT_TRACKSIDEOBJECTS    = 0x20;
  public define int PERMIT_EDIT_TRACKMARKS          = 0x40;
  public define int PERMIT_EDIT_TOOLS               = 0x80;
  public define int PERMIT_EDIT_WORLD               = 0x100;
  public define int PERMIT_EDIT_LAYERS              = 0x200;
  public define int PERMIT_EDIT_TRAINS              = 0x400;
  public define int PERMIT_EDIT_CONSISTS            = 0x800;
  public define int PERMIT_EDIT_ALL                 = -1;



  //! Load the route with the given KUID.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  kuid  KUID of route to load.  Use World::FindKUID() to get the desired route KUID.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  // 
  public native bool LoadMap(KUID kuid);


  //! Restarts the current session, valid in Driver only
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  // 
  public native bool RestartSession();


  //! Load the session with the given KUID.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  kuid  KUID of session to load.  Use World::FindKUID() to get the desired session KUID.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  // 
  public native bool LoadSession(KUID kuid);



  //! Load the specified <n .tso> file. Obsolete method.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  asset      The asset in which to find the <n .tso> file.
  // Param:  filename   The relative path name of the <n .tso> file within the asset, without the file extension.
  //
  // Returns:
  //     Returns true if successful, false otherwise.
  //
  public obsolete native bool LoadMapTSO(Asset asset, string filename);



  //=============================================================================
  // Name: CreateTrain
  // Desc: Creates a train consist on the specified track of a Buildable scenery
  //       object. Due to the nature of industry tracks being limited in size, it
  //       is advised that this method be used very carefully.  You really need
  //       to know the length of the consist you are creating as well as the
  //       length and orientation of the track section as well to use this method
  //       effectively. This method was intended to be used for purposes like
  //       creating a vehicle or two on an industry's track, not creating big
  //       consists. You could of course create a big consist if enough track is
  //       available, but that's not really what it is meant for.
  // Note: During multiplayer games this function will only succeed on the server
  // Parm: consist - An array of KUIDs of vehicles that make up the train
  // Parm: obj - Buildable object where track to create the train on can be found
  // Parm: trackName - Name of the track to create the train on
  // Parm: position - Position of where the consist is to be started. This is a
  //       distance in meters measured from where the track section starts.
  // Parm: direction - facing of the new train relative to the track direction
  // Retn: Train - The created train, or 'null' if assets were missing or
  //       the train could not be created at the specified location.
  //=============================================================================
  public native Train CreateTrain(KUID[] consist, Buildable obj, string trackName, float position, bool direction);


  //=============================================================================
  // Name: CreateTrain
  // Desc: Creates a train as described by an array of vehicle KUIDs at the given
  //       track mark in the specified direction.
  // Note: During multiplayer games this function will only succeed on the server
  // Parm: consist - An array of KUIDs of vehicles that make up the train
  // Parm: mark - TrackMark to place train consist at
  // Parm: direction - facing of the train relative to the trackmark direction
  // Retn: Train - The created train, or 'null' if assets were missing or
  //       the train could not be created at the specified location.
  //=============================================================================
  public native Train CreateTrain(KUID[] consist, TrackMark mark, bool direction);


  //=============================================================================
  // Name: CreateTrain
  // Desc: Creates a train as described by an array of vehicle KUIDs at the named
  //       track mark in the specified direction.
  // Note: During multiplayer games this function will only succeed on the server
  // Parm: consist - An array of KUIDs of vehicles that make up the train
  // Parm: trackMarkName - Name of the track mark to create the train consist at
  // Parm: direction - facing of the train relative to the trackmark direction
  // Retn: Train - The created train, or 'null' if assets were missing or
  //       the train could not be created at the specified location.
  //=============================================================================
  public native Train CreateTrain(KUID[] consist, string trackMarkName, bool direction);


  // ============================================================================
  // Name: CreateTrain
  // Desc: Creates a train as described by an array of vehicles KUIDs at the
  //       current position and direction of the specified GSTrackSearch.
  // Note: During multiplayer games this function will only succeed on the server
  // Parm: consist - A list of KUIDs describing the train to create
  // Parm: tracksearch - The location at which to create the train
  // Parm: avoidDerailments - If true this function will fail and return null if
  //       creating the train would cause a derailment (e.g. if the train doesn't
  //       fit, or there is another train in the way)
  // Retn: Train - The created train, or 'null' if assets were missing or
  //       the train could not be created at the specified location.
  // ============================================================================
  public native Train CreateTrain(KUID[] consist, GSTrackSearch tracksearch, bool avoidDerailments);
  public Train CreateTrain(KUID[] consist, GSTrackSearch tracksearch) { return CreateTrain(consist, tracksearch, true); }



	//! Deletes the given vehicle from its train.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  vehicle   Vehicle to be deleted from its train.
	//
	// See Also:
	//     Vehicle::GetMyTrain()
	//
	public native void DeleteVehicle(Vehicle vehicle);



	//! Deletes a train from the current route. 
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Once a train is deleted, its Train reference should not be used.
	//
	// Param:  train  Train to be deleted.
	//
	public native void DeleteTrain(Train train);



	//! Returns the currently focused train.
	//
	// Note:
	//     This does not mean that the camera is focused on this train.
	//     Merely that the user is currently controlling it.
	//
	public native Train GetCurrentTrain();



	//! Sets the camera to target the given train.
	//
	// Param:  focus       Train to focus camera on.
	// Param:  cameraMode  Flags that define the camera mode (i.e. restrictions on movement etc.).
	//                     Use any combination of the \ref camViewFlags "camera flags" and
	//                     \ref camModes "camera view modes" for this argument.
	//
	// Note:
	//     In <bi TRS2006>, the camera must be focused on an object such as a Train, Vehicle or 
	//     MapObject by the scenario script as <bi TRS2006> will not focus the camera automatically.
	//     To do this, use a method such as this one during scenario initialization.
	//
	// See Also:
	//     \ref camViewFlags "Camera Flags", \ref camModes "Camera View Modes"
	//
	public native void SetCamera(Train focus, int cameraMode);



	//! Sets the camera to target the given vehicle.
	//
	// Param:  focus       Train to focus camera on.
	// Param:  cameraMode  Flags that define the camera mode (i.e. restrictions on movement etc.).
	//                     Use any combination of the \ref camViewFlags "camera flags" and
	//                     \ref camModes "camera view modes" for this argument.
	//
	// Note:
	//     In <bi TRS2006>, the camera must be focused on an object such as a Train, Vehicle or 
	//     MapObject by the scenario script as <bi TRS2006> will not focus the camera automatically.
	//     To do this, use a method such as this one during scenario initialization.
	//
	// See Also:
	//     \ref camViewFlags "Camera Flags", \ref camModes "Camera View Modes"
	//
	public native void SetCamera(Vehicle focus, int cameraMode);



	//! Sets the camera to target the given junction.
	//
	// Param:  focus  Junction to focus the camera on.
	//
	public native void SetCamera(Junction focus);



	//! Sets the camera to target the given object.
	//
	// Param:  obj  Target object to set the camera to.  Can be any MapObject-derived type.
	//
	// Returns:
	//     Returns false if the <i obj> is not able to be a camera target, true otherwise if successful.
	//
	public native bool SetCamera(MapObject obj);



	//! Gets the current cameta target.
	//
	// Returns:
	//     Returns the current camera target, or null if in roaming camera mode
	//
	public native MapObject GetCameraTarget();



	//! Changes the current camera settings.
	//
	// Param:  cameraFlags  Flags that define behavior of the camera in what the user can and can't
	//                      do.  Use any combination of the \ref camViewFlags "camera flags" and
	//                      \ref camModes "camera view modes" for this argument.
	//
	// See Also:
	//     \ref camViewFlags "Camera Flags", \ref camModes "Camera View Modes"
	//
	public native void SetCameraFlags(int cameraFlags);
	public native int GetCameraFlags();


	//! Sets the current camera mode.
	//
	// Param:  cameraMode  Mode to set the camera to.  Use one of the \ref camModes "camera view modes"
	//                     constants for this argument.
	//
	// See Also:
	//     \ref camViewFlags "Camera Flags", \ref camModes "Camera View Modes"
	//
	public native void SetCameraMode(int cameraMode);
	public native int GetCameraMode();



	//! Sets the current camera mode, if permitted by the current mode flags.
	//
	// Param:  cameraMode  Mode to set the camera to.  Must be one of the \ref camModes "camera view mode" values.
	//
	// See Also:
	//     \ref camModes "Camera View Modes", \ref camViewFlags "Camera Flags"
	//
	public native void UserSetCameraMode(int cameraMode);

	//! Sets the camera to the given target (if possible).
	//
	// Param:  target  Target object to set the camera to.
	//
	// Returns:
	//     Returns true if the camera was pointed to <i target> successfully, false otherwise.
	//
	public native bool UserSetCamera(GameObject target);



	//! Sets the current camera angle.
	//
	// Param:  yaw     Yaw rotation in radians.
	// Param:  pitch   The angle up and down in radians.
	// Param:  radius  Distance to the targeted object (what the camera is pointing towards) in meters.
	//
	public native void SetCameraAngle(float yaw, float pitch, float radius);


	//! Get the current camera yaw, in radians.
	//
	public native float GetCameraYaw();


	//! Get the current camera pitch, in radians.
	//
	public native float GetCameraPitch();


	//! Get the current camera zoom, in meters.
	//
	public native float GetCameraZoom();



    //! Gets the current X co-ordinate of the camera.
	//
	// return: float	x position of the camera
	//
	public native float GetCameraPositionX();
	
	
	
    //! Gets the current Y co-ordinate of the camera.
	//
	// return: float	y position of the camera
	//
	public native float GetCameraPositionY();
	
	
	
    //! Gets the current Z co-ordinate of the camera.
	//
	// return: float	z position of the camera
	//
	public native float GetCameraPositionZ();
	
	
	
	//! Sets the current camera angle.
	//
	// Param:  yaw     Yaw rotation in degrees. 90 is looking straight at the front of a train
	// Param:  pitch   Angle up and down in degrees, -90 is straight down and  90 is straight up.
	// Param:  radius  Distance to the current object in focus in meters.
	//
	public void SetCameraAngle(int yaw, int pitch, float radius)
	{
		float fyaw = ((float) yaw * 2. * 3.1415) / 360.0;
		float fpitch = ((float) pitch * 2. * 3.1415) / 360.0;
		SetCameraAngle(fyaw, fpitch, radius);
	}
	
	

	//! Gets the current game time.
	//
	// Returns:
	//     Returns the current in-game time as a normalize value in the range of [0.0 - 1.0] where
	//     0.0 is midday, 0.5 is midnight and 1.0 is back to midday.
	//
	// See Also:
	//     \ref timeSecs "Time Values"
	//
	public native float GetGameTime(void);



	//! Set the in-game clock.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  time  Normalized value in the range of [0.0 - 1.0] where 0.0 is midday, 0.5 is 
	//               midnight and 1.0 is back to midday.
	//
	// See Also:
	//     \ref timeSecs "Time Values"
	//
	public native void SetGameTime(float time);
	
	

  //! Get the current game year ()
  //
  public native int GetGameYear(void);

  //! Get the current game month (1 - 12)
  //
  public native int GetGameMonth(void);

  //! Get the current game date (1 - 31)
  //
  public native int GetGameDate(void);

  //! Return the current game season, based on date and hemisphere
  //  (ranges from 0 to 1, where 0 = mid-summer, 0.5 = mid-winter)
  //
  public native float GetGameSeason(void);

  //! Set the current game date
  //
  //  Only supports dates from January 1st 1970 to January 18th 2038
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param: year  The year to set (1970-2038)
  // Param: month The month to set (1-12)
  // Param: date  The date to set (1-31)
  //
  public native void SetGameDate(int year, int month, int date);



	//! Set the in-game time rate.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  rate  Value in the range of [0 - 14].  Use one of the \ref timeRates "time rate constants"
	//               for this argument.
	//
	// See Also:
	//     \ref timeRates "Time Rate Constants"
	//
	public native void SetGameTimeRate(int rate);
	
	
	
	//! OBSOLETE. DO NOT USE.
	public obsolete void SetGoodWeatherFog(float n) {}
	public obsolete float GetGoodWeatherFog() { return 0.0; }
	public obsolete void SetBadWeatherFog(float n) {}
	public obsolete float GetBadWeatherFog() { return 0.0; }
	public obsolete void SetGroundDrawDistance(float n) {}
	public obsolete float GetGroundDrawDistance() { return 1000.0; }
	public obsolete void SetSceneryDrawDistance(float n) {}
	public obsolete float GetSceneryDrawDistance() { return 1000.0; }
	
	
	//! Gets the current weather type.
	//
	// Returns:
	//     Returns one of the \ref wethrTypes "weather types" indicating the current in-game
	//     weather conditions.
	//
	// See Also:
	//     \ref wethrTypes "Weather Type Constants", \ref wthrChange "Weather Changeability Constants"
	//
	public native int GetWeatherType();


	//! Gets the current weather changeability.
	//
	// Returns:
	//     Returns one of the \ref wthrChange "weather changeability constants" indicating the current
	//     level of changeability to in-game weather conditions.
	//
	// See Also:
	//     \ref wethrTypes "Weather Type Constants", \ref wthrChange "Weather Changeability Constants"
	//
	public native int GetWeatherChangeability();


	//! Sets the current weather type and changeability.
  //
  // Note: During multiplayer games this function will only succeed on the server
	//
	// Param:  type           Value in the range of [0 - 7] for the desired weather type.  Use one of
	//                        the \ref wethrTypes "weather type constants" for this argument.
	// Param:  changeability  Value in the range of [0 - 2] for the desired weather changeability.
	//                        Use one of the \ref wthrChange "weather changeability constants" for
	//                        this argument.
	//
	// See Also:
	//     \ref wethrTypes "Weather Type Constants", \ref wthrChange "Weather Changeability Constants"
	//
	public native void SetWeather(int type, int changeability);


	//! Deprecated, use PlaySound(Asset,string,float,float,float,GameObject,string) instead.
	public obsolete float PlaySound(string filename, float volume, float minDistance, float maxDistance, GameObject target, string attachmentPoint) { return 0.0; }
	
	
	//! Plays a <n .wav> sound file from the given asset's directory.
	//
  //
	// Param:  asset            Asset where <i filename> can be found.  An Asset reference can be
	//                          found by using World::FindAsset() or MeshObject::GetAsset()
	// Param:  filename         Name of the <n .wav> file to play.
	// Param:  volume           Volume level to play the sound at (0-1).
	// Param:  minDistance      Distance in meters within which the sound uses its maximum volume.
  //                          Beyond this distance, physics-based attenuation will occur.
	// Param:  maxDistance      A hint to the sound engine of the distance at which this sound
  //                          is expected to be inaudible. This is an optimisation only and
  //                          actual results may vary per Trainz version. This does not affect
  //                          the rate at which the sound fades out with distance.
	// Param:  target           Target game object if the sound is to be a 3D sound, null if the
	//                          sound is to be played in 2D.
	// Param:  attachmentPoint  Attachment point to play the sound from if it is to be a 3D sound,
	//                          null if the sound is to be played in 2D.
	// Param:  looping          A boolean for whether or not the sound is looping. Not honored as
  //                          of T:ANE as no mechanism was ever provided to stop the sound loop
  //                          or detect whether it had been interrupted, making it impossible to
  //                          use reliably in practice. Use soundscripts instead.
	//
	// Returns:
	//     Return value is undefined.
	//
	public native float PlaySound(Asset asset, string filename, float volume, float minDistance, float maxDistance, GameObject target, string attachmentPoint, bool looping);


	//! Plays a <n .wav> sound file from the given asset's directory.
	//
	// Param:  asset            Asset where <i filename> can be found.  An Asset reference can be
	//                          found by using World::FindAsset() or MeshObject::GetAsset()
	// Param:  filename         Name of the <n .wav> file to play.
	// Param:  volume           Volume level to play the sound at (0-1).
	// Param:  minDistance      Distance in meters within which the sound uses its maximum volume.
  //                          Beyond this distance, physics-based attenuation will occur.
	// Param:  maxDistance      A hint to the sound engine of the distance at which this sound
  //                          is expected to be inaudible. This is an optimisation only and
  //                          actual results may vary per Trainz version. This does not affect
  //                          the rate at which the sound fades out with distance.
	// Param:  target           Target game object if the sound is to be a 3D sound, null if the
	//                          sound is to be played in 2D.
	// Param:  attachmentPoint  Attachment point to play the sound from if it is to be a 3D sound,
	//                          null if the sound is to be played in 2D.
	//
	// Returns:
	//     Return value is undefined.
	//
	public float PlaySound(Asset asset, string filename, float volume, float minDistance, float maxDistance, GameObject target, string attachmentPoint)
  {
    return PlaySound(asset, filename, volume, minDistance, maxDistance, target, attachmentPoint, false);
  }

	//! Deprecated, use Play2DSound(Asset,string) instead.
	public obsolete float Play2DSound(string filename)
	{
		return PlaySound(filename, 1000.0f, 1, 1000, null, null);
	}

	//! Plays a <n .wav> sound file from the given asset's directory in 2D.
	//
	// Param:  asset     Asset where <i filename> can be found.  An Asset reference can be found by
	//                   using World::FindAsset() or MeshObject::GetAsset()
	// Param:  filename  Name of the <n .wav> sound file to play.
	//
	// Returns:
	//     Return value is undefined.
	//
	public float Play2DSound(Asset asset, string filename)
	{
		return PlaySound(asset, filename, 1000.0f, 1, 1000, null, null);
	}


  //=============================================================================
  // Name: EndScenario
  // Desc: Ends the scenario by posting a Scenario,Quit
  // Parm: time - Amount of seconds to delay before ending the session
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public void EndScenario(float time)
  {
    PostMessage(me, "World", "Quit", time);

    // Legacy support, do not rely on this message as it will eventually be removed
    Router.LegacyBroadcastMessage(me, "Scenario", "Quit", time, false);
  }


  //=============================================================================
  // Name: CreateBehavior
  // Desc: Creates an instance of the requested ScenarioBehavior and initializes
  //       it with the given properties.
  //=============================================================================
  public native ScenarioBehavior CreateBehavior(KUID kuid, Soup initialProperties);


  //=============================================================================
  // Name: GetBehaviors
  // Desc: Gets the list of top-level behaviors (i.e. all rules in the currently
  //       loaded session).
  //=============================================================================
  public native ScenarioBehavior[] GetBehaviors(void);



  //=============================================================================
  // Desc: Obsolete functions to list particular objects within the world. These
  //       may returning incomplete lists in current versions, and should be
  //       replaced with calls to World.GetNamedObjectList().
  //=============================================================================
  public obsolete native GameObject[] GetIndustryList(void);
  public obsolete native Vehicle[] GetVehicleList(void);
  public obsolete native Train[] GetTrainList(void);
  public obsolete native Signal[] GetSignalList(void);
  public obsolete native TrackMark[] GetTrackMarkList(void);
  public obsolete native Trigger[] GetTriggerList(void);
  public obsolete native Junction[] GetJunctionList(void);
  public obsolete native Crossing[] GetCrossingList(void);
  public obsolete native SceneryWithTrack[] GetSceneryWithTrackList(void);
  public obsolete native InterlockingTower[] GetInterlockingTowerList(void);
  public obsolete native MapObject[] GetCameraTargetList(void);


  //=============================================================================
  // Name: GetNamedObjectList
  // Desc: Gets a list of named objects within the world, filtering by category
  //       type string and partial localised name. A category code reference
  //       can be found on the wiki, or in the Trainz directory under:
  //        /resources/validation/category-class.txt
  // Retn: AsyncObjectSearchResult - An asynchronous search result object. This
  //       object is a reference to the in-progress object search. When the
  //       search completes, a message of type "ObjectSearch","AsyncResult" will
  //       be posted to this result object.
  //=============================================================================
  public native AsyncObjectSearchResult GetNamedObjectList(string categoryFilter, string nameFilter);


  //=============================================================================
  // Name: GetGameObjectByID
  // Desc: Finds an object by its unique object ID.
  // Parm: objectID - The ID of the object to find. See the comments on
  //       GameObjectID for more information.
  // Parm: bTriggerLoad (optional, true by default) - Whether to trigger an
  //       asynchronous load of any matching object (if it's not loaded already).
  //       Pass false here to confirm that the object exists without the added
  //       overhead of actually loading it from disk.
  // Retn: AsyncObjectSearchResult - An asynchronous search result object. This
  //       object is a reference to the in-progress object search. When the
  //       search completes, a message of type "ObjectSearch","AsyncResult" will
  //       be posted to this result object.
  //       If the bTriggerLoad param is true, a further message of type
  //       "ObjectSearch","AsyncLoadComplete" will be posted when all objects
  //       are also loaded into memory. This message will still be posted even
  //       if every object is already loaded.
  //=============================================================================
  public native AsyncObjectSearchResult GetGameObjectByID(GameObjectID objectID, bool bTriggerLoad);
  public AsyncObjectSearchResult GetGameObjectByID(GameObjectID objectID) { return GetGameObjectByID(objectID, true); }


  //=============================================================================
  // Name: GetGameObjectByID
  // Desc: Finds and returns an object by ID if it is currently loaded. If the
  //       object doesn't exist or isn't currently loaded, null will be returned.
  //       This behaviour is identical to the obsolete Router.GetGameObject,
  //       except that it operates on GameObjectID rather than name.
  // Parm: objectID - The ID of the object to find. See the comments on
  //       GameObjectID for more information.
  //=============================================================================
  public native GameObject GetGameObjectByIDIfLoaded(GameObjectID objectID);


  //=============================================================================
  // Name: SynchronouslyLoadGameObjectByID
  // Desc: Synchronously loads an object by ID and returns it. This function is
  //       usable only by script threads and will throw an exception if called
  //       incorrectly.
  // Parm: objectID - The ID of the object to find. See the comments on
  //       GameObjectID for more information. May be null, in which case the
  //       return value will be null.
  // Retn: GameObject - The loaded object, or null if no there is no object
  //       corresponding with the GameObjectID.
  //=============================================================================
  public GameObject SynchronouslyLoadGameObjectByID(GameObjectID objectID)
  {
    GameObject callingThread = Router.GetCurrentThreadGameObject();
    if (!callingThread)
    {
      Interface.Exception("World.SynchronouslyLoadGameObjectByID> No active thread");
      return null;
    }
    
    if (!objectID)
      return null;

    AsyncObjectSearchResult asyncSearch = GetGameObjectByID(objectID);
    callingThread.Sniff(asyncSearch, "ObjectSearch", "AsyncLoadComplete", true);

    Message msg;
    wait()
    {
      on "ObjectSearch", "AsyncLoadComplete", msg:
      if (msg.src == asyncSearch)
        break;

      continue;
    };

    int errCode = asyncSearch.GetSearchErrorCode();
    if (errCode != AsyncObjectSearchResult.ERROR_NONE)
      Interface.LogCallStack("World.SynchronouslyLoadGameObjectByID> Search failed, error: " + errCode);

    NamedObjectInfo[] results = asyncSearch.GetResults();
    if (results.size() == 0)
      return null;

    return results[0].objectRef;
  }



  //
  // Driver Character
  //

  //! Removes the given driver character from the world.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  driverCharacter  Driver character to remove.
  //
  public native void RemoveDriverCharacter(DriverCharacter driverCharacter);

  //! Gets a list of all driver characters in this world.
  //
  // Returns:
  //     Returns an array of DriverCharacter objects that are the drivers for this world.
  //
  public native DriverCharacter[] GetDriverCharacterList(void);

  //! Adds a driver character to this world from the given asset.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  driverCharacterAsset  Asset of the driver character to add.
  //
  // Returns:
  //     Returns the DriverCharacter object that was added if successful, null otherwise.
  //
  public native DriverCharacter AddDriverCharacter(Asset driverCharacterAsset);


  //
  // Driver Command
  //

  //! Removes the given driver command from this world.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  command  Driver command to remove.
  //
  public native void RemoveDriverCommand(DriverCommand command);

  //! Gets a list of all driver commands in this world.
  //
  // Returns:
  //     Returns an array of DriverCommand objects which are the driver commands currently in
  //     this world.
  //
  public native DriverCommand[] GetDriverCommandList(void);

  //! Adds a driver command to this world from the given asset.
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  driverCommandAsset  Asset of the driver command to add.
  //
  // Returns:
  //     Returns the DriverCommand object that was added if successful, null otherwise.
  //
  public native DriverCommand AddDriverCommand(Asset driverCommandAsset);

  //! Finds an existing driver command that matches the given asset.
  //
  // Param:  driverCommandAsset  Asset of the driver command to find.
  //
  // Returns:
  //     Returns the DriverCommand object that was found if successful, null otherwise.
  //
  public native DriverCommand FindDriverCommand(Asset driverCommandAsset);


  //! Not documented.
  //
  // Note:
  //     It is unlikely a script programmer would ever need to use this method.
  //
  // Param:  observer  Not documented.
  //
  public native void SetTargetObserver(GameObject observer);


  //! Gets the names of all of the pre-defined saved consists available in Surveyor.
  //
  // Gets a list of pre-defined train consist names that include the ones provided with %Trainz as
  // well as your own.  Use a name from that list with GetSurveyorSavedConsist() to get the actual
  // consist definition.
  //
  // Returns:
  //     Returns an array of names of all of the pre-defined saved consists available in Surveyor.
  //
  public obsolete native string[] GetSurveyorSavedConsistList(void);

  //! Gets the specified train consist as a Soup database.
  public obsolete Soup GetSurveyorSavedConsist(string name) { Interface.WarnObsolete("World.GetSurveyorSavedConsist> "); return null; }


  //! Gets the string tables as a soup for the current session
  //
  // Those 2 functions will obtain the local and non local string table for the current session
  //
  // Returns:
  //  Returns the a Soup that stores the current string table.
  public native StringTable GetStringTable(void);


  //! Show/Hide a route/session layer
  //
  // Note: During multiplayer games this function will only succeed on the server
  //
  // Param:  layerName  The name of the layer to show/hide
  // Param:  visible    true to show the layer, false to hide it
  //
  public native void SetLayerVisible(string layerName, bool visible);


  //! Get whether a route/session layer is visible
  //
  // Param:  layerName  The name of the layer
  //
  // Returns:
  //    true if the layer is currently visible
  public native bool IsLayerVisible(string layerName);


  // Layer type defines
  public define int LAYER_INVALID = 0;
  public define int LAYER_ROUTE   = 1;
  public define int LAYER_SESSION = 2;
  public define int LAYER_BOTH    = 3;


  //! Get whether a layer belongs to a route or session
  //
  // Param:  layerName  The name of the layer
  //
  // Returns:
  //    LAYER_ROUTE or LAYER_SESSION
  public native int GetLayerType(string layerName);


  //! Get a list of the layers in the active route/session
  //
  // Param:  layerType  The type of layers to list (LAYER_ROUTE/LAYER_SESSION/LAYER_BOTH)
  //
  // Returns:
  //    An array containing the layer names
  public native string[] GetLayerList(int layerType);




  //! \name   Trainz Module Modes
  //  \anchor moduleModes
  //@{
  //! %Trainz module mode constants.
  //
  // These values define the various module environments that %Trainz can be in.
  //
  // See Also:
  //     World::GetCurrentModule()
  //

  public define int NO_MODULE = 0;        //!< %Trainz isn't running in a module.
  public define int SURVEYOR_MODULE = 1;  //!< %Trainz is currently running in Surveyor.
  public define int DRIVER_MODULE = 2;    //!< %Trainz is currently running in Driver.

  //@}


  //! Gets the current module %Trainz is in at time of the function call.
  //
  // <bi A Potential Problem><br>
  //
  // Be careful when using this method as it may not necessarily be called when you expect it to be!
  // This is a known potential problem a Driver session is launched from Surveyor via the 
  // <n 'Ctrl + F2'> shortcut.
  //
  // Although this quick launch shortcut may be a nice convenience, there is a side effect that
  // creators of scripted assets need to be aware of.  The reason being is that because Surveyor
  // has already created and initialized the various game objects, Driver doesn't need to do as
  // many initialization tasks.
  //
  // This can become a problem when a scripted asset calls this method from its own 
  // <l TrainzGameObject::Init()  Init>() method to determine what to do.
  //
  // For example, consider a monitoring thread for a game object that is only needed in Driver,
  // so the <l TrainzGameObject::Init()  Init>() will check the game mode by using this method.
  // When Surveyor calls the <l TrainzGameObject::Init()  Init>() method, it will check for the
  // game mode, detect Surveyor and not start the monitoring thread.
  //
  // However the problem comes in the transition to Driver where that thread is needed and 
  // <l TrainzGameObject::Init()  Init>() won't be re-called because of the shortcuts taken to do
  // the quick launch.  As a result, the asset may not behave in Driver as expected.
  //
  //
  // <bi The Workaround><br>
  //
  // As a workaround to this problem, a message of type (<m"World">, <m "ModuleInit">) is broadcasted
  // when Driver is launched from Surveyor so game objects can detect this and respond as 
  // needed.
  //
  // In the example workaround shown here, the <b Init()> method adds a message handler that will
  // call automatically call the <b ModuleInit()> method when the message is received:
  //
  //<code>
  //public void Init(void)
  //{
  //  //# usual initialization stuff goes here...
  //  inherited();
  //
  //  //# add a handler method for when the ("World", "ModuleInit") message is received
  //  AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
  //}
  //</code>
  //
  // The actual initialization needed for Driver is now in the <b ModuleInitHandler()> method:
  //
  //<code>
  //  //# class variable to keep track of when Driver is running
  //  bool objectRunningDriver = false;
  //
  //  //# handler method
  //  void ModuleInitHandler(Message msg)
  //  {
  //    //# we have already launched the thread, no need to do anything
  //    if (objectRunningDriver)
  //      return;
  //
  //    //# are we in Driver?, if so, get the thread started we need to run this industry
  //    if (World.GetCurrentModule() == World.DRIVER_MODULE)
  //    {
  //      objectRunningDriver = true;
  //      MainObjectThread();
  //    }
  //  }
  //</code>
  //
  // When <b ModuleInitHandler()> is called, if the object isn't already running the main thread and
  // the current \ref moduleModes "Trainz module mode" is \ref moduleModes "World.DRIVER_MODULE",
  // the main thread of <b MainObjectThread()> is started.
  //
  // The <b objectRunningDriver> class variable is used to ensure we don't end up needlessly running
  // multiple threads.
  //
  // This workaround was added late in the development of <bi TRS2004:SP2> and as such, it is a bit
  // crude and not the perfect solution.
  //
  // Returns:
  //     Returns the current mode.  This will be one of the \ref moduleModes "Trainz Module Modes"
  //     constants.
  //
  // See Also:
  //     \ref moduleModes "Trainz Module Modes"
  //
  public native int GetCurrentModule(void);


  // ============================================================================
  // Name: GetCurrentProfile
  // Desc: Gets the current session asset.
  // Retn: The current session asset.
  // ============================================================================
  public native Asset GetCurrentProfile(void);


  // ============================================================================
  // Name: GetTimeElapsed
  // Desc: Returns the number of real-time seconds that have passed since the
  //       start of the current session. This measure of time stops passing while
  //       the game is paused.
  // Retn: float - The number of seconds that have passed.
  // ============================================================================
  public native float GetTimeElapsed(void);


  // ============================================================================
  // Name: SetLegacyAllowDriverlessTrains
  // Desc: Configures this session to allow humans to drive trains that do not
  //       have Driver Characters assigned to them.
  // Parm: enable - true for yes, false for no.
  // Note: This only makes sense in single player sessions.
  // ============================================================================
  public native void SetLegacyAllowDriverlessTrains(bool enable);
  

  // ============================================================================
  // Name: IsAssetRestrictionInEffect
  // Desc: Determines whether this game world has Asset Restrictions. 
  //       Multiplayer Sessions require Asset Restrictions to be in effect to
  //       avoid compatibility issues between peers.
  // Retn: bool - True if asset restrictions are in effect.
  // ============================================================================
  public native bool IsAssetRestrictionInEffect(void);
  
  
  // ============================================================================
  // Name: UpdatePositionToGroundHeight
  // Desc: Given a position in the world, adjusts the position to match the
  //       ground height. Note that this process may fail if the ground data at
  //       the specified location is not currently loaded.
  // Parm: position (IN, OUT) - The position to update.
  // Retn: bool - True if the position was updated to match the ground height,
  //       or false if there was no ground at the specified position.
  // ============================================================================
  public native bool UpdatePositionToGroundHeight(WorldCoordinate position);
  
  
  // ============================================================================
  // Name: World.UpdatePositionToSurfaceHeight
  // Desc: Given a position in the world, adjusts the position to match the
  //       water height. If no water is present at the specified position, the
  //       position is adjusted to the ground height. Note that this process may
  //       fail if the ground data at the specified location is not currently
  //       loaded.
  // Parm: position (IN, OUT) - The position to update.
  // Retn: bool - True if the position was updated to match the surface height,
  //       or false if there was no surface at the specified position.
  // ============================================================================
  public native bool UpdatePositionToSurfaceHeight(WorldCoordinate position);


  //=============================================================================
  // Name: SetWorldEditModeEnabled
  // Desc: Sets the available world editing tools, if possible for the current
  //       product and module. This does not affect scripts which may alter the
  //       world, only the availability of the player world editing tools (i.e,
  //       the Surveyor tabs).
  // Parm: editFlags - bitmask specifying which modes to alter, see PERMIT_EDIT_*
  // Parm: enable - whether to enable or disable the mode
  // Retn: bool - whether the change was completely successful
  //=============================================================================
  public native bool SetWorldEditModeEnabled(int editFlags, bool enable);


  //=============================================================================
  // Name: CancelCurrentEditingMode
  // Desc: Cancels out of any player entered editing mode, if relevant. This
  //       should only normally be called as a result of direct player action.
  //=============================================================================
  public native void CancelCurrentEditingMode();
  
  
  //=============================================================================
  // Name: GetLocalPlayerName
  // Desc: Gets the name of the local player, as should be used for setting
  //       ownership on DriverCharacters, etc.
  // Retn: string - The name of the local player.
  //=============================================================================
  public native string GetLocalPlayerName();

};

