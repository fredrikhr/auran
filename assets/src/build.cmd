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
FOR /D %%A IN (*) DO (
    PUSHD "%%~A"
    ECHO.excludefiles.txt > excludefiles.txt
    ECHO.additionalfiles.txt >> excludefiles.txt
    ECHO.%~nx0 >> excludefiles.txt

    MD "..\..\bin\%%~A"
    XCOPY "." "..\..\bin\%%~A" /E /C /H /Y /EXCLUDE:excludefiles.txt
    IF EXIST additionalfiles.txt (
        FOR /F %%F IN (additionalfiles.txt) DO COPY /Y "%%~F" "..\..\bin\%%~A"
    )

    PUSHD "..\..\bin\%%~A"
    FOR /R . %%G IN (*.gs) DO (
        TrainzUtil compile -i"..\..\..\ref\TANE\scripts" -o"%%~dpnG" "%%~G"
    )
    POPD

    POPD
)
:cleanup
REM Restore current directory location prior to invoking this script
POPD
