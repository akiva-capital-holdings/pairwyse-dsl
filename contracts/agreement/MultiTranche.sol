// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * (c) 2023 Akiva Capital Holdings, LLC.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
import { IParser } from '../dsl/interfaces/IParser.sol';
import { IProgramContext } from '../dsl/interfaces/IProgramContext.sol';
import { IERC20Mintable } from '../dsl/interfaces/IERC20Mintable.sol';
import { ProgramContext } from '../dsl/ProgramContext.sol';
import { ErrorsAgreement, ErrorsGovernance } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';
import { ERC20Mintable } from '../dsl/helpers/ERC20Mintable.sol';
import { Agreement } from '../agreement/Agreement.sol';

/**
 * This is a type of Agreement designed to perform a Nivaura Demo Phase II
 * https://docs.google.com/document/d/1wwEOXKa0cmmS0jM0p9q9rkltvEPmSuK3PuwPK-tapcs/edit
 */
contract MultiTranche is Agreement {
    using UnstructuredStorage for bytes32;

    uint256 public deadline;
    IERC20Mintable public WUSDC; // WUSDC
    mapping(address => address) public compounds; // token => cToken

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(
        address _parser,
        address _ownerAddr,
        address _dslContext
    ) Agreement(_parser, _ownerAddr, _dslContext) {
        _setBaseRecords();
        WUSDC = new ERC20Mintable('Wrapped USDC', 'WUSDC', 6);
        _setDefaultVariables();
    }

    /**
     * @dev Uploads pre-defined records to Governance contract directly
     */
    function _setBaseRecords() internal {
        _setEnterRecord();
        _setDepositRecord();
        _setWithdrawRecord();
    }

    function _setDefaultVariables() internal {
        // Set WUSDC variable
        setStorageAddress(
            0x1896092e00000000000000000000000000000000000000000000000000000000,
            address(WUSDC)
        );
        // Set MULTI_TRANCHE variable
        setStorageAddress(
            0x0a371cf900000000000000000000000000000000000000000000000000000000,
            address(this)
        );
        // Set cUSDC variable
        address CUSDC_ADDR = 0x73506770799Eb04befb5AaE4734e58C2C624F493;
        setStorageAddress(
            0x48ebcbd300000000000000000000000000000000000000000000000000000000,
            CUSDC_ADDR
        );
        // Set USDC variable
        address USDC_ADDR = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;
        setStorageAddress(
            0xd6aca1be00000000000000000000000000000000000000000000000000000000,
            USDC_ADDR
        );
        compounds[USDC_ADDR] = CUSDC_ADDR;

        // TODO: restrict setting DEPOSIT_TIME variable by the user
        // TODO: check that user's cannot modify the DEPOSITS_DEADLINE and LOCK_TIME variables (if they're set)
        // TODO: if DEPOSITS_DEADLINE and LOCK_TIME variable aren't set - don't activate the MultiTranche
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

    /**
     * @dev If DEPOSITS_DEADLINE hasn't passed, then to enter the MultiTranche contract:
     * 1. Understand how much USDC a user wants to deposit
     * 2. Transfer USDC from the user to the MultiTranche
     * 3. Mint WUSDC to the user's wallet in exchange for his/her USDC
     */
    function _setEnterRecord() internal {
        _setParameters(
            1, // record ID
            '(allowance USDC MSG_SENDER MULTI_TRANCHE) setUint256 ALLOWANCE \n'
            'transferFromVar USDC MSG_SENDER MULTI_TRANCHE ALLOWANCE \n'
            'mint WUSDC MSG_SENDER ALLOWANCE', // transaction
            'blockTimestamp < var DEPOSITS_DEADLINE' // condition
        );
    }

    /**
     * @dev If DEPOSITS_DEADLINE is passed to deposit USDC to MultiTranche:
     * 1. Deposit all collected on MultiTranche USDC to Compound.
     *    As a result MultiTranche receives cUSDC tokens from Compound
     * 2. Remember the deposit time in DEPOSIT_TIME variable
     */
    function _setDepositRecord() internal {
        _setParameters(
            2, // record ID
            'compound deposit all USDC \n'
            'blockTimestamp setUint256 DEPOSIT_TIME', // transaction
            'blockTimestamp > var DEPOSITS_DEADLINE' // condition
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
            '(allowance WUSDC MSG_SENDER MULTI_TRANCHE) setUint256 W_ALLOWANCE \n'
            'burn WUSDC MSG_SENDER W_ALLOWANCE \n'
            'compound withdraw W_ALLOWANCE USDC \n'
            '(W_ALLOWANCE - 1) setUint256 OUT_USDC \n'
            'transferVar USDC MSG_SENDER OUT_USDC', // transaction
            'blockTimestamp > (var DEPOSIT_TIME + var LOCK_TIME)' // condition
        );
    }
}
