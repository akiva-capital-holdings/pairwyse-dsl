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
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';

// import 'hardhat/console.sol';
// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 *
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract Agreement {
    using UnstructuredStorage for bytes32;

    IParser public parser; // TODO: We can get rid of this dependency
    IContext public context;
    address public ownerAddr;

    event NewRecord(
        uint256 recordId,
        uint256[] requiredRecords, // required transactions that have to be executed
        address[] signatories, // addresses that can execute the transaction
        string transaction, // DSL code string ex. `uint256 5 > uint256 3`
        //  DSL code strings that have to be executed successfully before the `transaction DSL code`
        string[] conditionStrings
    );

    modifier isReserved(bytes32 position) {
        bytes32 ETH_4_BYTES_HEX = 0xaaaebeba00000000000000000000000000000000000000000000000000000000;
        bytes32 GWEI_4_BYTES_HEX = 0x0c93a5d800000000000000000000000000000000000000000000000000000000;
        require(position != ETH_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable name is not 'ETH'
        require(position != GWEI_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable name is not 'GWEI'
        _;
    }

    // Only GnosisSafe
    modifier onlyOwner() {
        require(msg.sender == ownerAddr, ErrorsAgreement.AGR11);
        _;
    }

    struct Record {
        address recordContext;
        bool isExecuted;
        bool isArchived;
        bool isActive;
        string transactionString;
    }

    mapping(uint256 => Record) public records; // recordId => Record struct
    mapping(uint256 => address[]) public conditionContexts; // recordId => condition Context
    mapping(uint256 => string[]) public conditionStrings; // recordId => DSL condition as string
    mapping(uint256 => address[]) public signatories; // recordId => signatories
    mapping(uint256 => uint256[]) public requiredRecords; // recordId => requiredRecords[]
    // recordId => (signatory => was tx executed by signatory)
    mapping(uint256 => mapping(address => bool)) public isExecutedBySignatory;
    uint256[] public recordIds; // array of recordId

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(address _parser, address _ownerAddr) {
        require(_ownerAddr != address(0), ErrorsAgreement.AGR12);
        ownerAddr = _ownerAddr;
        parser = IParser(_parser);
        context = new Context();
        context.setAppAddress(address(this));
    }

    function getStorageBool(bytes32 position) external view returns (bool data) {
        return position.getStorageBool();
    }

    function getStorageAddress(bytes32 position) external view returns (address data) {
        return position.getStorageAddress();
    }

    function getStorageUint256(bytes32 position) external view returns (uint256 data) {
        return position.getStorageUint256();
    }

    function setStorageBool(bytes32 position, bool data) external isReserved(position) {
        position.setStorageBool(data);
    }

    function setStorageAddress(bytes32 position, address data) external isReserved(position) {
        position.setStorageAddress(data);
    }

    function setStorageBytes32(bytes32 position, bytes32 data) external isReserved(position) {
        position.setStorageBytes32(data);
    }

    function setStorageUint256(bytes32 position, uint256 data) external isReserved(position) {
        position.setStorageUint256(data);
    }

    /**
     * @dev Based on Record ID returns the number of condition Context instances
     * @param _recordId Record ID
     * @return Number of condition Context instances of the Record
     */
    function conditionContextsLen(uint256 _recordId) external view returns (uint256) {
        return conditionContexts[_recordId].length;
    }

    /**
     * @dev Based on Record ID returns the number of signatures
     * @param _recordId Record ID
     * @return Number of signatures in records
     */
    function signatoriesLen(uint256 _recordId) external view returns (uint256) {
        return signatories[_recordId].length;
    }

    /**
     * @dev Based on Record ID returns the number of required records
     * @param _recordId Record ID
     * @return Number of required records
     */
    function requiredRecordsLen(uint256 _recordId) external view returns (uint256) {
        return requiredRecords[_recordId].length;
    }

    /**
     * @dev Based on Record ID returns the number of condition strings
     * @param _recordId Record ID
     * @return Number of Condition strings of the Record
     */
    function conditionStringsLen(uint256 _recordId) external view returns (uint256) {
        return conditionStrings[_recordId].length;
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
                !records[recordIds[i]].isExecuted &&
                records[recordIds[i]].recordContext != address(0)
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
    function getRecord(uint256 _recordId)
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
        _requiredRecords = requiredRecords[_recordId];
        _signatories = signatories[_recordId];
        _conditions = conditionStrings[_recordId];
        _transaction = records[_recordId].transactionString;
        _isActive = records[_recordId].isActive;
    }

    /**
     * @dev archived any of the existing records by recordId.
     * @param _recordId Record ID
     */
    function archiveRecord(uint256 _recordId) external onlyOwner {
        require(records[_recordId].recordContext != address(0), ErrorsAgreement.AGR9);
        records[_recordId].isArchived = true;
    }

    /**
     * @dev unarchive any of the existing records by recordId
     * @param _recordId Record ID
     */
    function unArchiveRecord(uint256 _recordId) external onlyOwner {
        require(records[_recordId].recordContext != address(0), ErrorsAgreement.AGR9);
        require(records[_recordId].isArchived != false, ErrorsAgreement.AGR10);
        records[_recordId].isArchived = false;
    }

    /**
     * @dev activates the existing records by recordId, only awailable for ownerAddr
     * @param _recordId Record ID
     */
    function activateRecord(uint256 _recordId) external onlyOwner {
        require(records[_recordId].recordContext != address(0), ErrorsAgreement.AGR9);
        records[_recordId].isActive = true;
    }

    /**
     * @dev deactivates the existing records by recordId, only awailable for ownerAddr
     * @param _recordId Record ID
     */
    function deactivateRecord(uint256 _recordId) external onlyOwner {
        require(records[_recordId].recordContext != address(0), ErrorsAgreement.AGR9);
        require(records[_recordId].isActive != false, ErrorsAgreement.AGR10);
        records[_recordId].isActive = false;
    }

    /**
     * @dev Parse DSL code from the user and set the program bytecode in Context contract
     * @param _code DSL code input from the user
     * @param _context Context address
     * @param _preProc Preprocessor address
     */
    function parse(
        string memory _code,
        address _context,
        address _preProc
    ) external {
        parser.parse(_preProc, _context, _code);
    }

    function update(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories,
        string memory _transactionString,
        string[] memory _conditionStrings,
        address _recordContext,
        address[] memory _conditionContexts
    ) external onlyOwner {
        _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
        for (uint256 i = 0; i < _conditionContexts.length; i++) {
            _addRecordCondition(_recordId, _conditionStrings[i], _conditionContexts[i]);
        }
        _addRecordTransaction(_recordId, _transactionString, _recordContext);
        records[_recordId].isArchived = true;

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
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**********************
     * Internal Functions *
     *********************/

    /**
     * @dev Checks input _signatures that only one  'anyone' address exists in the
     * list or that 'anyone' address does not exist in signatures at all
     * @param _signatories the list of addresses
     */
    function _checkSignatories(address[] memory _signatories) internal view {
        require(_signatories.length != 0, ErrorsAgreement.AGR4);
        require(_signatories[0] != address(0), ErrorsAgreement.AGR4);
        if (_signatories.length > 1) {
            for (uint256 i = 0; i < _signatories.length; i++) {
                require(_signatories[i] != address(0), ErrorsAgreement.AGR4);
                require(_signatories[i] != context.anyone(), ErrorsAgreement.AGR4);
            }
        }
    }

    /**
     * Verify that the user who wants to execute the record is amoung the signatories for this Record
     * @param _recordId ID of the record
     * @return true if the user is allowed to execute the record, false - otherwise
     */
    function _verify(uint256 _recordId) internal view returns (bool) {
        address[] memory signatoriesOfRecord = signatories[_recordId];
        if (signatoriesOfRecord.length == 1 && signatoriesOfRecord[0] == context.anyone()) {
            return true;
        }

        for (uint256 i = 0; i < signatoriesOfRecord.length; i++) {
            if (signatories[_recordId][i] == msg.sender) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check that all records required by this records were executed
     * @param _recordId ID of the record
     * @return true all the required records were executed, false - otherwise
     */
    function _validateRequiredRecords(uint256 _recordId) internal view returns (bool) {
        uint256[] memory _requiredRecords = requiredRecords[_recordId];
        Record memory requiredRecord;
        for (uint256 i = 0; i < _requiredRecords.length; i++) {
            requiredRecord = records[_requiredRecords[i]];
            if (!requiredRecord.isExecuted) return false;
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
        Record memory record = Record(address(0), false, false, false, '');
        signatories[_recordId] = _signatories;
        requiredRecords[_recordId] = _requiredRecords;
        records[_recordId] = record;
        recordIds.push(_recordId);
    }

    /**
     * @dev Conditional Transaction: Append a condition to already existing conditions
     * inside Record
     * @param _recordId Record ID
     * @param _conditionStr DSL code for condition
     * @param _conditionCtx Context contract address for block of DSL code for `_conditionStr`
     */
    function _addRecordCondition(
        uint256 _recordId,
        string memory _conditionStr,
        address _conditionCtx
    ) internal {
        require(!StringUtils.equal(_conditionStr, ''), ErrorsAgreement.AGR5);
        IContext(_conditionCtx).setComparisonOpcodesAddr(address(ComparisonOpcodes));
        IContext(_conditionCtx).setBranchingOpcodesAddr(address(BranchingOpcodes));
        IContext(_conditionCtx).setLogicalOpcodesAddr(address(LogicalOpcodes));
        IContext(_conditionCtx).setOtherOpcodesAddr(address(OtherOpcodes));

        conditionContexts[_recordId].push(_conditionCtx);
        conditionStrings[_recordId].push(_conditionStr);
    }

    /**
     * @dev Adds a transaction that should be executed if all
     * conditions inside Record are met
     */
    function _addRecordTransaction(
        uint256 _recordId,
        string memory _transactionString,
        address _recordContext
    ) internal {
        require(conditionStrings[_recordId].length > 0, ErrorsAgreement.AGR5);
        IContext(_recordContext).setComparisonOpcodesAddr(address(ComparisonOpcodes));
        IContext(_recordContext).setBranchingOpcodesAddr(address(BranchingOpcodes));
        IContext(_recordContext).setLogicalOpcodesAddr(address(LogicalOpcodes));
        IContext(_recordContext).setOtherOpcodesAddr(address(OtherOpcodes));

        records[_recordId].recordContext = _recordContext;
        records[_recordId].transactionString = _transactionString;
    }

    function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool) {
        for (uint256 i = 0; i < conditionContexts[_recordId].length; i++) {
            IContext(conditionContexts[_recordId][i]).setMsgValue(_msgValue);
            Executor.execute(conditionContexts[_recordId][i]);
            if (IContext(conditionContexts[_recordId][i]).stack().seeLast() == 0) return false;
        }

        return true;
    }

    /**
     * @dev Fulfill Record
     * @param _recordId Record ID to execute
     * @param _msgValue Value that were sent along with function execution // TODO: possibly remove this argument
     * @param _signatory The user that is executing the Record
     * @return Boolean whether the record was successfully executed or not
     */
    function _fulfill(
        uint256 _recordId,
        uint256 _msgValue,
        address _signatory
    ) internal returns (bool) {
        Record memory record = records[_recordId];

        require(!isExecutedBySignatory[_recordId][_signatory], ErrorsAgreement.AGR7);

        IContext(record.recordContext).setMsgValue(_msgValue);
        Executor.execute(address(record.recordContext));
        isExecutedBySignatory[_recordId][_signatory] = true;

        // Check if record was executed by all signatories
        uint256 executionProgress;
        address[] memory signatoriesOfRecord = signatories[_recordId];
        for (uint256 i = 0; i < signatoriesOfRecord.length; i++) {
            if (isExecutedBySignatory[_recordId][signatoriesOfRecord[i]]) executionProgress++;
        }
        // If all signatories have executed the transaction - mark the tx as executed
        if (executionProgress == signatoriesOfRecord.length) {
            records[_recordId].isExecuted = true;
        }

        return IContext(record.recordContext).stack().seeLast() == 0 ? false : true;
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
                !records[recordIds[i]].isExecuted &&
                records[recordIds[i]].recordContext != address(0)
            ) {
                count++;
            }
        }
        return count;
    }
}
