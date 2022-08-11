// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../dsl/interfaces/IContext.sol';
import { ComparisonOpcodes } from '../dsl/libs/opcodes/ComparisonOpcodes.sol';
import { BranchingOpcodes } from '../dsl/libs/opcodes/BranchingOpcodes.sol';
import { LogicalOpcodes } from '../dsl/libs/opcodes/LogicalOpcodes.sol';
import { OtherOpcodes } from '../dsl/libs/opcodes/OtherOpcodes.sol';
import { ErrorsConditionalTxs } from '../dsl/libs/Errors.sol';
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

    address public constant anyone = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

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
        _checkSignatories(_signatories);

        Tx memory txn = Tx(_requiredTxs, IContext(address(0)), false, '');
        signatories[_txId] = _signatories;
        signatoriesLen[_txId] = _signatories.length;
        txs[_txId] = txn;
    }

    /**
     * @dev Checks input _signatures that only one  'anyone' address exists in the
     * list or that 'anyone' address does not exist in signatures at all
     * @param _signatories the list of addresses
     */
    function _checkSignatories(address[] memory _signatories) internal pure {
        if (_signatories.length > 1) {
            for (uint256 i = 0; i < _signatories.length; i++) {
                require(_signatories[i] != anyone, ErrorsConditionalTxs.CNT1);
            }
        }
    }

    function addTxCondition(
        uint256 _txId,
        string memory _conditionStr,
        IContext _conditionCtx
    ) external {
        _conditionCtx.setComparisonOpcodesAddr(address(ComparisonOpcodes));
        _conditionCtx.setBranchingOpcodesAddr(address(BranchingOpcodes));
        _conditionCtx.setLogicalOpcodesAddr(address(LogicalOpcodes));
        _conditionCtx.setOtherOpcodesAddr(address(OtherOpcodes));

        conditionCtxs[_txId].push(_conditionCtx);
        conditionStrs[_txId].push(_conditionStr);
    }

    function addTxTransaction(
        uint256 _txId,
        string memory _transactionStr,
        IContext _transactionCtx
    ) external {
        require(conditionStrs[_txId].length > 0, ErrorsConditionalTxs.CNT2);
        _transactionCtx.setComparisonOpcodesAddr(address(ComparisonOpcodes));
        _transactionCtx.setBranchingOpcodesAddr(address(BranchingOpcodes));
        _transactionCtx.setLogicalOpcodesAddr(address(LogicalOpcodes));
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
        Tx memory txn = txs[_txId];
        require(checkConditions(_txId, _msgValue), ErrorsConditionalTxs.CNT3);
        require(!isExecutedBySignatory[_txId][_signatory], ErrorsConditionalTxs.CNT4);

        txn.transactionCtx.setMsgValue(_msgValue);
        Executor.execute(address(txn.transactionCtx));
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

        bool _res = true;
        for (uint256 i = 0; i < conditionCtxs[_txId].length; i++) {
            conditionCtxs[_txId][i].setMsgValue(_msgValue);
            Executor.execute(address(conditionCtxs[_txId][i]));
            _res = _res && (conditionCtxs[_txId][i].stack().seeLast().getUint256() > 0);
        }
        return _res;
    }
}
