@echo off
echo GitHub Authentication Fix
echo.
echo Step 1: Go to GitHub.com
echo Step 2: Settings > Developer settings > Personal access tokens
echo Step 3: Generate new token with 'repo' scope
echo Step 4: Copy the token
echo.
set /p token="Enter your GitHub Personal Access Token: "
echo.
echo Setting up remote with token...
git remote add origin https://%token%@github.com/MdTabish24/CRM-Task-Tracker.git
git push -u origin main
echo.
echo Done! Future pushes will work with push_to_github.bat
pause