// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "./IMyNFT.sol";

contract CertificateNFT is ERC721URIStorage {
    uint256 public tokenCounter;
    event CertificateIssued(address indexed student, uint256 tokenId, string tokenURI);

    IMyNFT public nftContract;

    constructor(address _nftContractAddress) ERC721("CertificateNFT", "CERT") {
        tokenCounter = 0;
        nftContract = IMyNFT(_nftContractAddress);
    }

    function issueCertificate(uint256 identityToken, address student, string memory tokenURI) public returns (uint256) {
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");
        uint256 newTokenId = tokenCounter;
        _safeMint(student, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter++;
        emit CertificateIssued(student, newTokenId, tokenURI);
        return newTokenId;
    }
}
