// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Context } from '../Context.sol';

contract ContextMock is Context {
    function addOpcodeBranchExt(
        string memory _baseOpName,
        string memory _branchName,
        bytes1 _branchCode,
        bytes4 _selector
    ) external {
        addOpcodeBranch(_baseOpName, _branchName, _branchCode, _selector);
    }

    function addOperatorExt(string memory _op, uint256 _priority) external {
        addOperator(_op, _priority);
    }
}
