// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IDSLContext } from '../dsl/interfaces/IDSLContext.sol';
import { IProgramContext } from '../dsl/interfaces/IProgramContext.sol';
import { ProgramContext } from '../dsl/ProgramContext.sol';
import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';
import { LinkedList } from '../dsl/helpers/LinkedList.sol';

// import 'hardhat/console.sol';

// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 *
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract Agreement is LinkedList {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    struct Variable {
        string varName; // Name of variable
        ValueTypes valueType; // Type of variable
        bytes32 varHex; // Name of variable in type of bytes32
        uint256 varId; // Id of variable
        address varCreator; // address of owner
    }

    IParser public parser; // TODO: We can get rid of this dependency
    IProgramContext public contextProgram;
    address public contextDSL;
    address public ownerAddr;

    mapping(uint256 => Variable) public variables; // varId => Variable struct

    enum ValueTypes {
        ADDRESS,
        UINT256,
        BYTES32,
        BOOL
    }


    event Parsed(address indexed preProccessor, address indexed dslCtxAddr, string code);

    event RecordArchived(uint256 indexed recordId);
    event RecordUnarchived(uint256 indexed recordId);
    event RecordActivated(uint256 indexed recordId);
    event RecordDeactivated(uint256 indexed recordId);

    event RecordExecuted(
        address indexed signatory,
        uint256 indexed recordId,
        uint256 providedAmount,
        string transaction
    );

    event NewRecord(
        uint256 recordId,
        uint256[] requiredRecords, // required transactions that have to be executed
        address[] signatories, // addresses that can execute the transaction
        string transaction, // DSL code string ex. `uint256 5 > uint256 3`
        //  DSL code strings that have to be executed successfully before the `transaction DSL code`
        string[] conditionStrings
    );

    modifier isReserved(string memory varName) {
        bytes32 position = bytes4(keccak256(abi.encodePacked(varName)));
        bytes32 MSG_SENDER_4_BYTES_HEX = 0x9ddd6a8100000000000000000000000000000000000000000000000000000000;
        bytes32 ETH_4_BYTES_HEX = 0xaaaebeba00000000000000000000000000000000000000000000000000000000;
        bytes32 GWEI_4_BYTES_HEX = 0x0c93a5d800000000000000000000000000000000000000000000000000000000;
        require(position != MSG_SENDER_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable is not 'MSG_SENDER'
        require(position != ETH_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable name is not 'ETH'
        require(position != GWEI_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable name is not 'GWEI'
        _;
    }

    modifier doesVariableExist(string memory varName, ValueTypes valueType) {
        for (uint256 i = 0; i <= varIds.length; i++) {
            // check that value already exist
            if (varName.equal(variables[i].varName)) {
                // check that msg.sender can rewrite variable
                require(
                    msg.sender == variables[i].varCreator && valueType == variables[i].valueType,
                    ErrorsAgreement.AGR8
                );
            }
        }
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == ownerAddr, ErrorsAgreement.AGR11);
        _;
    }

    /*
        all mappings were moved to the Record struct as it uses less gas during contract deloyment
    */
    struct Record {
        bool isExecuted;
        bool isArchived;
        bool isActive;
        uint256[] requiredRecords;
        address[] signatories;
        string transactionString;
        string[] conditionStrings;
        bytes transactionProgram;
        bytes[] conditions; // condition program in bytes
        mapping(address => bool) isExecutedBySignatory;
    }
    mapping(uint256 => Record) public records; // recordId => Record struct
    mapping(string => uint256) public recordsByString; // DSL condition as string => recordID
    // recordId => (signatory => was tx executed by signatory)
    mapping(uint256 => mapping(string => bool)) public isConditionSet;
    mapping(uint256 => mapping(string => bool)) public isRecordSet;
    mapping(uint256 => mapping(string => bool)) public isCondition;
    mapping(uint256 => mapping(string => bool)) public isRecord;

    uint256[] public recordIds; // array of recordId

    /**
     * Sets parser address, creates new contextProgram instance, and setups contextProgram
     */
    constructor(address _parser, address _ownerAddr, address _dslContext) {
        require(_parser != address(0), ErrorsAgreement.AGR12);
        require(_ownerAddr != address(0), ErrorsAgreement.AGR12);
        require(_dslContext != address(0), ErrorsAgreement.AGR12);
        ownerAddr = _ownerAddr;
        contextDSL = _dslContext;
        parser = IParser(_parser);
        contextProgram = new ProgramContext();
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function getStorageBool(bytes32 position) external view returns (bool data) {
        return position.getStorageBool();
    }

    function getStorageAddress(bytes32 position) external view returns (address data) {
        return position.getStorageAddress();
    }

    function getStorageUint256(bytes32 position) external view returns (uint256 data) {
        return position.getStorageUint256();
    }

    function setStorageBool(
        string memory varName,
        bool data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.BOOL) {
        bytes32 position = _addNewVariable(varName, ValueTypes.BOOL);
        position.setStorageBool(data);
    }

    function setStorageAddress(
        string memory varName,
        address data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.ADDRESS) {
        bytes32 position = _addNewVariable(varName, ValueTypes.ADDRESS);
        return position.getStorageAddress();
    }

    function setStorageBytes32(
        string memory varName,
        bytes32 data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.BYTES32) {
        bytes32 position = _addNewVariable(varName, ValueTypes.BYTES32);
        position.setStorageBytes32(data);
    }

    function setStorageUint256(
        string memory varName,
        uint256 data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.UINT256) {
        bytes32 position = _addNewVariable(varName, ValueTypes.UINT256);
        position.setStorageUint256(data);
    }

    /**
     * @dev Based on Record ID returns the number of conditions
     * @param _recordId Record ID
     * @return Number of conditions of the Record
     */
    function conditionLen(uint256 _recordId) external view returns (uint256) {
        return records[_recordId].conditions.length;
    }

    /**
     * @dev Based on Record ID returns the number of signatures
     * @param _recordId Record ID
     * @return Number of signatures in records
     */
    function signatoriesLen(uint256 _recordId) external view returns (uint256) {
        return records[_recordId].signatories.length;
    }

    /**
     * @dev Based on Record ID returns the number of required records
     * @param _recordId Record ID
     * @return Number of required records
     */
    function requiredRecordsLen(uint256 _recordId) external view returns (uint256) {
        return records[_recordId].requiredRecords.length;
    }

    /**
     * @dev Based on Record ID returns the number of condition strings
     * @param _recordId Record ID
     * @return Number of Condition strings of the Record
     */
    function conditionStringsLen(uint256 _recordId) external view returns (uint256) {
        return records[_recordId].conditionStrings.length;
    }

    function conditionString(uint256 _recordId, uint256 i) external view returns (string memory) {
        require(i < records[_recordId].conditionStrings.length, ErrorsAgreement.AGR16);
        return records[_recordId].conditionStrings[i];
    }

    /**
     * @dev Sorted all records and return array of active records in Agreement
     * @return activeRecords array of active records in Agreement
     */
    function getActiveRecords() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256[] memory activeRecords = new uint256[](_activeRecordsLen());
        for (uint256 i = 0; i < recordIds.length; i++) {
            if (
                records[recordIds[i]].isActive &&
                !records[recordIds[i]].isArchived &&
                !records[recordIds[i]].isExecuted
            ) {
                activeRecords[count] = recordIds[i];
                count++;
            }
        }
        return activeRecords;
    }

    /**
     * @dev return valuses for preview record before execution
     * @param _recordId Record ID
     * @return _requiredRecords array of required records in the record
     * @return _signatories array of signatories in the record
     * @return _conditions array of conditions in the record
     * @return _transaction string of transaction
     * @return _isActive true if the record is active
     */
    function getRecord(
        uint256 _recordId
    )
        external
        view
        returns (
            uint256[] memory _requiredRecords,
            address[] memory _signatories,
            string[] memory _conditions,
            string memory _transaction,
            bool _isActive
        )
    {
        _requiredRecords = records[_recordId].requiredRecords;
        _signatories = records[_recordId].signatories;
        _conditions = records[_recordId].conditionStrings;
        _transaction = records[_recordId].transactionString;
        _isActive = records[_recordId].isActive;
    }

    /**
     * @dev archived any of the existing records by recordId.
     * @param _recordId Record ID
     */
    function archiveRecord(uint256 _recordId) external onlyOwner {
        require(!StringUtils.equal(records[_recordId].transactionString, ''), ErrorsAgreement.AGR9);
        records[_recordId].isArchived = true;

        emit RecordArchived(_recordId);
    }

    /**
     * @dev unarchive any of the existing records by recordId
     * @param _recordId Record ID
     */
    function unarchiveRecord(uint256 _recordId) external onlyOwner {
        require(records[_recordId].isArchived != false, ErrorsAgreement.AGR10);
        records[_recordId].isArchived = false;

        emit RecordUnarchived(_recordId);
    }

    /**
     * @dev activates the existing records by recordId, only awailable for ownerAddr
     * @param _recordId Record ID
     */
    function activateRecord(uint256 _recordId) external onlyOwner {
        require(!StringUtils.equal(records[_recordId].transactionString, ''), ErrorsAgreement.AGR9);
        records[_recordId].isActive = true;

        emit RecordActivated(_recordId);
    }

    /**
     * @dev deactivates the existing records by recordId, only awailable for ownerAddr
     * @param _recordId Record ID
     */
    function deactivateRecord(uint256 _recordId) external onlyOwner {
        require(records[_recordId].isActive != false, ErrorsAgreement.AGR10);
        records[_recordId].isActive = false;

        emit RecordDeactivated(_recordId);
    }

    /**
     * @dev Parse DSL code from the user and set the program bytecode in Agreement contract
     * @param _code DSL code input from the user
     * @param _preProc Preprocessor address
     * TODO: for loop for parsing till the function parse() returns TRUE value
     * the main idea is not to provide _code parameter to the parser as we already have
     * all of these records string
     */
    function parse(string memory _code, address _preProc) external {
        uint256 _recordId = recordsByString[_code];
        parser.parse(_preProc, contextDSL, address(contextProgram), _code);
        bytes memory _p = IProgramContext(contextProgram).program();
        /* 
            TODO: additional checking if conditional and transaction has the same string

            example:
            transactionStr: 'bool true',
            conditionStrings: ['bool true'],
        */
        if (isCondition[_recordId][_code] && !isConditionSet[_recordId][_code]) {
            records[_recordId].conditions.push(_p);
            isConditionSet[_recordId][_code] = true;
        } else if (isRecord[_recordId][_code] && !isRecordSet[_recordId][_code]) {
            records[_recordId].transactionProgram = _p;
            isRecordSet[_recordId][_code] = true;
        }
        emit Parsed(_preProc, _code);
    }

    // TODO: rename to addRecord?
    function update(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories,
        string memory _transactionString,
        string[] memory _conditionStrings
    ) public {
        _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
        for (uint256 i = 0; i < _conditionStrings.length; i++) {
            _addRecordCondition(_recordId, _conditionStrings[i]);
        }
        _addRecordTransaction(_recordId, _transactionString);
        if (msg.sender == ownerAddr) {
            records[_recordId].isActive = true;
        }

        emit NewRecord(
            _recordId,
            _requiredRecords,
            _signatories,
            _transactionString,
            _conditionStrings
        );
    }

    function execute(uint256 _recordId) external payable {
        require(records[_recordId].isActive, ErrorsAgreement.AGR13);
        require(_verify(_recordId), ErrorsAgreement.AGR1);
        require(_validateRequiredRecords(_recordId), ErrorsAgreement.AGR2);
        require(_validateConditions(_recordId, msg.value), ErrorsAgreement.AGR6);
        require(_fulfill(_recordId, msg.value, msg.sender), ErrorsAgreement.AGR3);
        emit RecordExecuted(msg.sender, _recordId, msg.value, records[_recordId].transactionString);
    }

    /**********************
     * Internal Functions *
     *********************/

    /**
     * @dev Checks input _signatures that only one 'ANYONE' address exists in the
     * list or that 'ANYONE' address does not exist in signatures at all
     * @param _signatories the list of addresses
     */
    function _checkSignatories(address[] memory _signatories) internal view {
        require(_signatories.length != 0, ErrorsAgreement.AGR4);
        require(_signatories[0] != address(0), ErrorsAgreement.AGR4);
        if (_signatories.length > 1) {
            for (uint256 i = 0; i < _signatories.length; i++) {
                require(_signatories[i] != address(0), ErrorsAgreement.AGR4);
                require(_signatories[i] != contextProgram.ANYONE(), ErrorsAgreement.AGR4);
            }
        }
    }

    /**
     * @dev Created and save new Variable of seted Value
     * @param _varName seted value name in type of string
     * @param _valueType seted value type number
     * @return position is a _varName in type of bytes32
     */
    function _addNewVariable(
        string memory _varName,
        ValueTypes _valueType
    ) internal returns (bytes32 position) {
        position = bytes4(keccak256(abi.encodePacked(_varName)));
        uint256 arrPos = varIds.length;
        varIds.push(arrPos);
        Variable memory variable = Variable(_varName, _valueType, position, arrPos, msg.sender);
        variables[arrPos] = variable;
    }

    /**
     * Verify that the user who wants to execute the record is amoung the signatories for this Record
     * @param _recordId ID of the record
     * @return true if the user is allowed to execute the record, false - otherwise
     */
    function _verify(uint256 _recordId) internal view returns (bool) {
        address[] memory signatoriesOfRecord = records[_recordId].signatories;
        if (signatoriesOfRecord.length == 1 && signatoriesOfRecord[0] == contextProgram.ANYONE())
            return true;

        for (uint256 i = 0; i < signatoriesOfRecord.length; i++) {
            if (records[_recordId].signatories[i] == msg.sender) return true;
        }
        return false;
    }

    /**
     * @dev Check that all records required by this records were executed
     * @param _recordId ID of the record
     * @return true all the required records were executed, false - otherwise
     */
    function _validateRequiredRecords(uint256 _recordId) internal view returns (bool) {
        uint256[] memory _requiredRecords = records[_recordId].requiredRecords;
        for (uint256 i = 0; i < _requiredRecords.length; i++) {
            if (!records[_requiredRecords[i]].isExecuted) return false;
        }

        return true;
    }

    /**
     * @dev Define some basic values for a new record
     * @param _recordId is the ID of a transaction
     * @param _requiredRecords transactions ids that have to be executed
     * @param _signatories addresses that can execute the chosen transaction
     */
    function _addRecordBlueprint(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories
    ) internal {
        _checkSignatories(_signatories);
        records[_recordId].requiredRecords = _requiredRecords;
        records[_recordId].signatories = _signatories;
        recordIds.push(_recordId);
    }

    /**
     * @dev Conditional Transaction: Append a condition to already existing conditions
     * inside Record
     * @param _recordId Record ID
     * @param _conditionStr DSL code for condition
     */
    function _addRecordCondition(uint256 _recordId, string memory _conditionStr) internal {
        require(!_conditionStr.equal(''), ErrorsAgreement.AGR5);
        records[_recordId].conditionStrings.push(_conditionStr);
        isCondition[_recordId][_conditionStr] = true;
        recordsByString[_conditionStr] = _recordId;
    }

    /**
     * @dev Adds a transaction that should be executed if all
     * conditions inside Record are met
     */
    function _addRecordTransaction(uint256 _recordId, string memory _transactionString) internal {
        require(records[_recordId].conditionStrings.length > 0, ErrorsAgreement.AGR5);
        records[_recordId].transactionString = _transactionString;
        isRecord[_recordId][_transactionString] = true;
        recordsByString[_transactionString] = _recordId;
    }

    // TODO: add doc
    function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool) {
        for (uint256 i = 0; i < records[_recordId].conditions.length; i++) {
            _execute(_msgValue, records[_recordId].conditions[i]);
            if (IProgramContext(address(contextProgram)).stack().seeLast() == 0) return false;
        }
        return true;
    }

    /**
     * @dev Fulfill Record
     * @param _recordId Record ID to execute
     * @param _msgValue Value that were sent along with function execution // TODO: possibly remove this argument
     * @param _signatory The user that is executing the Record
     * @return result Boolean whether the record was successfully executed or not
     */
    function _fulfill(
        uint256 _recordId,
        uint256 _msgValue,
        address _signatory
    ) internal returns (bool result) {
        require(!records[_recordId].isExecutedBySignatory[_signatory], ErrorsAgreement.AGR7);
        _execute(_msgValue, records[_recordId].transactionProgram);
        records[_recordId].isExecutedBySignatory[_signatory] = true;

        // Check if record was executed by all signatories
        uint256 executionProgress;
        address[] memory signatoriesOfRecord = records[_recordId].signatories;
        for (uint256 i = 0; i < signatoriesOfRecord.length; i++) {
            if (records[_recordId].isExecutedBySignatory[signatoriesOfRecord[i]])
                executionProgress++;
        }
        // If all signatories have executed the transaction - mark the tx as executed
        if (executionProgress == signatoriesOfRecord.length) {
            records[_recordId].isExecuted = true;
        }
        return IProgramContext(address(contextProgram)).stack().seeLast() == 0 ? false : true;
    }

    /**
     * @dev Execute Record
     * @param _msgValue Value that were sent along with function execution
     // TODO: possibly remove this argument
     * @param _program provided bytcode of the program
     */
    function _execute(uint256 _msgValue, bytes memory _program) internal {
        IProgramContext(address(contextProgram)).setMsgValue(_msgValue);
        IProgramContext(address(contextProgram)).setProgram(_program);
        Executor.execute(contextDSL, address(contextProgram));
    }

    /**
     * @dev return length of active records for getActiveRecords
     * @return count length of active records array
     */
    function _activeRecordsLen() internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < recordIds.length; i++) {
            if (
                records[recordIds[i]].isActive &&
                !records[recordIds[i]].isArchived &&
                !records[recordIds[i]].isExecuted
            ) {
                count++;
            }
        }
        return count;
    }
}
