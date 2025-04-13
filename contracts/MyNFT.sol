// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Import the ERC721URIStorage contract from OpenZeppelin.
// This extension of the ERC721 standard adds the ability to store token URIs on-chain.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// MyNFT is an ERC721 token contract that enables minting NFTs with on-chain metadata storage.
contract MyNFT is ERC721URIStorage {
    // A counter to keep track of the number of tokens minted.
    // Each minted NFT gets assigned a unique token ID based on this counter.
    uint256 public tokenCounter;

    // Event that is emitted when a new identity NFT is minted.
    // The event logs the address of the minter, the token ID, and the tokenURI containing metadata.
    event IdentityMinted(address indexed user, uint256 tokenId, string tokenURI);

    // The constructor initializes the ERC721 token with a name ("DigitalIdentity") and a symbol ("DID").
    // It also initializes the token counter to start at 0.
    constructor() ERC721("DigitalIdentity", "DID") {
        tokenCounter = 0;
    }

    // Function mintNFT creates a new NFT.
    // It accepts a tokenURI parameter which should point to the metadata for the NFT.
    // The metadata typically contains information such as name, description, and image URL.
    // Only the caller (msg.sender) will receive the newly minted token.
    function mintNFT(string memory tokenURI) public returns (uint256) {
        // Assign a new token ID using the current tokenCounter value.
        uint256 newTokenId = tokenCounter;
        
        // Mint the token safely to the caller (msg.sender).
        // _safeMint ensures the token is only sent to addresses that can handle ERC721 tokens,
        // especially important if the recipient is a contract.
        _safeMint(msg.sender, newTokenId);
        
        // Set the tokenURI for the token.
        // This function comes from the ERC721URIStorage extension and links the token ID to its metadata.
        _setTokenURI(newTokenId, tokenURI);
        
        // Increment the token counter so that the next minted token gets a new unique ID.
        tokenCounter++;
        
        // Emit the IdentityMinted event, which logs the minting details.
        emit IdentityMinted(msg.sender, newTokenId, tokenURI);
        
        // Return the new token ID to confirm the successful minting.
        return newTokenId;
    }
}
