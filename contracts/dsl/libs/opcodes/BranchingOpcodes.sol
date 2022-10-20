// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { ILinkedList } from '../../interfaces/ILinkedList.sol';
import { IStorage } from '../../interfaces/IStorage.sol';
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
        IContext(_ctx).incPc(4); // skip loop's temporary variable name. It will be used later in opStartLoop
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // check if the array exists
        (bool success1, bytes memory data1) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(success1, ErrorsBranchingOpcodes.BR1);
        require(bytes32(data1) != bytes32(0x0), ErrorsBranchingOpcodes.BR2);

        uint256 _arrLen = ILinkedList(IContext(_ctx).appAddr()).getLength(_arrNameB32);
        IContext(_ctx).setForLoopIterationsRemaining(_arrLen);
    }

    function opStartLoop(address _ctx) public {
        // Decrease by 1 the for-loop iterations couter
        uint256 _currCtr = IContext(_ctx).forLoopIterationsRemaining();
        uint256 _currPc = IContext(_ctx).pc() - 1;

        if (_currCtr > 1) {
            IContext(_ctx).setNextPc(_currPc);
        }

        // -- Get the element by index from array. TODO: move to another function
        bytes32 _tempVarNameB32 = OpcodeHelpers.readBytesSlice(_ctx, _currPc - 8, _currPc - 4);
        bytes32 _arrNameB32 = OpcodeHelpers.readBytesSlice(_ctx, _currPc - 4, _currPc);
        uint256 _arrLen = ILinkedList(IContext(_ctx).appAddr()).getLength(_arrNameB32);
        uint256 _index = _arrLen - IContext(_ctx).forLoopIterationsRemaining();

        // check if the array exists & get array elements type
        (bool success, bytes memory data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(success, ErrorsBranchingOpcodes.BR1);
        bytes1 dataType = bytes1(data);

        (success, data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(
                'get(uint256,bytes32)',
                _index, // index of the searched item
                _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
            )
        );
        require(success, ErrorsBranchingOpcodes.BR3);

        // TODO: get the functions that you need to call from Context.branchSelectors[_baseOpName][_branchCode]
        if (dataType == 0x01) {
            IStorage(IContext(_ctx).appAddr()).setStorageUint256(
                _tempVarNameB32,
                uint256(bytes32(data))
            );
        } else if (dataType == 0x02) {
            IStorage(IContext(_ctx).appAddr()).setStorageAddress(
                _tempVarNameB32,
                address(bytes20(data))
            );
        } else {
            revert('Unknown array data type');
        }
        // -- end of Get the element by index from array

        IContext(_ctx).setForLoopIterationsRemaining(_currCtr - 1);
    }

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
