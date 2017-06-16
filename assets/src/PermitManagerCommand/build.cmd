@ECHO OFF
ECHO.WHERE TrainzUtil
WHERE TrainzUtil
IF %ERRORLEVEL% NEQ 0 (
	ECHO.TrainzUtil not in PATH! >&2
	ECHO.Run TrainzUtil-Path.cmd script or include TrainzUtil from your Trainz Simulator distribution into your PATH variable >&2
	EXIT /B %ERRORLEVEL%
)

REM Change to current directory
PUSHD "%~dp0"
ECHO.excludefiles.txt > excludefiles.txt
ECHO..gitignore >> excludefiles.txt
ECHO.%~nx0 >> excludefiles.txt

MD "..\..\bin\PermitManagerCommand"
XCOPY "." "..\..\bin\PermitManagerCommand" /E /C /H /Y /EXCLUDE:excludefiles.txt
COPY /Y "..\PermitManagerShared.gs" "..\..\bin\PermitManagerCommand"

PUSHD "..\..\bin\PermitManagerCommand"
FOR /R . %%G IN (*.gs) DO (
	TrainzUtil compile -i"..\..\..\ref\TS12\scripts" -o"%%~dpnG" "%%~G"
)
POPD

:cleanup
REM Restore current directory location prior to invoking this script
POPD