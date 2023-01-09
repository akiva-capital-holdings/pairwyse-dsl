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
import { ERC20Token } from '../dsl/ERC20Token.sol';
import { IERC20 } from '../dsl/interfaces/IERC20.sol';

// import 'hardhat/console.sol';

// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract MultiTranche is Agreement {
    using UnstructuredStorage for bytes32;

    uint256 public deadline;
    address token;
    ERC20Token public wrappedUSDC1;

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
        token = _token;
        uint supply = 1e20;
        wrappedUSDC1 = new ERC20Token('WrappedUSDC1', 'USDC1', supply);
    }

    function mintWrappedUSDC(address spender) external {
        uint amount = ERC20Token(token).allowance(spender, address(this));
        wrappedUSDC1.transfer(spender, amount);
    }
}
