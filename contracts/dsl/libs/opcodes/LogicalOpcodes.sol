// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IStorage } from '../../interfaces/IStorage.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';

import 'hardhat/console.sol';

/**
 * @title Logical operator opcodes
 * @notice Opcodes for logical operators such as if/esle, switch/case
 */
// TODO: rename to BranchingOpcodes
library LogicalOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opIfelse(IContext _ctx) public {
        if (_ctx.stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctx, 0); // for if-else condition to work all the time
        }

        StackValue last = _getLast(_ctx);
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type in the stack');

        uint16 _posTrueBranch = getUint16(_ctx);
        uint16 _posFalseBranch = getUint16(_ctx);

        _ctx.setNextPc(_ctx.pc());
        _ctx.setPc(last.getUint256() > 0 ? _posTrueBranch : _posFalseBranch);
    }

    function opIf(IContext _ctx) public {
        if (_ctx.stack().length() == 0) {
            OpcodeHelpers.putToStack(_ctx, 0); // for if condition to work all the time
        }

        StackValue last = _getLast(_ctx);
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type in the stack');

        uint16 _posTrueBranch = getUint16(_ctx);

        if (last.getUint256() != 0) {
            _ctx.setNextPc(_ctx.pc());
            _ctx.setPc(_posTrueBranch);
        } else {
            _ctx.setNextPc(_ctx.program().length);
        }
    }

    function opEnd(IContext _ctx) public {
        _ctx.setPc(_ctx.nextpc());
        _ctx.setNextPc(_ctx.program().length);
    }

    function getUint16(IContext _ctx) public returns (uint16) {
        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 2);

        // Convert bytes to bytes8
        bytes2 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint16(result);
    }
}
