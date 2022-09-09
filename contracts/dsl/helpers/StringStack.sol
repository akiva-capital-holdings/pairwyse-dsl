// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ErrorsStack } from '../libs/Errors.sol';

contract StringStack {
    string[] public stack;

    function length() external view returns (uint256) {
        return _length();
    }

    function seeLast() external view returns (string memory) {
        return _seeLast();
    }

    function push(string memory data) external {
        stack.push(data);
    }

    function pop() external returns (string memory) {
        string memory data = _seeLast();
        stack.pop();

        return data;
    }

    function clear() external {
        delete stack;
    }

    function _length() internal view returns (uint256) {
        return stack.length;
    }

    function _seeLast() internal view returns (string memory) {
        require(_length() > 0, ErrorsStack.STK4);
        return stack[_length() - 1];
    }
}
