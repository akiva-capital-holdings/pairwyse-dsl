/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { ErrorsStack } from '../libs/Errors.sol';
import { StringUtils } from './StringUtils.sol';

// TODO: add tests for this file
/**
 * @dev This library has all the functions to use solidity string array as a struct
 */
library StringStack {
    using StringUtils for string;

    /**
     * @dev Push element to array in the first position
     * As the array has fixed size, we drop the last element
     * when addind a new one to the beginning of the array
     * @param _stack String stack
     * @param _element String to be added to the stack
     * @return Modified stack
     */
    function pushToStack(
        string[] memory _stack,
        string memory _element
    ) external pure returns (string[] memory) {
        _stack[stackLength(_stack)] = _element;
        return _stack;
    }

    function popFromStack(
        string[] memory _stack
    ) external pure returns (string[] memory, string memory) {
        string memory _topElement = seeLastInStack(_stack);
        _stack[stackLength(_stack) - 1] = '';
        return (_stack, _topElement);
    }

    function stackLength(string[] memory _stack) public pure returns (uint256) {
        uint256 i;
        while (!_stack[i].equal('')) {
            i++;
        }
        return i;
    }

    function seeLastInStack(string[] memory _stack) public pure returns (string memory) {
        uint256 _len = stackLength(_stack);
        require(_len > 0, ErrorsStack.STK4);
        return _stack[_len - 1];
    }
}
