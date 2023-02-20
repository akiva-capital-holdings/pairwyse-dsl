// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ERC20 } from './ERC20.sol';

contract ERC20PremintDecimals is ERC20 {
    uint8 internal _decimals;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSuply,
        uint8 decimals_
    ) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, totalSuply);
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
