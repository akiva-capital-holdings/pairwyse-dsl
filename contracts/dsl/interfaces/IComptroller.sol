// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IcToken } from './IcToken.sol';

/**
 * @dev Base Interface of the Comptroller
 *
 *  Proxy:
 *  https://github.com/compound-finance/compound-protocol/blob/master/contracts/Unitroller.sol
 *
 * 	Comptroller:
 *	https://github.com/compound-finance/compound-protocol/blob/master/contracts/Comptroller.sol
 *  goerli 0x05Df6C772A563FfB37fD3E04C1A279Fb30228621
 */
interface IComptroller {
    function markets(address) external returns (bool, uint256);

    function checkMembership(address account, IcToken cToken) external view returns (bool);

    function enterMarkets(address[] calldata) external returns (uint256[] memory);

    function getAccountLiquidity(address) external view returns (uint256, uint256, uint256);
}
