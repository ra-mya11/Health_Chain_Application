@echo off
echo ========================================
echo Medical Records System - Quick Start
echo ========================================
echo.

echo Step 1: Checking MongoDB...
net start MongoDB
if %errorlevel% neq 0 (
    echo MongoDB already running or failed to start
)
echo.

echo Step 2: Deploy Smart Contract
echo Please run in separate terminal:
echo cd blockchain-service
echo npx hardhat node
echo.
echo Then in another terminal:
echo cd blockchain-service
echo npx hardhat run scripts/deployMedicalRecordManager.js --network localhost
echo.
echo Copy the contract address and update in application.properties
echo.

pause

echo Step 3: Starting Spring Boot Backend...
cd springboot-backend
start cmd /k "mvn spring-boot:run"
echo.

echo ========================================
echo System Starting...
echo Backend: http://localhost:8080
echo ========================================
echo.
echo Make sure IPFS daemon is running!
echo.

pause
