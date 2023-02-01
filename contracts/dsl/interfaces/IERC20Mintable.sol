// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

import { IERC20 } from './IERC20.sol';

/**
 * @dev Interface of ERC20 token with `mint` and `burn` functions
 */
interface IERC20Mintable is IERC20 {
    function mint(address _to, uint256 _amount) external;

    function burn(address _to, uint256 _amount) external;
}
