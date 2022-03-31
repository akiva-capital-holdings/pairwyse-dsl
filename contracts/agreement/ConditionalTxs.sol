// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../dsl/interfaces/IContext.sol';
import { ComparatorOpcodes } from '../dsl/libs/opcodes/ComparatorOpcodes.sol';
import { LogicalOpcodes } from '../dsl/libs/opcodes/LogicalOpcodes.sol';
import { SetOpcodes } from '../dsl/libs/opcodes/SetOpcodes.sol';
import { OtherOpcodes } from '../dsl/libs/opcodes/OtherOpcodes.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';
import { Storage } from '../dsl/helpers/Storage.sol';

import 'hardhat/console.sol';

contract ConditionalTxs is Storage {
    struct Tx {
        uint256[] requiredTxs;
        IContext transactionCtx;
        bool isExecuted;
        address signatory;
        string transactionStr;
    }

    mapping(uint256 => Tx) public txs; // txId => Tx struct
    mapping(uint256 => IContext[]) public conditionCtxs; // txId => condition Context
    mapping(uint256 => string[]) public conditionStrs; // txId => DSL condition as string

    function conditionCtxsLen(uint256 _txId) external view returns (uint256) {
        return conditionCtxs[_txId].length;
    }

    function conditionStrsLen(uint256 _txId) external view returns (uint256) {
        return conditionStrs[_txId].length;
    }

    function addTxBlueprint(
        uint256 _txId,
        uint256[] memory _requiredTxs,
        address _signatory
    ) external {
        Tx memory txn = Tx(_requiredTxs, IContext(address(0)), false, _signatory, '');
        txs[_txId] = txn;
    }

    function addTxCondition(
        uint256 _txId,
        string memory _conditionStr,
        IContext _conditionCtx
    ) external {
        _conditionCtx.setComparatorOpcodesAddr(address(ComparatorOpcodes));
        _conditionCtx.setLogicalOpcodesAddr(address(LogicalOpcodes));
        _conditionCtx.setSetOpcodesAddr(address(SetOpcodes));
        _conditionCtx.setOtherOpcodesAddr(address(OtherOpcodes));

        conditionCtxs[_txId].push(_conditionCtx);
        conditionStrs[_txId].push(_conditionStr);
    }

    function addTxTransaction(
        uint256 _txId,
        string memory _transactionStr,
        IContext _transactionCtx
    ) external {
        require(
            conditionStrs[_txId].length > 0,
            'The transaction should have at least one condition'
        );
        _transactionCtx.setComparatorOpcodesAddr(address(ComparatorOpcodes));
        _transactionCtx.setLogicalOpcodesAddr(address(LogicalOpcodes));
        _transactionCtx.setSetOpcodesAddr(address(SetOpcodes));
        _transactionCtx.setOtherOpcodesAddr(address(OtherOpcodes));

        txs[_txId].transactionCtx = _transactionCtx;
        txs[_txId].transactionStr = _transactionStr;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function execTx(
        uint256 _txId,
        uint256 _msgValue /*onlyOwner*/
    ) external {
        // console.log('execTx');
        Tx memory txn = txs[_txId];
        require(
            checkConditions(_txId, _msgValue),
            'ConditionalTxs: txn condition is not satisfied'
        );
        require(!txn.isExecuted, 'ConditionalTxs: txn already was executed');

        txn.transactionCtx.setMsgValue(_msgValue);
        Executor.execute(txn.transactionCtx);
        txs[_txId].isExecuted = true;
    }

    function checkConditions(
        uint256 _txId,
        uint256 _msgValue /*onlyOwner*/
    ) public returns (bool) {
        // console.log('checkConditions');
        Tx memory txn = txs[_txId];

        Tx memory requiredTx;
        for (uint256 i = 0; i < txn.requiredTxs.length; i++) {
            requiredTx = txs[txn.requiredTxs[i]];
            require(
                requiredTx.isExecuted,
                string(
                    abi.encodePacked(
                        'ConditionalTxs: required tx #',
                        StringUtils.toString(txn.requiredTxs[i]),
                        ' was not executed'
                    )
                )
            );
        }

        bool _res;
        for (uint256 i = 0; i < conditionCtxs[_txId].length; i++) {
            conditionCtxs[_txId][i].setMsgValue(_msgValue);
            Executor.execute(conditionCtxs[_txId][i]);
            _res = _res && conditionCtxs[_txId][i].stack().seeLast().getUint256() == 0
                ? false
                : true;
        }
        return _res;
    }
}
