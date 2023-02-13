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

    /**
     * @dev Gets next {size} bytes from the program
     * @param _ctxProgram Context contract address
     * @param _size Size of the chunk
     * @return out Resulting chunk of type bytes
     */
    function getNextBytes(address _ctxProgram, uint256 _size) public returns (bytes memory out) {
        out = IProgramContext(_ctxProgram).programAt(IProgramContext(_ctxProgram).pc(), _size);
        IProgramContext(_ctxProgram).incPc(_size);
    }

    /**
     * @dev Get next parameter from the program that is executing now
     * @param _ctxProgram ProgramContext contract address
     * @param _size Size of the chunk
     * @return The bytes32-sized slice of the program
     */
    function getNextBytes32(address _ctxProgram, uint256 _size) public returns (bytes32) {
        return bytes32(getNextBytes(_ctxProgram, _size));
    }

    /**
     * @dev add value in bytes32 to array
     * @param _ctxProgram Context contract address
     * @param _varValue added value
     * @param _arrNameB32 name of array
     */
    function addItemToArray(address _ctxProgram, bytes32 _varValue, bytes32 _arrNameB32) public {
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
        return bytes32(IProgramContext(_ctxProgram).programAt(_start, _end - _start));
    }

    function nextBranchSelector(
        address _ctxDSL,
        address _ctxProgram,
        string memory baseOpName
    ) public returns (bytes4) {
        bytes1 branchCode = bytes1(getNextBytes(_ctxProgram, 1));
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

    /**
     * @dev Reads a variable of type `address`
     * @param _ctxProgram ProgramContext contract address
     * @return result The address value
     */
    function getAddress(address _ctxProgram) public returns (address result) {
        result = address(uint160(uint256(getLocalVar(_ctxProgram, 'getStorageAddress(bytes32)'))));
    }

    /**
     * @dev Reads a uint256 number from the program
     * @param _ctxProgram ProgramContext contract address
     * @return uint256 value from the program
     */
    function getUint256(address _ctxProgram, address) public returns (uint256) {
        return uint256(getNextBytes32(_ctxProgram, 32));
    }

    /**
     * @dev Read local variable by delegatecalling a "read" function by its signature
     * @param _ctxProgram ProgramContext contract address
     * @param _funcSignature Signature of the "read" function
     * @return result Local variable value
     */
    function getLocalVar(
        address _ctxProgram,
        string memory _funcSignature
    ) public returns (bytes32 result) {
        bytes32 MSG_SENDER = 0x9ddd6a8100000000000000000000000000000000000000000000000000000000;
        bytes memory data;
        bytes32 varNameB32 = getNextBytes32(_ctxProgram, 4);
        if (varNameB32 == MSG_SENDER) {
            data = abi.encode(IProgramContext(_ctxProgram).msgSender());
        } else {
            // Load local variable by it's hex
            data = mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature(_funcSignature, varNameB32)
            );
        }

        return bytes32(data);
    }
}
