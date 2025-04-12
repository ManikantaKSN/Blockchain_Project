// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "./IMyNFT.sol";

contract FeePaymentNFT is ERC721URIStorage {
    uint256 public tokenCounter;
    event FeePaid(address indexed payer, uint256 tokenId, uint256 amount, string tokenURI);

    IMyNFT public nftContract;

    constructor(address _nftContractAddress) ERC721("FeePaymentNFT", "FPNFT") {
        tokenCounter = 0;
        nftContract = IMyNFT(_nftContractAddress);
    }

    // Payable function to accept fee payments and mint an NFT receipt.
    // The function verifies that the caller owns the specified NFT identity.
    function payFees(uint256 identityToken, string memory tokenURI) public payable returns (uint256) {
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");
        require(msg.value > 0, "Fee must be greater than zero");
        uint256 newTokenId = tokenCounter;
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter++;
        emit FeePaid(msg.sender, newTokenId, msg.value, tokenURI);
        return newTokenId;
    }
}
