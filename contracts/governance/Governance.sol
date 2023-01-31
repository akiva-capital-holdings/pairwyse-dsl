// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IProgramContext } from '../dsl/interfaces/IProgramContext.sol';
import { ProgramContext } from '../dsl/ProgramContext.sol';
import { ErrorsAgreement, ErrorsGovernance } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';
import { Agreement } from '../agreement/Agreement.sol';

// import 'hardhat/console.sol';

// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract Governance is Agreement {
    using UnstructuredStorage for bytes32;

    mapping(uint256 => bool) public baseRecord; // recordId => true/false

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(
        address _parser,
        address _ownerAddr,
        address _token,
        address _dslContext,
        uint256 _deadline
    ) Agreement(_parser, _ownerAddr, _dslContext) {
        require(_deadline > block.timestamp, ErrorsAgreement.AGR15);
        require(
            _parser != address(0) &&
                _ownerAddr != address(0) &&
                _token != address(0) &&
                _dslContext != address(0),
            ErrorsAgreement.AGR12
        );

        UnstructuredStorage.setStorageUint256(
            0x11d887ad00000000000000000000000000000000000000000000000000000000, // `DEADLINE` in bytes32
            _deadline
        );

        // all records use the same context
        _setBaseRecords();
    }

    function execute(uint256 _recordId) external payable override {
        _verifyRecord(_recordId);
        if (_recordId == 1) {
            // if the user already voted NO he can not vote YES anymore
            require(!records[2].isExecutedBySignatory[msg.sender], ErrorsGovernance.GOV2);
        } else if (_recordId == 2) {
            // if the user already voted YES he can not vote NO anymore
            require(!records[1].isExecutedBySignatory[msg.sender], ErrorsGovernance.GOV1);
        }
        require(_fulfill(_recordId, msg.value, msg.sender), ErrorsAgreement.AGR3);
        emit RecordExecuted(msg.sender, _recordId, msg.value, records[_recordId].recordString);
    }

    /**
     * @dev Uploads 4 pre-defined records to Governance contract directly
     */
    function _setBaseRecords() internal {
        _setBaseRecord();
        _setYesRecord();
        _setNoRecord();
        _setCheckVotingRecord();
    }

    /**
     * @dev Uploads 4 pre-defined records to Governance contract directly.
     * Uses a simple condition string `bool true`.
     * Records still have to be parsed using a preprocessor before execution. Such record becomes
     * non-upgradable. Check `isUpgradableRecord` modifier
     * @param _recordId is the record ID
     * @param _record is a string of the main record for execution
     * @param _condition is a string of the condition that will be checked before record execution
     * @param _requiredRecordsLength is a flag for required records before execution
     */
    function _setParameters(
        uint256 _recordId,
        string memory _record,
        string memory _condition,
        uint256 _requiredRecordsLength
    ) internal {
        address[] memory _signatories = new address[](1);
        string[] memory _conditionStrings = new string[](1);
        uint256[] memory _requiredRecords;
        if (_requiredRecordsLength != 0) {
            _requiredRecords = new uint256[](1);
            _requiredRecords[0] = 0; // required alvays 0 record
        }
        if (_recordId == 0 || _recordId == 3) {
            _signatories[0] = ownerAddr;
        } else {
            _signatories[0] = IProgramContext(contextProgram).ANYONE();
        }
        _conditionStrings[0] = _condition;
        update(_recordId, _requiredRecords, _signatories, _record, _conditionStrings);
        _setBaseRecordStatus(_recordId);
    }

    /**
     * @dev Declares VOTERS list that will contain structures.
     * In additional to that declares two structures that will be
     * used for YES/NO voting
     */
    function _setBaseRecord() internal {
        uint256 recordId = 0;
        string memory record = 'declareArr address YES_VOTERS '
        'declareArr address NO_VOTERS';

        string memory _condition = 'bool true';
        _setParameters(recordId, record, _condition, 0);
    }

    /**
     * @dev Inserts VOTE_YES structure to the VOTERS list,
     * this record can be executed only if deadline is not occurred
     * TODO: and balance for
     * msg.sender of Governance token will be more that 0
     */
    function _setYesRecord() internal {
        uint256 recordId = 1;
        string memory record = 'insert MSG_SENDER into YES_VOTERS';

        string memory _condition = 'blockTimestamp < DEADLINE';

        _setParameters(recordId, record, _condition, 1);
    }

    /**
     * @dev Inserts VOTE_NO structure to the VOTERS list,
     * this record can be executed only if deadline is not occurred
     * TODO: and balance for
     * msg.sender of Governance token will be more that 0
     */
    function _setNoRecord() internal {
        uint256 recordId = 2;
        string memory record = 'insert MSG_SENDER into NO_VOTERS';

        string memory _condition = 'blockTimestamp < DEADLINE';

        _setParameters(recordId, record, _condition, 1);
    }

    /**
     * @dev Sums up the results of the voting, if results are more than 50%
     * the record that is set as RECORD_ID for AGREEMENT_ADDR will be activated
     * otherwise, the RECORD_ID record won't be activated.
     * This record can be executed only if the deadline has already occurred
     * TODO: change RECORD_ID and AGREEMENT_ADDR to the dynamical inside of
     * the governance contract
     */
    function _setCheckVotingRecord() internal {
        uint256 recordId = 3;

        string memory record = 'enableRecord RECORD_ID at AGREEMENT_ADDR';

        string
            memory _condition = '((votersBalance TOKEN YES_VOTERS) > (votersBalance TOKEN NO_VOTERS)) and (blockTimestamp >= DEADLINE)';

        _setParameters(recordId, record, _condition, 1);
    }

    /**
     * @dev Sets the record as base record for the Governance contract
     * @param _recordId is the record ID
     */
    function _setBaseRecordStatus(uint256 _recordId) internal {
        baseRecord[_recordId] = true;
    }
}
