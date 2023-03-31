/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
 pragma solidity ^0.8.0;

import { ERC20 } from './ERC20.sol';

contract ERC20Premint is ERC20 {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSuply
    ) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, totalSuply);
    }
}
