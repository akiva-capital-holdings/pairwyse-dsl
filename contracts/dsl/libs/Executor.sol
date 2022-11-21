// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from '../interfaces/IDSLContext.sol';
import { IProgramContext } from '../interfaces/IProgramContext.sol';
import { ErrorsExecutor, ErrorsContext } from './Errors.sol';

// import 'hardhat/console.sol';

library Executor {
    function execute(address _dslContext, address _programContext, address _app) public {
        bytes memory program = IProgramContext(_programContext).program();
        require(program.length > 0, ErrorsExecutor.EXC1);
        bytes memory opcodeBytes;
        bytes1 opcodeByte;
        bytes4 _selector;
        address _lib;
        bool success;
        IProgramContext(_programContext).setMsgSender(msg.sender);

        while (IProgramContext(_programContext).pc() < program.length) {
            opcodeBytes = IProgramContext(_programContext).currentProgram();
            opcodeByte = bytes1(uint8(opcodeBytes[0]));
            _selector = IDSLContext(_dslContext).selectorByOpcode(opcodeByte);
            require(_selector != 0x0, ErrorsExecutor.EXC2);

            IDSLContext.OpcodeLibNames _libName = IDSLContext(_dslContext).opcodeLibNameByOpcode(
                opcodeByte
            );
            (success, ) = _programContext.delegatecall(abi.encodeWithSignature('incPc(uin256)', 1));
            require(success, ErrorsExecutor.EXC4);

            if (_libName == IDSLContext.OpcodeLibNames.ComparisonOpcodes) {
                _lib = IDSLContext(_dslContext).comparisonOpcodes();
            } else if (_libName == IDSLContext.OpcodeLibNames.BranchingOpcodes) {
                _lib = IDSLContext(_dslContext).branchingOpcodes();
            } else if (_libName == IDSLContext.OpcodeLibNames.LogicalOpcodes) {
                _lib = IDSLContext(_dslContext).logicalOpcodes();
            } else {
                _lib = IDSLContext(_dslContext).otherOpcodes();
            }

            (success, ) = _lib.delegatecall(abi.encodeWithSelector(_selector, _dslContext, _app));
            require(success, ErrorsExecutor.EXC3);
        }
        (success, ) = _programContext.delegatecall(abi.encodeWithSignature('setPc(uin256)', 0));
        require(success, ErrorsExecutor.EXC4);
    }
}
