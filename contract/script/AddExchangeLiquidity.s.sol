// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Exchange.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AddExchangeLiquidity is Script {
    // Deployed Exchange contract
    address constant EXCHANGE = 0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5;

    // Token addresses
    address constant USDC_TOKEN = 0x125D3f690f281659Dd7708D21688BC83Ee534aE6;
    address constant USDT_TOKEN = 0xd4E61131Ed9C3dd610727655aE8254B286deE95c;
    address constant DAI_TOKEN = 0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        Exchange exchange = Exchange(payable(EXCHANGE));

        console.log("Adding liquidity to Exchange contract...");
        console.log("Exchange address:", EXCHANGE);
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Add USDC liquidity (if you have USDC)
        //    uint256 usdcBalance = IERC20(USDC_TOKEN).balanceOf(deployer);
        //    if (usdcBalance > 0) {
        //        uint256 usdcAmount = 10000 * 10 ** 18; // 10,000 USDC (6 decimals)
        //        if (usdcBalance >= usdcAmount) {
        //            IERC20(USDC_TOKEN).approve(EXCHANGE, usdcAmount);
        //            exchange.addTokenLiquidity(USDC_TOKEN, usdcAmount);
        //            console.log("Added USDC liquidity:", usdcAmount);
        //        } else {
        //            console.log(
        //                "Insufficient USDC balance. Available:",
        //                usdcBalance
        //            );
        //        }
        //    } else {
        //        console.log("No USDC balance to add");
        //    }

        // Add USDT liquidity (if you have USDT)
        //    uint256 usdtBalance = IERC20(USDT_TOKEN).balanceOf(deployer);
        //    if (usdtBalance > 0) {
        //        uint256 usdtAmount = 10000 * 10 ** 18; // 10,000 USDT (6 decimals)
        //        if (usdtBalance >= usdtAmount) {
        //            IERC20(USDT_TOKEN).approve(EXCHANGE, usdtAmount);
        //            exchange.addTokenLiquidity(USDT_TOKEN, usdtAmount);
        //            console.log("Added USDT liquidity:", usdtAmount);
        //        } else {
        //            console.log(
        //                "Insufficient USDT balance. Available:",
        //                usdtBalance
        //            );
        //        }
        //    } else {
        //        console.log("No USDT balance to add");
        //    }

        //    // Add DAI liquidity (if you have DAI)
        //    uint256 daiBalance = IERC20(DAI_TOKEN).balanceOf(deployer);
        //    if (daiBalance > 0) {
        //        uint256 daiAmount = 10000 * 10 ** 18; // 10,000 DAI (18 decimals)
        //        if (daiBalance >= daiAmount) {
        //            IERC20(DAI_TOKEN).approve(EXCHANGE, daiAmount);
        //            exchange.addTokenLiquidity(DAI_TOKEN, daiAmount);
        //            console.log("Added DAI liquidity:", daiAmount);
        //        } else {
        //            console.log("Insufficient DAI balance. Available:", daiBalance);
        //        }
        //    } else {
        //        console.log("No DAI balance to add");
        //    }

        //    // Add HBAR liquidity
        uint256 hbarAmount = 100 * 10 ** 8; // 1,00 HBAR
        if (deployer.balance >= hbarAmount) {
            exchange.addHbarLiquidity{value: hbarAmount}();
            console.log("Added HBAR liquidity:", hbarAmount);
        } else {
            console.log(
                "Insufficient HBAR balance. Available:",
                deployer.balance
            );
        }

        vm.stopBroadcast();

        console.log("\n=== Liquidity Addition Complete ===");
        console.log("Exchange Contract:", EXCHANGE);
        console.log("USDC Balance:", IERC20(USDC_TOKEN).balanceOf(EXCHANGE));
        console.log("USDT Balance:", IERC20(USDT_TOKEN).balanceOf(EXCHANGE));
        console.log("DAI Balance:", IERC20(DAI_TOKEN).balanceOf(EXCHANGE));
        console.log("HBAR Balance:", EXCHANGE.balance);
    }
}
