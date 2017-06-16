@ECHO OFF
IF "%~1"=="" (
    WHERE TrainzUtil
    IF %ERRORLEVEL% EQU 0 GOTO last
    IF EXIST "C:\Program Files\N3V Games\Trainz A New Era" (
        CALL "%~0" "C:\Program Files\N3V Games\Trainz A New Era"
        GOTO last
    ) ELSE (
        ECHO.No common TrainzUtil directory detected. Try executing the script with a custom TrainzUtil directory path as argument.
        EXIT /B %ERRORLEVEL%
    )
) ELSE (
    GOTO setPath
)

:setPath
ECHO.Expanding PATH with %~1
SET PATH=%PATH%;%~1
:printTrainzUtil
WHERE TrainzUtil
:last
