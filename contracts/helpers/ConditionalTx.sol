// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IConditionalTx } from "../interfaces/IConditionalTx.sol";
import { IContext } from "../interfaces/IContext.sol";
import { Opcodes } from "../libs/Opcodes.sol";
import { Executor } from "../libs/Executor.sol";

import "hardhat/console.sol";

contract ConditionalTx is IConditionalTx {
    IContext public transactionCtx;
    IContext public conditionCtx;
    bool public isExecuted;

    address public signatory;
    string public transactionStr;
    string public conditionStr;

    constructor(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        IContext _transactionCtx,
        IContext _conditionCtx
    ) {
        signatory = _signatory;
        transactionStr = _transactionStr;
        conditionStr = _conditionStr;

        transactionCtx = _transactionCtx;
        conditionCtx = _conditionCtx;

        conditionCtx.setOpcodesAddr(address(Opcodes));
        transactionCtx.setOpcodesAddr(address(Opcodes));
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function checkCondition() external {
        Executor.execute(conditionCtx);
    }

    function execTransaction() external {
        require(!isExecuted, "ConditionalTx: txn already was executed");
        Executor.execute(transactionCtx);
        isExecuted = true;
    }
}
