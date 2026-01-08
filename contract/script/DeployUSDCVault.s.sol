// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VaultFactory.sol";
import "../src/RewardVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DeployUSDCVault
 * @notice Script to deploy USDC RewardVault using VaultFactory
 * @dev Deploy this after USDT vault is deployed
 *
 * USAGE:
 * forge script script/DeployUSDCVault.s.sol:DeployUSDCVault --rpc-url https://testnet.hashio.io/api --broadcast --legacy
 */
contract DeployUSDCVault is Script {
    // ============ Deployed Contracts ============

    /// @notice VaultFactory address
    address constant VAULT_FACTORY = 0x29021eaeb230Bc84120C0f05FDD83C446270c4f7;

    /// @notice USDC token address (already deployed)
    address constant USDC = 0x125D3f690f281659Dd7708D21688BC83Ee534aE6;

    // ============ Vault Parameters ============

    /// @notice APY in basis points (1200 = 12.00%)
    uint256 constant USDC_APY = 1200; // 12%

    /// @notice Initial rewards deposit (100,000 tokens)
    uint256 constant INITIAL_REWARDS = 100_000 * 1e18;

    /// @notice Minimum deposit per user
    uint256 constant MIN_DEPOSIT = 100 * 1e18; // 100 tokens

    /// @notice Maximum deposit per user
    uint256 constant MAX_DEPOSIT_PER_USER = 100_000 * 1e18; // 100,000 tokens

    // ============ Main Script ============

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING USDC VAULT (12% APY)");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("VaultFactory:", VAULT_FACTORY);
        console.log("USDC Token:", USDC);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        VaultFactory factory = VaultFactory(VAULT_FACTORY);
        IERC20 token = IERC20(USDC);

        // Approve factory to spend tokens
        console.log("Approving", INITIAL_REWARDS / 1e18, "USDC...");
        token.approve(VAULT_FACTORY, INITIAL_REWARDS);

        // Create vault
        console.log("Creating USDC vault...");
        address vaultAddress = factory.createVault(
            USDC,
            "Stable USDC Vault",
            "sUSDC",
            USDC_APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=================================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("=================================================");
        console.log("USDC Vault deployed at:", vaultAddress);
        console.log("APY: 12%");
        console.log("Initial Rewards: 100,000 USDC");
        console.log("=================================================");
        console.log("");
        console.log("Next step: Deploy DAI vault");
        console.log(
            "Run: forge script script/DeployDAIVault.s.sol --broadcast --legacy"
        );
    }
}
