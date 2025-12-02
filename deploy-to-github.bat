@echo off
REM Deploy to GitHub - acads-Terraform_Survivor-ELEC5

echo ========================================
echo Terraform Survivor - GitHub Deployment
echo ========================================
echo.

REM Check if remote already exists
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Remote 'origin' already exists. Pushing to existing remote...
    git push -u origin main
) else (
    echo Please enter your GitHub username:
    set /p USERNAME=
    
    echo.
    echo Adding remote: https://github.com/%USERNAME%/acads-Terraform_Survivor-ELEC5.git
    git remote add origin https://github.com/%USERNAME%/acads-Terraform_Survivor-ELEC5.git
    
    echo.
    echo Renaming branch to 'main'...
    git branch -M main
    
    echo.
    echo Pushing to GitHub...
    git push -u origin main
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Go to: https://github.com/%USERNAME%/acads-Terraform_Survivor-ELEC5
echo 2. Click Settings ^> Pages
echo 3. Under Source, select:
echo    - Branch: main
echo    - Folder: /src/frontend
echo 4. Click Save
echo.
echo Your game will be live at:
echo https://%USERNAME%.github.io/acads-Terraform_Survivor-ELEC5/
echo.
pause
