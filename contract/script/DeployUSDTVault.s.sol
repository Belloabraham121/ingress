// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VaultFactory.sol";
import "../src/RewardVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DeployUSDTVault
 * @notice Script to deploy USDT RewardVault using VaultFactory
 * @dev Deploy this first, then USDC, then DAI to avoid transaction issues
 *
 * USAGE:
 * forge script script/DeployUSDTVault.s.sol:DeployUSDTVault --rpc-url https://testnet.hashio.io/api --broadcast --legacy
 */
contract DeployUSDTVault is Script {
    // ============ Deployed Contracts ============

    /// @notice VaultFactory address
    address constant VAULT_FACTORY = 0x29021eaeb230Bc84120C0f05FDD83C446270c4f7;

    /// @notice USDT token address (already deployed)
    address constant USDT = 0xd4E61131Ed9C3dd610727655aE8254B286deE95c;

    // ============ Vault Parameters ============

    /// @notice APY in basis points (1800 = 18.00%)
    uint256 constant USDT_APY = 1800; // 18%

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
        console.log("DEPLOYING USDT VAULT (18% APY)");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("VaultFactory:", VAULT_FACTORY);
        console.log("USDT Token:", USDT);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        VaultFactory factory = VaultFactory(VAULT_FACTORY);
        IERC20 token = IERC20(USDT);

        // Approve factory to spend tokens
        console.log("Approving", INITIAL_REWARDS / 1e18, "USDT...");
        token.approve(VAULT_FACTORY, INITIAL_REWARDS);

        // Create vault
        console.log("Creating USDT vault...");
        address vaultAddress = factory.createVault(
            USDT,
            "High Yield USDT Vault",
            "hyUSDT",
            USDT_APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=================================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("=================================================");
        console.log("USDT Vault deployed at:", vaultAddress);
        console.log("APY: 18%");
        console.log("Initial Rewards: 100,000 USDT");
        console.log("=================================================");
        console.log("");
        console.log("Next step: Deploy USDC vault");
        console.log(
            "Run: forge script script/DeployUSDCVault.s.sol --broadcast --legacy"
        );
    }
}
