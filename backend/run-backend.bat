@echo off
echo ========================================================
echo   Starting StaffConnect Backend (Spring Boot + Java 21)
echo ========================================================
cd /d "%~dp0"
call .\mvnw.cmd spring-boot:run
pause
