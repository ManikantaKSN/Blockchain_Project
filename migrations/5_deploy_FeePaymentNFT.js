const FeePaymentNFT = artifacts.require("FeePaymentNFT");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  const myNFTInstance = await MyNFT.deployed();
  await deployer.deploy(FeePaymentNFT, myNFTInstance.address);
};
