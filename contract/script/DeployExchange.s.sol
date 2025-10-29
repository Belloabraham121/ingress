// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Exchange.sol";

contract DeployExchange is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Exchange contract to Hedera testnet...");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Exchange with deployer as initial authorized withdrawer
        // This can be updated later using updateAuthorizedWithdrawer()
        Exchange exchange = new Exchange(deployer);
        console.log("Exchange deployed at:", address(exchange));
        console.log("Owner:", exchange.owner());
        console.log("Authorized Withdrawer:", exchange.authorizedWithdrawer());

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Network: Hedera Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Exchange Contract:", address(exchange));
        console.log("Owner:", exchange.owner());
        console.log("Authorized Withdrawer:", exchange.authorizedWithdrawer());

        console.log(
            "\n=== Copy these addresses to deployments/hedera-testnet.env ==="
        );
        console.log("EXCHANGE_CONTRACT=", address(exchange));
        console.log("EXCHANGE_OWNER=", deployer);
        console.log("EXCHANGE_AUTHORIZED_WITHDRAWER=", deployer);
        console.log("DEPLOYER=", deployer);
        console.log("CHAIN_ID=", block.chainid);

        console.log("\n=== Next Steps ===");
        console.log(
            "1. Save the Exchange contract address:",
            address(exchange)
        );
        console.log("2. If needed, update the authorized withdrawer using:");
        console.log("   exchange.updateAuthorizedWithdrawer(newAddress)");
        console.log("3. Users can now deposit tokens and HBAR");
        console.log("4. Authorized withdrawer can withdraw funds as needed");
    }
}
