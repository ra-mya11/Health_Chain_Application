# System Architecture Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (React.js Frontend)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Upload     │  │     View     │  │    Verify    │        │
│  │   Records    │  │   Records    │  │   Records    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                          │
│                      (Port 8080)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MedicalRecordController                      │  │
│  │  - POST /upload    - GET /patient/{id}                   │  │
│  │  - GET /verify     - GET /download                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │              MedicalRecordService                         │  │
│  │  - Upload workflow  - Retrieve records                   │  │
│  │  - Verify integrity - Download files                     │  │
│  └──┬──────────────┬──────────────┬────────────────────────┘  │
└─────┼──────────────┼──────────────┼───────────────────────────┘
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│   IPFS   │  │Ethereum  │  │   MongoDB    │
│ Service  │  │Blockchain│  │  Repository  │
│          │  │ Service  │  │              │
└────┬─────┘  └────┬─────┘  └──────┬───────┘
     │             │                │
     ▼             ▼                ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│   IPFS   │  │ Hardhat  │  │   MongoDB    │
│  Daemon  │  │  Node    │  │   Database   │
│Port 5001 │  │Port 8545 │  │  Port 27017  │
└──────────┘  └──────────┘  └──────────────┘
```

## Upload Workflow

```
┌──────┐
│ User │ Selects medical file (PDF/Image)
└───┬──┘
    │
    ▼
┌─────────────────┐
│ React Component │ Creates FormData with file + metadata
└────────┬────────┘
         │ POST /api/records/upload
         ▼
┌──────────────────┐
│ Spring Boot API  │ Receives multipart file
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  IPFS Service    │ Uploads file to IPFS
└────────┬─────────┘
         │ Returns: QmXxx... (IPFS Hash)
         ▼
┌──────────────────┐
│Blockchain Service│ Stores hash on Ethereum
└────────┬─────────┘
         │ Returns: 0xabc... (Transaction Hash)
         ▼
┌──────────────────┐
│MongoDB Repository│ Saves metadata
└────────┬─────────┘
         │ Returns: Record ID
         ▼
┌──────────────────┐
│   Response       │ {recordId, ipfsHash, txHash}
└──────────────────┘
```

## Verification Workflow

```
┌──────┐
│ User │ Clicks "Verify" button
└───┬──┘
    │
    ▼
┌─────────────────┐
│ React Component │ Calls verify API
└────────┬────────┘
         │ GET /api/records/verify/{recordId}
         ▼
┌──────────────────┐
│ Spring Boot API  │ Gets record from MongoDB
└────────┬─────────┘
         │ Retrieves stored IPFS hash
         ▼
┌──────────────────┐
│Blockchain Service│ Calls smart contract verifyRecord()
└────────┬─────────┘
         │ Smart contract compares hashes
         ▼
┌──────────────────┐
│ Smart Contract   │ Returns true/false
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Response       │ {verified: true/false}
└──────────────────┘
```

## Data Storage Strategy

```
┌─────────────────┐
│  Medical File   │
│  (Binary Data)  │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │  IPFS  │ ← Decentralized, Content-addressed
    └────┬───┘
         │ Returns Hash: QmXxx...
         │
         ├─────────────────┬──────────────────┐
         ▼                 ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐
    │Ethereum │      │ MongoDB  │      │  User    │
    │Contract │      │ Metadata │      │ Response │
    └─────────┘      └──────────┘      └──────────┘
    Immutable        Queryable         Accessible
    Verifiable       Fast Search       Download
```

## Smart Contract Structure

```
┌────────────────────────────────────────┐
│     MedicalRecordManager.sol           │
├────────────────────────────────────────┤
│ Struct: MedicalRecord                  │
│  - ipfsHash                            │
│  - patientId                           │
│  - doctorId                            │
│  - timestamp                           │
│  - recordType                          │
│  - exists                              │
├────────────────────────────────────────┤
│ Mappings:                              │
│  - records[recordId] → MedicalRecord   │
│  - patientRecords[patientId] → []      │
├────────────────────────────────────────┤
│ Functions:                             │
│  ✓ addRecord()                         │
│  ✓ getRecord()                         │
│  ✓ verifyRecord()                      │
│  ✓ getPatientRecords()                 │
├────────────────────────────────────────┤
│ Events:                                │
│  - RecordAdded                         │
│  - RecordVerified                      │
└────────────────────────────────────────┘
```

## MongoDB Schema

```
┌────────────────────────────────────────┐
│  Collection: medical_records           │
├────────────────────────────────────────┤
│ {                                      │
│   _id: ObjectId,                       │
│   recordId: "uuid",                    │
│   patientId: "P001",                   │
│   doctorId: "D001",                    │
│   ipfsHash: "QmXxx...",                │
│   fileName: "report.pdf",              │
│   fileType: "application/pdf",         │
│   recordType: "Lab Report",            │
│   fileSize: 1024000,                   │
│   blockchainTxHash: "0xabc...",        │
│   uploadedAt: ISODate,                 │
│   verified: true                       │
│ }                                      │
└────────────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│              FRONTEND LAYER                 │
│  React.js + Axios + Tailwind CSS            │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│            APPLICATION LAYER                │
│  Spring Boot 3.2 + Java 17                  │
│  - Controllers (REST endpoints)             │
│  - Services (Business logic)                │
│  - Repositories (Data access)               │
└──────┬──────────┬──────────┬────────────────┘
       │          │          │
┌──────▼─────┐ ┌─▼────────┐ ┌▼──────────────┐
│   IPFS     │ │Ethereum  │ │   MongoDB     │
│  Storage   │ │Blockchain│ │   Database    │
│            │ │          │ │               │
│ Web3j      │ │ Hardhat  │ │ Spring Data   │
│ IPFS Client│ │ Solidity │ │ MongoDB       │
└────────────┘ └──────────┘ └───────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         Application Security            │
│  - CORS Protection                      │
│  - Input Validation                     │
│  - File Type Checking                   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Blockchain Security             │
│  - Immutable Storage                    │
│  - Hash Verification                    │
│  - Smart Contract Logic                 │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           IPFS Security                 │
│  - Content Addressing                   │
│  - Distributed Storage                  │
│  - Cryptographic Hashing                │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           Production Environment            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  React   │  │  Spring  │  │ MongoDB  │ │
│  │   App    │  │   Boot   │  │  Cluster │ │
│  │ (Nginx)  │  │  (JAR)   │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌──────────┐  ┌──────────┐               │
│  │   IPFS   │  │ Ethereum │               │
│  │  Cluster │  │   Node   │               │
│  └──────────┘  └──────────┘               │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Legend:**
- ┌─┐ : Component/Service
- │ : Connection/Flow
- ▼ : Data Flow Direction
- ✓ : Implemented Feature
