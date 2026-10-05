// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {CertiTest} from "../src/CertiTest.sol";

contract DeployCertiTest is Script {
    function run() external returns (CertiTest certiTest) {
        string memory privateKey = vm.envString("PRIVATE_KEY");
        if (bytes(privateKey).length == 64) privateKey = string.concat("0x", privateKey);
        uint256 deployerPrivateKey = vm.parseUint(privateKey);
        vm.startBroadcast(deployerPrivateKey);
        certiTest = new CertiTest();
        vm.stopBroadcast();
    }
}