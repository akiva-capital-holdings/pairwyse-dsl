// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { OpcodeHelpers } from '../../libs/opcodes/OpcodeHelpers.sol';

contract OpcodeHelpersMock {
    function putToStack(address _ctx, uint256 _value) public {
        OpcodeHelpers.putToStack(_ctx, _value);
    }

    function nextBytes(address _ctx, uint256 _size) public returns (bytes memory) {
        return OpcodeHelpers.nextBytes(_ctx, _size);
    }

    function nextBytes1(address _ctx) public returns (bytes1) {
        return OpcodeHelpers.nextBytes1(_ctx);
    }

    function nextBranchSelector(address _ctx, string memory _baseOpName) public returns (bytes4) {
        return OpcodeHelpers.nextBranchSelector(_ctx, _baseOpName);
    }

    function mustCall(address _addr, bytes memory _data) public {
        OpcodeHelpers.mustCall(_addr, _data);
    }

    function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32) {
        return OpcodeHelpers.getNextBytes(_ctx, _bytesNum);
    }
}
