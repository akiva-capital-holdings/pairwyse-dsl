// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ERC20 } from './ERC20.sol';
import { IERC20Mintable } from '../interfaces/IERC20Mintable.sol';

contract ERC20Mintable is ERC20, IERC20Mintable {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function burn(address _to, uint256 _amount) external {
        _burn(_to, _amount);
    }
}
