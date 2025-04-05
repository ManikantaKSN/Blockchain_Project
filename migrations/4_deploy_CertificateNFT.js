const CertificateNFT = artifacts.require("CertificateNFT");

module.exports = function (deployer) {
  deployer.deploy(CertificateNFT);
};
