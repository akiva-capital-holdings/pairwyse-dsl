// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IConditionalTx } from '../interfaces/IConditionalTx.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Opcodes } from '../libs/Opcodes.sol';
import { Executor } from '../libs/Executor.sol';
import { Storage } from './Storage.sol';

import 'hardhat/console.sol';

contract ConditionalTxs is Storage {
    struct Tx {
        IContext transactionCtx;
        IContext conditionCtx;
        bool isExecuted;
        address signatory;
        string transactionStr;
        string conditionStr;
    }

    mapping(bytes32 => Tx) public txs;

    event NewTx(bytes32 txId);

    function addTx(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        IContext _transactionCtx,
        IContext _conditionCtx
    ) external returns (bytes32 txId) {
        Tx memory txn = Tx(
            _transactionCtx,
            _conditionCtx,
            false,
            _signatory,
            _transactionStr,
            _conditionStr
        );

        _conditionCtx.setOpcodesAddr(address(Opcodes));
        _transactionCtx.setOpcodesAddr(address(Opcodes));

        txId = hashTx(_signatory, _transactionStr, _conditionStr);
        txs[txId] = txn;
        emit NewTx(txId);
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function execTransaction(bytes32 txId) external {
        Tx memory txn = txs[txId];
        require(checkCondition(txId), 'ConditionalTxs: txn condition is not satisfied');
        require(!txn.isExecuted, 'ConditionalTxs: txn already was executed');
        Executor.execute(txn.transactionCtx);
        txn.isExecuted = true;
    }

    function checkCondition(bytes32 txId) public returns (bool) {
        Tx memory txn = txs[txId];
        Executor.execute(txn.conditionCtx);
        return txn.conditionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }

    function hashTx(
        address _signatory,
        string memory _transaction,
        string memory _condition
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_signatory, _transaction, _condition));
    }
}