// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// import { IConditionalTxs } from '../interfaces/IConditionalTxs.sol';
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
        // uint256 txId;
        uint256[] requiredTxs;
        IContext transactionCtx;
        IContext conditionCtx;
        bool isExecuted;
        address signatory;
        string transactionStr;
        string conditionStr;
    }

    mapping(uint256 => Tx) public txs;

    // event NewTx(bytes32 txId);

    function addTx(
        uint256 _txId,
        uint256[] memory _requiredTxs,
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        IContext _transactionCtx,
        IContext _conditionCtx
    ) external {
        Tx memory txn = Tx(
            // _txId,
            _requiredTxs,
            _transactionCtx,
            _conditionCtx,
            false,
            _signatory,
            _transactionStr,
            _conditionStr
        );

        _conditionCtx.setComparatorOpcodesAddr(address(ComparatorOpcodes));
        _conditionCtx.setLogicalOpcodesAddr(address(LogicalOpcodes));
        _conditionCtx.setSetOpcodesAddr(address(SetOpcodes));
        _conditionCtx.setOtherOpcodesAddr(address(OtherOpcodes));

        _transactionCtx.setComparatorOpcodesAddr(address(ComparatorOpcodes));
        _transactionCtx.setLogicalOpcodesAddr(address(LogicalOpcodes));
        _transactionCtx.setSetOpcodesAddr(address(SetOpcodes));
        _transactionCtx.setOtherOpcodesAddr(address(OtherOpcodes));

        // txId = hashTx(_signatory, _transactionStr, _conditionStr);
        txs[_txId] = txn;
        // emit NewTx(txId);
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function execTx(
        uint256 _txId,
        uint256 _msgValue /*onlyOwner*/
    ) external {
        // console.log('execTx');
        Tx memory txn = txs[_txId];
        require(checkCondition(_txId, _msgValue), 'ConditionalTxs: txn condition is not satisfied');
        require(!txn.isExecuted, 'ConditionalTxs: txn already was executed');

        txn.transactionCtx.setMsgValue(_msgValue);
        Executor.execute(txn.transactionCtx);
        txs[_txId].isExecuted = true;
    }

    function checkCondition(
        uint256 _txId,
        uint256 _msgValue /*onlyOwner*/
    ) public returns (bool) {
        // console.log('checkCondition');
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

        txn.conditionCtx.setMsgValue(_msgValue);
        Executor.execute(txn.conditionCtx);
        return txn.conditionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }

    // function hashTx(
    //     address _signatory,
    //     string memory _transaction,
    //     string memory _condition
    // ) internal pure returns (bytes32) {
    //     return keccak256(abi.encodePacked(_signatory, _transaction, _condition));
    // }
}
