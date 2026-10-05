// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract CertiTest is ERC721URIStorage, Ownable {
    error UnauthorizedIssuer();
    error InvalidRecipient();
    error EmptyTokenURI();

    uint256 public nextCertificateId = 1;
    mapping(address => bool) public issuers;

    event IssuerUpdated(address indexed issuer, bool approved);
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string tokenURI
    );

    modifier onlyIssuer() {
        if (!issuers[msg.sender]) revert UnauthorizedIssuer();
        _;
    }

    constructor() ERC721("CertiTest Certificate", "CERTI") Ownable(msg.sender) {
        issuers[msg.sender] = true;
        emit IssuerUpdated(msg.sender, true);
    }

    function setIssuer(address issuer, bool approved) external onlyOwner {
        if (issuer == address(0)) revert InvalidRecipient();
        issuers[issuer] = approved;
        emit IssuerUpdated(issuer, approved);
    }

    function issueCertificate(address recipient, string calldata metadataURI)
        external
        onlyIssuer
        returns (uint256 tokenId)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        if (bytes(metadataURI).length == 0) revert EmptyTokenURI();

        tokenId = nextCertificateId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CertificateIssued(tokenId, recipient, msg.sender, metadataURI);
    }
}