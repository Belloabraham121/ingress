// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../test/MockERC20.sol";

/**
 * @title MintTokens
 * @notice Script to mint additional tokens to the deployer address
 * @dev Use this if you've already deployed tokens but need more for vault creation
 *
 * USAGE:
 * forge script script/MintTokens.s.sol:MintTokens --rpc-url https://testnet.hashio.io/api --broadcast --legacy
 */
contract MintTokens is Script {
    // Token addresses (if already deployed)
    address constant USDT = 0xaaa4e4EdA96fb9A9eBA3A10cC4d274c63846C81d;
    
    // Amount to mint per token (1 million tokens)
    uint256 constant MINT_AMOUNT = 1_000_000 * 1e18;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================");
        console.log("MINTING TOKENS");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("Amount per token:", MINT_AMOUNT / 1e18);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Try to mint USDT
        try MockERC20(USDT).mint(deployer, MINT_AMOUNT) {
            console.log("Minted", MINT_AMOUNT / 1e18, "USDT to", deployer);
        } catch {
            console.log("Failed to mint USDT - you may not be the owner");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=================================================");
        console.log("MINTING COMPLETE");
        console.log("=================================================");
    }
}

