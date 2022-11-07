// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

import 'hardhat/console.sol';

/**
 * @title Set operator opcodes
 * @notice Opcodes for set operators such as AND, OR, XOR
 */
library LogicalOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     * @param _ctx Context contract address
     */
    function opAnd(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, (prev > 0) && (last > 0) ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     * @param _ctx Context contract address
     */
    function opOr(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, (prev > 0) || (last > 0) ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if the values ​
     * ​are different and 0 if they are the same
     * @param _ctx Context contract address
     */
    function opXor(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(
            _ctx,
            ((prev > 0) && (last == 0)) || ((prev == 0) && (last > 0)) ? 1 : 0
        );
    }

    /**
     * @dev Add two values and put result in the stack.
     * @param _ctx Context contract address
     */
    function opAdd(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, prev + last);
    }

    /**
     * @dev Subtracts one value from enother and put result in the stack.
     * @param _ctx Context contract address
     */
    function opSub(address _ctx) public {
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        OpcodeHelpers.putToStack(_ctx, prev - last);
    }

    /**
     * @dev Multiplies values and put result in the stack.
     * @param _ctx Context contract address
     */
    function opMul(address _ctx) public {
        console.log('-------->* 1<------');
        // uint256 last1 = IContext(_ctx).stack().pop();
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        console.log(prev, last);
        OpcodeHelpers.putToStack(_ctx, prev * last);
        console.log('-------->* 2<------');
    }

    /**
     * Divide two numbers from the top of the stack
     * @dev This is an integer division. Example: 5 / 2 = 2
     * @param _ctx Context address
     */
    function opDiv(address _ctx) public {
        console.log('-------->10<------');
        uint256 last = IContext(_ctx).stack().pop();
        uint256 prev = IContext(_ctx).stack().pop();
        console.log('-------->1<------');
        OpcodeHelpers.putToStack(_ctx, prev / last);
    }
}
