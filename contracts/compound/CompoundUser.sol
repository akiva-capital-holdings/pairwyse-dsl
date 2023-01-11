// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from '../dsl/interfaces/IERC20.sol';
import { IcToken } from './interfaces/IcToken.sol';

/**
 * @dev The contract that integrates with compounds and stores cTokens
 * check https://v2-app.compound.finance/ for more information
 * Note: Ethereum network
 */
contract CompoundUser {
    address public cUSDC = 0x39AA39c021dfbaE8faC545936693aC917d5E7563; // Compound USDC Token
    address public USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    mapping(address => uint256) public info; // user - amount cTokens

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @dev Supply chosen token into the market
     * @param _amount the amount of the underlying asset to supply
     */
    function mint(uint256 _amount) external {
        require(_amount > 0, 'CompoundUser: amount should be more than 0');
        // transfer underlying asset to this smart contract
        IERC20(USDC).transferFrom(msg.sender, address(this), _amount);
        // approve simple token to use it into the market
        IERC20(USDC).approve(cUSDC, _amount);
        // get the last balance of cToken in the contract
        uint256 previosBalance = IcToken(cUSDC).balanceOf(address(this));
        // supply assets into the market and receives cTokens in exchange
        IcToken(cUSDC).mint(_amount);
        // get the current balance of cToken in the contract
        uint256 currentBalance = IcToken(cUSDC).balanceOf(address(this)) - previosBalance;
        // increasse the amount of cTokens for the certain user
        info[msg.sender] += currentBalance;
    }

    /**
     * @dev Sender redeems all his cTokens in exchange for the underlying asset
     */
    function redeem() external {
        require(info[msg.sender] > 0, 'CompoundUser: the user has not supplied the USDC yet');
        // redeems cTokens in exchange for the underlying asset
        IcToken(cUSDC).redeem(info[msg.sender]);
        // thansfer all assets to the user
        IERC20(USDC).transfer(msg.sender, IERC20(USDC).balanceOf(address(this)));
        // no cTokens stores for the user anymore
        info[msg.sender] = 0;
    }
}
