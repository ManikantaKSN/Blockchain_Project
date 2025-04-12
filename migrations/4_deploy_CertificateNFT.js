const CertificateNFT = artifacts.require("CertificateNFT");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  const myNFTInstance = await MyNFT.deployed();
  await deployer.deploy(CertificateNFT, myNFTInstance.address);
};
