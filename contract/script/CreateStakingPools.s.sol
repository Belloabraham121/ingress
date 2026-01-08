// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/StakingPools.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CreateStakingPools is Script {
    // Deployed StakingPools contract address
    address constant STAKING_POOLS = 0xE057622f9A2479f4990ffC11aeAd0De40DA7862A;

    // Token addresses from deployed vaults
    address constant USDC_TOKEN = 0x125D3f690f281659Dd7708D21688BC83Ee534aE6;
    address constant USDT_TOKEN = 0xd4E61131Ed9C3dd610727655aE8254B286deE95c;
    address constant DAI_TOKEN = 0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Creating staking pools on Hedera testnet...");
        console.log("Deployer address:", deployer);
        console.log("StakingPools contract:", STAKING_POOLS);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        StakingPools stakingPools = StakingPools(STAKING_POOLS);

        // Pool parameters
        uint256 rewardsDeposit = 50_0000 * 10 ** 18; // 50,000 tokens reward pool
        uint256 minStake = 5 * 10 ** 18; // 100 tokens minimum
        uint256 maxStakePerUser = 100_000 * 10 ** 18; // 100,000 tokens max per user

        // Create USDC Pool (12% APY)
        //    console.log("\n=== Creating USDC Staking Pool ===");
        //    IERC20(USDC_TOKEN).approve(STAKING_POOLS, rewardsDeposit);
        //    uint256 usdcPoolId = stakingPools.createPool(
        //        USDC_TOKEN,
        //        "USDC Staking Pool",
        //        1200, // 12% APY in basis points
        //        rewardsDeposit,
        //        minStake,
        //        maxStakePerUser
        //    );
        //    console.log("USDC Pool ID:", usdcPoolId);
        //    console.log("USDC Token:", USDC_TOKEN);
        //    console.log("APY: 12%");

        // Create USDT Pool (18% APY)
        //    console.log("\n=== Creating USDT Staking Pool ===");
        //    IERC20(USDT_TOKEN).approve(STAKING_POOLS, rewardsDeposit);
        //    uint256 usdtPoolId = stakingPools.createPool(
        //        USDT_TOKEN,
        //        "USDT Staking Pool",
        //        1800, // 18% APY in basis points
        //        rewardsDeposit,
        //        minStake,
        //        maxStakePerUser
        //    );
        //    console.log("USDT Pool ID:", usdtPoolId);
        //    console.log("USDT Token:", USDT_TOKEN);
        //    console.log("APY: 18%");

        // Create DAI Pool (15% APY)
        console.log("\n=== Creating DAI Staking Pool ===");
        IERC20(DAI_TOKEN).approve(STAKING_POOLS, rewardsDeposit);
        uint256 daiPoolId = stakingPools.createPool(
            DAI_TOKEN,
            "DAI Staking Pool",
            1900, // 15% APY in basis points
            rewardsDeposit,
            minStake,
            maxStakePerUser
        );
        console.log("DAI Pool ID:", daiPoolId);
        console.log("DAI Token:", DAI_TOKEN);
        console.log("APY: 15%");

        vm.stopBroadcast();

        console.log("\n=== Pool Creation Summary ===");
        console.log("Network: Hedera Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("StakingPools:", STAKING_POOLS);
        console.log("\nPools Created:");
        //    console.log("1. USDC Pool ID:", usdcPoolId, "- APY: 12%");
        //    console.log("2. USDT Pool ID:", usdtPoolId, "- APY: 18%");
        console.log("3. DAI Pool ID:", daiPoolId, "- APY: 15%");
        console.log("\nRewards Deposited: 50,000 tokens per pool");
        console.log("Min Stake: 100 tokens");
        console.log("Max Stake Per User: 100,000 tokens");
    }
}
