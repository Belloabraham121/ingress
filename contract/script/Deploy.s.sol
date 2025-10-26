// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/VaultFactory.sol";
import "../src/StakingPools.sol";
import "../test/MockERC20.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts to Hedera testnet...");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy a mock ERC20 token for testing (optional)
        MockERC20 mockToken = new MockERC20("Test Token", "TEST", 18, 0); // 18 decimals, 0 initial supply
        console.log("Mock Token deployed at:", address(mockToken));
        
        // Deploy VaultFactory
        uint256 factoryFee = 500; // 5% factory fee in basis points
        VaultFactory vaultFactory = new VaultFactory(deployer, factoryFee); // deployer as fee recipient
        console.log("VaultFactory deployed at:", address(vaultFactory));
        
        // Deploy StakingPools
        StakingPools stakingPools = new StakingPools();
        console.log("StakingPools deployed at:", address(stakingPools));
        
        // Mint some test tokens to deployer for testing
        mockToken.mint(deployer, 1000000 * 10**18); // 1M tokens
        console.log("Minted 1M test tokens to deployer");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Hedera Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Mock Token:", address(mockToken));
        console.log("VaultFactory:", address(vaultFactory));
        console.log("StakingPools:", address(stakingPools));
        console.log("Factory Fee:", factoryFee, "basis points");
        
        console.log("\n=== Copy these addresses to deployments/hedera-testnet.env ===");
        console.log("MOCK_TOKEN=", address(mockToken));
        console.log("VAULT_FACTORY=", address(vaultFactory));
        console.log("STAKING_POOLS=", address(stakingPools));
        console.log("DEPLOYER=", deployer);
        console.log("CHAIN_ID=", block.chainid);
    }
}