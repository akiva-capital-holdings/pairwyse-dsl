// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// import { IConditionalTxs } from '../interfaces/IConditionalTxs.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Opcodes } from '../libs/Opcodes.sol';
import { Executor } from '../libs/Executor.sol';
import { Storage } from './Storage.sol';

import 'hardhat/console.sol';

/*IConditionalTxs,*/
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
    mapping(address => uint256) transfers;

    event NewTx(bytes32 txId);

    function addTx(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        IContext _transactionCtx,
        IContext _conditionCtx /*onlyOwner*/
    ) external returns (bytes32 txId) {
        Tx memory txn = Tx(
            _transactionCtx,
            _conditionCtx,
            false,
            _signatory,
            _transactionStr,
            _conditionStr
        );

        _transactionCtx.setAppAddress(address(this));
        _conditionCtx.setAppAddress(address(this));

        _conditionCtx.setOpcodesAddr(address(Opcodes));
        _transactionCtx.setOpcodesAddr(address(Opcodes));

        txId = hashTx(_signatory, _transactionStr, _conditionStr);
        txs[txId] = txn;
        emit NewTx(txId);
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {
        // bytes4 _msgSender = bytes4(keccak256(abi.encodePacked(msg.sender)));
        // uint256 _amount = getStorageUint256(_msgSender);
        // setStorageUint256(_msgSender, _amount + msg.value);
    }

    function execTransaction(bytes32 txId, uint256 _msgValue) external /*onlyOwner*/
    {
        Tx memory txn = txs[txId];
        require(checkCondition(txId, _msgValue), 'ConditionalTxs: txn condition is not satisfied');
        require(!txn.isExecuted, 'ConditionalTxs: txn already was executed');
        txn.transactionCtx.setMsgValue(_msgValue);
        Executor.execute(txn.transactionCtx);
        txs[txId].isExecuted = true;
    }

    function checkCondition(
        bytes32 txId,
        uint256 _msgValue /*onlyOwner*/
    ) public returns (bool) {
        Tx memory txn = txs[txId];
        txn.conditionCtx.setMsgValue(_msgValue);
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
