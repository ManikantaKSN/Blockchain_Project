// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract FeePaymentNFT is ERC721URIStorage {
    uint256 public tokenCounter;
    event FeePaid(address indexed payer, uint256 tokenId, uint256 amount, string tokenURI);

    constructor() ERC721("FeePaymentNFT", "FPNFT") {
        tokenCounter = 0;
    }

    // Payable function to accept fee payments and mint an NFT receipt
    function payFees(string memory tokenURI) public payable returns (uint256) {
        require(msg.value > 0, "Fee must be greater than zero");
        uint256 newTokenId = tokenCounter;
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter++;
        emit FeePaid(msg.sender, newTokenId, msg.value, tokenURI);
        return newTokenId;
    }
}
