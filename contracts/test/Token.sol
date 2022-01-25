// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ERC20.sol";

contract Token is ERC20 {
    constructor(uint256 totalSupply) ERC20("Token", "TKN") {
        _mint(msg.sender, totalSupply);
    }
}
