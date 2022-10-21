// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../interfaces/IContext.sol';
import { ErrorsExecutor } from './Errors.sol';

import 'hardhat/console.sol';

library Executor {
    function execute(address _ctx) public {
        require(IContext(_ctx).program().length > 0, ErrorsExecutor.EXC1);

        while (IContext(_ctx).pc() < IContext(_ctx).program().length) {
            bytes memory opcodeBytes = IContext(_ctx).programAt(IContext(_ctx).pc(), 1);
            bytes1 opcodeByte1 = bytes1(uint8(opcodeBytes[0]));

            bytes4 _selector = IContext(_ctx).selectorByOpcode(opcodeByte1);
            console.logBytes1(opcodeByte1);
            require(_selector != 0x0, ErrorsExecutor.EXC2);
            IContext.OpcodeLibNames _libName = IContext(_ctx).opcodeLibNameByOpcode(opcodeByte1);
            IContext(_ctx).incPc(1);

            address _lib;

            if (_libName == IContext.OpcodeLibNames.ComparisonOpcodes) {
                _lib = IContext(_ctx).comparisonOpcodes();
            } else if (_libName == IContext.OpcodeLibNames.BranchingOpcodes) {
                _lib = IContext(_ctx).branchingOpcodes();
            } else if (_libName == IContext.OpcodeLibNames.LogicalOpcodes) {
                _lib = IContext(_ctx).logicalOpcodes();
            } else {
                _lib = IContext(_ctx).otherOpcodes();
            }

            (bool success, ) = _lib.delegatecall(abi.encodeWithSelector(_selector, _ctx));
            require(success, ErrorsExecutor.EXC3);
        }
        IContext(_ctx).setPc(0);
    }
}
