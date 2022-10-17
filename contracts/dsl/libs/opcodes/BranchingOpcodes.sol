// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';

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
        bytes32 arrName = OpcodeHelpers.getNextBytes(_ctx, 4);
        console.logBytes32(arrName);

        // check if the array exists
        (bool success1, bytes memory data1) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', arrName)
        );
        // TODO: these errors are as strings because I wanna check are the error names correct
        require(success1, 'ErrorsGeneralOpcodes.OP1');
        require(bytes32(data1) != bytes32(0x0), 'ErrorsGeneralOpcodes.OP4');

        /**
         * Get array length
         */
        // Load local variable by it's hex
        (bool success2, bytes memory data2) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getLength(bytes32)', arrName)
        );
        require(success2, 'ErrorsGeneralOpcodes.OP5');

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data2, 0x20))
        }
        uint256 arrLength = uint256(result);
        console.log(arrLength); // 3

        IContext(_ctx).setForLoopCtr(arrLength);

        // IContext(_ctx).setPc(last > 0 ? _posTrueBranch : _posFalseBranch);

        // /**
        //  * opGet
        //  */
        // for (uint256 i = 0; i < arrLength; i++) {
        //     console.log('i =', i);

        //     (bool success3, bytes memory data3) = IContext(_ctx).appAddr().call(
        //         abi.encodeWithSignature(
        //             'get(uint256,bytes32)',
        //             i, // index of the searched item
        //             arrName // array name, ex. INDEX_LIST, PARTNERS
        //         )
        //     );
        //     require(success3, 'ErrorsGeneralOpcodes.OP1');

        //     address element; // element by index `i` from the array

        //     assembly {
        //         element := mload(add(data3, 20))
        //     }
        //     // 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        //     // 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        //     // 2: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
        //     console.log(element);
        // }
    }

    function opIterate(address _ctx) public {
        console.log('-> opIterate');
        // Decrease by 1 the for-loop iterations couter
        uint256 _currCtr = IContext(_ctx).forLoopCtr();
        console.log('Current counter is', _currCtr);
        if (_currCtr > 1) {
            console.log('Set next PC to current PC', IContext(_ctx).pc() - 1);
            IContext(_ctx).setNextPc(IContext(_ctx).pc() - 1);
        } /* else {
            IContext(_ctx).setNextPc(IContext(_ctx).program().length);
        }*/

        IContext(_ctx).setForLoopCtr(_currCtr - 1); // TODO: rename forLoopCtr to forLoopIterationsRemaining
    }

    function opEnd(address _ctx) public {
        console.log('-> opEnd');
        console.log('Next PC is', IContext(_ctx).nextpc());
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
