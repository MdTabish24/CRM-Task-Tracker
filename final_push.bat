@echo off
echo GitHub Push with New Token
echo.
echo Go to: https://github.com/settings/tokens
echo Generate new token with 'repo' scope
echo.
set /p token="Enter NEW GitHub token: "
git remote add origin https://%token%@github.com/MdTabish24/CRM-Task-Tracker.git
git push -u origin main
echo Done!
pause