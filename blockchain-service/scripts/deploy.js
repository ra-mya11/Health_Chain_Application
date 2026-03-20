const hre = require("hardhat");

async function main() {
  console.log("Deploying MedicalRecords contract...");

  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const medicalRecords = await MedicalRecords.deploy();

  await medicalRecords.waitForDeployment();

  const address = await medicalRecords.getAddress();
  console.log(`MedicalRecords deployed to: ${address}`);

  // Register sample users
  const [admin, patient1, doctor1] = await hre.ethers.getSigners();

  console.log("\nRegistering sample users...");
  
  await medicalRecords.registerUser(patient1.address, 0, "John Doe");
  console.log(`Patient registered: ${patient1.address}`);

  await medicalRecords.registerUser(doctor1.address, 1, "Dr. Smith");
  console.log(`Doctor registered: ${doctor1.address}`);

  console.log("\n=== Deployment Summary ===");
  console.log(`Contract Address: ${address}`);
  console.log(`Admin: ${admin.address}`);
  console.log(`Patient: ${patient1.address}`);
  console.log(`Doctor: ${doctor1.address}`);
  console.log("\nSave the contract address to your .env file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
