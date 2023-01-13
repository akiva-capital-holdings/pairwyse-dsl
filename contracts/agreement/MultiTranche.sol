// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

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

// import 'hardhat/console.sol';

contract MultiTranche is Agreement {
    using UnstructuredStorage for bytes32;

    uint256 public deadline;
    IERC20Mintable public wusdc; // WUSDC
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
        wusdc = new ERC20Mintable('Wrapped USDC', 'WUSDC');
        _setDefaultVariables();
    }

    /**
     * @dev Uploads 4 pre-defined records to Governance contract directly
     */
    function _setBaseRecords() internal {
        _setEnterRecord();
        _setDepositRecord();
        _setWithdrawRecord();
        _setClaimRecord();
    }

    function _setDefaultVariables() internal {
        // Set WUSDC variable
        setStorageAddress(
            0x1896092e00000000000000000000000000000000000000000000000000000000,
            address(wusdc)
        );
        // Set MULTI_TRANCHE variable
        setStorageAddress(
            0x0a371cf900000000000000000000000000000000000000000000000000000000,
            address(this)
        );
        // Set cUSDC variable
        address cUSDC = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
        setStorageAddress(
            0x48ebcbd300000000000000000000000000000000000000000000000000000000,
            cUSDC
        );
        // Set USDC variable
        address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        setStorageAddress(0xd6aca1be00000000000000000000000000000000000000000000000000000000, USDC);
        compounds[USDC] = cUSDC;

        // Set LOCK_TIME variable
        uint256 LOCK_TIME = 2 weeks;
        setStorageUint256(
            0x27533ff000000000000000000000000000000000000000000000000000000000,
            LOCK_TIME
        );

        // declare variable WUSDC_TOTAL = 0
        setStorageUint256(0x3593acaa00000000000000000000000000000000000000000000000000000000, 0);
    }

    /**
     * @dev Uploads 4 pre-defined records to Governance contract directly.
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
        string[] memory _conditionStrings;
        uint256[] memory _requiredRecords;
        if (_recordId == 4) {
            // if the user will try to claim his tokens, it is needed
            // to be sure that USDC_TOTAL and DEPOSIT_TIME were set
            // TODO: rewrite implementation?
            _conditionStrings = new string[](3);
            _conditionStrings[0] = _condition;
            _conditionStrings[1] = 'var USDC_TOTAL > 0 ';
            _conditionStrings[2] = 'var DEPOSIT_TIME > 0 ';
        } else {
            _conditionStrings = new string[](1);
            _conditionStrings[0] = _condition;
        }
        _signatories[0] = IProgramContext(contextProgram).ANYONE();

        update(_recordId, _requiredRecords, _signatories, _record, _conditionStrings);
    }

    function _setEnterRecord() internal {
        _setParameters(
            1, // record ID
            '(allowance USDC MSG_SENDER MULTI_TRANCHE) setUint256 ALLOWANCE '
            'transferFromVar USDC MSG_SENDER MULTI_TRANCHE ALLOWANCE '
            'mint WUSDC MSG_SENDER ALLOWANCE '
            '(var WUSDC_TOTAL + var ALLOWANCE) setUint256 WUSDC_TOTAL ', // transaction
            'blockTimestamp < var DEPOSITS_DEADLINE ' // condition
        );
    }

    /**
     * @dev To enter the MultiTranche contract:
     * 1. Understand how much USDC a user wants to deposit
     * 2. Transfer USDC from the user to the MultiTranche
     * 3. Mint WUSDC to the user's wallet in exchange for his/her USDC
     */
    function _setDepositRecord() internal {
        _setParameters(
            2, // record ID
            'compound deposit USDC '
            'blockTimestamp setUint256 DEPOSIT_TIME', // transaction
            'blockTimestamp < var DEPOSITS_DEADLINE' // condition
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
            'compound withdraw USDC '
            '(balanceOf USDC MULTI_TRANCHE) setUint256 USDC_TOTAL ', // transaction
            'blockTimestamp > (var DEPOSIT_TIME + var LOCK_TIME)' // condition
        );
    }

    /* 
    ERROR after adding

    'ifelse A B end '
    'A { (var WUSDC_TOTAL - var USER_AMOUNT) setUint256 WUSDC_TOTAL} '
    'B { 0 setUint256 WUSDC_TOTAL} '
*/
    function _setClaimRecord() internal {
        _setParameters(
            4, // record ID
            '(allowance WUSDC MSG_SENDER MULTI_TRANCHE) setUint256 W_ALLOWANCE '
            'burn WUSDC MSG_SENDER W_ALLOWANCE '
            '((((var W_ALLOWANCE * 10000) / var WUSDC_TOTAL) * var USDC_TOTAL)/ 10000) setUint256 USER_AMOUNT '
            'transferVar USDC MSG_SENDER USER_AMOUNT '
            'var WUSDC_TOTAL > var USER_AMOUNT '
            'ifelse A B end '
            'A { (var WUSDC_TOTAL - var USER_AMOUNT) setUint256 WUSDC_TOTAL} '
            'B { 0 setUint256 WUSDC_TOTAL} ', // transaction
            'blockTimestamp > (var DEPOSIT_TIME + var LOCK_TIME) ' // condition
        );
    }
}
