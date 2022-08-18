// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Comparator operator opcodes
 * @notice Opcodes for comparator operators such as >, <, =, !, etc.
 */
library ComparisonOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(address _ctx) public {
        StackValue last = IContext(_ctx).stack().pop();
        StackValue prev = IContext(_ctx).stack().pop();

        require(last.getType() == prev.getType(), ErrorsGeneralOpcodes.OP4);
        require(last.getType() == StackValue.StackType.UINT256, ErrorsGeneralOpcodes.OP2);

        bool result = last.getUint256() == prev.getUint256();

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(address _ctx) public {
        StackValue last = IContext(_ctx).stack().pop();
        StackValue prev = IContext(_ctx).stack().pop();

        require(last.getType() == prev.getType(), ErrorsGeneralOpcodes.OP4);
        require(last.getType() == StackValue.StackType.UINT256, ErrorsGeneralOpcodes.OP2);

        bool result = last.getUint256() != prev.getUint256();

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(address _ctx) public {
        StackValue last = IContext(_ctx).stack().pop();
        StackValue prev = IContext(_ctx).stack().pop();

        require(last.getType() == prev.getType(), ErrorsGeneralOpcodes.OP4);
        require(last.getType() == StackValue.StackType.UINT256, ErrorsGeneralOpcodes.OP2);

        bool result = prev.getUint256() < last.getUint256();

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt(address _ctx) public {
        opSwap(_ctx);
        opLt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe(address _ctx) public {
        opGt(_ctx);
        opNot(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe(address _ctx) public {
        opLt(_ctx);
        opNot(_ctx);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(address _ctx) public {
        StackValue last = IContext(_ctx).stack().pop();

        require(last.getType() == StackValue.StackType.UINT256, ErrorsGeneralOpcodes.OP2);

        bool result = last.getUint256() == 0;

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap(address _ctx) public {
        StackValue last = IContext(_ctx).stack().pop();
        StackValue prev = IContext(_ctx).stack().pop();
        IContext(_ctx).stack().push(last);
        IContext(_ctx).stack().push(prev);
    }
}
