// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {InsurancePool} from "../src/InsurancePool.sol";
import {PolicyManager} from "../src/PolicyManager.sol";
import {ReferenceLendingPool} from "../src/ReferenceLendingPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ICCP} from "../src/interfaces/ICCP.sol";

// Mock Token to act as our CVA Token during tests
contract MockERC20 is ERC20 {
    constructor() ERC20("Cleanverse Verified Asset", "CVA") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Compliance Protocol (CCP) that approves everything for testing
contract MockCCP is ICCP {
    function check(address, address, address) external pure override returns (bool) {
        return true;
    }
}

contract ContinuityTest is Test {
    InsurancePool public insurancePool;
    PolicyManager public policyManager;
    ReferenceLendingPool public lendingPool;
    MockERC20 public cvaToken;
    MockCCP public ccp;

    address owner = address(1);
    address underwriter = address(2);
    address lender = address(3);
    address borrower = address(4);
    address relayer = address(5);

    function setUp() public {
        vm.startPrank(owner);
        
        // 1. Deploy Mock infrastructure
        cvaToken = new MockERC20();
        ccp = new MockCCP();

        lendingPool = new ReferenceLendingPool(address(cvaToken));
        insurancePool = new InsurancePool(address(cvaToken), address(ccp));
        
        // Deploy Policy Manager (1 day waiting period, 80% payout ratio, 5% premium rate)
        policyManager = new PolicyManager(
            address(insurancePool),
            address(cvaToken),
            address(ccp),
            relayer,
            1 days, 
            8000,   
            500     
        );

        // Link contracts together
        insurancePool.setPolicyManager(address(policyManager));
        lendingPool.setPolicyManager(address(policyManager));
        vm.stopPrank();

        // 2. Fund our test accounts with mock CVA tokens
        cvaToken.mint(underwriter, 500000 * 1e18);
        cvaToken.mint(lender, 50000 * 1e18);
    }

    function testFullContinuityWorkflow() public {
        // --- STEP 1: Underwriter deposits capital into InsurancePool ---
        vm.startPrank(underwriter);
        cvaToken.approve(address(insurancePool), 200000 * 1e18);
        insurancePool.depositUnderwriting(200000 * 1e18);
        vm.stopPrank();

        assertEq(insurancePool.getReserves(), 200000 * 1e18, "Reserves should match deposit");

        // --- STEP 2: Issue a loan in the Lending Pool ---
        vm.prank(owner);
        uint256 loanId = lendingPool.issueLoan(borrower, lender, 10000 * 1e18);
        assertEq(lendingPool.getOutstandingBalance(loanId), 10000 * 1e18);

        // --- STEP 3: Lender buys an insurance policy for the loan ---
        vm.startPrank(lender);
        cvaToken.approve(address(insurancePool), 1000 * 1e18); 
        uint256 policyId = policyManager.buyPolicy(address(lendingPool), loanId, 10000 * 1e18);
        vm.stopPrank();

        // Verify policy is created
        assertEq(policyManager.getPolicy(policyId).loanId, loanId);

        // --- STEP 4: Time travel past the waiting period (1 day) ---
        vm.warp(block.timestamp + 2 days);

        uint256 lenderBalanceBefore = cvaToken.balanceOf(lender);

        // --- STEP 5: Relayer triggers the policy (Simulating CVI revocation/default) ---
        vm.prank(relayer);
        policyManager.checkAndTrigger(policyId);

        // --- STEP 6: Assert that the lender received their payout successfully ---
        uint256 expectedPayout = (10000 * 1e18 * 8000) / 10000; // 80% of coverage amount
        assertEq(
            cvaToken.balanceOf(lender), 
            lenderBalanceBefore + expectedPayout, 
            "Lender should receive insurance payout"
        );
        
        emit log("Test passed successfully: Full workflow verified!");
    }
}