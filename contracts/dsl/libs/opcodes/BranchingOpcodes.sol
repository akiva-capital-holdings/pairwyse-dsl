/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { IDSLContext } from '../../interfaces/IDSLContext.sol';
import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { ILinkedList } from '../../interfaces/ILinkedList.sol';
import { IStorageUniversal } from '../../interfaces/IStorageUniversal.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsBranchingOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Logical operator opcodes
 * @notice Opcodes for logical operators such as if/esle, switch/case
 */
library BranchingOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opIfelse(address _ctxProgram, address) public {
        if (IProgramContext(_ctxProgram).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctxProgram, 0); // for if-else condition to work all the time
        }

        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint16 _posTrueBranch = getUint16(_ctxProgram);
        uint16 _posFalseBranch = getUint16(_ctxProgram);

        IProgramContext(_ctxProgram).setNextPc(IProgramContext(_ctxProgram).pc());
        IProgramContext(_ctxProgram).setPc(last > 0 ? _posTrueBranch : _posFalseBranch);
    }

    function opIf(address _ctxProgram, address) public {
        if (IProgramContext(_ctxProgram).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctxProgram, 0); // for if condition to work all the time
        }

        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint16 _posTrueBranch = getUint16(_ctxProgram);

        if (last != 0) {
            IProgramContext(_ctxProgram).setNextPc(IProgramContext(_ctxProgram).pc());
            IProgramContext(_ctxProgram).setPc(_posTrueBranch);
        } else {
            IProgramContext(_ctxProgram).setNextPc(IProgramContext(_ctxProgram).program().length);
        }
    }

    function opFunc(address _ctxProgram, address) public {
        if (IProgramContext(_ctxProgram).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctxProgram, 0);
        }

        uint16 _reference = getUint16(_ctxProgram);

        IProgramContext(_ctxProgram).setNextPc(IProgramContext(_ctxProgram).pc());
        IProgramContext(_ctxProgram).setPc(_reference);
    }

    /**
     * @dev For loop setup. Responsible for checking iterating array existence, set the number of iterations
     * @param _ctxProgram Context contract address
     */
    function opForLoop(address _ctxProgram, address) external {
        IProgramContext(_ctxProgram).incPc(4); // skip loop's temporary variable name. It will be used later in opStartLoop
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

        // check if the array exists
        bytes memory data1 = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(bytes1(data1) != bytes1(0x0), ErrorsBranchingOpcodes.BR2);

        // Set loop
        uint256 _arrLen = ILinkedList(IProgramContext(_ctxProgram).appAddr()).getLength(
            _arrNameB32
        );
        IProgramContext(_ctxProgram).setForLoopIterationsRemaining(_arrLen);
    }

    /**
     * @dev Does the real iterating process over the body of the for-loop
     * @param _ctxDSL DSL Context contract address
     * @param _ctxProgram ProgramContext contract address
     */
    function opStartLoop(address _ctxProgram, address _ctxDSL) public {
        // Decrease by 1 the for-loop iterations couter as PC actually points onto the next block of code already
        uint256 _currCtr = IProgramContext(_ctxProgram).forLoopIterationsRemaining();
        uint256 _currPc = IProgramContext(_ctxProgram).pc() - 1;

        // Set the next program counter to the beginning of the loop block
        if (_currCtr > 1) {
            IProgramContext(_ctxProgram).setNextPc(_currPc);
        }

        // Get element from array by index
        bytes32 _arrName = OpcodeHelpers.readBytesSlice(_ctxProgram, _currPc - 4, _currPc);
        uint256 _arrLen = ILinkedList(IProgramContext(_ctxProgram).appAddr()).getLength(_arrName);
        uint256 _index = _arrLen - IProgramContext(_ctxProgram).forLoopIterationsRemaining();
        bytes1 _arrType = ILinkedList(IProgramContext(_ctxProgram).appAddr()).getType(_arrName);
        bytes32 _elem = ILinkedList(IProgramContext(_ctxProgram).appAddr()).get(_index, _arrName);

        // Set the temporary variable value: TMP_VAR = ARR_NAME[i]
        bytes32 _tempVarNameB32 = OpcodeHelpers.readBytesSlice(
            _ctxProgram,
            _currPc - 8,
            _currPc - 4
        );
        bytes4 setFuncSelector = IDSLContext(_ctxDSL).branchSelectors('declareArr', _arrType);
        OpcodeHelpers.mustDelegateCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSelector(setFuncSelector, _tempVarNameB32, _elem)
        );

        // Reduce the number of iterations remaining
        IProgramContext(_ctxProgram).setForLoopIterationsRemaining(_currCtr - 1);
    }

    /**
     * @dev This function is responsible for getting of the body of the for-loop
     * @param _ctxProgram Context contract address
     */
    function opEndLoop(address _ctxProgram, address) public {
        uint256 _currPc = IProgramContext(_ctxProgram).pc();
        IProgramContext(_ctxProgram).setPc(IProgramContext(_ctxProgram).nextpc());
        IProgramContext(_ctxProgram).setNextPc(_currPc); // sets next PC to the code after this `end` opcode
    }

    function opEnd(address _ctxProgram, address) public {
        IProgramContext(_ctxProgram).setPc(IProgramContext(_ctxProgram).nextpc());
        IProgramContext(_ctxProgram).setNextPc(IProgramContext(_ctxProgram).program().length);
    }

    function getUint16(address _ctxProgram) public returns (uint16) {
        bytes memory data = OpcodeHelpers.getNextBytes(_ctxProgram, 2);

        // Convert bytes to bytes8
        bytes2 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint16(result);
    }
}
