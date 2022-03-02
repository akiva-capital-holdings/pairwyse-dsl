// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IContext } from '../dsl/interfaces/IContext.sol';
import { Context } from '../dsl/Context.sol';
import { ConditionalTxs } from './ConditionalTxs.sol';

import 'hardhat/console.sol';

contract Agreement {
    IParser public parser;
    ConditionalTxs public txs;

    event NewTransaction(
        uint256 txId,
        uint256[] requiredTxs,
        address signatory,
        string transaction,
        string conditionStr
    );

    constructor(IParser _parser) {
        parser = _parser;
        txs = new ConditionalTxs();
    }

    function update(
        uint256 _txId,
        uint256[] memory _requiredTxs,
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr,
        Context _transactionCtx,
        Context _conditionCtx
    ) external {
        console.log('update');
        _transactionCtx.initOpcodes();
        _conditionCtx.initOpcodes();

        _transactionCtx.setAppAddress(address(txs));
        _conditionCtx.setAppAddress(address(txs));

        // console.log('addTx');
        txs.addTx(
            _txId,
            _requiredTxs,
            _signatory,
            _transactionStr,
            _conditionStr,
            _transactionCtx,
            _conditionCtx
        );

        // _transactionCtx.setMsgSender(msg.sender);
        // _conditionCtx.setMsgSender(msg.sender);

        (IContext transactionCtx, IContext conditionCtx, , , , ) = txs.txs(_txId);
        parser.parse(transactionCtx, _transactionStr);
        parser.parse(conditionCtx, _conditionStr);

        emit NewTransaction(_txId, _requiredTxs, _signatory, _transactionStr, _conditionStr);
    }

    function execute(uint256 _txId) external payable {
        payable(txs).transfer(msg.value);
        require(verify(_txId), 'Agreement: bad tx signatory');
        require(validate(_txId, msg.value), 'Agreement: tx condition is not satisfied');
        require(fulfil(_txId, msg.value), 'Agreement: tx fulfilment error');
    }

    function verify(uint256 _txId) internal view returns (bool) {
        console.log('verify');
        (, , , address signatory, , ) = txs.txs(_txId);
        return signatory == msg.sender;
    }

    function validate(uint256 _txId, uint256 _msgValue) internal returns (bool) {
        console.log('validate');
        (, IContext conditionCtx, , , , ) = txs.txs(_txId);
        txs.checkCondition(_txId, _msgValue);
        return conditionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }

    function fulfil(uint256 _txId, uint256 _msgValue) internal returns (bool) {
        console.log('fulfil');
        (IContext transactionCtx, , , , , ) = txs.txs(_txId);
        txs.execTx(_txId, _msgValue);
        return transactionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }
}
