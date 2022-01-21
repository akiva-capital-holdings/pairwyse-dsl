// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import { Context } from "./Context.sol";
import { Opcodes } from "./Opcodes.sol";
import "hardhat/console.sol";

contract ConditionalTx {
    Context public transactionCtx;
    Context public conditionCtx;
    Opcodes public opcodes;
    bool public isExecuted;

    address public signatory; // Alice
    // bytes public transaction; // sendEth TO_WALLET 1000000000000000000
    // bytes public condition; // blockTimestamp < loadLocal uint256 VARIABLE
    string public transactionStr;
    string public conditionStr;

    constructor(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        Context _transactionCtx,
        Context _conditionCtx,
        Opcodes _opcodes
    ) {
        signatory = _signatory;
        transactionStr = _transactionStr;
        conditionStr = _conditionStr;

        transactionCtx = _transactionCtx;
        conditionCtx = _conditionCtx;
        opcodes = _opcodes;
    }

    function checkCondition() external {
        require(conditionCtx.program().length > 0, "ConditionalTx: empty program");

        while (conditionCtx.pc() < conditionCtx.program().length) {
            bytes memory opcodeBytes = conditionCtx.programAt(conditionCtx.pc(), 1);
            bytes1 opcodeByte1;

            // convert bytes to bytes1
            assembly {
                opcodeByte1 := mload(add(opcodeBytes, 0x20))
            }

            // console.log("opcodeBytes1");
            // console.logBytes1(opcodeByte1);

            bytes4 selector = conditionCtx.selectorByOpcode(opcodeByte1);
            require(selector != 0x0, "ConditionalTx: did not find selector for opcode");

            conditionCtx.incPc(1);

            (bool success, ) = address(opcodes).call(abi.encodeWithSelector(selector, address(conditionCtx)));
            require(success, "ConditionalTx: call not success");
        }
    }

    function execTransaction() external {
        require(!isExecuted, "ConditionalTx: txn already was executed");
        require(transactionCtx.program().length > 0, "ConditionalTx: empty program");

        while (transactionCtx.pc() < transactionCtx.program().length) {
            bytes memory opcodeBytes = transactionCtx.programAt(transactionCtx.pc(), 1);
            bytes1 opcodeByte1;

            // convert bytes to bytes1
            assembly {
                opcodeByte1 := mload(add(opcodeBytes, 0x20))
            }

            // console.log("opcodeBytes1");
            // console.logBytes1(opcodeByte1);

            bytes4 selector = transactionCtx.selectorByOpcode(opcodeByte1);
            require(selector != 0x0, "ConditionalTx: did not find selector for opcode");

            transactionCtx.incPc(1);

            (bool success, ) = address(opcodes).call(abi.encodeWithSelector(selector, address(transactionCtx)));
            require(success, "ConditionalTx: call not success");
        }
        isExecuted = true;
    }
}
