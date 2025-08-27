@echo off
echo Setting up GitHub remote...
echo.
echo IMPORTANT: Replace YOUR_USERNAME and YOUR_REPO_NAME with actual values!
echo Example: git remote add origin https://github.com/MdTabish24/crm-task-tracker.git
echo.
set /p repo_url="Enter your GitHub repository URL: "
git remote add origin %repo_url%
git branch -M main
git push -u origin main
echo.
echo GitHub setup complete!
pause