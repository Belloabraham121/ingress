// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/StakingPools.sol";

contract DeployStakingPoolsScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying StakingPools to Hedera testnet...");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy StakingPools
        StakingPools stakingPools = new StakingPools();
        
        vm.stopBroadcast();
        
        console.log("StakingPools deployed at:", address(stakingPools));
        
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Hedera Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("StakingPools:", address(stakingPools));
    }
}