// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IConditionalTx } from "../interfaces/IConditionalTx.sol";
import { IContext } from "../interfaces/IContext.sol";
import { IExecutor } from "../interfaces/IExecutor.sol";
import { Opcodes } from "../Opcodes.sol";

// import "hardhat/console.sol";

contract ConditionalTx is IConditionalTx {
    IContext public transactionCtx;
    IContext public conditionCtx;
    IExecutor public executor;
    bool public isExecuted;

    address public signatory;
    string public transactionStr;
    string public conditionStr;

    constructor(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        IContext _transactionCtx,
        IContext _conditionCtx,
        IExecutor _executor
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
