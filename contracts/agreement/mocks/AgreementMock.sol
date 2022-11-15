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

contract AgreementMock is Agreement {
    constructor(address _parser, address _ownerAddr) Agreement(_parser, _ownerAddr) {}

    function verify(uint256 _recordId) public view returns (bool) {
        return _verify(_recordId);
    }

    function validateRequiredRecords(uint256 _recordId) public view returns (bool) {
        return _validateRequiredRecords(_recordId);
    }

    function validateConditions(uint256 _recordId, uint256 _msgValue) public returns (bool) {
        return _validateConditions(_recordId, _msgValue);
    }

    function addRecordBlueprint(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories
    ) external {
        _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
    }

    function addRecordCondition(uint256 _recordId, string memory _conditionStr) public {
        _addRecordCondition(_recordId, _conditionStr);
    }

    function addRecordTransaction(uint256 _recordId, string memory _transactionString) public {
        _addRecordTransaction(_recordId, _transactionString);
    }

    function fulfill(
        uint256 _recordId,
        uint256 _msgValue,
        address _signatory
    ) external returns (bool) {
        return _fulfill(_recordId, _msgValue, _signatory);
    }
}
