const CourseReg = artifacts.require("MyCourseReg");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  // Get the deployed NFT contract instance
  const nftInstance = await MyNFT.deployed();
  // Deploy CourseReg with the NFT contract's address as parameter
  await deployer.deploy(CourseReg, nftInstance.address);
};
