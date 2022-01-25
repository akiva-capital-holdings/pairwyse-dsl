// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from "./interfaces/IContext.sol";
import { IExecutor } from "./interfaces/IExecutor.sol";
import "hardhat/console.sol";

contract Executor is IExecutor {
    address public opcodes;

    constructor(address _opcodes) {
        opcodes = _opcodes;
    }

    function execute(IContext _ctx) public {
        require(_ctx.program().length > 0, "Executor: empty program");
        while (_ctx.pc() < _ctx.program().length) {
            bytes memory opcodeBytes = _ctx.programAt(_ctx.pc(), 1);
            bytes1 opcodeByte1;
            // convert bytes to bytes1
            assembly {
                opcodeByte1 := mload(add(opcodeBytes, 0x20))
            }
            // console.log("opcodeBytes1");
            // console.logBytes1(opcodeByte1);
            bytes4 selector = _ctx.selectorByOpcode(opcodeByte1);
            require(selector != 0x0, "Executor: did not find selector for opcode");
            _ctx.incPc(1);
            (bool success, ) = opcodes.call(abi.encodeWithSelector(selector, address(_ctx)));
            require(success, "Executor: call not success");
        }
    }
}
