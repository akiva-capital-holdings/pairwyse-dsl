/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { IAgreement } from '../dsl/interfaces/IAgreement.sol';
import { IParser } from '../dsl/interfaces/IParser.sol';
import { IDSLContext } from '../dsl/interfaces/IDSLContext.sol';
import { IProgramContext } from '../dsl/interfaces/IProgramContext.sol';
import { ProgramContext } from '../dsl/ProgramContext.sol';
import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';
import { AgreementStorage } from './AgreementStorage.sol';
import { LinkedList } from '../dsl/helpers/LinkedList.sol';

// import 'hardhat/console.sol';

// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 *
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract Agreement is IAgreement, AgreementStorage, LinkedList {
    using StringUtils for string;

    uint256[] public recordIds; // array of recordId
    address public parser; // TODO: We can get rid of this dependency
    address public contextProgram;
    address public contextDSL;
    address public ownerAddr;
    mapping(uint256 => Record) public records; // recordId => Record struct

    modifier onlyOwner() {
        require(msg.sender == ownerAddr, ErrorsAgreement.AGR11);
        _;
    }

    /**
     * Sets parser address, creates new contextProgram instance, and setups contextProgram
     */
    constructor(address _parser, address _ownerAddr, address _dslContext) {
        _checkZeroAddress(_parser);
        _checkZeroAddress(_ownerAddr);
        _checkZeroAddress(_dslContext);
        ownerAddr = _ownerAddr;
        contextDSL = _dslContext;
        parser = _parser;
        contextProgram = address(new ProgramContext());
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * Apply keccak256 to `_str`, cut the result to the first 4 bytes
     * @param _str Input string
     * @return bytes4(keccak256(str))
     */
    function hex4Bytes(string memory _str) external pure returns (bytes4) {
        return bytes4(keccak256(abi.encodePacked(_str)));
    }

    /**
     * @dev archive any of the existing records by recordId.
     * @param _recordId Record ID
     */
    function archiveRecord(uint256 _recordId) external onlyOwner {
        _checkEmptyString(records[_recordId].recordString);
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
        _checkEmptyString(records[_recordId].recordString);
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
     * @dev returns true if parsing was finished for the record including
     * conditions otherwise, it returns false
     * The `finished parsing` therm means that all record and conditions
     * already parsed and have got their bytecodes, so all bytecodes
     * already storing in the Agreement smart contract
     */
    function parseFinished() external view returns (bool _result) {
        uint256 i;
        uint256 recordId;
        string memory code;
        for (i; i < recordIds.length; i++) {
            uint256 count = 0;
            recordId = recordIds[i];
            code = records[recordId].recordString;
            // check that the main transaction was set already
            if (records[recordId].isRecordSet[code]) {
                for (uint256 j; j < records[recordId].conditionStrings.length; j++) {
                    code = records[recordId].conditionStrings[j];
                    // check that the conditions were set already
                    if (records[recordId].isConditionSet[code]) {
                        count++;
                    }
                }
            }
            if (count != records[recordId].conditionStrings.length) return false;
        }
        return true;
    }

    /**
     * @dev Parse DSL code from the user and set the program bytecode in Agreement contract
     * @param _preProc Preprocessor address
     */
    function parse(address _preProc) external returns (bool _result) {
        uint256 i;
        uint256 recordId;
        string memory code;
        for (i; i < recordIds.length; i++) {
            recordId = recordIds[i];
            code = records[recordId].recordString;
            if (!records[recordId].isRecordSet[code]) {
                _parse(recordId, _preProc, code, true);
                return true;
            } else {
                for (uint256 j; j < conditionStringsLen(recordId); j++) {
                    code = records[recordId].conditionStrings[j];
                    if (!records[recordId].isConditionSet[code]) {
                        _parse(recordId, _preProc, code, false);
                        return true;
                    }
                }
            }
        }
    }

    /**
     * @dev Parse DSL code and set the program bytecode in Agreement contract
     * @param _recordId Record ID
     * @param _preProc Preprocessor address
     * @param _code DSL code for the record of the condition
     * @param _isRecord a flag that shows if provided _code is a record or
     * not (a condition then)
     */
    function _parse(
        uint256 _recordId,
        address _preProc,
        string memory _code,
        bool _isRecord
    ) internal {
        IParser(parser).parse(_preProc, contextDSL, contextProgram, _code);
        if (_isRecord) {
            records[_recordId].isRecordSet[_code] = true;
            records[_recordId].recordProgram = _getProgram();
        } else {
            records[_recordId].isConditionSet[_code] = true;
            records[_recordId].conditions.push(_getProgram());
        }

        emit Parsed(_preProc, _code);
    }

    /**
     * @dev Updates Agreement contract by DSL code for the record
     * and its conditions. All records that will be updated still
     * need to be parsed. Please, check the `parse` function for more details
     * TODO: rename this function to addRecord
     * @param _recordId Record ID
     * @param _requiredRecords array of required records in the record
     * @param _signatories array of signatories in the record
     * @param _recordString string of record DSL transaction
     * @param _conditionStrings the array of conditions string for the record
     */
    function update(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories,
        string memory _recordString,
        string[] memory _conditionStrings
    ) public {
        _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
        for (uint256 i = 0; i < _conditionStrings.length; i++) {
            _addRecordCondition(_recordId, _conditionStrings[i]);
        }
        _addRecordTransaction(_recordId, _recordString);
        if (msg.sender == ownerAddr) {
            records[_recordId].isActive = true;
        }

        emit NewRecord(_recordId, _requiredRecords, _signatories, _recordString, _conditionStrings);
    }

    /**
     * @dev Check if the recorcID is executable (validate all conditions before
     * record execution, check signatures).
     * @param _recordId Record ID
     */
    function execute(uint256 _recordId) external payable virtual {
        _verifyRecord(_recordId);
        require(_fulfill(_recordId, msg.value, msg.sender), ErrorsAgreement.AGR3);
        emit RecordExecuted(msg.sender, _recordId, msg.value, records[_recordId].recordString);
    }

    function _verifyRecord(uint256 _recordId) internal {
        require(records[_recordId].isActive, ErrorsAgreement.AGR13);
        require(_verify(_recordId), ErrorsAgreement.AGR1);
        require(_validateRequiredRecords(_recordId), ErrorsAgreement.AGR2);
        require(_validateConditions(_recordId, msg.value), ErrorsAgreement.AGR6);
    }

    /**
     * @dev Returns the condition string for provided recordID
     * and index for the searching condition string
     * @param _recordId Record ID
     */
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
     * @return _record string of record DSL transaction
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
            string memory _record,
            bool _isActive
        )
    {
        _requiredRecords = records[_recordId].requiredRecords;
        _signatories = records[_recordId].signatories;
        _conditions = records[_recordId].conditionStrings;
        _record = records[_recordId].recordString;
        _isActive = records[_recordId].isActive;
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
        _checkZeroAddress(_signatories[0]);
        if (_signatories.length > 1) {
            for (uint256 i = 0; i < _signatories.length; i++) {
                _checkZeroAddress(_signatories[i]);
                require(_signatories[i] != _anyone(), ErrorsAgreement.AGR4);
            }
        }
    }

    /**
     * Verify that the user who wants to execute the record is amoung the signatories for this Record
     * @param _recordId ID of the record
     * @return true if the user is allowed to execute the record, false - otherwise
     */
    function _verify(uint256 _recordId) internal view returns (bool) {
        if (
            records[_recordId].signatories.length == 1 &&
            records[_recordId].signatories[0] == _anyone()
        ) return true;

        for (uint256 i = 0; i < records[_recordId].signatories.length; i++) {
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
        _checkEmptyString(_conditionStr);
        records[_recordId].conditionStrings.push(_conditionStr);
    }

    /**
     * @dev Adds a transaction that should be executed if all
     * conditions inside Record are met
     * @param _recordId Record ID
     * @param _recordString DSL code for record string
     */
    function _addRecordTransaction(uint256 _recordId, string memory _recordString) internal {
        require(records[_recordId].conditionStrings.length > 0, ErrorsAgreement.AGR5);
        records[_recordId].recordString = _recordString;
    }

    /**
     * @dev Validate all conditions for the certain record ID
     * @param _recordId Record ID to execute
     * @param _msgValue Value that were sent along with function execution // TODO: possibly remove this argument
     */
    function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool) {
        for (uint256 i = 0; i < records[_recordId].conditions.length; i++) {
            _execute(_msgValue, records[_recordId].conditions[i]);
            if (_seeLast() == 0) return false;
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
        _execute(_msgValue, records[_recordId].recordProgram);
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
        return _seeLast() == 0 ? false : true;
    }

    /**
     * @dev Execute Record
     * @param _msgValue Value that were sent along with function execution
     // TODO: possibly remove this argument
     * @param _program provided bytcode of the program
     */
    function _execute(uint256 _msgValue, bytes memory _program) private {
        IProgramContext(address(contextProgram)).setMsgValue(_msgValue);
        IProgramContext(address(contextProgram)).setProgram(_program);
        Executor.execute(contextDSL, contextProgram);
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

    function conditionStringsLen(uint256 _recordId) public view returns (uint256) {
        return records[_recordId].conditionStrings.length;
    }

    function _seeLast() private view returns (uint256) {
        return IProgramContext(contextProgram).stack().seeLast();
    }

    function _anyone() private view returns (address) {
        return IProgramContext(contextProgram).ANYONE();
    }

    function _checkEmptyString(string memory _string) private pure {
        require(!StringUtils.equal(_string, ''), ErrorsAgreement.AGR5);
    }

    function _checkZeroAddress(address _address) private pure {
        require(_address != address(0), ErrorsAgreement.AGR12);
    }

    function _getProgram() private view returns (bytes memory) {
        return IProgramContext(contextProgram).program();
    }
}
