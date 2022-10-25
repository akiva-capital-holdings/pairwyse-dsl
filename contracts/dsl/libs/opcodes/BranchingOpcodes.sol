// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { ILinkedList } from '../../interfaces/ILinkedList.sol';
import { IStorageUniversal } from '../../interfaces/IStorageUniversal.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsBranchingOpcodes } from '../Errors.sol';

import 'hardhat/console.sol';

/**
 * @title Logical operator opcodes
 * @notice Opcodes for logical operators such as if/esle, switch/case
 */
library BranchingOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opIfelse(address _ctx) public {
        if (IContext(_ctx).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctx, 0); // for if-else condition to work all the time
        }

        uint256 last = IContext(_ctx).stack().pop();
        uint16 _posTrueBranch = getUint16(_ctx);
        uint16 _posFalseBranch = getUint16(_ctx);

        IContext(_ctx).setNextPc(IContext(_ctx).pc());
        IContext(_ctx).setPc(last > 0 ? _posTrueBranch : _posFalseBranch);
    }

    function opIf(address _ctx) public {
        if (IContext(_ctx).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctx, 0); // for if condition to work all the time
        }

        uint256 last = IContext(_ctx).stack().pop();
        uint16 _posTrueBranch = getUint16(_ctx);

        if (last != 0) {
            IContext(_ctx).setNextPc(IContext(_ctx).pc());
            IContext(_ctx).setPc(_posTrueBranch);
        } else {
            IContext(_ctx).setNextPc(IContext(_ctx).program().length);
        }
    }

    function opFunc(address _ctx) public {
        if (IContext(_ctx).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctx, 0);
        }

        uint16 _reference = getUint16(_ctx);

        IContext(_ctx).setNextPc(IContext(_ctx).pc());
        IContext(_ctx).setPc(_reference);
    }

    /**
     * @dev For loop setup. Responsible for checking iterating array existence, set the number of iterations
     * @param _ctx Context contract address
     */
    function opForLoop(address _ctx) external {
        IContext(_ctx).incPc(4); // skip loop's temporary variable name. It will be used later in opStartLoop
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // check if the array exists
        (bool success1, bytes memory data1) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(success1, ErrorsBranchingOpcodes.BR1);
        require(bytes1(data1) != bytes1(0x0), ErrorsBranchingOpcodes.BR2);

        // Set loop
        uint256 _arrLen = ILinkedList(IContext(_ctx).appAddr()).getLength(_arrNameB32);
        IContext(_ctx).setForLoopIterationsRemaining(_arrLen);
    }

    /**
     * @dev Does the real iterating process over the body of the for-loop
     * @param _ctx Context contract address
     */
    function opStartLoop(address _ctx) public {
        // Decrease by 1 the for-loop iterations couter as PC actually points onto the next block of code already
        uint256 _currCtr = IContext(_ctx).forLoopIterationsRemaining();
        uint256 _currPc = IContext(_ctx).pc() - 1;

        // Set the next program counter to the beginning of the loop block
        if (_currCtr > 1) {
            IContext(_ctx).setNextPc(_currPc);
        }

        // Get element from array by index
        bytes32 _arrName = OpcodeHelpers.readBytesSlice(_ctx, _currPc - 4, _currPc);
        uint256 _arrLen = ILinkedList(IContext(_ctx).appAddr()).getLength(_arrName);
        uint256 _index = _arrLen - IContext(_ctx).forLoopIterationsRemaining();
        bytes1 _arrType = ILinkedList(IContext(_ctx).appAddr()).getType(_arrName);
        bytes32 _elem = ILinkedList(IContext(_ctx).appAddr()).get(_index, _arrName);

        // Set the temporary variable value: TMP_VAR = ARR_NAME[i]
        bytes32 _tempVarNameB32 = OpcodeHelpers.readBytesSlice(_ctx, _currPc - 8, _currPc - 4);
        bytes4 setFuncSelector = IContext(_ctx).branchSelectors('declareArr', _arrType);
        OpcodeHelpers.mustCall(
            IContext(_ctx).appAddr(),
            abi.encodeWithSelector(setFuncSelector, _tempVarNameB32, _elem)
        );

        // Reduce the number of iterations remaining
        IContext(_ctx).setForLoopIterationsRemaining(_currCtr - 1);
    }

    /**
     * @dev This function is responsible for getting of the body of the for-loop
     * @param _ctx Context contract address
     */
    function opEndLoop(address _ctx) public {
        uint256 _currPc = IContext(_ctx).pc();
        IContext(_ctx).setPc(IContext(_ctx).nextpc());
        IContext(_ctx).setNextPc(_currPc); // sets next PC to the code after this `end` opcode
    }

    function opEnd(address _ctx) public {
        IContext(_ctx).setPc(IContext(_ctx).nextpc());
        IContext(_ctx).setNextPc(IContext(_ctx).program().length);
    }

    function getUint16(address _ctx) public returns (uint16) {
        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 2);

        // Convert bytes to bytes8
        bytes2 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint16(result);
    }
}
