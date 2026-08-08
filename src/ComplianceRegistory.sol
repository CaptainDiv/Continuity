// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICCP} from "./interfaces/ICCP.sol";

contract ComplianceRegistry is ICCP {
    address public relayer;
    mapping(bytes32 => bool) private eligibility;

    event EligibilityRecorded(address indexed sender, address indexed receiver, address indexed asset, bool eligible);

    error NotRelayer();

    constructor(address _relayer) {
        relayer = _relayer;
    }

    function recordEligibility(address sender, address receiver, address asset, bool eligible) external {
        if (msg.sender != relayer) revert NotRelayer();
        bytes32 key = keccak256(abi.encodePacked(sender, receiver, asset));
        eligibility[key] = eligible;
        emit EligibilityRecorded(sender, receiver, asset, eligible);
    }

    function check(address sender, address receiver, address asset) external view override returns (bool) {
        bytes32 key = keccak256(abi.encodePacked(sender, receiver, asset));
        return eligibility[key];
    }
}