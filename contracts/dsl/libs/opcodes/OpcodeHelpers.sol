// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from '../../interfaces/IDSLContext.sol';
import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { ErrorsOpcodeHelpers } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Opcode helper functions
 * @notice Opcode helper functions that are used in other opcode libraries
 * @dev Opcode libraries are: ComparisonOpcodes, BranchingOpcodes, LogicalOpcodes, and OtherOpcodes
 */
library OpcodeHelpers {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    // TODO: get rid of putToStack function
    function putToStack(address _ctxProgram, uint256 _value) public {
        IProgramContext(_ctxProgram).stack().push(_value);
    }

    function nextBytes(address _ctxProgram, uint256 size) public returns (bytes memory out) {
        out = IProgramContext(_ctxProgram).programAt(IProgramContext(_ctxProgram).pc(), size);
        IProgramContext(_ctxProgram).incPc(size);
    }

    function nextBytes1(address _ctxProgram) public returns (bytes1) {
        return nextBytes(_ctxProgram, 1)[0];
    }

    function addItemToArray(address _ctxProgram, bytes32 _varValue, bytes32 _arrNameB32)public{
            mustCall(
               IProgramContext(_ctxProgram).appAddr(),
               abi.encodeWithSignature(
                   'addItem(bytes32,bytes32)',
                   _varValue, // value that pushes to the array
                   _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
               )
               );
    }

    /**
     * @dev Reads the slice of bytes from the raw program
     * @dev Warning! The maximum slice size can only be 32 bytes!
     * @param _ctxProgram Context contract address
     * @param _start Start position to read
     * @param _end End position to read
     * @return res Bytes32 slice of the raw program
     */
    function readBytesSlice(
        address _ctxProgram,
        uint256 _start,
        uint256 _end
    ) public view returns (bytes32 res) {
        bytes memory slice = IProgramContext(_ctxProgram).programAt(_start, _end - _start);
        // Convert bytes to bytes32
        assembly {
            res := mload(add(slice, 0x20))
        }
    }

    function nextBranchSelector(
        address _ctxDSL,
        address _ctxProgram,
        string memory baseOpName
    ) public returns (bytes4) {
        bytes1 branchCode = nextBytes1(_ctxProgram);
        return IDSLContext(_ctxDSL).branchSelectors(baseOpName, branchCode);
    }

    /**
     * @dev Check .call() function and returns data
     * @param addr Context contract address
     * @param data Abi fubction with params
     * @return callData returns data from call
     */
    function mustCall(address addr, bytes memory data) public returns (bytes memory) {
        (bool success, bytes memory callData) = addr.call(data);
        require(success, ErrorsOpcodeHelpers.OPH1);
        return callData;
    }

    /**
     * @dev Check .delegatecall() function and returns data
     * @param addr Context contract address
     * @param data Abi fubction with params
     * @return delegateCallData returns data from call
     */
    function mustDelegateCall(address addr, bytes memory data) public returns (bytes memory) {
        (bool success, bytes memory delegateCallData) = addr.delegatecall(data);
        require(success, ErrorsOpcodeHelpers.OPH2);
        return delegateCallData;
    }

    function getNextBytes(
        address _ctxProgram,
        uint256 _bytesNum
    ) public returns (bytes32 varNameB32) {
        bytes memory varName = nextBytes(_ctxProgram, _bytesNum);

        // Convert bytes to bytes32
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }
    }
}
