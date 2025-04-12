const AmenitiesNFT = artifacts.require("AmenitiesNFT");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  const myNFTInstance = await MyNFT.deployed();
  await deployer.deploy(AmenitiesNFT, myNFTInstance.address);
};
