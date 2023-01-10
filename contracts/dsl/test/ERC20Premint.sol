// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ERC20 } from './ERC20.sol';

contract ERC20Token is ERC20 {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSuply
    ) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, totalSuply);
    }
}
