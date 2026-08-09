// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IPolicyManager {
    function createPolicy(uint256 loanId, address borrower, uint256 amount) external;
    function updateCviStatus(address account, bool status) external;
}

interface IInsurancePool {
    function deposit() external payable;
}

contract SeedContracts is Script {
    // Your deployed contract addresses on Monad Testnet
    address constant POLICY_MANAGER = 0xfC599223766CD08e843d819D8a951b90162796C7;
    address constant INSURANCE_POOL = 0x5b424b56a9eb5d65cEF56D70fB966FB73216e62c;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Fund the Insurance Pool with testnet native MON if needed
        (bool success, ) = INSURANCE_POOL.call{value: 1 ether}("");
        require(success, "Pool funding failed");

        // 2. Initialize or activate Policy #1 / Loan #1
        // (Adjust function names if your PolicyManager uses slightly different naming)
        try IPolicyManager(POLICY_MANAGER).createPolicy(1, msg.sender, 20000) {
            console.log("Policy #1 created successfully");
        } catch {
            console.log("Policy setup bypassed or already initialized");
        }

        vm.stopBroadcast();
    }
}