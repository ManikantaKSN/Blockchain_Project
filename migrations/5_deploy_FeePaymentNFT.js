const FeePaymentNFT = artifacts.require("FeePaymentNFT");

module.exports = function (deployer) {
  deployer.deploy(FeePaymentNFT);
};
