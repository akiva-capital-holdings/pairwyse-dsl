// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../../dsl/interfaces/IParser.sol';
import { IProgramContext } from '../../dsl/interfaces/IProgramContext.sol';
import { IERC20Mintable } from '../../dsl/interfaces/IERC20Mintable.sol';
import { ProgramContext } from '../../dsl/ProgramContext.sol';
import { ErrorsAgreement, ErrorsGovernance } from '../../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../../dsl/libs/UnstructuredStorage.sol';
import { Executor } from '../../dsl/libs/Executor.sol';
import { StringUtils } from '../../dsl/libs/StringUtils.sol';
import { ERC20Mintable } from '../../dsl/helpers/ERC20Mintable.sol';
import { Agreement } from '../../agreement/Agreement.sol';

/**
 * This is a type of Agreement designed to perform a Nivaura Demo Phase II
 * https://docs.google.com/document/d/1wwEOXKa0cmmS0jM0p9q9rkltvEPmSuK3PuwPK-tapcs/edit
 */
contract CompoundBorrowing is Agreement {
    // Variables:
    // THIS_CONTRACT
    // STEP_0
    // STEP_1
    // STEP_2
    // STEP_3
    // STEP_4

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(
        address _parser,
        address _ownerAddr,
        address _dslContext,
        uint256 step0Dea
    ) Agreement(_parser, _ownerAddr, _dslContext) {
        _setBaseRecords();
        _setDefaultVariables();
    }

    function _setDefaultVariables() internal {
        // Set THIS_CONTRACT variable
        setStorageAddress(
            0x15a63e7600000000000000000000000000000000000000000000000000000000,
            address(this)
        );
    }

    /**
     * @dev Uploads pre-defined records to MultiTranche contract directly.
     * Uses a simple condition string `bool true`.
     * Records still have to be parsed using a preprocessor before execution. Such record becomes
     * non-upgradable. Check `isUpgradableRecord` modifier
     * @param _recordId is the record ID
     * @param _record is a string of the main record for execution
     * @param _condition is a string of the condition that will be checked before record execution
     */
    function _setParameters(
        uint256 _recordId,
        string memory _record,
        string memory _condition
    ) internal {
        address[] memory _signatories = new address[](1);
        string[] memory _conditionStrings = new string[](1);
        uint256[] memory _requiredRecords;
        _conditionStrings[0] = _condition;
        _signatories[0] = IProgramContext(contextProgram).ANYONE();

        update(_recordId, _requiredRecords, _signatories, _record, _conditionStrings);
    }

    function _setBaseRecords() internal {
        // 1. Supply ETH
        _setParameters(
            1, // record ID
            'compound depositETH msgValue ', // transaction
            'bool true'
            // 'blockTimestamp > var STEP_0' // condition
        );

        // 2. Enable ETH as a collateral
        _setParameters(
            2, // record ID
            'compound enableCollateral ETH ', // transaction
            'bool true'
            // 'blockTimestamp > var STEP_1' // condition
        );

        // 3. Borrow USDC at 80% of allowance
        _setParameters(
            3, // record ID
            'compound borrow all USDC ', // transaction
            'bool true'
            // 'blockTimestamp > var STEP_2' // condition
        );

        // 4. Pay back borrowed USDC
        _setParameters(
            4, // record ID
            'compound repay all USDC ', // transaction
            'bool true'
            // 'blockTimestamp > var STEP_3' // condition
        );

        // 5. Withdraw ETH (collateral)
        _setParameters(
            5, // record ID
            'compound withdraw all ETH msgSender', // transaction
            'bool true'
            // 'blockTimestamp > var STEP_4' // condition
        );
    }
}
