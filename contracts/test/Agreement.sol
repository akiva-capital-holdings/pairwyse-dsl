// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IContext } from '../interfaces/IContext.sol';
import { ConditionalTxs } from '../helpers/ConditionalTxs.sol';
import { Context } from '../Context.sol';

import 'hardhat/console.sol';

contract Agreement {
    IParser public parser;
    ConditionalTxs public txs;

    event NewTransaction(bytes32 txId, address signatory, string transaction, string conditionStr);

    constructor(IParser _parser) {
        parser = _parser;
        txs = new ConditionalTxs();
    }

    function update(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr
    ) external returns (bytes32 _txId) {
        Context _transactionCtx = new Context();
        Context _conditionCtx = new Context();

        // TODO: improve the logic here. Why parser is responsible for initing opcodes for Context?
        parser.initOpcodes(_transactionCtx);
        parser.initOpcodes(_conditionCtx);

        _txId = txs.addTx(
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

        emit NewTransaction(_txId, _signatory, _transactionStr, _conditionStr);
    }

    function execute(bytes32 _txId) external {
        require(verify(_txId), 'Agreement: bad tx signatory');
        require(validate(_txId), 'Agreement: tx condition is not satisfied');
        require(fulfil(_txId), 'Agreement: tx fulfilment error');
    }

    function verify(bytes32 _txId) internal view returns (bool) {
        (, , , address signatory, , ) = txs.txs(_txId);
        return signatory == msg.sender;
    }

    function validate(bytes32 _txId) internal returns (bool) {
        (, IContext conditionCtx, , , , ) = txs.txs(_txId);
        txs.checkCondition(_txId);
        return conditionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }

    function fulfil(bytes32 _txId) internal returns (bool) {
        (IContext transactionCtx, , , , , ) = txs.txs(_txId);
        txs.execTransaction(_txId);
        return transactionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }
}
