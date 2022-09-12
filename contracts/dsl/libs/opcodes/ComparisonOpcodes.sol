// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
// import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Comparator operator opcodes
 * @notice Opcodes for comparator operators such as >, <, =, !, etc.
 */
library ComparisonOpcodes {
    // using UnstructuredStorage for bytes32;
    using StringUtils for string;

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     * @param _ctx Context contract address
     */
    function opEq(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        IContext(_ctx).stack().push(last == prev ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     * @param _ctx Context contract address
     */
    function opNotEq(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, last != prev ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     * @param _ctx Context contract address
     */
    function opLt(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, prev < last ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     * @param _ctx Context contract address
     */
    function opGt(address _ctx) public {
        opSwap(_ctx);
        opLt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     * @param _ctx Context contract address
     */
    function opLe(address _ctx) public {
        opGt(_ctx);
        opNot(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     * @param _ctx Context contract address
     */
    function opGe(address _ctx) public {
        opLt(_ctx);
        opNot(_ctx);
    }

    /**
     * @dev Revert last value in the stack
     * @param _ctx Context contract address
     */
    function opNot(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, last == 0 ? 1 : 0);
    }

    /**
     * @dev Swaps two last element in the stack
     * @param _ctx Context contract address
     */
    function opSwap(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        IContext(_ctx).stack().push(last);
        IContext(_ctx).stack().push(prev);
    }
}
