// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICVI {
    /// @notice True if `wallet` currently holds a valid, non-revoked CVI credential.
    function isVerified(address wallet) external view returns (bool);
}