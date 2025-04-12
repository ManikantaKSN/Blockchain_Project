const FeePaymentNFT = artifacts.require("FeePaymentNFT");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  // Ensure that MyNFT is deployed first.
  const myNFTInstance = await MyNFT.deployed();
  // Deploy FeePaymentNFT with the NFT contract's address.
  await deployer.deploy(FeePaymentNFT, myNFTInstance.address);
};
