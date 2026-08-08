// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal surface any lending protocol must expose to be insurable by Continuity.
/// ReferenceLendingPool implements this; a real integration would too.
interface ILendingPool {
    function getOutstandingBalance(uint256 loanId) external view returns (uint256);
    function getBorrower(uint256 loanId) external view returns (address);
}