// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../test/MockERC20.sol";

/**
 * @title DeployTokens
 * @notice Script to deploy USDT, USDC, and DAI mock tokens
 * @dev Run this first to get tokens before deploying vaults
 *
 * USAGE:
 * forge script script/DeployTokens.s.sol:DeployTokens --rpc-url https://testnet.hashio.io/api --broadcast --legacy
 */
contract DeployTokens is Script {
    // Amount to mint per token (1 million tokens)
    uint256 constant MINT_AMOUNT = 1_000_000 * 1e18;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================");
        console.log("DEPLOYING MOCK TOKENS");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("Mint amount per token:", MINT_AMOUNT / 1e18);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy USDT
        console.log("Deploying USDT...");
        MockERC20 usdt = new MockERC20("Tether USD", "USDT", 18, 0);
        usdt.mint(deployer, MINT_AMOUNT);
        console.log("  USDT deployed at:", address(usdt));
        console.log("  Minted", MINT_AMOUNT / 1e18, "USDT");
        console.log("");

        // Deploy USDC
        //    console.log("Deploying USDC...");
        //    MockERC20 usdc = new MockERC20("USD Coin", "USDC", 18, 0);
        //    usdc.mint(deployer, MINT_AMOUNT);
        //    console.log("  USDC deployed at:", address(usdc));
        //    console.log("  Minted", MINT_AMOUNT / 1e18, "USDC");
        //    console.log("");

        //    // Deploy DAI
        //    console.log("Deploying DAI...");
        //    MockERC20 dai = new MockERC20("Dai Stablecoin", "DAI", 18, 0);
        //    dai.mint(deployer, MINT_AMOUNT);
        //    console.log("  DAI deployed at:", address(dai));
        //    console.log("  Minted", MINT_AMOUNT / 1e18, "DAI");
        //    console.log("");

        vm.stopBroadcast();

        console.log("=================================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("=================================================");
        console.log("");
        console.log(
            "IMPORTANT: Update vault deployment scripts with these addresses:"
        );
        console.log("");
        console.log("USDT:", address(usdt));
        //    console.log("USDC:", address(usdc));
        //    console.log("DAI:", address(dai));
        console.log("");
        console.log("=================================================");
    }
}
