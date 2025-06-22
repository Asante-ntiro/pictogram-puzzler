// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {PictogramAchievement} from "../src/PictogramAchievement.sol";

contract DeployPictogramAchievement is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console2.log("Deploying PictogramAchievement contract with address:", deployerAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PictogramAchievement pictogramAchievement = new PictogramAchievement(deployerAddress);
        
        vm.stopBroadcast();

        console2.log("PictogramAchievement deployed at:", address(pictogramAchievement));
    }
}
