// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICCP} from "./interfaces/ICCP.sol";

struct UnderwriterPosition {
    address underwriter;
    uint256 sharesOwned;
    uint256 depositedAt;
}

contract InsurancePool {
    IERC20 public immutable cvaToken;
    ICCP public immutable ccp;
    address public policyManager;
    address public owner;

    uint256 public totalShares;
    uint256 public totalCommittedLiability;
    mapping(address => UnderwriterPosition) private positions;

    event UnderwritingDeposited(address indexed underwriter, uint256 amount, uint256 sharesMinted);
    event UnderwritingWithdrawn(address indexed underwriter, uint256 shares, uint256 amountReturned);
    event PremiumReceived(uint256 indexed policyId, address indexed payer, uint256 amount);
    event LiabilityCommitted(uint256 indexed policyId, uint256 amount);
    event LiabilityReleased(uint256 indexed policyId, uint256 amount);
    event PayoutExecuted(uint256 indexed policyId, address indexed recipient, uint256 amount);
    event PolicyManagerSet(address indexed policyManager);

    error NotPolicyManager();
    error PolicyManagerAlreadySet();
    error NotCompliant(address wallet);
    error InsufficientUnlockedCapital();
    error InsufficientReserves();
    error ZeroAmount();
    error ZeroShares();
    error NotOwner();

    constructor(address _cvaToken, address _ccp) {
        cvaToken = IERC20(_cvaToken);
        ccp = ICCP(_ccp);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if(msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyPolicyManager() {
        if(msg.sender != policyManager) revert NotPolicyManager();
        _;
    }

    function setPolicyManager(address _policyManager) external onlyOwner {
        if(policyManager != address(0)) revert PolicyManagerAlreadySet();
        policyManager = _policyManager;
        emit PolicyManagerSet(_policyManager);
    }

    function getReserves() public view returns (uint256) {
        return cvaToken.balanceOf(address(this));
    }

    function depositUnderwriting(uint256 amount) external returns (uint256 sharesMinted) {
        if (amount == 0) revert ZeroAmount();
        if (!ccp.check(msg.sender, address(this), address(cvaToken))) revert NotCompliant(msg.sender);

        uint256 _reserves = getReserves();
        if (totalShares == 0 || _reserves == 0) {
            sharesMinted = amount;
        } else {
            sharesMinted = (amount * totalShares) / _reserves;
        }

        cvaToken.transferFrom(msg.sender, address(this), amount);
        
        totalShares += sharesMinted;
        positions[msg.sender].sharesOwned += sharesMinted;
        positions[msg.sender].underwriter = msg.sender;
        positions[msg.sender].depositedAt = block.timestamp;

        emit UnderwritingDeposited(msg.sender, amount, sharesMinted);
    }

    function previewWithdraw(uint256 shares) public view returns (uint256 amountOut) {
        if (totalShares == 0) return 0;
        amountOut = (shares * getReserves()) / totalShares;
    }

    function maxWithdrawableShares(address underwriter) public view returns (uint256 shares) {
        shares = positions[underwriter].sharesOwned;
        uint256 amountOut = previewWithdraw(shares);
        uint256 unlockedCapital = getReserves() - totalCommittedLiability;
        
        if (amountOut > unlockedCapital) {
            shares = (unlockedCapital * totalShares) / getReserves();
        }
    }

    function withdrawUnderwriting(uint256 shares) external returns (uint256 amountReturned) {
        if (shares == 0) revert ZeroShares();
        if (shares > maxWithdrawableShares(msg.sender)) revert InsufficientUnlockedCapital();

        amountReturned = previewWithdraw(shares);
        totalShares -= shares;
        positions[msg.sender].sharesOwned -= shares;

        cvaToken.transfer(msg.sender, amountReturned);
        emit UnderwritingWithdrawn(msg.sender, shares, amountReturned);
    }

    function getPosition(address underwriter) external view returns (UnderwriterPosition memory) {
        return positions[underwriter];
    }

    function getSolvencyRatio() external view returns (uint256) {
        if (totalCommittedLiability == 0) return type(uint256).max;
        return (getReserves() * 10000) / totalCommittedLiability;
    }

    function receivePremium(address payer, uint256 amount, uint256 policyId) external onlyPolicyManager {
        cvaToken.transferFrom(payer, address(this), amount);
        emit PremiumReceived(policyId, payer, amount);
    }

    function commitLiability(uint256 policyId, uint256 liabilityAmount) external onlyPolicyManager {
        if (getReserves() - totalCommittedLiability < liabilityAmount) revert InsufficientReserves();
        totalCommittedLiability += liabilityAmount;
        emit LiabilityCommitted(policyId, liabilityAmount);
    }

    function releaseLiability(uint256 policyId, uint256 liabilityAmount) external onlyPolicyManager {
        totalCommittedLiability -= liabilityAmount;
        emit LiabilityReleased(policyId, liabilityAmount);
    }

    function payout(uint256 policyId, address recipient, uint256 amount) external onlyPolicyManager {
        totalCommittedLiability -= amount;
        cvaToken.transfer(recipient, amount);
        emit PayoutExecuted(policyId, recipient, amount);
    }
}