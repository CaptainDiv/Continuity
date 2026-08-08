// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICCP {
    /// @notice True if a transfer of `asset` from `sender` to `receiver` is currently compliant.
    /// @dev Fails closed at the call site — returns false rather than reverting, caller decides.
    function check(address sender, address receiver, address asset) external view returns (bool);
}