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
include "AsyncObjectSearch.gs"



//=============================================================================
// Name: World
// Desc: This class is an interface to many miscellaneous items in the Trainz
//       world including assets, cameras, industries, track marks, vehicles,
//       weather, sound, time, routes, signals, driver commands and driver
//       characters to name a few.
//=============================================================================
final static class World isclass TrainzScriptBase
{

  //=============================================================================
  // Desc: Camera view mode constants for use by the various SetCameraMode and
  //       SetCamera function.
  //=============================================================================
  public define int CAMERA_INTERNAL		= 1;   // Internal cabin camera view.
  public define int CAMERA_EXTERNAL		= 2;   // External train camera view.
  public define int CAMERA_TRACKING		= 4;   // Tracking camera view.
  public define int CAMERA_ROAMING		= 128; // Roaming camera view.



  //=============================================================================
  // Desc: Camera permissions flags, for use with SetCameraFlags/GetCameraFlags.
  //       These flags can bse used to allow/disallow the player from using
  //       certain game features, such as changing trains.
  //=============================================================================
  public define int CAMERA_SWITCH_VIEWS = 8;      // User permitted to swap between the camera views.
  public define int CAMERA_SWITCH_VEHICLES = 16;  // User permitted to swap vehicles within the current train.
  public define int CAMERA_SWITCH_TRAINS = 32;    // User permitted to swap to other trains which are in the consist menu.
  public define int CAMERA_LOCKED = 64;           // User is NOT permitted to adjust camera (i.e. zoom, pan etc.)
  public define int CAMERA_EXTERNAL_AVOID = 256;  // External train camera view camera will avoid objects with the camera collide flag.


  // Default/normal camera flags where everything is permitted.
  public define int CAMERA_NORMAL = CAMERA_INTERNAL | CAMERA_EXTERNAL | CAMERA_TRACKING | CAMERA_ROAMING | CAMERA_SWITCH_VIEWS | CAMERA_SWITCH_VEHICLES | CAMERA_SWITCH_TRAINS;


  // Camera mode where everything is permitted and the camera avoids Camera Collidable objects.
  public define int CAMERA_NORMAL_AVOID = CAMERA_NORMAL | CAMERA_EXTERNAL_AVOID;



  //=============================================================================
  // Desc: Time constants defined in seconds, for ease of use with various time
  //       related functions.
  //=============================================================================
  public define float TIME_SECOND = 1.0f;                 // One second.
  public define float TIME_MINUTE = TIME_SECOND * 60.0f;  // One minute defined as 60.0 seconds.
  public define float TIME_HOUR = TIME_MINUTE * 60.0f;    // One hour defined as 60.0 minutes (3600.0 seconds).
  public define float TIME_DAY = TIME_HOUR * 24.0f;       // One day defined as 24 hours (1440.0 minutes or 86400.0 seconds.

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

  //=============================================================================
  // Desc: Defines for the current weather of the in-game world.
  //       See also: World.SetWeather(), World.GetWeatherType()
  //=============================================================================
  public define int WEATHER_TYPE_CLEAR = 0;        // Clear weather, no clouds, rain or snow.
  public define int WEATHER_TYPE_CLOUDY = 1;       // Cloudy weather, no rain.
  public define int WEATHER_TYPE_DRIZZLE = 2;      // Drizzle, light rain.
  public define int WEATHER_TYPE_RAIN = 3;         // Rainy weather.
  public define int WEATHER_TYPE_STORMY = 4;       // Stormy weather that includes lightening and thunder.
  public define int WEATHER_TYPE_LIGHT_SNOW = 5;   // Snowing lightly.
  public define int WEATHER_TYPE_MEDIUM_SNOW = 6;  // Medium level snow fall.
  public define int WEATHER_TYPE_HEAVY_SNOW = 7;   // Heavy snow fall.


  //=============================================================================
  // Desc: The changeability of the weather determines how/if the weather will
  //       randomly change during gameplay.
  //       See also: World.SetWeather(), World.GetWeatherChangeability()
  //=============================================================================
  public define int WEATHER_CHANGEABILITY_NONE = 0;      //!< Weather stays static and won't change.
  public define int WEATHER_CHANGEABILITY_PERIODIC = 1;  //!< Periodic changes in weather.
  public define int WEATHER_CHANGEABILITY_EXTREME = 2;   //!< Extreme and frequent changes in weather.



  //=============================================================================
  // Desc: Values that define the in-game time rate relative to real-world time.
  //       See also: World.SetGameTimeRate()
  //=============================================================================
  public define int TIME_RATE_1X = 0;      // In game time progress at the same rate as the real world.
  public define int TIME_RATE_2X = 1;      // 2 times faster than real-world time.
  public define int TIME_RATE_4X = 2;      // 4 times faster than real-world time.
  public define int TIME_RATE_8X = 3;      // 8 times faster than real-world time.
  public define int TIME_RATE_16X = 4;     // 16 times faster than real-world time.
  public define int TIME_RATE_32X = 5;     // 32 times faster than real-world time.
  public define int TIME_RATE_60X = 6;     // 60 times faster than real-world time.
  public define int TIME_RATE_120X = 7;    // 120 times faster than real-world time.
  public define int TIME_RATE_240X = 8;    // 240 times faster than real-world time.
  public define int TIME_RATE_360X = 9;    // 360 times faster than real-world time.
  public define int TIME_RATE_480X = 10;   // 480 times faster than real-world time.
  public define int TIME_RATE_720X = 11;   // 720 times faster than real-world time.
  public define int TIME_RATE_960X = 12;   // 960 times faster than real-world time.
  public define int TIME_RATE_1200X = 13;  // 1200 times faster than real-world time.
  public define int TIME_RATE_1440X = 14;  // 1440 times faster than real-world time.



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



  //=============================================================================
  // Name: LoadMap
  // Desc: Load the route with the given KUID.
  // Note: During multiplayer games this function will only succeed on the
  //       server, and will obviously cause the current multiplayer game to end.
  //=============================================================================
  public native bool LoadMap(KUID kuid);


  //=============================================================================
  // Name: LoadMapTSO
  // Desc: Obsolete, do not use.
  //=============================================================================
  public obsolete native bool LoadMapTSO(Asset asset, string filename);


  //=============================================================================
  // Name: LoadSession
  // Desc: Load the session with the given KUID.
  // Note: During multiplayer games this function will only succeed on the
  //       server, and will obviously cause the current multiplayer game to end.
  //=============================================================================
  public native bool LoadSession(KUID kuid);


  //=============================================================================
  // Name: RestartSession
  // Desc: Restarts the current session, valid in Driver only
  // Note: During multiplayer games this function will only succeed on the
  //       server, and will obviously cause the current multiplayer game to end.
  //=============================================================================
  public native bool RestartSession();


  //=============================================================================
  // Name: GetCurrentProfile
  // Desc: Gets the current session asset.
  //=============================================================================
  public native Asset GetCurrentProfile(void);



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


  //=============================================================================
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
  //=============================================================================
  public native Train CreateTrain(KUID[] consist, GSTrackSearch tracksearch, bool avoidDerailments);
  public Train CreateTrain(KUID[] consist, GSTrackSearch tracksearch) { return CreateTrain(consist, tracksearch, true); }


  //=============================================================================
  // Name: DeleteTrain
  // Desc: Deletes a train from the current route. Once a train is deleted, its
  //       reference should not be used.
  // Note: During multiplayer games this will only succeed on the server.
  //=============================================================================
  public native void DeleteTrain(Train train);


  //=============================================================================
  // Name: DeleteVehicle
  // Desc: Deletes the given vehicle from its train. If called on a non-end
  //       vehicle within the train then this will split the train in two.
  // Note: During multiplayer games this will only succeed on the server.
  //=============================================================================
  public native void DeleteVehicle(Vehicle vehicle);


  //=============================================================================
  // Name: GetCurrentTrain
  // Desc: Returns the currently focused train.
  // Note: This does not mean that the camera is focused on this train. Merely
  //       that the user is currently controlling it.
  //=============================================================================
  public native Train GetCurrentTrain();


  //=============================================================================
  // Name: SetTargetModuleForCameraControl
  // Desc: Switches the target module (e.g. DRIVER_MODULE) for camera functions.
  //       By default all script camera functions are expected to target Driver,
  //       so when called elsewhere (e.g. Surveyor) the camera change will be
  //       postponed until until Driver is activated (if it ever is). This
  //       exists to allow script to alter this behaviour, and gain access to
  //       editing the camera mode/position/etc outside of Driver.
  // Parm: targetModule - The module the script wishes to edit the camera for,
  //       or NO_MODULE to restore the default camera function behaviour.
  // Note: This should only be called when the requested module is active. It's
  //       not currently supported to (for example) attempt manipulation of the
  //       Surveyor camera from within Driver.
  // Note: Scripts should only use this temporarily, calling it immediately
  //       before accessing the camera functions, and deactivating (by calling
  //       it with NO_MODULE) as soon as they're done.
  //=============================================================================
  public native void SetTargetModuleForCameraControl(int targetModule);


  //=============================================================================
  // Name: SetEditingCamera
  // Desc: Hints to the caching systems that the camera position is in the
  //       process of being changed. This may reduce the amount of streaming that
  //       will occur until the change is complete. This is intended for
  //       use-cases where the decision to move the camera happens in advance of
  //       the actual call to SetCamera() or etc., for example when the new
  //       camera target needs to be streamed in first. There is no advantage in
  //       calling this unless your code then sleeps/waits before undoing the
  //       call.
  // Parm: actor - The script who is intended to edit the camera position.
  // Parm: bIsActorEditingCamera - True to begin editing, or False to end the
  //       editing operation. Scripts must ensure to always end the editing
  //       operation in a timely fashion, even in the event that the camera
  //       transition is aborted after starting the operation.
  // Note: It is not required to call this before using SetCamera() etc.
  // Note: A boolean state is stored per actor; multiple calls to enable editing
  //       on a single actor do not need to be matched to multiple calls to
  //       disable editing.
  // Note: It is not an error to disabled editing when editing is already
  //       disabled, although this generally suggests poor coding habits.
  // Note: It is counterproductive to call this when transitioning the camera
  //       over a short distance (ie. where the source and target locations can
  //       see each other). If jumping to a new location, followed by a visual
  //       camera transition at the new location, camera editing may be enabled
  //       around the target-selection for the jump, and the jump itself, but
  //       should be disabled before proceeding with the transition.
  //=============================================================================
  public native void SetEditingCamera(GameObject actor, bool bIsActorEditingCamera);


  //=============================================================================
  // Name: SetCamera
  // Desc: Sets the camera to target the given train using the given camera mode.
  //       Note that this will attempt to set the target and mode independently
  //       of each other, meaning it may change the target even if the specified
  //       camera mode is unavailable, and may change the mode even if the
  //       specified target is invalid.
  //       Also note that the targeted train is inherently tied to the Driver
  //       controls UI, and that calling this will automatically change the
  //       controled train as well.
  //=============================================================================
  public native void SetCamera(Train focus, int cameraMode);


  //=============================================================================
  // Name: SetCamera
  // Desc: Sets the camera to target the given traincar using the given camera
  //       mode. Note that this will attempt to set the target and mode
  //       independently of each other, meaning it may change the target even if
  //       the specified camera mode is unavailable, and may change the mode even
  //       if the specified target is invalid.
  //       Also note that the targeted train is inherently tied to the Driver
  //       controls UI, and that calling this will automatically change the
  //       controled train as well.
  //=============================================================================
  public native void SetCamera(Vehicle focus, int cameraMode);


  //=============================================================================
  // Name: SetCamera
  // Desc: Sets the camera to target the given object.
  // Retn: bool - Whether the camera was successfully moved.
  //=============================================================================
  public native bool SetCamera(MapObject obj);


  //=============================================================================
  // Name: GetCameraTarget
  // Desc: Returns the current camera target object, if there is one, else null.
  //=============================================================================
  public native MapObject GetCameraTarget();


  //=============================================================================
  // Name: SetCameraFlags
  // Desc: Changes the current camera permission flags. See the "Camera Flags"
  //       defines above (e.g. CAMERA_SWITCH_VIEWS) for a list of valid params.
  //=============================================================================
  public native void SetCameraFlags(int cameraFlags);
  public native int GetCameraFlags();


  //=============================================================================
  // Name: SetCameraMode
  // Desc: Sets the current camera mode.
  // Parm: cameraMode - One of the camera view modes (e.g CAMERA_INTERNAL)
  //=============================================================================
  public native void SetCameraMode(int cameraMode);
  public native int GetCameraMode();


  //=============================================================================
  // Name: UserSetCameraMode
  // Desc: Sets the current camera mode, if permitted by the current mode flags.
  // Parm: cameraMode - One of the camera view modes (e.g CAMERA_INTERNAL)
  //=============================================================================
  public native void UserSetCameraMode(int cameraMode);


  //=============================================================================
  // Name: UserSetCamera
  // Desc: Sets the camera target, if permitted by the current mode flags.
  //=============================================================================
  public native bool UserSetCamera(GameObject target);


  //=============================================================================
  // Name: UserSetCameraPosition
  // Desc: For camera modes which do not need to target specific objects, this
  //       allows the camera to be set to an arbitrary world position.
  //=============================================================================
  public native bool UserSetCameraPosition(WorldCoordinate camPos);


  //=============================================================================
  // Name: SetCameraAngle
  // Desc: Sets the current camera angles.
  // Parm: yaw - Yaw rotation in radians.
  // Parm: pitch - The angle up and down in radians.
  // Parm: radius - Distance along the camera ray the target object (in metres).
  //       If there's no target object this will be the distance to the ground.
  //=============================================================================
  public native void SetCameraAngle(float yaw, float pitch, float radius);


  //=============================================================================
  // Name: SetCameraAngle
  // Desc: This function has been marked obsolete due to it's obvious ambiguity
  //       against SetCameraAngle(float,...) above. Script using this function
  //       should be updated to use the radians variant.
  //
  // Parm: yaw - Yaw rotation in degrees. 90 is looking straight at the front
  //       of a train (when in external camera).
  // Parm: pitch - Angle up and down in degrees, -90 is straight down at the
  //       ground and 90 is straight up at the sky.
  // Parm: radius - Distance to the current target object in meters.
  //=============================================================================
  public obsolete void SetCameraAngle(int yaw, int pitch, float radius)
  {
    float fyaw = ((float) yaw * 2.0 * 3.1415) / 360.0;
    float fpitch = ((float) pitch * 2.0 * 3.1415) / 360.0;
    SetCameraAngle(fyaw, fpitch, radius);
  }


  //=============================================================================
  // Name: GetCameraYaw
  // Desc: Get the current camera yaw, in radians.
  //=============================================================================
  public native float GetCameraYaw();


  //=============================================================================
  // Name: GetCameraPitch
  // Desc: Get the current camera pitch, in radians.
  //=============================================================================
  public native float GetCameraPitch();


  //=============================================================================
  // Name: GetCameraZoom
  // Desc: Get the current camera zoom, in meters.
  //=============================================================================
  public native float GetCameraZoom();


  //=============================================================================
  // Name: GetCameraPositionX/Y/Z
  // Desc: Obsolete, do not use.
  //=============================================================================
  public obsolete native float GetCameraPositionX();
  public obsolete native float GetCameraPositionY();
  public obsolete native float GetCameraPositionZ();



  //=============================================================================
  // Name: GetGameTime
  // Desc: Returns the in-game time as a normalized value (in the range of 0.0 to
  //       1.0) where 0.0 is midday, 0.5 is midnight and 1.0 is back to midday.
  //=============================================================================
  public native float GetGameTime(void);


  //=============================================================================
  // Name: SetGameTime
  // Desc: Sets the in-game time as a normalized value (in the range of 0.0 to
  //       1.0) where 0.0 is midday, 0.5 is midnight and 1.0 is back to midday.
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void SetGameTime(float time);


  //=============================================================================
  // Name: GetGameYear
  // Desc: Get the current in-game year (e.g. 1995)
  //=============================================================================
  public native int GetGameYear(void);


  //=============================================================================
  // Name: GetGameMonth
  // Desc: Get the current in-game month, from 1 to 12 (e.g. January is '1',
  //       February is '2', etc.)
  //=============================================================================
  public native int GetGameMonth(void);


  //=============================================================================
  // Name: GetGameDate
  // Desc: Get the current in-game day of the month, from 1 to 31.
  //=============================================================================
  public native int GetGameDate(void);


  //=============================================================================
  // Name: GetGameSeason
  // Desc: Return the current in-game 'season', based on date and hemisphere
  //      (ranges from 0 to 1, where 0 = mid-summer, 0.5 = mid-winter).
  //=============================================================================
  public native float GetGameSeason(void);


  //=============================================================================
  // Name: SetGameDate
  // Desc: Set the current in-game date. Only supports dates from January 1st
  //       1970 to January 18th 2038.
  // Parm: year - The year to set (1970-2038)
  // Parm: month - The month to set (1-12)
  // Parm: date - The date to set (1-31)
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void SetGameDate(int year, int month, int date);


  //=============================================================================
  // Name: SetGameTimeRate
  // Desc: Sets rate at which in-game time passes, compared to the real world.
  // Parm: rate - One of the World.TIME_RATE_* defines.
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void SetGameTimeRate(int rate);


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
  //=============================================================================
  // Name: SetWeather
  // Desc: Sets the current in-game weather type and changeability.
  // Parm: type - The type of weather to set, as one of the
  //       World.WEATHER_TYPE_* defines.
  // Parm: changeability - The changeability of the new weather, as one of the
  //       World.WEATHER_CHANGEABILITY_* defines.
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void SetWeather(int type, int changeability);


  //=============================================================================
  // Name: GetWeatherType
  // Desc: Gets the current in-game weather, as one of the World.WEATHER_TYPE_*
  //       defines.
  //=============================================================================
  public native int GetWeatherType();


  //=============================================================================
  // Name: GetWeatherChangeability
  // Desc: Gets the current in-game weather changeability, as one of the
  //       World.WEATHER_CHANGEABILITY_* defines.
  //=============================================================================
  public native int GetWeatherChangeability();


  //! OBSOLETE. DO NOT USE.
  public obsolete void SetGoodWeatherFog(float n) {}
  public obsolete float GetGoodWeatherFog() { return 0.0; }
  public obsolete void SetBadWeatherFog(float n) {}
  public obsolete float GetBadWeatherFog() { return 0.0; }
  public obsolete void SetGroundDrawDistance(float n) {}
  public obsolete float GetGroundDrawDistance() { return 1000.0; }
  public obsolete void SetSceneryDrawDistance(float n) {}
  public obsolete float GetSceneryDrawDistance() { return 1000.0; }


  //=============================================================================
  // Name: PlaySound
  // Desc: Plays a sound file from the given asset.
  // Parm: asset - The asset to play the sound from
  // Parm: filename - The filename of the sound within the passed asset
  // Parm: volume - Volume level to play the sound at (0-1).
  // Parm: minDistance - Distance in meters within which the sound is at maximum
  //       volume. Beyond this distance, physics-based attenuation will occur.
  // Parm: maxDistance - A hint to the game for the distance at which this sound
  //       is expected to be inaudible. This is an optimisation only and actual
  //       results may vary per Trainz version. This does not affect the rate at
  //       which the sound fades out with distance.
  // Parm: target - Target game object if the sound is to be a 3D sound, null if
  //       the sound is to be played in 2D.
  // Parm: attachmentPoint - Attachment point to play the sound from if it is to
  //       be a 3D sound, null if the sound is to be played in 2D.
  // Parm: looping - OBSOLETE - This param is not honored as of T:ANE as no
  //       mechanism was ever provided to stop the sound loop or detect whether
  //       it had been interrupted, making it impossible to use reliably in
  //       practice. Use soundscripts instead.
  // Retn: float - Undefined, do not use.
  // Note: The 'attachmentPoint' parameter may be ignored if this function is
  //       called with a 'target' which has not finished loading. It is
  //       recommended that soundscripts are used where precise positioning is
  //       critical.
  //=============================================================================
  public native float PlaySound(Asset asset, string filename, float volume, float minDistance, float maxDistance, GameObject target, string attachmentPoint, bool looping);


  //=============================================================================
  // Name: PlaySound
  // Desc: See above.
  //=============================================================================
  public float PlaySound(Asset asset, string filename, float volume, float minDistance, float maxDistance, GameObject target, string attachmentPoint)
  {
    return PlaySound(asset, filename, volume, minDistance, maxDistance, target, attachmentPoint, false);
  }


  //=============================================================================
  // Name: Play2DSound
  // Desc: Plays a 2D (ie non-positional) sound file from the given asset.
  // Parm: asset - The asset to play the sound from
  // Parm: filename - The filename of the sound within the passed asset
  // Retn: float - Undefined, do not use
  //=============================================================================
  public float Play2DSound(Asset asset, string filename)
  {
    return PlaySound(asset, filename, 1000.0f, 1, 1000, null, null);
  }


  //=============================================================================
  //! Obsolete, use the asset relative versions above.
  public obsolete float PlaySound(string filename, float volume, float minDistance, float maxDistance, GameObject target, string attachmentPoint) { return 0.0; }
  public obsolete float Play2DSound(string filename) { return 0.0; }


  //=============================================================================
  // Name: EndScenario
  // Desc: Ends the scenario by posting a World,Quit message to this module (and
  //       broadcasting Scenario,Quit in legacy modes, but do not rely on this).
  // Parm: time - Amount of seconds to delay before ending the session
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void EndScenario(float time);


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
  //       type string and partial localised name. 
  // Parm: categoryFilter - A category filter to search for. Optional, provided
  //       a nameFilter param is specified. Category codes specify the type of
  //       objects to search for, via their asset config data. A category code
  //       reference can be found in asset.gs, or on the wiki.
  // Parm: nameFilter - A partial object name to search for. Optional, provided
  //       a categoryFilter is specified.
  // Parm: bNotifyOfExpiry - Optional, defaults to false. This option allows the
  //       caller to be automatically notified of future updates to this search
  //       (ie, new objects, removed objects, renamed objects, etc). The search
  //       object itself will not automatically update, but if native code
  //       detects that the search results have changed then a message of type
  //       "ObjectSearch","Expired" will be posted to the result object, and the
  //       calling script can perform a new search if desired. Only one such
  //       notification will be posted for each search.
  // Retn: AsyncObjectSearchResult - An asynchronous search result object. This
  //       object is a reference to the in-progress object search. When the
  //       search completes, a message of type "ObjectSearch","AsyncResult" will
  //       be posted to this result object.
  //=============================================================================
  public native AsyncObjectSearchResult GetNamedObjectList(string categoryFilter, string nameFilter, bool bNotifyOfExpiry);
  public AsyncObjectSearchResult GetNamedObjectList(string categoryFilter, string nameFilter) { return GetNamedObjectList(categoryFilter, nameFilter, false); }


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
  //       This behaviour is identical to the GetGameObject function on Router.
  // Parm: objectID - The ID of the object to find. See the comments on
  //       GameObjectID for more information.
  //=============================================================================
  public native GameObject GetGameObjectByIDIfLoaded(GameObjectID objectID);


  //=============================================================================
  // Name: SynchronouslyLoadGameObjectByID
  // Desc: Synchronously loads an object by ID and returns it. This function is
  //       usable only by script 'thread' functions and will throw an exception
  //       if called incorrectly.
  // Parm: objectID - The ID of the object to find. See the comments on
  //       GameObjectID for more information. May be null, in which case the
  //       return value will be null.
  // Retn: GameObject - The loaded object, or null if no there is no object
  //       corresponding with the GameObjectID.
  //=============================================================================
  public GameObject SynchronouslyLoadGameObjectByID(GameObjectID objectID)
  {
    if (!objectID)
      return null;

    // Start the search, wait on it, and return the result (if any).
    AsyncObjectSearchResult asyncSearch = GetGameObjectByID(objectID);
    if (asyncSearch.SynchronouslyWaitForResults("AsyncLoadComplete"))
    {
      NamedObjectInfo[] results = asyncSearch.GetResults();
      if (results.size() > 0)
        return results[0].objectRef;
    }

    return null;
  }


  //=============================================================================
  // Name: AddDriverCharacter
  // Desc: Adds a driver character to this Session from the given asset.
  // Note: During multiplayer games this function will only succeed on the server
  // Retn: DriverCharacter - The added driver, or null on failure/denial.
  //=============================================================================
  public native DriverCharacter AddDriverCharacter(Asset driverCharacterAsset);


  //=============================================================================
  // Name: RemoveDriverCharacter
  // Desc: Removes the given driver character from the Session.
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void RemoveDriverCharacter(DriverCharacter driverCharacter);


  //=============================================================================
  // Name: GetDriverCharacterList
  // Desc: Gets a list of all driver characters in this Session.
  //=============================================================================
  public native DriverCharacter[] GetDriverCharacterList(void);



  //=============================================================================
  // Name: AddDriverCommand
  // Desc: Adds a driver command to this Session from the given asset.
  // Retn: DriverCommand - The added command, or null on failure/denial.
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native DriverCommand AddDriverCommand(Asset driverCommandAsset);


  //=============================================================================
  // Name: RemoveDriverCommand
  // Desc: Removes the given driver command from this Session.
  // Note: During multiplayer games this function will only succeed on the server
  //=============================================================================
  public native void RemoveDriverCommand(DriverCommand command);


  //=============================================================================
  // Name: GetDriverCommandList
  // Desc: Gets a list of all driver commands available in this Session.
  //=============================================================================
  public native DriverCommand[] GetDriverCommandList(void);


  //=============================================================================
  // Name: FindDriverCommand
  // Desc: Finds an existing driver command that matches the given asset.
  // Retn: DriverCommand - The found command, or null if no it wasn't found.
  //=============================================================================
  public native DriverCommand FindDriverCommand(Asset driverCommandAsset);


  //=============================================================================
  // Name: SetTargetObserver
  // Desc: Not documented. It is unlikely a script programmer would ever need to
  //       use this method.
  //=============================================================================
  public native void SetTargetObserver(GameObject observer);


  //=============================================================================
  // Name: GetSurveyorSavedConsistList
  // Desc: Obsolete. See TrainzAssetSearch.gs for similar and much more powerful
  //       asset searching capabilities.
  //=============================================================================
  public obsolete native string[] GetSurveyorSavedConsistList(void);


  //=============================================================================
  // Desc: Obsolete, do not use.
  public obsolete Soup GetSurveyorSavedConsist(string name) { Interface.WarnObsolete("World.GetSurveyorSavedConsist> "); return null; }


  //=============================================================================
  // Name: GetStringTable
  // Desc: Gets the combined string tables for the currently loaded Route and
  //       Session. In the case of duplicates Session data overwrites Route data.
  //=============================================================================
  public native StringTable GetStringTable(void);


  //=============================================================================
  // Name: SetLayerVisible
  // Desc: Show/Hide a route/session layer.
  // Note: During multiplayer games this function will only succeed on the server
  // Parm: layerName - The name of the layer to show/hide.
  // Parm: visible - true to show the layer, false to hide it.
  //=============================================================================
  public native void SetLayerVisible(string layerName, bool visible);


  //=============================================================================
  // Name: IsLayerVisible
  // Desc: Returns whether a route/session layer is visible.
  //=============================================================================
  public native bool IsLayerVisible(string layerName);


  //=============================================================================
  // Desc: Layer type defines, for use with GetLayerType() and GetLayerList().
  //=============================================================================
  public define int LAYER_INVALID = 0;
  public define int LAYER_ROUTE   = 1;
  public define int LAYER_SESSION = 2;
  public define int LAYER_BOTH    = 3;


  //=============================================================================
  // Name: GetLayerType
  // Desc: Get whether a named layer belongs to a Route, Session or neither.
  // Retn: int - One of the LAYER_* defines above, indicating which table the
  //       named layer is in (if any).
  //=============================================================================
  public native int GetLayerType(string layerName);


  //=============================================================================
  // Name: GetLayerList
  // Desc: Retiurns the names of the layers in the active Route, Session or both.
  // Parm: layerType - The type of layers to return, specified using one of the
  //       LAYER_* defines above.
  //=============================================================================
  public native string[] GetLayerList(int layerType);



  //=============================================================================
  // Desc: Defines the possible return values from World.GetCurrentModule().
  //=============================================================================
  public define int NO_MODULE = 0;        // No interface module (e.g. Might be a preview window, or possibly still loading).
  public define int SURVEYOR_MODULE = 1;  // Trainz is currently running in Surveyor (or Surveyor 2).
  public define int DRIVER_MODULE = 2;    // Trainz is currently running in Driver.


  //=============================================================================
  // Name: GetCurrentModule
  // Desc: Returns the current interface module, as one of the module defines
  //       above. Trainz will post a "World","ModuleInit" message to this object
  //       (i.e. World) whenever the active module changes. This includes at load
  //       time, or when the player switches modules (whether using traditional
  //       Surveyor "Quickdrive" feature, or the more modern "Unified Surveyor/
  //       Driver" (aka UDS) feature).
  //
  //       Do not assume that this value is static, or even that it has yet been
  //       set when your script is initialised. Any script which changes it's
  //       behaviour based on the active module should monitor for changes by
  //       adding a handler for the "World","ModuleInit" message.
  //       
  //=============================================================================
  public native int GetCurrentModule(void);



  //=============================================================================
  // Name: GetTimeElapsed
  // Desc: Returns the number of real-time seconds that have passed since the
  //       start of the current session. This measure of time stops passing while
  //       the game is paused.
  // Retn: float - The number of seconds that have passed.
  //=============================================================================
  public native float GetTimeElapsed(void);


  //=============================================================================
  // Name: SetLegacyAllowDriverlessTrains
  // Desc: Configures this session to allow humans to drive trains that do not
  //       have Driver Characters assigned to them.
  // Parm: enable - true for yes, false for no.
  // Note: This only makes sense in single player sessions.
  //=============================================================================
  public native void SetLegacyAllowDriverlessTrains(bool enable);


  //=============================================================================
  // Name: IsAssetRestrictionInEffect
  // Desc: Determines whether this game world has Asset Restrictions. 
  //       Multiplayer Sessions require Asset Restrictions to be in effect to
  //       avoid compatibility issues between peers.
  // Retn: bool - True if asset restrictions are in effect.
  //=============================================================================
  public native bool IsAssetRestrictionInEffect(void);


  //=============================================================================
  // Name: UpdatePositionToGroundHeight
  // Desc: Given a position in the world, adjusts the position to match the
  //       ground height. Note that this process may fail if the ground data at
  //       the specified location is not currently loaded.
  // Parm: position (IN, OUT) - The position to update.
  // Retn: bool - True if the position was updated to match the ground height,
  //       or false if there was no ground at the specified position.
  //=============================================================================
  public native bool UpdatePositionToGroundHeight(WorldCoordinate position);


  //=============================================================================
  // Name: World.UpdatePositionToSurfaceHeight
  // Desc: Given a position in the world, adjusts the position to match the
  //       water height. If no water is present at the specified position, the
  //       position is adjusted to the ground height. Note that this process may
  //       fail if the ground data at the specified location is not currently
  //       loaded.
  // Parm: position (IN, OUT) - The position to update.
  // Retn: bool - True if the position was updated to match the surface height,
  //       or false if there was no surface at the specified position.
  //=============================================================================
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

