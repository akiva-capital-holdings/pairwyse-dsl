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

// import 'hardhat/console.sol';

contract ConditionalTxs is Storage {
    struct Tx {
        uint256[] requiredTxs;
        IContext transactionCtx;
        bool isExecuted;
        string transactionStr;
    }

    mapping(uint256 => Tx) public txs; // txId => Tx struct
    mapping(uint256 => IContext[]) public conditionCtxs; // txId => condition Context
    mapping(uint256 => string[]) public conditionStrs; // txId => DSL condition as string
    mapping(uint256 => address[]) public signatories; // txId => signatories
    mapping(uint256 => uint256) public signatoriesLen; // txId => signarories length
    // txId => (signatory => was tx executed by signatory)
    mapping(uint256 => mapping(address => bool)) isExecutedBySignatory;

    function conditionCtxsLen(uint256 _txId) external view returns (uint256) {
        return conditionCtxs[_txId].length;
    }

    function conditionStrsLen(uint256 _txId) external view returns (uint256) {
        return conditionStrs[_txId].length;
    }

    function addTxBlueprint(
        uint256 _txId,
        uint256[] memory _requiredTxs,
        address[] memory _signatories
    ) external {
        Tx memory txn = Tx(_requiredTxs, IContext(address(0)), false, '');
        signatories[_txId] = _signatories;
        signatoriesLen[_txId] = _signatories.length;
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

    // TODO: make available only for Agreement. So that Agreement is in charge for ensuring that all
    //       the conditions are met before executing the transaction
    function execTx(
        uint256 _txId,
        uint256 _msgValue,
        address _signatory
    ) external {
        // console.log('execTx');
        Tx memory txn = txs[_txId];
        // require(
        //     checkConditions(_txId, _msgValue),
        //     'ConditionalTxs: txn condition is not satisfied'
        // );
        require(
            !isExecutedBySignatory[_txId][_signatory],
            'ConditionalTxs: txn already was executed by this signatory'
        );

        txn.transactionCtx.setMsgValue(_msgValue);
        Executor.execute(txn.transactionCtx);
        isExecutedBySignatory[_txId][_signatory] = true;

        // Check is tx was executed by all signatories
        uint256 executionProgress;
        address[] memory signatoriesOfTx = signatories[_txId];
        for (uint256 i = 0; i < signatoriesLen[_txId]; i++) {
            if (isExecutedBySignatory[_txId][signatoriesOfTx[i]]) executionProgress++;
        }
        // If all signatories have executed the transaction - mark the tx as executed
        if (executionProgress == signatoriesLen[_txId]) {
            txs[_txId].isExecuted = true;
        }
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

    // TODO: IMPORTANT, use this function only for tests! Remove it from production
    function cleanTx(uint256[] memory _txIds, address[] memory _signatories) public {
        for (uint256 i = 0; i < _txIds.length; i++) {
            txs[_txIds[i]].isExecuted = false;
            for (uint256 j = 0; j < _signatories.length; j++) {
                isExecutedBySignatory[_txIds[i]][_signatories[j]] = false;
            }
        }
    }

    // TODO: IMPORTANT, use this function only for tests! Remove it from production
    function returnFunds(address _address) public {
        // send fund back to the _address
        payable(_address).transfer(address(this).balance);
    }
}
