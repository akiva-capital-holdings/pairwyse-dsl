// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IcTokenBase } from './IcTokenBase.sol';

/**
 * @dev Interface of the cToken that defined as asset in https://v2-app.compound.finance/
 * check if here https://etherscan.io/address/0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5#readContract
 */
interface IcTokenNative is IcTokenBase {
    /**
     * @notice Sender supplies assets into the market and receives cTokens in exchange
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     */
    function mint() external payable;
}
