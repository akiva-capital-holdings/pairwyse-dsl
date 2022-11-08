// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Governance } from '../Governance.sol';

// TODO: this contract will be used for tests
contract GovernanceMock is Governance {
    constructor(
        address _parser,
        address _onlyOwner,
        address _token,
        uint256 _deadline,
        address[] memory _contexts
    ) Governance(_parser, _onlyOwner, _token, _deadline, _contexts) {}
}
