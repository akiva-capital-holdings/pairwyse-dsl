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

    /**
     * @dev To enter the MultiTranche contract:
     * 1. Understand how much USDC a user wants to deposit
     * 2. Transfer USDC from the user to the MultiTranche
     * 3. Mint WUSDC to the user's wallet in exchange for his/her USDC
     */
    function _setEnterRecord() internal {
        _setParameters(
            1, // record ID
            '(allowance USDC MSG_SENDER MULTI_TRANCHE) setUint256 ALLOWANCE '
            'transferFrom USDC MSG_SENDER MULTI_TRANCHE ALLOWANCE '
            'mint WUSDC MSG_SENDER ALLOWANCE ', // transaction
            'bool true', // condition
            0 // required records length
        );
    }

    /**
     * @dev If the deposits deadline has passed anyone can trigger the deposit of all USDC to
     *      Compound. This is done in the following way:
     * 1. Understand how much USDC there are on the MultiTranche contract
     * 2. Deposit all USDC to Compound
     * 3. Remember in a variable when the deposit happened
     */
    function _setDepositAllRecord() internal {
        _setParameters(
            2, // record ID
            '(balanceOf USDC MULTI_TRANCHE) setUint256 TOTAL_USDC'
            'compound deposit USDC TOTAL_USDC '
            'blockTimestamp setUint256 DEPOSIT_TIME', // transaction
            'blockTimestamp > var DEPOSITS_DEADLINE', // condition
            0 // required records length
        );
    }

    /**
     * @dev If USDC lock time is passed:
     * 1. Understand how much WUSDC a user wants to withdraw
     * 2. Withdraw requested amount of USDC from Compound
     * 3. Burn user's WUSDC
     * 4. Send USDC to the user
     */
    function _setWithdrawRecord() internal {
        _setParameters(
            3, // record ID
            '(allowance WUSDC MSG_SENDER MULTI_TRANCHE) setUint256 W_ALLOWANCE'
            'compound withdraw USDC W_ALLOWANCE '
            'burn WUSDC MSG_SENDER W_ALLOWANCE'
            'transferFrom USDC MSG_SENDER W_ALLOWANCE ', // transaction
            'blockTimestamp > (var DEPOSIT_TIME + var LOCK_TIME)', // condition
            0 // required records length
        );
    }
}
