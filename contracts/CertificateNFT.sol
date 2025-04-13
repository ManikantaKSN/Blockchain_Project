// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Import the ERC721URIStorage contract from OpenZeppelin that provides ERC721 functionality with token URI storage.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Import the IMyNFT interface (defined in a separate file) to interact with an existing NFT contract.
import "./IMyNFT.sol";

// CertificateNFT contract inherits from ERC721URIStorage.
contract CertificateNFT is ERC721URIStorage {
    // Counter to track the next token ID to be minted.
    uint256 public tokenCounter;
    
    // Event emitted when a certificate NFT is issued.
    // This event logs the student's address, the NFT token ID, and its associated tokenURI.
    event CertificateIssued(address indexed student, uint256 tokenId, string tokenURI);

    // Reference to an NFT contract that implements the IMyNFT interface.
    // This reference is used to verify digital identity NFT ownership.
    IMyNFT public nftContract;

    /**
     * @notice Constructor for the CertificateNFT contract.
     * @param _nftContractAddress The address of the NFT contract (e.g., digital identity NFT) that is used to verify ownership.
     * The ERC721 constructor is called with the name "CertificateNFT" and the symbol "CERT".
     * The tokenCounter is initialized to 0.
     */
    constructor(address _nftContractAddress) ERC721("CertificateNFT", "CERT") {
        tokenCounter = 0;
        nftContract = IMyNFT(_nftContractAddress);
    }

    /**
     * @notice Issues a certificate NFT for a student.
     * @param identityToken The NFT token ID that serves as the student's digital identity.
     * @param student The address of the student for whom the certificate is being issued.
     * @param tokenURI The token URI that points to the metadata of the certificate.
     * @return The newly minted certificate NFT token ID.
     *
     * Requirements:
     * - The caller must own the digital identity NFT (verified via nftContract.ownerOf).
     */
    function issueCertificate(
        uint256 identityToken,
        address student,
        string memory tokenURI
    ) public returns (uint256) {
        // Ensure that the sender of the transaction owns the digital identity NFT.
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");
        
        // Store the current tokenCounter value in newTokenId.
        uint256 newTokenId = tokenCounter;
        
        // Mint a new NFT with token ID newTokenId to the student's address.
        _safeMint(student, newTokenId);
        
        // Set the tokenURI for the newly minted certificate NFT.
        _setTokenURI(newTokenId, tokenURI);
        
        // Increment the token counter for the next certificate.
        tokenCounter++;
        
        // Emit the CertificateIssued event so that off-chain services or logs can capture this issuance.
        emit CertificateIssued(student, newTokenId, tokenURI);
        
        // Return the new token ID.
        return newTokenId;
    }
}
