# Deployment Guide

## Prerequisites

- **Node.js** v16+
- **Python** 3.9+
- **MongoDB**
- **MetaMask** browser extension
- **Git**

## Step-by-Step Deployment

### 1. Blockchain Service

```bash
cd blockchain-service
npm install
npx hardhat compile
npx hardhat node  # Keep running in separate terminal
```

In new terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Save the contract address from output!

### 2. ML Service

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python train_models.py
cd api
uvicorn main:app --reload --port 8000
```

### 3. Backend Service

```bash
cd backend-service
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm start
```

## Production Deployment

Use Docker:
```bash
docker-compose up -d
```

Deploy to cloud (AWS/Azure/Vercel) with proper environment variables.
