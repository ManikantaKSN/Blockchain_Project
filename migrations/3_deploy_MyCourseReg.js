const CourseReg = artifacts.require("MyCourseReg");
const MyNFT = artifacts.require("MyNFT");

module.exports = async function(deployer) {
  const nftInstance = await MyNFT.deployed();
  await deployer.deploy(CourseReg, nftInstance.address);
};
