const hre = require("hardhat");

async function main() {
  console.log("Deploying MedicalRecordManager contract...");

  const MedicalRecordManager = await hre.ethers.getContractFactory("MedicalRecordManager");
  const contract = await MedicalRecordManager.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✓ MedicalRecordManager deployed to:", address);
  console.log("\nUpdate this address in application.properties:");
  console.log(`blockchain.contract.address=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
