// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Opcodes } from '../libs/Opcodes.sol';
import { IContext } from './IContext.sol';

interface IConditionalTx {
    // Variables

    function transactionCtx() external returns (IContext);

    function conditionCtx() external returns (IContext);

    function isExecuted() external returns (bool);

    function signatory() external returns (address);

    function transactionStr() external returns (string memory);

    function conditionStr() external returns (string memory);

    // Functions

    function checkCondition() external;

    function execTransaction() external;
}
