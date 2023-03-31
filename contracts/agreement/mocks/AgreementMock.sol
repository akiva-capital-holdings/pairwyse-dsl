pragma solidity ^0.8.0;

/**
 * (c) 2023 Akiva Capital Holdings, LLC.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */

import { Agreement } from '../Agreement.sol';

contract AgreementMock is Agreement {
    constructor(
        address _parser,
        address _ownerAddr,
        address _contextDSL
    ) Agreement(_parser, _ownerAddr, _contextDSL) {}

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

    function addRecordTransaction(uint256 _recordId, string memory _recordString) public {
        _addRecordTransaction(_recordId, _recordString);
    }

    function fulfill(
        uint256 _recordId,
        uint256 _msgValue,
        address _signatory
    ) external returns (bool) {
        return _fulfill(_recordId, _msgValue, _signatory);
    }
}
