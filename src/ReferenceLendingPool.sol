// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";

enum LoanStatus { Active, Frozen, Repaid, Defaulted }

struct LoanRecord {
    uint256 id;
    address borrower;
    address lender;
    address claimHolder;
    uint256 principal;
    uint256 outstandingBalance;
    uint256 issuedAt;
    LoanStatus status;
}

contract ReferenceLendingPool is ILendingPool {
    IERC20 public immutable cvaToken;
    address public policyManager;
    address public owner;

    mapping(uint256 => LoanRecord) private loans;
    uint256 public nextLoanId;

    event LoanIssued(uint256 indexed loanId, address indexed borrower, address indexed lender, uint256 principal);
    event LoanRepaid(uint256 indexed loanId, address indexed payer, uint256 amount, uint256 remainingBalance);
    event LoanFullyRepaid(uint256 indexed loanId);
    event LoanSubrogated(uint256 indexed loanId, address indexed previousClaimHolder, address indexed newClaimHolder);
    event PolicyManagerSet(address indexed policyManager);

    error LoanNotFound();
    error RepayExceedsOutstandingBalance();
    error NotPolicyManager();
    error PolicyManagerAlreadySet();
    error ZeroAmount();
    error AlreadySubrogated();
    error NotOwner();

    constructor(address _cvaToken) {
        cvaToken = IERC20(_cvaToken);
        owner = msg.sender;
    }

    function setPolicyManager(address _policyManager) external {
        if (msg.sender != owner) revert NotOwner();
        if (policyManager != address(0)) revert PolicyManagerAlreadySet();
        policyManager = _policyManager;
        emit PolicyManagerSet(_policyManager);
    }

    function issueLoan(address borrower, address lender, uint256 amount) external returns (uint256 loanId) {
        if (amount == 0) revert ZeroAmount();
        loanId = nextLoanId++;
        loans[loanId] = LoanRecord({
            id: loanId,
            borrower: borrower,
            lender: lender,
            claimHolder: lender,
            principal: amount,
            outstandingBalance: amount,
            issuedAt: block.timestamp,
            status: LoanStatus.Active
        });
        emit LoanIssued(loanId, borrower, lender, amount);
    }

    function repay(uint256 loanId, uint256 amount) external {
        LoanRecord storage loan = loans[loanId];
        if (loan.principal == 0) revert LoanNotFound();
        if (amount > loan.outstandingBalance) revert RepayExceedsOutstandingBalance();

        loan.outstandingBalance -= amount;
        if (loan.outstandingBalance == 0) {
            loan.status = LoanStatus.Repaid;
            emit LoanFullyRepaid(loanId);
        }
        emit LoanRepaid(loanId, msg.sender, amount, loan.outstandingBalance);
    }

    function subrogate(uint256 loanId, address newClaimHolder) external {
        if (msg.sender != policyManager) revert NotPolicyManager();
        LoanRecord storage loan = loans[loanId];
        if (loan.principal == 0) revert LoanNotFound();
        address previous = loan.claimHolder;
        loan.claimHolder = newClaimHolder;
        emit LoanSubrogated(loanId, previous, newClaimHolder);
    }

    function getOutstandingBalance(uint256 loanId) external view override returns (uint256) {
        return loans[loanId].outstandingBalance;
    }

    function getBorrower(uint256 loanId) external view override returns (address) {
        return loans[loanId].borrower;
    }

    function getLoan(uint256 loanId) external view returns (LoanRecord memory) {
        return loans[loanId];
    }
}