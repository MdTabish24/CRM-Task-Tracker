@echo off
echo TechStartUpTS GitHub Push
echo.
echo Login to TechStartUpTS account and get token from:
echo https://github.com/settings/tokens
echo.
set /p token="Enter TechStartUpTS token: "
git remote add origin https://%token%@github.com/TechStartUpTS/CRM-Task-Tracker.git
git push -u origin main
echo.
echo Success! Commits will show as MdTabish24
pause