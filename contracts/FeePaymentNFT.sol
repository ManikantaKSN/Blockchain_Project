// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Import OpenZeppelin's ERC721URIStorage contract which extends ERC721 functionality and stores token URIs.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Import the IMyNFT interface to interact with an external NFT contract. This interface provides access to the ownerOf() function.
import "./IMyNFT.sol";

// FeePaymentNFT contract inherits from ERC721URIStorage.
contract FeePaymentNFT is ERC721URIStorage {
    // Counter that tracks the next token ID to mint.
    uint256 public tokenCounter;
    
    // Event emitted when a fee payment NFT is minted.
    // It logs the payer's address, the minted token ID, the fee amount, and the associated token URI.
    event FeePaid(address indexed payer, uint256 tokenId, uint256 amount, string tokenURI);

    // Reference to an NFT contract that implements IMyNFT.
    // This contract is used to verify the ownership of the digital identity NFT.
    IMyNFT public nftContract;

    /**
     * @notice Constructor for FeePaymentNFT.
     * @dev Initializes the ERC721 token with a name and symbol, sets the token counter to 0, and stores the address of the external NFT contract.
     * @param _nftContractAddress The address of the deployed NFT contract (digital identity) which is used for ownership verification.
     */
    constructor(address _nftContractAddress) ERC721("FeePaymentNFT", "FPNFT") {
        tokenCounter = 0;
        nftContract = IMyNFT(_nftContractAddress);
    }

    /**
     * @notice Processes fee payment and mints an NFT receipt.
     * @dev The function checks that the caller owns the specified digital identity NFT and that a fee greater than zero is sent.
     * It then mints an NFT as a receipt, assigns its token URI, updates the counter, emits an event, and returns the new token ID.
     * @param identityToken The NFT token ID representing the student's digital identity.
     * @param tokenURI The URI pointing to the metadata for this fee payment NFT.
     * @return The ID of the newly minted fee payment NFT.
     */
    function payFees(uint256 identityToken, string memory tokenURI) public payable returns (uint256) {
        // Check that the caller owns the digital identity NFT. If not, revert with an error message.
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");
        
        // Ensure that a non-zero fee is sent with the transaction.
        require(msg.value > 0, "Fee must be greater than zero");
        
        // Store the current token counter as the new token's ID.
        uint256 newTokenId = tokenCounter;
        
        // Mint a new NFT receipt to the sender (msg.sender) with the tokenId.
        _safeMint(msg.sender, newTokenId);
        
        // Set the token URI for this NFT which points to the fee payment metadata.
        _setTokenURI(newTokenId, tokenURI);
        
        // Increment the token counter for the next minted NFT.
        tokenCounter++;
        
        // Emit the FeePaid event for off-chain tracking, logging the payer, token ID, fee amount, and token URI.
        emit FeePaid(msg.sender, newTokenId, msg.value, tokenURI);
        
        // Return the new token ID.
        return newTokenId;
    }
}
