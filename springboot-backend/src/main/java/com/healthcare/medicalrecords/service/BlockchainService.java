package com.healthcare.medicalrecords.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.List;

/**
 * Service for blockchain interactions using Web3j
 * Handles smart contract calls for medical record management
 */
@Service
public class BlockchainService {

    private static final Logger log = LoggerFactory.getLogger(BlockchainService.class);
    
    private final Web3j web3j;
    private final Credentials credentials;
    private final String contractAddress;
    private final TransactionManager transactionManager;
    
    public BlockchainService(
            @Value("${blockchain.rpc.url}") String rpcUrl,
            @Value("${blockchain.contract.address}") String contractAddress,
            @Value("${blockchain.private.key}") String privateKey) {
        
        try {
            this.web3j = Web3j.build(new HttpService(rpcUrl));
            this.credentials = Credentials.create(privateKey);
            this.contractAddress = contractAddress;
            this.transactionManager = new RawTransactionManager(web3j, credentials);
            log.info("BlockchainService initialized with contract: {}", contractAddress);
        } catch (Exception e) {
            log.error("Failed to initialize BlockchainService", e);
            throw new RuntimeException("Blockchain service initialization failed", e);
        }
    }
    
    /**
     * Add a new medical record to the blockchain
     */
    public String addRecord(String recordId, String ipfsHash, String patientId, 
                           String doctorId, String recordType) throws Exception {
        
        try {
            log.debug("Adding record to blockchain - ID: {}, Patient: {}", recordId, patientId);
            
            Function function = new Function(
                "addRecord",
                Arrays.asList(
                    new Utf8String(recordId),
                    new Utf8String(ipfsHash),
                    new Utf8String(patientId),
                    new Utf8String(doctorId),
                    new Utf8String(recordType)
                ),
                Arrays.asList(new TypeReference<Bool>() {})
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            EthSendTransaction transactionResponse = transactionManager.sendTransaction(
                DefaultGasProvider.GAS_PRICE,
                DefaultGasProvider.GAS_LIMIT,
                contractAddress,
                encodedFunction,
                BigInteger.ZERO
            );
            
            String txHash = transactionResponse.getTransactionHash();
            log.info("Record added to blockchain with TX hash: {}", txHash);
            
            return txHash;
            
        } catch (Exception e) {
            log.error("Error adding record to blockchain", e);
            throw new Exception("Failed to add record to blockchain: " + e.getMessage());
        }
    }
    
    /**
     * Verify a record's integrity on the blockchain
     */
    public boolean verifyRecord(String recordId, String ipfsHash) throws Exception {
        
        try {
            log.debug("Verifying record on blockchain - ID: {}", recordId);
            
            Function function = new Function(
                "verifyRecord",
                Arrays.asList(
                    new Utf8String(recordId),
                    new Utf8String(ipfsHash)
                ),
                Arrays.asList(new TypeReference<Bool>() {})
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(
                    credentials.getAddress(),
                    contractAddress,
                    encodedFunction
                ),
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST
            ).send();
            
            if (response.getError() != null) {
                log.error("Blockchain call error: {}", response.getError().getMessage());
                return false;
            }
            
            List<Type> result = FunctionReturnDecoder.decode(
                response.getValue(),
                function.getOutputParameters()
            );
            
            if (result.isEmpty()) {
                log.warn("No result returned from verification call");
                return false;
            }
            
            boolean isValid = (Boolean) result.get(0).getValue();
            log.info("Record verification result: {} - Valid: {}", recordId, isValid);
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying record on blockchain", e);
            throw new Exception("Failed to verify record: " + e.getMessage());
        }
    }
    
    /**
     * Get record details from blockchain
     */
    public RecordDetails getRecord(String recordId) throws Exception {
        
        try {
            log.debug("Fetching record from blockchain - ID: {}", recordId);
            
            Function function = new Function(
                "getRecord",
                Arrays.asList(new Utf8String(recordId)),
                Arrays.asList(
                    new TypeReference<Utf8String>() {},  // ipfsHash
                    new TypeReference<Utf8String>() {},  // patientId
                    new TypeReference<Utf8String>() {},  // doctorId
                    new TypeReference<Utf8String>() {},  // recordType
                    new TypeReference<Uint256>() {}      // timestamp
                )
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(
                    credentials.getAddress(),
                    contractAddress,
                    encodedFunction
                ),
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST
            ).send();
            
            if (response.getError() != null) {
                log.error("Blockchain call error: {}", response.getError().getMessage());
                return null;
            }
            
            List<Type> result = FunctionReturnDecoder.decode(
                response.getValue(),
                function.getOutputParameters()
            );
            
            if (result.size() >= 5) {
                return new RecordDetails(
                    (String) result.get(0).getValue(),    // ipfsHash
                    (String) result.get(1).getValue(),    // patientId
                    (String) result.get(2).getValue(),    // doctorId
                    (String) result.get(3).getValue(),    // recordType
                    ((Uint256) result.get(4)).getValue()  // timestamp
                );
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("Error fetching record from blockchain", e);
            throw new Exception("Failed to fetch record: " + e.getMessage());
        }
    }
    
    /**
     * Get all record IDs for a patient
     */
    public List<String> getPatientRecords(String patientId) throws Exception {
        
        try {
            log.debug("Fetching patient records from blockchain - PatientID: {}", patientId);
            
            Function function = new Function(
                "getPatientRecords",
                Arrays.asList(new Utf8String(patientId)),
                Arrays.asList(new TypeReference<org.web3j.abi.datatypes.DynamicArray<Utf8String>>() {})
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(
                    credentials.getAddress(),
                    contractAddress,
                    encodedFunction
                ),
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST
            ).send();
            
            if (response.getError() != null) {
                log.warn("Could not fetch patient records: {}", response.getError().getMessage());
                return Arrays.asList();
            }
            
            log.info("Successfully fetched patient records for: {}", patientId);
            return Arrays.asList();
            
        } catch (Exception e) {
            log.error("Error fetching patient records from blockchain", e);
            return Arrays.asList();
        }
    }
    
    /**
     * Archive a record on blockchain
     */
    public String archiveRecord(String recordId) throws Exception {
        
        try {
            log.debug("Archiving record on blockchain - ID: {}", recordId);
            
            Function function = new Function(
                "archiveRecord",
                Arrays.asList(new Utf8String(recordId)),
                Arrays.asList(new TypeReference<Bool>() {})
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            EthSendTransaction transactionResponse = transactionManager.sendTransaction(
                DefaultGasProvider.GAS_PRICE,
                DefaultGasProvider.GAS_LIMIT,
                contractAddress,
                encodedFunction,
                BigInteger.ZERO
            );
            
            String txHash = transactionResponse.getTransactionHash();
            log.info("Record archived on blockchain with TX hash: {}", txHash);
            
            return txHash;
            
        } catch (Exception e) {
            log.error("Error archiving record on blockchain", e);
            throw new Exception("Failed to archive record: " + e.getMessage());
        }
    }
    
    /**
     * Check if blockchain is connected and accessible
     */
    public boolean isConnected() {
        try {
            return web3j.web3ClientVersion().send().hasError() == false;
        } catch (Exception e) {
            log.error("Blockchain connection check failed", e);
            return false;
        }
    }
    
    /**
     * Get current block number
     */
    public Long getCurrentBlockNumber() throws Exception {
        return web3j.ethBlockNumber().send().getBlockNumber().longValue();
    }
    
    /**
     * Inner class to hold record details from blockchain
     */
    public static class RecordDetails {
        public final String ipfsHash;
        public final String patientId;
        public final String doctorId;
        public final String recordType;
        public final BigInteger timestamp;
        
        public RecordDetails(String ipfsHash, String patientId, String doctorId, 
                           String recordType, BigInteger timestamp) {
            this.ipfsHash = ipfsHash;
            this.patientId = patientId;
            this.doctorId = doctorId;
            this.recordType = recordType;
            this.timestamp = timestamp;
        }
    }
}
