package com.healthcare.medicalrecords.service;

import io.ipfs.api.IPFS;
import io.ipfs.api.MerkleNode;
import io.ipfs.api.NamedStreamable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class IPFSService {

    @Value("${ipfs.host}")
    private String host;

    @Value("${ipfs.port}")
    private int port;

    private IPFS getIpfs() {
        return new IPFS(host, port);
    }

    public String uploadFile(MultipartFile file) throws Exception {
        NamedStreamable.ByteArrayWrapper fileWrapper =
            new NamedStreamable.ByteArrayWrapper(file.getOriginalFilename(), file.getBytes());
        MerkleNode response = getIpfs().add(fileWrapper).get(0);
        return response.hash.toString();
    }

    public byte[] downloadFile(String hash) throws Exception {
        return getIpfs().cat(io.ipfs.multihash.Multihash.fromBase58(hash));
    }
}
