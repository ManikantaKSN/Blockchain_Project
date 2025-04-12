const CertificateNFT = artifacts.require("CertificateNFT");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  // Ensure MyNFT is deployed first
  const myNFTInstance = await MyNFT.deployed();
  // Deploy CertificateNFT with the NFT contract's address as the parameter.
  await deployer.deploy(CertificateNFT, myNFTInstance.address);
};
