// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Agreement } from '../Agreement.sol';
import { IParser } from '../../dsl/interfaces/IParser.sol';
import { IContext } from '../../dsl/interfaces/IContext.sol';
import { Context } from '../../dsl/Context.sol';
import { ErrorsAgreement } from '../../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../../dsl/libs/UnstructuredStorage.sol';
import { ComparisonOpcodes } from '../../dsl/libs/opcodes/ComparisonOpcodes.sol';
import { BranchingOpcodes } from '../../dsl/libs/opcodes/BranchingOpcodes.sol';
import { LogicalOpcodes } from '../../dsl/libs/opcodes/LogicalOpcodes.sol';
import { OtherOpcodes } from '../../dsl/libs/opcodes/OtherOpcodes.sol';
import { Executor } from '../../dsl/libs/Executor.sol';
import { StringUtils } from '../../dsl/libs/StringUtils.sol';

// This is just an empty contract. Is used only in AgreementFactoryMock
contract AgreementMock is Agreement {
    // using UnstructuredStorage for bytes32;
    // IParser public parser;
    // IContext public context;
    // event NewTransaction(
    //     uint256 txId, // transaction ID
    //     uint256[] requiredRecords, // required transactions that have to be executed
    //     address[] signatories, // addresses that can execute the transaction
    //     string transaction, // DSL code string ex. `uint256 5 > uint256 3`
    //     //  DSL code strings that have to be executed successfully before the `transaction DSL code`
    //     string[] conditionStrings
    // );
    // struct Record {
    //     uint256[] requiredRecords;
    //     address transactionContext;
    //     bool isExecuted;
    //     string transactionString;
    // }
    // mapping(uint256 => Record) public txs; // txId => Record struct
    // mapping(uint256 => address[]) public conditionContexts; // txId => condition Context
    // mapping(uint256 => string[]) public conditionStrings; // txId => DSL condition as string
    // mapping(uint256 => address[]) public signatories; // txId => signatories
    // mapping(uint256 => uint256) public signatoriesLen; // txId => signarories length
    // // txId => (signatory => was tx executed by signatory)
    // mapping(uint256 => mapping(address => bool)) public isExecutedBySignatory;
    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(address _parser) Agreement(_parser) {}

    // function getStorageBool(bytes32 position) external view returns (bool data) {
    //     return getStorageBool(position);
    // }

    // function getStorageAddress(bytes32 position) external view returns (address data) {
    //     return getStorageAddress(position);
    // }

    // function getStorageBytes32(bytes32 position) external view returns (bytes32 data) {
    //     return getStorageBytes32(position);
    // }

    // function getStorageUint256(bytes32 position) external view returns (uint256 data) {
    //     return getStorageUint256(position);
    // }

    // function setStorageBool(bytes32 position, bool data) external {
    //     setStorageBool(position, data);
    // }

    // function setStorageAddress(bytes32 position, address data) external {
    //     setStorageAddress(position, data);
    // }

    // function setStorageBytes32(bytes32 position, bytes32 data) external {
    //     setStorageBytes32(position, data);
    // }

    // function setStorageUint256(bytes32 position, uint256 data) external {
    //     setStorageUint256(position, data);
    // }

    // /**
    //  * @dev Based on Record ID returns the number of condition Context instances
    //  * @param _recordId Record ID
    //  * @return Number of condition Context instances of the Record
    //  */
    // function conditionContextsLen(uint256 _recordId) external view returns (uint256) {
    //     return conditionContexts[_recordId].length;
    // }
    // /**
    //  * @dev Based on Record ID returns the number of condition strings
    //  * @param _recordId Record ID
    //  * @return Number of Condition strings of the Record
    //  */
    // function conditionStringsLen(uint256 _recordId) external view returns (uint256) {
    //     return conditionStrings[_recordId].length;
    // }
    // /**
    //  * @dev Parse DSL code from the user and set the program bytecode in Context contract
    //  * @param _code DSL code input from the user
    //  * @param _context Context address
    //  * @param _preProc Preprocessor address
    //  */
    // function parse(
    //     string memory _code,
    //     address _context,
    //     address _preProc
    // ) external {
    //     parser.parse(_preProc, _context, _code);
    // }
    // function update(
    //     uint256 _recordId,
    //     uint256[] memory _requiredRecords,
    //     address[] memory _signatories,
    //     string memory _transactionString,
    //     string[] memory _conditionStrings,
    //     address _transactionContext,
    //     address[] memory _conditionContexts
    // ) external {
    //     // console.log('update');
    //     _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
    //     for (uint256 i = 0; i < _conditionContexts.length; i++) {
    //         _addRecordCondition(_recordId, _conditionStrings[i], _conditionContexts[i]);
    //     }
    //     _addRecordTransaction(_recordId, _transactionString, _transactionContext);
    //     emit NewTransaction(
    //         _recordId,
    //         _requiredRecords,
    //         _signatories,
    //         _transactionString,
    //         _conditionStrings
    //     );
    // }
    // function execute(uint256 _recordId) external payable {
    //     // console.log(payable(address(this)).balance);
    //     require(_verify(_recordId), ErrorsAgreement.AGR1);
    //     require(_validate(_recordId, msg.value), ErrorsAgreement.AGR2);
    //     require(_fulfill(_recordId, msg.value, msg.sender), ErrorsAgreement.AGR3);
    // }
    // // solhint-disable-next-line no-empty-blocks
    // receive() external payable {}
    function addRecordBlueprint(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories
    ) external {
        _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
    }

    function addRecordCondition(
        uint256 _recordId,
        string memory _conditionStr,
        address _conditionCtx
    ) public {
        _addRecordCondition(_recordId, _conditionStr, _conditionCtx);
    }

    function addRecordTransaction(
        uint256 _recordId,
        string memory _transactionString,
        address _transactionContext
    ) public {
        _addRecordTransaction(_recordId, _transactionString, _transactionContext);
    }

    // /**
    //  * @dev Checks conditions for the certain transaction
    //  * @param _recordId Record ID which conditions to check
    //  * @param _msgValue passed amount of native tokens for conditional
    //  */
    function checkConditions(uint256 _recordId, uint256 _msgValue) public {
        _checkConditions(_recordId, _msgValue);
    }

    // /**
    //  * @dev Checks input _signatures that only one  'anyone' address exists in the
    //  * list or that 'anyone' address does not exist in signatures at all
    //  * @param _signatories the list of addresses
    //  */
    // function _checkSignatories(address[] memory _signatories) internal pure {
    //     require(_signatories.length != 0, ErrorsAgreement.AGR4);
    //     require(_signatories[0] != address(0), ErrorsAgreement.AGR4);
    //     if (_signatories.length > 1) {
    //         for (uint256 i = 0; i < _signatories.length; i++) {
    //             require(_signatories[i] != address(0), ErrorsAgreement.AGR4);
    //             require(_signatories[i] != Context.anyone(), ErrorsAgreement.AGR4);
    //         }
    //     }
    // }
    // function _verify(uint256 _recordId) internal view returns (bool) {
    //     if (signatoriesLen[_recordId] == 1 && signatories[_recordId][0] == anyone) {
    //         return true;
    //     }
    //     for (uint256 i = 0; i < signatoriesLen[_recordId]; i++) {
    //         if (signatories[_recordId][i] == msg.sender) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
    // function _validate(uint256 _recordId, uint256 _msgValue) internal returns (bool) {
    //     uint256 _len = conditionContexts[_recordId].length;
    //     _checkConditions(_recordId, _msgValue);
    //     uint256 _result;
    //     for (uint256 i = 0; i < _len; i++) {
    //         _result += (IContext(conditionContexts[_recordId][i]).stack().seeLast().getUint256() >
    //             0)
    //             ? 1
    //             : 0;
    //     }
    //     return _result == _len;
    // }
    // /**
    //  * @dev Fulfill Record
    //  * @param _recordId Record ID to execute
    //  * @param _msgValue Value that were sent along with function execution // TODO: possibly remove this argument
    //  * @param _signatory The user that is executing the Record
    //  * @return Boolean whether the record was successfully executed or not
    //  */
    function fulfill(
        uint256 _recordId,
        uint256 _msgValue,
        address _signatory
    ) external returns (bool) {
        return _fulfill(_recordId, _msgValue, _signatory);
    }
}
