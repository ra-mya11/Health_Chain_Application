@echo off
echo ========================================
echo Blockchain Healthcare System Setup
echo ========================================
echo.

echo [1/6] Setting up Blockchain Service...
cd blockchain-service
call npm install
echo Blockchain service dependencies installed!
echo.

echo [2/6] Setting up ML Service...
cd ..\ml-service
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo Training ML models...
python train_models.py
echo ML service setup complete!
echo.

echo [3/6] Setting up Backend Service...
cd ..\backend-service
call npm install
if not exist .env copy .env.example .env
echo Backend service dependencies installed!
echo.

echo [4/6] Setting up Frontend...
cd ..\frontend
call npm install
echo Frontend dependencies installed!
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Start Hardhat node: cd blockchain-service ^&^& npx hardhat node
echo 2. Deploy contract: cd blockchain-service ^&^& npx hardhat run scripts/deploy.js --network localhost
echo 3. Update .env files with contract address
echo 4. Start ML service: cd ml-service\api ^&^& uvicorn main:app --reload --port 8000
echo 5. Start backend: cd backend-service ^&^& npm run dev
echo 6. Start frontend: cd frontend ^&^& npm start
echo.
echo See QUICKSTART.md for detailed instructions!
echo.
pause
