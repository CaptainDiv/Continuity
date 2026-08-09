// SPDX-License-Identifier: MIT
pragma solidity >=0.4.16 ^0.8.24;

// src/interfaces/ICCP.sol

interface ICCP {
    /// @notice True if a transfer of `asset` from `sender` to `receiver` is currently compliant.
    /// @dev Fails closed at the call site — returns false rather than reverting, caller decides.
    function check(address sender, address receiver, address asset) external view returns (bool);
}

// lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// src/interfaces/ILendingPool.sol

/// @notice Minimal surface any lending protocol must expose to be insurable by Continuity.
/// ReferenceLendingPool implements this; a real integration would too.
interface ILendingPool {
    function getOutstandingBalance(uint256 loanId) external view returns (uint256);
    function getBorrower(uint256 loanId) external view returns (address);
}

// src/InsurancePool.sol

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

        require(cvaToken.transferFrom(msg.sender, address(this), amount), "TransferFailed");
        
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

        require(cvaToken.transfer(msg.sender, amountReturned), "TransferFailed");
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
        require(cvaToken.transferFrom(payer, address(this), amount), "TransferFailed");
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
        require(cvaToken.transfer(recipient, amount), "TransferFailed");
        emit PayoutExecuted(policyId, recipient, amount);
    }
}

// src/PolicyManager.sol

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

