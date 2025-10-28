// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VaultFactory.sol";
import "../src/RewardVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DeployDAIVault
 * @notice Script to deploy DAI RewardVault using VaultFactory
 * @dev Deploy this last, after USDT and USDC vaults are deployed
 *
 * USAGE:
 * forge script script/DeployDAIVault.s.sol:DeployDAIVault --rpc-url https://testnet.hashio.io/api --broadcast --legacy
 */
contract DeployDAIVault is Script {
    // ============ Deployed Contracts ============

    /// @notice VaultFactory address
    address constant VAULT_FACTORY = 0x29021eaeb230Bc84120C0f05FDD83C446270c4f7;

    /// @notice DAI token address (already deployed)
    address constant DAI = 0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53;

    // ============ Vault Parameters ============

    /// @notice APY in basis points (1500 = 15.00%)
    uint256 constant DAI_APY = 1500; // 15%

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
        console.log("DEPLOYING DAI VAULT (15% APY)");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("VaultFactory:", VAULT_FACTORY);
        console.log("DAI Token:", DAI);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        VaultFactory factory = VaultFactory(VAULT_FACTORY);
        IERC20 token = IERC20(DAI);

        // Approve factory to spend tokens
        console.log("Approving", INITIAL_REWARDS / 1e18, "DAI...");
        token.approve(VAULT_FACTORY, INITIAL_REWARDS);

        // Create vault
        console.log("Creating DAI vault...");
        address vaultAddress = factory.createVault(
            DAI,
            "Optimized DAI Vault",
            "opDAI",
            DAI_APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=================================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("=================================================");
        console.log("DAI Vault deployed at:", vaultAddress);
        console.log("APY: 15%");
        console.log("Initial Rewards: 100,000 DAI");
        console.log("=================================================");
        console.log("");
        console.log("All vaults deployed successfully!");
        console.log(
            "You can now use the frontend to interact with the vaults."
        );
    }
}
