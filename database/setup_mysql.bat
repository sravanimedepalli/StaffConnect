@echo off
echo ========================================================
echo   StaffConnect - MySQL Database Setup
echo ========================================================
echo This script sets up the 'staffconnect_db' database in MySQL.
echo Please ensure your MySQL server is running on port 3306.
echo.
set /p MYSQL_USER="Enter MySQL Username [default: root]: " || set MYSQL_USER=root
if "%MYSQL_USER%"=="" set MYSQL_USER=root

echo Importing schema.sql...
mysql -u %MYSQL_USER% -p < "%~dp0schema.sql"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to execute schema.sql. Please check your credentials and MySQL status.
    pause
    exit /b %errorlevel%
)

echo Importing sample-data.sql...
mysql -u %MYSQL_USER% -p staffconnect_db < "%~dp0sample-data.sql"
if %errorlevel% neq 0 (
    echo [WARNING] Sample data import encountered an issue or records already exist.
)

echo.
echo Database setup completed successfully!
echo To run backend with MySQL, execute:
echo   mvn spring-boot:run -Dspring-boot.run.profiles=mysql
echo.
pause
