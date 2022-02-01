// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.0;

// import { IContext } from './IContext.sol';
// import { Opcodes } from '../libs/Opcodes.sol';
// import { Executor } from '../libs/Executor.sol';

// import 'hardhat/console.sol';

// interface IConditionalTxs {
//     struct Tx {
//         IContext transactionCtx;
//         IContext conditionCtx;
//         bool isExecuted;
//         address signatory;
//         string transactionStr;
//         string conditionStr;
//     }

//     event NewTx(bytes32 txId);

//     // Variables

//     function txs(bytes32 txId)
//         external
//         returns (
//             IContext transactionCtx,
//             IContext conditionCtx,
//             bool isExecuted,
//             address signatory,
//             string memory transactionStr,
//             string memory conditionStr
//         );

//     // Functions

//     function addTx(
//         address _signatory,
//         string memory _transactionStr,
//         string memory _conditionStr,
//         IContext _transactionCtx,
//         IContext _conditionCtx
//     ) external returns (bytes32 txId);

//     function execTransaction(bytes32 txId) external;

//     function checkCondition(bytes32 txId) external returns (bool);
// }
