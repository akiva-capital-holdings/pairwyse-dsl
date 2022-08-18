// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';
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

        StackValue last = _getLast(_ctx);
        require(last.getType() == StackValue.StackType.UINT256, ErrorsBranchingOpcodes.BOP1);

        uint16 _posTrueBranch = getUint16(_ctx);
        uint16 _posFalseBranch = getUint16(_ctx);

        IContext(_ctx).setNextPc(IContext(_ctx).pc());
        IContext(_ctx).setPc(last.getUint256() > 0 ? _posTrueBranch : _posFalseBranch);
    }

    function opIf(address _ctx) public {
        if (IContext(_ctx).stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctx, 0); // for if condition to work all the time
        }

        StackValue last = _getLast(_ctx);
        require(last.getType() == StackValue.StackType.UINT256, ErrorsBranchingOpcodes.BOP1);

        uint16 _posTrueBranch = getUint16(_ctx);

        if (last.getUint256() != 0) {
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

        StackValue last = _getLast(_ctx);
        require(last.getType() == StackValue.StackType.UINT256, ErrorsBranchingOpcodes.BOP1);

        uint16 _reference = getUint16(_ctx);

        IContext(_ctx).setNextPc(IContext(_ctx).pc());
        IContext(_ctx).setPc(_reference);
    }

    function _getLast(address _ctx) public returns (StackValue) {
        return IContext(_ctx).stack().pop();
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
