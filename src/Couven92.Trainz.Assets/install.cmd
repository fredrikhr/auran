@ECHO OFF
ECHO.WHERE TrainzUtil
WHERE TrainzUtil
IF %ERRORLEVEL% NEQ 0 (
	ECHO.TrainzUtil not in PATH! >&2
	ECHO.Run TrainzUtil-Path.cmd script or include TrainzUtil from your Trainz Simulator distribution into your PATH variable >&2
	EXIT /B %ERRORLEVEL%
)

PUSHD "%~dp0"
FOR /D %%A IN (*) DO (
    TrainzUtil installfrompath "%%~A"
)
POPD