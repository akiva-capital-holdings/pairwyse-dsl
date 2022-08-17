// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IContext } from '../dsl/interfaces/IContext.sol';
import { Context } from '../dsl/Context.sol';
import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { ComparisonOpcodes } from '../dsl/libs/opcodes/ComparisonOpcodes.sol';
import { BranchingOpcodes } from '../dsl/libs/opcodes/BranchingOpcodes.sol';
import { LogicalOpcodes } from '../dsl/libs/opcodes/LogicalOpcodes.sol';
import { OtherOpcodes } from '../dsl/libs/opcodes/OtherOpcodes.sol';
import { ErrorsConditionalTxs } from '../dsl/libs/Errors.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';

// import 'hardhat/console.sol';

/**
 * Financial Agreement written in DSL between two or more users
 *
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract Agreement {
    using UnstructuredStorage for bytes32;
    IParser public parser;
    IContext public context;

    constructor(address _parser) {
        parser = IParser(_parser);
        context = new Context(address(this));
    }

    event NewTransaction(
        uint256 txId, // transaction ID
        uint256[] requiredTransactions, // required transactions that have to be executed
        address[] signatories, // addresses that can execute the transaction
        string transaction, // DSL code string ex. `uint256 5 > uint256 3`
        //  DSL code strings that have to be executed successfully before the `transaction DSL code`
        string[] conditionStrings
    );

    struct Tx {
        uint256[] requiredTransactions;
        address transactionContext;
        bool isExecuted;
        string transactionString;
    }

    // The address that is used to symbolyze any signer inside Conditional Transaction
    address public constant ANYONE = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    mapping(uint256 => Tx) public txs; // txId => Tx struct
    mapping(uint256 => address[]) public conditionContexts; // txId => condition Context
    mapping(uint256 => string[]) public conditionStrings; // txId => DSL condition as string
    mapping(uint256 => address[]) public signatories; // txId => signatories
    mapping(uint256 => uint256) public signatoriesLen; // txId => signarories length
    // txId => (signatory => was tx executed by signatory)
    mapping(uint256 => mapping(address => bool)) isExecutedBySignatory;

    function getStorageBool(bytes32 position) public view returns (bool data) {
        return position.getStorageBool();
    }

    function getStorageAddress(bytes32 position) public view returns (address data) {
        return position.getStorageAddress();
    }

    function getStorageBytes32(bytes32 position) public view returns (bytes32 data) {
        return position.getStorageBytes32();
    }

    function getStorageUint256(bytes32 position) public view returns (uint256 data) {
        return position.getStorageUint256();
    }

    function setStorageBool(bytes32 position, bool data) public {
        position.setStorageBool(data);
    }

    function setStorageAddress(bytes32 position, address data) public {
        position.setStorageAddress(data);
    }

    function setStorageBytes32(bytes32 position, bytes32 data) public {
        position.setStorageBytes32(data);
    }

    function setStorageUint256(bytes32 position, uint256 data) public {
        position.setStorageUint256(data);
    }

    /**
     * @dev Define some basic values for a new Conditional Transaction
     * @param _txId is the ID of a transaction
     * @param _requiredTransactions transactions ids that have to be executed
     * @param _signatories addresses that can execute the chosen transaction
     */
    function addTxBlueprint(
        uint256 _txId,
        uint256[] memory _requiredTransactions,
        address[] memory _signatories
    ) public {
        _checkSignatories(_signatories);

        Tx memory txn = Tx(_requiredTransactions, address(0), false, '');
        signatories[_txId] = _signatories;
        signatoriesLen[_txId] = _signatories.length;
        txs[_txId] = txn;
    }

    /**
     * @dev Conditional Transaction: Append a condition to already existing conditions
     * inside Conditional Transaction
     * @param _txId Conditional Transaction ID
     * @param _conditionStr DSL code for condition
     * @param _conditionCtx Context contract address for block of DSL code for `_conditionStr`
     */
    function addTxCondition(
        uint256 _txId,
        string memory _conditionStr,
        address _conditionCtx
    ) public {
        IContext(_conditionCtx).setComparisonOpcodesAddr(address(ComparisonOpcodes));
        IContext(_conditionCtx).setBranchingOpcodesAddr(address(BranchingOpcodes));
        IContext(_conditionCtx).setLogicalOpcodesAddr(address(LogicalOpcodes));
        IContext(_conditionCtx).setOtherOpcodesAddr(address(OtherOpcodes));

        conditionContexts[_txId].push(_conditionCtx);
        conditionStrings[_txId].push(_conditionStr);
    }

    /**
     * @dev Conditional Transaction: Add a transaction that should be executed if all
     * conditions inside Conditional Transacion are met
     */
    function addTxTransaction(
        uint256 _txId,
        string memory _transactionString,
        address _transactionContext
    ) public {
        require(conditionStrings[_txId].length > 0, ErrorsConditionalTxs.CNT2);
        IContext(_transactionContext).setComparisonOpcodesAddr(address(ComparisonOpcodes));
        IContext(_transactionContext).setBranchingOpcodesAddr(address(BranchingOpcodes));
        IContext(_transactionContext).setLogicalOpcodesAddr(address(LogicalOpcodes));
        IContext(_transactionContext).setOtherOpcodesAddr(address(OtherOpcodes));

        txs[_txId].transactionContext = _transactionContext;
        txs[_txId].transactionString = _transactionString;
    }

    function conditionContextsLen(uint256 _txId) public view returns (uint256) {
        return conditionContexts[_txId].length;
    }

    function conditionStringsLen(uint256 _txId) public view returns (uint256) {
        return conditionStrings[_txId].length;
    }

    function execTx(
        uint256 _txId,
        uint256 _msgValue,
        address _signatory
    ) public {
        Tx memory txn = txs[_txId];
        require(checkConditions(_txId, _msgValue), ErrorsConditionalTxs.CNT3);
        require(!isExecutedBySignatory[_txId][_signatory], ErrorsConditionalTxs.CNT4);

        IContext(txn.transactionContext).setMsgValue(_msgValue);
        Executor.execute(address(txn.transactionContext));
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

    /**
     * @dev Checks conditions for the certain transaction
     * @param _txId is the ID of a transaction
     * @param _msgValue passed amount of native tokens for conditional
     * @return bool true if conditionals were executed successfully
     */
    function checkConditions(
        uint256 _txId,
        uint256 _msgValue /*onlyOwner*/
    ) public returns (bool) {
        Tx memory txn = txs[_txId];

        Tx memory requiredTx;
        for (uint256 i = 0; i < txn.requiredTransactions.length; i++) {
            requiredTx = txs[txn.requiredTransactions[i]];
            require(
                requiredTx.isExecuted,
                string(
                    abi.encodePacked(
                        'ConditionalTxs: required tx #',
                        StringUtils.toString(txn.requiredTransactions[i]),
                        ' was not executed'
                    )
                )
            );
        }

        bool _res = true;
        for (uint256 i = 0; i < conditionContexts[_txId].length; i++) {
            IContext(conditionContexts[_txId][i]).setMsgValue(_msgValue);
            Executor.execute(conditionContexts[_txId][i]);
            _res =
                _res &&
                (IContext(conditionContexts[_txId][i]).stack().seeLast().getUint256() > 0);
        }
        return _res;
    }

    function parse(
        string memory _code,
        address _context,
        address _preProc
    ) external {
        parser.parse(_preProc, _context, _code);
    }

    function update(
        uint256 _txId,
        uint256[] memory _requiredTransactions,
        address[] memory _signatories,
        string memory _transactionString,
        string[] memory _conditionStrings,
        address _transactionContext,
        address[] memory _conditionContexts
    ) external {
        // console.log('update');
        addTxBlueprint(_txId, _requiredTransactions, _signatories);
        for (uint256 i = 0; i < _conditionContexts.length; i++) {
            addTxCondition(_txId, _conditionStrings[i], _conditionContexts[i]);
        }
        addTxTransaction(_txId, _transactionString, _transactionContext);

        emit NewTransaction(
            _txId,
            _requiredTransactions,
            _signatories,
            _transactionString,
            _conditionStrings
        );
    }

    function execute(uint256 _txId) external payable {
        // payable(txs).transfer(msg.value);
        require(verify(_txId), ErrorsAgreement.AGR1);
        require(validate(_txId, msg.value), ErrorsAgreement.AGR2);
        require(fulfil(_txId, msg.value, msg.sender), ErrorsAgreement.AGR3);
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @dev Checks input _signatures that only one  'ANYONE' address exists in the
     * list or that 'ANYONE' address does not exist in signatures at all
     * @param _signatories the list of addresses
     */
    function _checkSignatories(address[] memory _signatories) internal pure {
        if (_signatories.length > 1) {
            for (uint256 i = 0; i < _signatories.length; i++) {
                require(_signatories[i] != ANYONE, ErrorsConditionalTxs.CNT1);
            }
        }
    }

    function verify(uint256 _txId) internal view returns (bool) {
        if (signatoriesLen[_txId] == 1 && signatories[_txId][0] == ANYONE) {
            return true;
        }

        for (uint256 i = 0; i < signatoriesLen[_txId]; i++) {
            if (signatories[_txId][i] == msg.sender) {
                return true;
            }
        }
        return false;
    }

    function validate(uint256 _txId, uint256 _msgValue) internal returns (bool) {
        uint256 _len = conditionContextsLen(_txId);
        checkConditions(_txId, _msgValue);
        uint256 _result;
        for (uint256 i = 0; i < _len; i++) {
            _result += (IContext(conditionContexts[_txId][i]).stack().seeLast().getUint256() > 0)
                ? 1
                : 0;
        }
        return _result == _len;
    }

    function fulfil(
        uint256 _txId,
        uint256 _msgValue,
        address _signatory
    ) internal returns (bool) {
        Tx memory txn = txs[_txId];
        execTx(_txId, _msgValue, _signatory);
        return IContext(txn.transactionContext).stack().seeLast().getUint256() == 0 ? false : true;
    }
}
