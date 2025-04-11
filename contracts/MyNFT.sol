// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721URIStorage {
    uint256 public tokenCounter;
    event IdentityMinted(address indexed user, uint256 tokenId, string tokenURI);

    constructor() ERC721("DigitalIdentity", "DID") {
        tokenCounter = 0;
    }

    // Mints an NFT for a given user with metadata stored in tokenURI.
    function mintNFT(address user, string memory tokenURI) public returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(user, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter++;
        emit IdentityMinted(user, newTokenId, tokenURI);
        return newTokenId;
    }
}
