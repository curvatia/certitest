// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CertiTest} from "../src/CertiTest.sol";

contract CertiTestTest is Test {
    CertiTest private certiTest;
    address private recipient = makeAddr("recipient");
    address private issuer = makeAddr("issuer");

    function setUp() public {
        certiTest = new CertiTest();
    }

    function testOwnerCanIssueCertificateWithMetadata() public {
        uint256 tokenId = certiTest.issueCertificate(recipient, "ipfs://metadata-cid");

        assertEq(tokenId, 1);
        assertEq(certiTest.ownerOf(tokenId), recipient);
        assertEq(certiTest.tokenURI(tokenId), "ipfs://metadata-cid");
    }

    function testApprovedIssuerCanIssueCertificate() public {
        certiTest.setIssuer(issuer, true);

        vm.prank(issuer);
        uint256 tokenId = certiTest.issueCertificate(recipient, "ipfs://metadata-cid");

        assertEq(certiTest.ownerOf(tokenId), recipient);
    }

    function testUnauthorizedAddressCannotIssue() public {
        vm.prank(issuer);
        vm.expectRevert(CertiTest.UnauthorizedIssuer.selector);
        certiTest.issueCertificate(recipient, "ipfs://metadata-cid");
    }

    function testOwnerCanRevokeIssuer() public {
        certiTest.setIssuer(issuer, true);
        certiTest.setIssuer(issuer, false);

        vm.prank(issuer);
        vm.expectRevert(CertiTest.UnauthorizedIssuer.selector);
        certiTest.issueCertificate(recipient, "ipfs://metadata-cid");
    }

    function testCannotIssueToZeroAddress() public {
        vm.expectRevert(CertiTest.InvalidRecipient.selector);
        certiTest.issueCertificate(address(0), "ipfs://metadata-cid");
    }

    function testCannotIssueWithoutMetadata() public {
        vm.expectRevert(CertiTest.EmptyTokenURI.selector);
        certiTest.issueCertificate(recipient, "");
    }
}