// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IProgramContext } from '../dsl/interfaces/IProgramContext.sol';
import { ProgramContext } from '../dsl/ProgramContext.sol';
import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
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

    uint256 public deadline;
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

        deadline = _deadline;
        // all records use the same context
        _setBaseRecords();
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
     * // TODO: add parameters in the doc
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
        string memory record = 'uint256[] VOTERS';
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
        string memory record = 'insert 1 into VOTERS';
        string memory _condition = string(
            abi.encodePacked(
                '(GOV_BALANCE > 0) and (blockTimestamp < ',
                StringUtils.toString(deadline),
                ' )'
            )
        );
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
        string memory record = 'insert 0 into VOTERS';
        string memory _condition = string(
            abi.encodePacked(
                '(GOV_BALANCE > 0) and (blockTimestamp < ',
                StringUtils.toString(deadline),
                ' )'
            )
        );
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
        string memory record = '(sumOf VOTERS) setUint256 YES_CTR '
        '(((lengthOf VOTERS * 1e10) / (YES_CTR * 1e10)) < 2)'
        'if ENABLE_RECORD end '
        'ENABLE_RECORD { enableRecord RECORD_ID at AGREEMENT_ADDR }';

        string memory _condition = string(
            abi.encodePacked('blockTimestamp >= ', StringUtils.toString(deadline))
        );
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
