// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { OpcodeHelpers } from '../../libs/opcodes/OpcodeHelpers.sol';

contract OpcodeHelpersMock {
    function putToStack(address _ctxProgram, uint256 _value) public {
        OpcodeHelpers.putToStack(_ctxProgram, _value);
    }

    function getNextBytes(address _ctxProgram, uint256 _size) public returns (bytes memory) {
        return OpcodeHelpers.getNextBytes(_ctxProgram, _size);
    }

    function getNextBytes32(address _ctxProgram, uint256 _size) public returns (bytes32) {
        return OpcodeHelpers.getNextBytes32(_ctxProgram, _size);
    }

    function nextBranchSelector(
        address _ctxDSL,
        address _ctxProgram,
        string memory _baseOpName
    ) public returns (bytes4) {
        return OpcodeHelpers.nextBranchSelector(_ctxDSL, _ctxProgram, _baseOpName);
    }

    function mustCall(address _addr, bytes memory _data) public {
        OpcodeHelpers.mustCall(_addr, _data);
    }

    function mustDelegateCall(address _addr, bytes memory _data) public {
        OpcodeHelpers.mustDelegateCall(_addr, _data);
    }
}
