@echo off
echo Starting IMS Backend Server...

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting server...
call npm start
