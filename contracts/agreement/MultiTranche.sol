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
    IERC20Mintable public wcusdc; // WcUSDC

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
        wcusdc = new ERC20Mintable('Wrapped cUSDC', 'WcUSDC');
        _setDefaultVariables();
    }

    /**
     * @dev Uploads 4 pre-defined records to Governance contract directly
     */
    function _setBaseRecords() internal {
        _setDepositRecord();
        _setWithdrawRecord();
    }

    function _setDefaultVariables() internal {
        // Set WcUSDC variable
        setStorageAddress(
            0x7188be9000000000000000000000000000000000000000000000000000000000,
            address(wcusdc)
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
        string memory _condition // uint256 _requiredRecordsLength
    ) internal {
        address[] memory _signatories = new address[](1);
        string[] memory _conditionStrings = new string[](1);
        uint256[] memory _requiredRecords;

        _signatories[0] = IProgramContext(contextProgram).ANYONE();
        _conditionStrings[0] = _condition;
        update(_recordId, _requiredRecords, _signatories, _record, _conditionStrings);
    }

    /**
     * @dev To enter the MultiTranche contract:
     * 1. Understand how much USDC a user wants to deposit
     * 2. Transfer USDC from the user to the MultiTranche
     * 3. Mint WUSDC to the user's wallet in exchange for his/her USDC
     */
    function _setDepositRecord() internal {
        _setParameters(
            1, // record ID
            '(allowance USDC MSG_SENDER MULTI_TRANCHE) setUint256 ALLOWANCE '
            'transferFromVar USDC MSG_SENDER MULTI_TRANCHE ALLOWANCE '
            'compound deposit USDC ALLOWANCE '
            'mint WcUSDC MSG_SENDER cUSDC_BALANCE '
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
            2, // record ID
            '(allowance WcUSDC MSG_SENDER MULTI_TRANCHE) setUint256 W_ALLOWANCE '
            'compound withdraw USDC W_ALLOWANCE '
            'burn WcUSDC MSG_SENDER W_ALLOWANCE '
            '(balanceOf USDC MULTI_TRANCHE) setUint256 USDC_TOTAL '
            'transferVar USDC MSG_SENDER USDC_TOTAL ', // transaction
            'blockTimestamp > (var DEPOSIT_TIME + var LOCK_TIME)' // condition
        );
    }
}
