/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { ERC20 } from './ERC20.sol';
import { IERC20 } from '../interfaces/IERC20.sol';
import { IERC20Mintable } from '../interfaces/IERC20Mintable.sol';

contract ERC20Mintable is ERC20, IERC20Mintable {
    uint8 internal decimals_;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) ERC20(_name, _symbol) {
        decimals_ = _decimals;
    }

    function decimals() public view override(ERC20, IERC20) returns (uint8) {
        return decimals_;
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function burn(address _to, uint256 _amount) external {
        _burn(_to, _amount);
    }
}
