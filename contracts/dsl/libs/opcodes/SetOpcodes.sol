// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IStorage } from '../../interfaces/IStorage.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';

// import 'hardhat/console.sol';

/**
 * @title Set operator opcodes
 * @notice Opcodes for set operators such as AND, OR, XOR
 */
library SetOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     */
    function opAnd(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = (prev.getUint256() > 0) && (last.getUint256() > 0);

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = (prev.getUint256() > 0) || (last.getUint256() > 0);

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }

    function opXor(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = ((prev.getUint256() > 0) && (last.getUint256() == 0)) ||
            ((prev.getUint256() == 0) && (last.getUint256() > 0));

        OpcodeHelpers.putToStack(_ctx, result ? 1 : 0);
    }
}