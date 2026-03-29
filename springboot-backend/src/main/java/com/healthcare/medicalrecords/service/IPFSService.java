package com.healthcare.medicalrecords.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Service
public class IPFSService {

    private static final Logger log = LoggerFactory.getLogger(IPFSService.class);

    @Value("${ipfs.host:localhost}")
    private String host;

    @Value("${ipfs.port:5001}")
    private int port;

    @Value("${ipfs.encryption.key:HealthCareSecure}")
    private String encryptionKeyBase;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── Encryption ────────────────────────────────────────────────────────────

    private SecretKey getSecretKey() throws Exception {
        byte[] keyBytes = new byte[16];
        byte[] base = encryptionKeyBase.getBytes("UTF-8");
        System.arraycopy(base, 0, keyBytes, 0, Math.min(base.length, 16));
        return new SecretKeySpec(keyBytes, "AES");
    }

    public byte[] encrypt(byte[] data) throws Exception {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey());
        return cipher.doFinal(data);
    }

    public byte[] decrypt(byte[] data) throws Exception {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey());
        return cipher.doFinal(data);
    }

    // ── IPFS Upload ───────────────────────────────────────────────────────────

    public String uploadFile(MultipartFile file) {
        try {
            byte[] encrypted = encrypt(file.getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(encrypted) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() + ".enc";
                }
            });

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "http://" + host + ":" + port + "/api/v0/add", request, String.class);

            JsonNode json = objectMapper.readTree(response.getBody());
            String hash = json.get("Hash").asText();
            log.info("File encrypted and uploaded to IPFS: {}", hash);
            return hash;

        } catch (Exception e) {
            log.warn("IPFS upload failed: {}", e.getMessage());
            return null;
        }
    }

    // ── IPFS Download ─────────────────────────────────────────────────────────

    public byte[] downloadFile(String hash) throws Exception {
        // IPFS API requires POST for cat
        ResponseEntity<byte[]> response = restTemplate.postForEntity(
            "http://" + host + ":" + port + "/api/v0/cat?arg=" + hash, null, byte[].class);
        byte[] data = response.getBody();
        if (data == null || data.length == 0) throw new Exception("Empty response from IPFS");
        // Try to decrypt — fall back to raw if decryption fails (files uploaded without encryption)
        try {
            return decrypt(data);
        } catch (Exception e) {
            log.warn("Decryption failed for {}, returning raw bytes: {}", hash, e.getMessage());
            return data;
        }
    }
}
