//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { Parser } from "./Parser.sol";
import { Context } from "./Context.sol";
import { ConditionalTx } from "./ConditionalTx.sol";
import { Storage } from "./helpers/Storage.sol";

import "hardhat/console.sol";

contract Agreement is Storage {
    Parser public parser;

    mapping(uint256 => ConditionalTx) public txs;

    constructor(Parser _parser) {
        parser = _parser;
    }

    function update(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr
    ) external returns (uint256) {
        console.log("Agreement.update");
        Context transactionCtx = new Context();
        Context conditionCtx = new Context();
        parser.initOpcodes(transactionCtx);
        parser.initOpcodes(conditionCtx);

        ConditionalTx txn = new ConditionalTx(
            _signatory,
            _transactionStr,
            _conditionStr,
            transactionCtx,
            conditionCtx,
            parser.opcodes()
        );
        parser.parse(txn.transactionCtx(), _transactionStr);
        parser.parse(txn.conditionCtx(), _conditionStr);

        // console.logBytes(txn.conditionCtx().program());
        // ConditionalTx txn = parser.spawnHighLevel(_signatory, _transaction, _condition);

        uint256 txId = 1; // TODO: calculate txId, don't hardcode
        txs[txId] = txn;
        return txId;
    }

    function execute(uint256 txId) external {
        ConditionalTx txn = txs[txId];
        require(verify(txn.signatory()), "Agreement: bad tx signatory");
        require(validate(txn), "Agreement: tx condition is not satisfied");
        require(fulfil(txn), "Agreement: tx fulfilment error");
    }

    function verify(address _signatory) internal view returns (bool) {
        return _signatory == msg.sender;
    }

    function validate(ConditionalTx _tx) internal returns (bool) {
        _tx.checkCondition();
        return _tx.conditionCtx().stack().seeLast().getUint256() == 0 ? false : true;
    }

    function fulfil(ConditionalTx _tx) internal returns (bool) {
        _tx.execTransaction();
        return _tx.transactionCtx().stack().seeLast().getUint256() == 0 ? false : true;
    }
}
