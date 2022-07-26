// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../interfaces/IContext.sol';

// import 'hardhat/console.sol';

library Executor {
    function execute(address _ctxAddr) public {
        // console.log('Executor.execute()');
        IContext _ctx = IContext(_ctxAddr);
        // console.logBytes(_ctx.program());
        require(_ctx.program().length > 0, 'Executor: empty program');

        while (_ctx.pc() < _ctx.program().length) {
            bytes memory opcodeBytes = _ctx.programAt(_ctx.pc(), 1);
            bytes1 opcodeByte1 = bytes1(uint8(opcodeBytes[0]));
            // console.logBytes1(opcodeByte1);

            bytes4 _selector = _ctx.selectorByOpcode(opcodeByte1);
            require(_selector != 0x0, 'Executor: did not find selector for opcode');
            IContext.OpcodeLibNames _libName = _ctx.opcodeLibNameByOpcode(opcodeByte1);
            _ctx.incPc(1);

            address _lib;

            if (_libName == IContext.OpcodeLibNames.ComparisonOpcodes) {
                _lib = _ctx.comparisonOpcodes();
            } else if (_libName == IContext.OpcodeLibNames.BranchingOpcodes) {
                _lib = _ctx.branchingOpcodes();
            } else if (_libName == IContext.OpcodeLibNames.LogicalOpcodes) {
                _lib = _ctx.logicalOpcodes();
            } else {
                _lib = _ctx.otherOpcodes();
            }

            // console.log('lib addr =', _lib);

            (bool success, ) = _lib.delegatecall(abi.encodeWithSelector(_selector, address(_ctx)));
            require(success, 'Executor: call not success');
        }
        _ctx.setPc(0);
    }
}
