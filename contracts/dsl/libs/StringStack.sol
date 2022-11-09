// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ErrorsStack } from '../libs/Errors.sol';
import { StringUtils } from './StringUtils.sol';

// TODO: add tests for this file
library StringStack {
    using StringUtils for string;

    /**
     * @dev Push element to array in the first position
     * @dev As the array has fixed size, we drop the last element when addind a new one to the beginning of the array
     */
    function pushToStack(string[] memory _stack, string memory _element)
        external
        pure
        returns (string[] memory)
    {
        // console.log('push to stack');
        _stack[stackLength(_stack)] = _element;
        return _stack;
    }

    function popFromStack(string[] memory _stack)
        external
        pure
        returns (string[] memory, string memory)
    {
        // console.log('pop from stack');
        string memory _topElement = seeLastInStack(_stack);
        _stack[stackLength(_stack) - 1] = '';
        return (_stack, _topElement);
    }

    function stackLength(string[] memory _stack) public pure returns (uint256) {
        // console.log('stackLength');
        uint256 i;
        while (!_stack[i].equal('')) {
            i++;
        }
        return i;
    }

    function seeLastInStack(string[] memory _stack) public pure returns (string memory) {
        // console.log('last in stack is:', _stack[stackLength(_stack) - 1]);
        uint256 _len = stackLength(_stack);
        require(_len > 0, ErrorsStack.STK4);
        return _stack[_len - 1];
    }
}
