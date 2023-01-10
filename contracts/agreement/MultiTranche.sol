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

contract MultiTranche is Agreement {
    using UnstructuredStorage for bytes32;

    uint256 public deadline;
    mapping(uint256 => bool) public baseRecord; // recordId => true/false

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(
        address _parser,
        address _ownerAddr,
        address _dslContext
    ) Agreement(_parser, _ownerAddr, _dslContext) {
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
        _setEnterRecord();
        _setDepositAllRecord();
        _setWithdrawRecord();
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
            _requiredRecords[0] = 0; // required always 0 record
        }
        if (_recordId == 0 || _recordId == 3) {
            _signatories[0] = ownerAddr;
        } else {
            _signatories[0] = IProgramContext(contextProgram).ANYONE();
        }
        _conditionStrings[0] = _condition;
        update(_recordId, _requiredRecords, _signatories, _record, _conditionStrings);
        baseRecord[_recordId] = true; // sets the record as base record for the Governance contract
    }

    function _setEnterRecord() internal {
        _setParameters(
            1, // record ID
            'bool true', // transaction
            'bool true', // condition
            0 // required records lenght
        );
    }

    function _setDepositAllRecord() internal {
        _setParameters(
            2, // record ID
            'bool true', // transaction
            'bool true', // condition
            0 // required records lenght
        );
    }

    function _setWithdrawRecord() internal {
        _setParameters(
            3, // record ID
            'bool true', // transaction
            'bool true', // condition
            0 // required records lenght
        );
    }
}
