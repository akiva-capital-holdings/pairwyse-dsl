// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from "../interfaces/IParser.sol";
import { ConditionalTx } from "../helpers/ConditionalTx.sol";
import { Storage } from "../helpers/Storage.sol";
import { Context } from "../Context.sol";

// import "hardhat/console.sol";

// Create ProxyConditionalTx for funds storage for different ConditionalTx
contract Agreement is Storage {
    IParser public parser;

    event NewTransaction(bytes32 txId, address signatory, string transaction, string conditionStr);

    mapping(bytes32 => ConditionalTx) public txs;

    constructor(IParser _parser) {
        parser = _parser;
    }

    function update(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr
    ) external returns (bytes32 txId) {
        Context transactionCtx = new Context();
        Context conditionCtx = new Context();

        // TODO: improve the logic here. Why parser is responsible for initing opcodes for Context?
        parser.initOpcodes(transactionCtx);
        parser.initOpcodes(conditionCtx);

        transactionCtx.setAppAddress(address(this));
        transactionCtx.setMsgSender(msg.sender);

        conditionCtx.setAppAddress(address(this));
        conditionCtx.setMsgSender(msg.sender);

        ConditionalTx txn = new ConditionalTx(_signatory, _transactionStr, _conditionStr, transactionCtx, conditionCtx);
        parser.parse(txn.transactionCtx(), _transactionStr);
        parser.parse(txn.conditionCtx(), _conditionStr);

        txId = hashTx(_signatory, _transactionStr, _conditionStr);
        txs[txId] = txn;

        emit NewTransaction(txId, _signatory, _transactionStr, _conditionStr);
    }

    function execute(bytes32 txId) external {
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

    function hashTx(
        address _signatory,
        string memory _transaction,
        string memory _condition
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_signatory, _transaction, _condition));
    }
}
