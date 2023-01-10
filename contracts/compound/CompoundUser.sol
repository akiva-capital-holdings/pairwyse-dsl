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
    // underlying token (simple token) => cToken (compound address)
    mapping(address => address) public compounds;
    mapping(address => mapping(address => uint256)) public info; // user - token - amount cTokens

    /**
     * @dev Sets used tokens as underlying for cTokens
     */
    constructor() {
        // USDC
        address cAAVE = 0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c; // Compound Aave Token
        address AAVE = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9; // AAVE token
        address cUSDT = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9; // Compound USDT
        address USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7; // Tether USD
        compounds[AAVE] = cAAVE;
        compounds[USDT] = cUSDT;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @dev Supply chosen token into the market
     * @param _token the address of simple token that will be supply as asset
     * @param _amount the amount of the underlying asset to supply
     */
    function mint(address _token, uint256 _amount) external {
        require(_token != address(0), 'CompoundUser: token can not be zero address');
        require(_amount > 0, 'CompoundUser: amount should be more than 0');
        // transfer underlying asset to this smart contract
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        // approve simple token to use it into the market
        IERC20(_token).approve(compounds[_token], _amount);
        // get the last balance of cToken in the contract
        uint256 previosBalance = IcToken(compounds[_token]).balanceOf(address(this));
        // supply assets into the market and receives cTokens in exchange
        IcToken(compounds[_token]).mint(_amount);
        // get the current balance of cToken in the contract
        uint256 currentBalance = IcToken(compounds[_token]).balanceOf(address(this)) -
            previosBalance;
        require(currentBalance > 0, 'CompoundUser: amount of cTokens should be more than 0');
        // increasse the amount of cTokens for the certain user
        info[msg.sender][_token] += currentBalance;
    }

    /**
     * @dev Sender redeems all his cTokens in exchange for the underlying asset
     * @param _token the address of simple token that will be supply as asset
     */
    function redeem(address _token) external {
        require(_token != address(0), 'CompoundUser: token can not be zero address');
        require(
            info[msg.sender][_token] > 0,
            'CompoundUser: the user has not supplied the token yet'
        );
        // redeems cTokens in exchange for the underlying asset
        IcToken(compounds[_token]).redeem(info[msg.sender][_token]);
        // thansfer all assets to the user
        IERC20(_token).transfer(msg.sender, IERC20(_token).balanceOf(address(this)));
        // no cTokens stores for the user anymore
        info[msg.sender][_token] = 0;
    }
}
