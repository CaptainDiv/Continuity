// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICCP} from "./interfaces/ICCP.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";
import {InsurancePool} from "./InsurancePool.sol";

enum PolicyStatus { Pending, Active, Triggered, Expired, Claimed }

struct Policy {
    uint256 id;
    address lender;
    address loanContract;
    uint256 loanId;
    address borrower;
    uint256 coverageAmount;
    uint256 payoutAmount;
    uint256 premiumPaid;
    uint256 purchasedAt;
    uint256 activeAt;
    PolicyStatus status;
}

contract PolicyManager {
    InsurancePool public immutable insurancePool;
    IERC20 public immutable cvaToken;
    ICCP public immutable ccp;
    address public relayer;
    address public owner;
    uint256 public immutable waitingPeriod;
    uint256 public immutable payoutRatioBps;
    uint256 public immutable premiumRateBps;

    mapping(uint256 => Policy) private policies;
    uint256 public nextPolicyId;

    event PolicyPurchased(uint256 indexed policyId, address indexed lender, address indexed loanContract, uint256 loanId, uint256 coverageAmount, uint256 payoutAmount, uint256 premiumPaid, uint256 activeAt);
    event PolicyTriggered(uint256 indexed policyId, address indexed lender, uint256 payoutAmount);
    event PolicyExpired(uint256 indexed policyId);
    event RelayerUpdated(address indexed relayer);

    error NotRelayer();
    error NotOwner();
    error CoverageExceedsOutstandingBalance();
    error InsufficientPoolCapacity();
    error PolicyNotFound();
    error PolicyNotYetActive();
    error PolicyNotActive();
    error LoanNotRepaid();
    error NotCompliant(address wallet);
    error ZeroCoverageAmount();

    constructor(
        address _insurancePool,
        address _cvaToken,
        address _ccp,
        address _relayer,
        uint256 _waitingPeriod,
        uint256 _payoutRatioBps,
        uint256 _premiumRateBps
    ) {
        insurancePool = InsurancePool(_insurancePool);
        cvaToken = IERC20(_cvaToken);
        ccp = ICCP(_ccp);
        relayer = _relayer;
        waitingPeriod = _waitingPeriod;
        payoutRatioBps = _payoutRatioBps;
        premiumRateBps = _premiumRateBps;
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        if(msg.sender != owner) revert NotOwner();
        _;
    }

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
        emit RelayerUpdated(_relayer);
    }

    function getQuote(uint256 coverageAmount) public view returns (uint256 premium) {
        return (coverageAmount * premiumRateBps) / 10000;
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function isActive(uint256 policyId) public view returns (bool) {
        Policy memory p = policies[policyId];
        return (p.status == PolicyStatus.Active && block.timestamp >= p.activeAt);
    }

    function buyPolicy(address loanContract, uint256 loanId, uint256 coverageAmount) external returns (uint256 policyId) {
        if (coverageAmount == 0) revert ZeroCoverageAmount();
        if (!ccp.check(msg.sender, address(this), address(cvaToken))) revert NotCompliant(msg.sender);

        uint256 outstanding = ILendingPool(loanContract).getOutstandingBalance(loanId);
        if (coverageAmount > outstanding) revert CoverageExceedsOutstandingBalance();

        uint256 premium = getQuote(coverageAmount);
        uint256 payoutAmount = (coverageAmount * payoutRatioBps) / 10000;

        policyId = nextPolicyId++;
        
        policies[policyId] = Policy({
            id: policyId,
            lender: msg.sender,
            loanContract: loanContract,
            loanId: loanId,
            borrower: ILendingPool(loanContract).getBorrower(loanId),
            coverageAmount: coverageAmount,
            payoutAmount: payoutAmount,
            premiumPaid: premium,
            purchasedAt: block.timestamp,
            activeAt: block.timestamp + waitingPeriod,
            status: PolicyStatus.Active
        });

        insurancePool.receivePremium(msg.sender, premium, policyId);
        insurancePool.commitLiability(policyId, payoutAmount);

        emit PolicyPurchased(policyId, msg.sender, loanContract, loanId, coverageAmount, payoutAmount, premium, block.timestamp + waitingPeriod);
    }

    function checkAndTrigger(uint256 policyId) external {
        if (msg.sender != relayer) revert NotRelayer();
        
        Policy storage p = policies[policyId];
        if (p.coverageAmount == 0) revert PolicyNotFound();
        if (p.status != PolicyStatus.Active) revert PolicyNotActive();
        if (block.timestamp < p.activeAt) revert PolicyNotYetActive();

        p.status = PolicyStatus.Triggered;
        insurancePool.payout(policyId, p.lender, p.payoutAmount);

        emit PolicyTriggered(policyId, p.lender, p.payoutAmount);
    }

    function expirePolicy(uint256 policyId) external {
        Policy storage p = policies[policyId];
        if (p.coverageAmount == 0) revert PolicyNotFound();
        if (p.status != PolicyStatus.Active) revert PolicyNotActive();

        if (ILendingPool(p.loanContract).getOutstandingBalance(p.loanId) != 0) revert LoanNotRepaid();

        p.status = PolicyStatus.Expired;
        insurancePool.releaseLiability(policyId, p.payoutAmount);

        emit PolicyExpired(policyId);
    }
}