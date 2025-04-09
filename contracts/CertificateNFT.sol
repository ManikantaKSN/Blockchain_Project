// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CertificateNFT is ERC721URIStorage {
    uint256 public tokenCounter;
    event CertificateIssued(address indexed student, uint256 tokenId, string tokenURI);

    constructor() ERC721("CertificateNFT", "CERT") {
        tokenCounter = 0;
    }

    function issueCertificate(address student, string memory tokenURI) public returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(student, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter++;
        emit CertificateIssued(student, newTokenId, tokenURI);
        return newTokenId;
    }
}
