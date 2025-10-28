// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeployVaults (DEPRECATED)
 * @notice This script is now deprecated. Use individual vault deployment scripts instead.
 *
 * ⚠️  IMPORTANT: DO NOT USE THIS SCRIPT ⚠️
 *
 * The tokens (USDT, USDC, DAI) are already deployed. To avoid transaction issues,
 * deploy vaults one at a time using the individual scripts:
 *
 * 1. Deploy USDT Vault: script/DeployUSDTVault.s.sol
 * 2. Deploy USDC Vault: script/DeployUSDCVault.s.sol
 * 3. Deploy DAI Vault: script/DeployDAIVault.s.sol
 *
 * See DEPLOYMENT_INSTRUCTIONS.md for detailed steps.
 *
 * Already Deployed Tokens:
 * - USDT: 0xaaa4e4EdA96fb9A9eBA3A10cC4d274c63846C81d
 * - USDC: 0xc519BfbD99A7c3b930E74259aA41a7C229B46599
 * - DAI: 0x0a80098112bc1B9BaC8be558C9Bd3DB8f4eB4ba6
 *
 * VaultFactory: 0x29021eaeb230Bc84120C0f05FDD83C446270c4f7
 */

import "forge-std/Script.sol";
import "../src/VaultFactory.sol";
import "../src/RewardVault.sol";
import "../test/MockERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract DeployVaults is Script {
    // ============ Deployed Contracts ============

    /// @notice VaultFactory address (from run-latest.json)
    address constant VAULT_FACTORY = 0x29021eaeb230Bc84120C0f05FDD83C446270c4f7;

    // ============ Token Addresses (Deployed during script execution) ============

    /// @notice USDT token address (deployed by this script)
    address public USDT;

    /// @notice USDC token address (deployed by this script)
    address public USDC;

    /// @notice DAI token address (deployed by this script)
    address public DAI;

    // ============ Vault Parameters ============

    /// @notice APY in basis points (1200 = 12.00%)
    uint256 constant USDT_APY = 1800; // 18%
    uint256 constant USDC_APY = 1200; // 12%
    uint256 constant DAI_APY = 1500; // 15%

    /// @notice Amount to mint per token (1 million tokens)
    uint256 constant MINT_AMOUNT = 1_000_000 * 1e18;

    /// @notice Initial rewards deposit per vault (100,000 tokens)
    /// @dev This is the amount you deposit to pay out rewards to users
    uint256 constant INITIAL_REWARDS = 100_000 * 1e18;

    /// @notice Minimum deposit per user
    uint256 constant MIN_DEPOSIT = 100 * 1e18; // 100 tokens

    /// @notice Maximum deposit per user (0 = unlimited)
    uint256 constant MAX_DEPOSIT_PER_USER = 100_000 * 1e18; // 100,000 tokens

    // ============ Deployed Vault Addresses ============

    address public usdtVault;
    address public usdcVault;
    address public daiVault;

    // ============ Main Script ============

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING TOKENS AND REWARD VAULTS");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("VaultFactory:", VAULT_FACTORY);
        console.log("Mint Amount per Token:", MINT_AMOUNT / 1e18, "tokens");
        console.log(
            "Initial Rewards per Vault:",
            INITIAL_REWARDS / 1e18,
            "tokens"
        );
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Store deployer for later use in deployVault function
        address sender = deployer;

        // ============ Deploy Tokens ============

        console.log("=== STEP 1: DEPLOYING TOKENS ===");
        console.log("");

        // Deploy USDT
        console.log("Deploying USDT token...");
        MockERC20 usdtToken = new MockERC20("Tether USD", "USDT", 18, 0);
        USDT = address(usdtToken);
        console.log("  USDT deployed at:", USDT);

        // Mint USDT
        usdtToken.mint(deployer, MINT_AMOUNT);
        console.log("  Minted", MINT_AMOUNT / 1e18, "USDT to deployer");
        console.log("");

        // Deploy USDC
        console.log("Deploying USDC token...");
        MockERC20 usdcToken = new MockERC20("USD Coin", "USDC", 18, 0);
        USDC = address(usdcToken);
        console.log("  USDC deployed at:", USDC);

        // Mint USDC
        usdcToken.mint(deployer, MINT_AMOUNT);
        console.log("  Minted", MINT_AMOUNT / 1e18, "USDC to deployer");
        console.log("");

        // Deploy DAI
        console.log("Deploying DAI token...");
        MockERC20 daiToken = new MockERC20("Dai Stablecoin", "DAI", 18, 0);
        DAI = address(daiToken);
        console.log("  DAI deployed at:", DAI);

        // Mint DAI
        daiToken.mint(deployer, MINT_AMOUNT);
        console.log("  Minted", MINT_AMOUNT / 1e18, "DAI to deployer");
        console.log("");

        console.log("=== STEP 2: DEPLOYING VAULTS ===");
        console.log("");

        // ============ Deploy USDT Vault (18% APY) ============

        console.log("--- Deploying USDT Vault (18% APY) ---");
        usdtVault = deployVault(
            USDT,
            "High Yield USDT Vault",
            "hyUSDT",
            USDT_APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER,
            sender
        );
        console.log("USDT Vault deployed at:", usdtVault);
        console.log("");

        // ============ Deploy USDC Vault (12% APY) ============

        console.log("--- Deploying USDC Vault (12% APY) ---");
        usdcVault = deployVault(
            USDC,
            "Stable USDC Vault",
            "sUSDC",
            USDC_APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER,
            sender
        );
        console.log("USDC Vault deployed at:", usdcVault);
        console.log("");

        // ============ Deploy DAI Vault (15% APY) ============

        console.log("--- Deploying DAI Vault (15% APY) ---");
        daiVault = deployVault(
            DAI,
            "Optimized DAI Vault",
            "opDAI",
            DAI_APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER,
            sender
        );
        console.log("DAI Vault deployed at:", daiVault);
        console.log("");

        vm.stopBroadcast();

        // ============ Summary ============

        console.log("=================================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("=================================================");
        console.log("");
        console.log("TOKENS:");
        console.log("  USDT Token:", USDT);
        console.log("  USDC Token:", USDC);
        console.log("  DAI Token:", DAI);
        console.log("");
        console.log("VAULTS:");
        console.log("  USDT Vault (18% APY):", usdtVault);
        console.log("  USDC Vault (12% APY):", usdcVault);
        console.log("  DAI Vault (15% APY):", daiVault);
        console.log("");
        console.log("BALANCES:");
        console.log(
            "  Deployer USDT:",
            (MINT_AMOUNT - INITIAL_REWARDS) / 1e18,
            "tokens"
        );
        console.log(
            "  Deployer USDC:",
            (MINT_AMOUNT - INITIAL_REWARDS) / 1e18,
            "tokens"
        );
        console.log(
            "  Deployer DAI:",
            (MINT_AMOUNT - INITIAL_REWARDS) / 1e18,
            "tokens"
        );
        console.log("=================================================");
        console.log("");
        console.log("NOTE: Save these addresses for frontend integration!");
        console.log("");

        // Verify vaults are registered in factory
        verifyDeployments();
    }

    // ============ Helper Functions ============

    /**
     * @notice Deploy a single vault using VaultFactory
     * @param asset Token address for the vault
     * @param name Vault share token name
     * @param symbol Vault share token symbol
     * @param apy Annual percentage yield in basis points
     * @param initialRewards Initial rewards deposit amount
     * @param minDeposit Minimum deposit amount
     * @param maxDeposit Maximum deposit per user
     * @param deployer Address of the deployer (token holder)
     * @return vaultAddress Address of deployed vault
     */
    function deployVault(
        address asset,
        string memory name,
        string memory symbol,
        uint256 apy,
        uint256 initialRewards,
        uint256 minDeposit,
        uint256 maxDeposit,
        address deployer
    ) internal returns (address vaultAddress) {
        VaultFactory factory = VaultFactory(VAULT_FACTORY);
        IERC20 token = IERC20(asset);

        // Check token balance
        uint256 balance = token.balanceOf(deployer);
        require(balance >= initialRewards, "Insufficient token balance");

        console.log("  Token:", asset);
        console.log("  Name:", name);
        console.log("  Symbol:", symbol);
        console.log("  APY:", apy, "basis points");
        console.log("  Initial Rewards:", initialRewards / 1e18);
        console.log("  Min Deposit:", minDeposit / 1e18);
        console.log("  Max Deposit:", maxDeposit / 1e18);

        // Approve factory to spend tokens
        console.log("  Approving tokens...");
        token.approve(VAULT_FACTORY, initialRewards);

        // Create vault
        console.log("  Creating vault...");
        vaultAddress = factory.createVault(
            asset,
            name,
            symbol,
            apy,
            initialRewards,
            minDeposit,
            maxDeposit
        );

        console.log("  Vault created successfully!");

        return vaultAddress;
    }

    /**
     * @notice Verify all vaults are properly registered in factory
     */
    function verifyDeployments() internal view {
        VaultFactory factory = VaultFactory(VAULT_FACTORY);

        console.log("=================================================");
        console.log("VERIFICATION");
        console.log("=================================================");

        // Check total vaults
        uint256 totalVaults = factory.getTotalVaults();
        console.log("Total vaults in factory:", totalVaults);

        // Verify each vault
        require(factory.isVault(usdtVault), "USDT vault not registered");
        require(factory.isVault(usdcVault), "USDC vault not registered");
        require(factory.isVault(daiVault), "DAI vault not registered");

        console.log("All vaults verified successfully!");
        console.log("=================================================");
    }

    /**
     * @notice Get vault details for a deployed vault
     * @param vault Vault address to query
     */
    function getVaultDetails(address vault) internal view {
        VaultFactory factory = VaultFactory(VAULT_FACTORY);

        (
            address vaultAddress,
            address asset,
            address creator,
            string memory name,
            string memory symbol,
            uint256 apr,
            uint256 initialDeposit,
            uint256 createdAt,
            bool active,
            uint256 totalUserDeposits,
            uint256 rewardsPoolRemaining,
            uint256 totalRewardsClaimed,
            uint256 totalDepositors
        ) = factory.getVaultDetails(vault);

        console.log("Vault Details:");
        console.log("  Address:", vaultAddress);
        console.log("  Asset:", asset);
        console.log("  Creator:", creator);
        console.log("  Name:", name);
        console.log("  Symbol:", symbol);
        console.log("  APY:", apr, "bps");
        console.log("  Initial Deposit:", initialDeposit / 1e18);
        console.log("  Created At:", createdAt);
        console.log("  Active:", active);
        console.log("  Total User Deposits:", totalUserDeposits / 1e18);
        console.log("  Rewards Pool Remaining:", rewardsPoolRemaining / 1e18);
        console.log("  Total Rewards Claimed:", totalRewardsClaimed / 1e18);
        console.log("  Total Depositors:", totalDepositors);
    }
}
