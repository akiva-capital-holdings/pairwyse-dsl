// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Context } from "./Context.sol";
import { Opcodes } from "./Opcodes.sol";
import { Executor } from "./Executor.sol";
import "hardhat/console.sol";

contract ConditionalTx {
    Context public transactionCtx;
    Context public conditionCtx;
    Executor public executor; // TODO: make interface
    bool public isExecuted;

    address public signatory;
    string public transactionStr;
    string public conditionStr;

    constructor(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        Context _transactionCtx,
        Context _conditionCtx,
        Executor _executor
    ) {
        signatory = _signatory;
        transactionStr = _transactionStr;
        conditionStr = _conditionStr;

        transactionCtx = _transactionCtx;
        conditionCtx = _conditionCtx;
        executor = _executor;
    }

    function checkCondition() external {
        executor.execute(conditionCtx);
    }

    function execTransaction() external {
        require(!isExecuted, "ConditionalTx: txn already was executed");
        executor.execute(transactionCtx);
        isExecuted = true;
    }
}
