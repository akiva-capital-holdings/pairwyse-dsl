// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IcTokenBase } from './IcTokenBase.sol';

/**
 * @dev Interface of the cToken that defined as asset in https://v2-app.compound.finance/
 */
interface IcToken is IcTokenBase {
    /**
     * @notice Sender supplies assets into the market and receives cTokens in exchange
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param mintAmount The amount of the underlying asset to supply
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function mint(uint256 mintAmount) external returns (uint);
}
