// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { ILinkedList } from '../../interfaces/ILinkedList.sol';
import { IStorage } from '../../interfaces/IStorage.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

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

    function opForLoop(address _ctx) public {
        console.log('opForLoop');
        // Ex. [('for'), 'LP_INITIAL', 'in', 'LPS_INITIAL']
        bytes32 loopVarName = OpcodeHelpers.getNextBytes(_ctx, 4);
        console.logBytes32(loopVarName);
        // OpcodeHelpers.nextBytes(_ctx, 32); // skip `in` keyword as it is useless
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);
        console.logBytes32(_arrNameB32);

        // check if the array exists
        (bool success1, bytes memory data1) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        // TODO: these errors are as strings because I wanna check are the error names correct
        require(success1, 'ErrorsGeneralOpcodes.OP1');
        require(bytes32(data1) != bytes32(0x0), 'ErrorsGeneralOpcodes.OP4');

        uint256 _arrLen = ILinkedList(IContext(_ctx).appAddr()).getLength(_arrNameB32);
        IContext(_ctx).setForLoopCtr(_arrLen);
    }

    function opStartLoop(address _ctx) public {
        console.log('-> opStartLoop');
        // Decrease by 1 the for-loop iterations couter
        uint256 _currCtr = IContext(_ctx).forLoopCtr();
        uint256 _currPc = IContext(_ctx).pc() - 1;
        console.log('Current counter is', _currCtr);
        if (_currCtr > 1) {
            console.log('iterate: Set next PC to current PC', _currPc);
            IContext(_ctx).setNextPc(_currPc);
        }

        // -- Get the element by index from array
        bytes32 _tempVarNameB32 = OpcodeHelpers.readBytesSlice(_ctx, _currPc - 8, _currPc - 4);
        bytes32 _arrNameB32 = OpcodeHelpers.readBytesSlice(_ctx, _currPc - 4, _currPc);
        console.log('Array name is');
        console.logBytes32(_arrNameB32);
        uint256 _arrLen = ILinkedList(IContext(_ctx).appAddr()).getLength(_arrNameB32);
        uint256 _index = _arrLen - IContext(_ctx).forLoopCtr();

        // check if the array exists
        (bool success, bytes memory data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(success, ErrorsGeneralOpcodes.OP1);

        (success, data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(
                'get(uint256,bytes32)',
                _index, // index of the searched item
                _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
            )
        );
        require(success, ErrorsGeneralOpcodes.OP1);

        uint256 _element = uint256(bytes32(data));
        console.log('The current element by index', _index, 'is', _element);

        // Set the iterator variable value
        console.log('_tempVarNameB32');
        console.logBytes32(_tempVarNameB32);
        IStorage(IContext(_ctx).appAddr()).setStorageUint256(_tempVarNameB32, _element);

        // -- end of Get the element by index from array

        IContext(_ctx).setForLoopCtr(_currCtr - 1); // TODO: rename forLoopCtr to forLoopIterationsRemaining
    }

    function opEndLoop(address _ctx) public {
        console.log('-> opEndLoop');
        console.log('Next PC is', IContext(_ctx).nextpc());
        uint256 _currPc = IContext(_ctx).pc();
        IContext(_ctx).setPc(IContext(_ctx).nextpc());
        console.log('end-loop: Set next PC to current PC', _currPc);
        IContext(_ctx).setNextPc(_currPc); // set next PC to the code after this `end` opcode
    }

    function opEnd(address _ctx) public {
        console.log('-> opEnd');
        console.log('Current PC is', IContext(_ctx).pc());
        console.log('Next PC is', IContext(_ctx).nextpc());
        IContext(_ctx).setPc(IContext(_ctx).nextpc());
        console.log('Set next PC to', IContext(_ctx).program().length);
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
