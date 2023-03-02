// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Compound's Maximillion Contract
 * @author Compound
 */
interface IMaximillion {
    /**
     * @notice msg.sender sends Ether to repay an account's borrow in the cEther market
     * @dev The provided Ether is applied towards the borrow balance, any excess is refunded
     * @param borrower The address of the borrower account to repay on behalf of
     */
    function repayBehalf(address borrower) external payable;
}
