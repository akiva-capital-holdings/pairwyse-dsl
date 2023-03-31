/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { ErrorsStack } from '../libs/Errors.sol';

contract Stack {
    uint256[] public stack;

    function length() external view returns (uint256) {
        return _length();
    }

    function seeLast() external view returns (uint256) {
        return _seeLast();
    }

    function push(uint256 data) external {
        stack.push(data);
    }

    function pop() external returns (uint256) {
        uint256 data = _seeLast();
        stack.pop();

        return data;
    }

    function clear() external {
        delete stack;
    }

    function _length() internal view returns (uint256) {
        return stack.length;
    }

    function _seeLast() internal view returns (uint256) {
        require(_length() > 0, ErrorsStack.STK4);
        return stack[_length() - 1];
    }
}
