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
 * @title Logical operator opcodes
 * @notice Opcodes for logical operators such as if/esle, switch/case
 */
library LogicalOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opBnz(IContext _ctx) public {
        // console.log('opBnz');
        if (_ctx.stack().length() == 0) {
            // console.log('notihing in the stack');
            OpcodeHelpers.putToStack(_ctx, 0); // for if-else condition to work all the time
        }

        StackValue last = _ctx.stack().pop();
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type in the stack');

        uint16 _offsetFalseBranch = getUint16(_ctx);
        // console.log('offset (false) =', _offsetFalseBranch);
        uint16 _offsetCode = getUint16(_ctx);
        // console.log('offset (code) =', _offsetCode);

        // console.log('pc =', _ctx.pc());
        _ctx.setNextPc(_ctx.pc() + _offsetCode);

        if (last.getUint256() > 0) {
            // console.log('if condition is true');
            _ctx.setPc(_ctx.pc());
        } else {
            // console.log('if condition is false');
            _ctx.setPc(_ctx.pc() + _offsetFalseBranch);
        }
    }

    function opEnd(IContext _ctx) public {
        _ctx.setPc(_ctx.nextpc());
        _ctx.setNextPc(0);
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
