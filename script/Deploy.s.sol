// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {InsurancePool} from "../src/InsurancePool.sol";
import {PolicyManager} from "../src/PolicyManager.sol";
import {ReferenceLendingPool} from "../src/ReferenceLendingPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ICCP} from "../src/interfaces/ICCP.sol";

// Mock token and CCP for hackathon deployment
contract MockERC20 is ERC20 {
    constructor() ERC20("Cleanverse Verified Asset", "CVA") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockCCP is ICCP {
    function check(address, address, address) external pure override returns (bool) {
        return true;
    }
}

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // 1. Deploy infrastructure
        MockERC20 cvaToken = new MockERC20();
        MockCCP ccp = new MockCCP();

        // 2. Deploy core protocol contracts
        ReferenceLendingPool lendingPool = new ReferenceLendingPool(address(cvaToken));
        InsurancePool insurancePool = new InsurancePool(address(cvaToken), address(ccp));
        
        PolicyManager policyManager = new PolicyManager(
            address(insurancePool),
            address(cvaToken),
            address(ccp),
            msg.sender, // Sets your deployer wallet as the authorized relayer
            0, // Changed from 1 days to 0 for instant testing
            8000,   
            500     
        );

        // 3. Link contracts together
        insurancePool.setPolicyManager(address(policyManager));
        lendingPool.setPolicyManager(address(policyManager));

        // Output deployed addresses to the console
        console.log("-----------------------------------------");
        console.log("CVA Token deployed at:", address(cvaToken));
        console.log("InsurancePool deployed at:", address(insurancePool));
        console.log("ReferenceLendingPool deployed at:", address(lendingPool));
        console.log("PolicyManager deployed at:", address(policyManager));
        console.log("-----------------------------------------");

        vm.stopBroadcast();
    }
}