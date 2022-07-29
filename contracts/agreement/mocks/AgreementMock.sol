// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../../dsl/interfaces/IParser.sol';
import { IContext } from '../../dsl/interfaces/IContext.sol';
import { Context } from '../../dsl/Context.sol';
import { ConditionalTxsMock } from './ConditionalTxsMock.sol';

import { IERC20 } from '../../dsl/interfaces/IERC20.sol';

//  import 'hardhat/console.sol';

contract AgreementMock {
    IParser public parser;
    ConditionalTxsMock public txs;

    event NewTransaction(
        uint256 txId,
        uint256[] requiredTxs,
        address[] signatories,
        string transaction,
        string[] conditionStrs
    );

    constructor(address _parser) {
        parser = IParser(_parser);
        txs = new ConditionalTxsMock();
    }

    function parse(string memory _code, Context _ctx) external {
        _ctx.initOpcodes();
        _ctx.setAppAddress(address(txs));
        parser.parse(address(_ctx), _code);
    }

    function update(
        uint256 _txId,
        uint256[] memory _requiredTxs,
        address[] memory _signatories,
        string memory _transactionStr,
        string[] memory _conditionStrs,
        Context _transactionCtx,
        Context[] memory _conditionCtxs
    ) external {
        // console.log('update');
        txs.addTxBlueprint(_txId, _requiredTxs, _signatories);
        for (uint256 i = 0; i < _conditionCtxs.length; i++) {
            txs.addTxCondition(_txId, _conditionStrs[i], _conditionCtxs[i]);
        }
        txs.addTxTransaction(_txId, _transactionStr, _transactionCtx);

        emit NewTransaction(_txId, _requiredTxs, _signatories, _transactionStr, _conditionStrs);
    }

    function execute(uint256 _txId) external payable {
        payable(txs).transfer(msg.value);
        require(verify(_txId), 'Agreement: bad tx signatory');
        require(validate(_txId, msg.value), 'Agreement: tx condition is not satisfied');
        require(fulfil(_txId, msg.value, msg.sender), 'Agreement: tx fulfilment error');
    }

    function verify(uint256 _txId) internal view returns (bool) {
        for (uint256 i = 0; i < txs.signatoriesLen(_txId); i++) {
            if (txs.signatories(_txId, i) == msg.sender) {
                return true;
            }
        }
        return false;
    }

    function validate(uint256 _txId, uint256 _msgValue) internal returns (bool) {
        // console.log('validate');
        uint256 _len = txs.conditionCtxsLen(_txId);
        txs.checkConditions(_txId, _msgValue);

        uint256 _result;
        for (uint256 i = 0; i < _len; i++) {
            _result += (txs.conditionCtxs(_txId, i).stack().seeLast().getUint256() > 0) ? 1 : 0;
        }
        return _result == _len;
    }

    function fulfil(
        uint256 _txId,
        uint256 _msgValue,
        address _signatory
    ) internal returns (bool) {
        // console.log('fulfil');
        (IContext transactionCtx, , ) = txs.txs(_txId);
        txs.execTx(_txId, _msgValue, _signatory);
        return transactionCtx.stack().seeLast().getUint256() == 0 ? false : true;
    }
}
