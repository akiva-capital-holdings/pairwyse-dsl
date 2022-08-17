// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ErrorsStack } from '../libs/Errors.sol';
import { StackValue } from './StackValue.sol';

contract Stack {
    StackValue[] public stack;

    function length() external view returns (uint256) {
        return _length();
    }

    function seeLast() external view returns (StackValue) {
        return _seeLast();
    }

    function push(StackValue data) external {
        stack.push(data);
    }

    function pop() external returns (StackValue) {
        StackValue data = _seeLast();
        stack.pop();

        return data;
    }

    function clear() external {
        delete stack;
    }

    function _length() internal view returns (uint256) {
        return stack.length;
    }

    function _seeLast() internal view returns (StackValue) {
        require(_length() > 0, ErrorsStack.STK4);
        return stack[_length() - 1];
    }
}
