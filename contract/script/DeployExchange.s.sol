// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Exchange.sol";

contract DeployExchange is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address authorizedWithdrawer = vm.envAddress("AUTHORIZED_WITHDRAWER");

        vm.startBroadcast(deployerPrivateKey);

        TestVault vault = new TestVault(authorizedWithdrawer);

        console.log("TestVault deployed at:", address(vault));
        console.log("Owner:", vault.owner());
        console.log("Authorized Withdrawer:", vault.authorizedWithdrawer());

        vm.stopBroadcast();
    }
}
