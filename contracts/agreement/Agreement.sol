// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IContext } from '../dsl/interfaces/IContext.sol';
import { Context } from '../dsl/Context.sol';
import { ConditionalTxs } from './ConditionalTxs.sol';

// import 'hardhat/console.sol';

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

    function parse(string memory _code, Context _ctx) external {
        _ctx.initOpcodes();
        _ctx.setAppAddress(address(txs));
        parser.parse(_ctx, _code);
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
        // console.log('update');
        txs.addTxBlueprint(_txId, _requiredTxs, _signatory);
        txs.addTxCondition(_txId, _conditionStr, _conditionCtx);
        txs.addTxTransaction(_txId, _transactionStr, _transactionCtx);

        emit NewTransaction(_txId, _requiredTxs, _signatory, _transactionStr, _conditionStr);
    }

    function execute(uint256 _txId) external payable {
        payable(txs).transfer(msg.value);
        require(verify(_txId), 'Agreement: bad tx signatory');
        require(validate(_txId, msg.value), 'Agreement: tx condition is not satisfied');
        require(fulfil(_txId, msg.value), 'Agreement: tx fulfilment error');
    }

    function verify(uint256 _txId) internal view returns (bool) {
        // console.log('verify');
        (, , address signatory, ) = txs.txs(_txId);
        return signatory == msg.sender;
    }

    function validate(uint256 _txId, uint256 _msgValue) internal returns (bool) {
        // console.log('validate');
        uint256 _len = txs.conditionCtxsLen(_txId);
        txs.checkConditions(_txId, _msgValue);

        uint256 _result;
        for (uint256 i = 0; i < _len; i++) {
            _result += txs.conditionCtxs(_txId, i).stack().seeLast().getUint256();
        }
        return _result == _len;
    }

    function fulfil(uint256 _txId, uint256 _msgValue) internal returns (bool) {
        // console.log('fulfil');
        (IContext transactionCtx, , , ) = txs.txs(_txId);
        txs.execTx(_txId, _msgValue);
        return transactionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }
}
