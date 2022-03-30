// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';

import "hardhat/console.sol";

contract Preprocessor {
    using StringUtils for string;

    string[] internal result;

    function transform(IContext _ctx, string memory _program) external returns (string[] memory) {
        Stack stack = new Stack();
        string[] memory code = split(_program);
        return infixToPostfix(_ctx, code, stack);
    }

    function split(string memory _program) public returns (string[] memory) {
        delete result;
        string memory buffer;

        // console.log("program len: %s", program.length());
        for (uint256 i = 0; i < _program.length(); i++) {
            string memory char = _program.char(i);

            // if-else conditions parsing
            if (char.equal('{')) continue;
            if (char.equal('}')) {
                result.push('end');
                continue;
            }

            // console.log("char: %s", char);
            if (char.equal('\n') || char.equal(' ') || char.equal('(') || char.equal(')')) {
                if (buffer.length() > 0) {
                    result.push(buffer);
                    buffer = '';
                }
                // TODO: looks like it needs to remove the double check here
                if (char.equal('\n')) {
                    result.push(char);
                }
            } else {
                buffer = buffer.concat(char);
            }

            if (char.equal('(') || char.equal(')')) {
                result.push(char);
            }
        }

        if (buffer.length() > 0) {
            result.push(buffer);
            buffer = '';
        }

        return result;
    }

    function infixToPostfix(
        IContext _ctx,
        string[] memory _code,
        Stack _stack
    ) public returns (string[] memory) {
        delete result;
        string memory chunk;
        // console.log("\n\n", chunk);
        uint256 i = 0;

        while(i < _code.length) {
            chunk = _code[i];

            if(chunk.equal('/*')) {
                i = _findEndSymbol(i, _code, '*/');
                i += 1;
                continue;
            } else if(chunk.equal('//')) {
                i = _findEndSymbol(i, _code, '\n');
                i += 1;
                continue;
            } else if(chunk.equal('\n')) {
                i += 1;
                continue;
            }

            if (isOperator(_ctx, chunk)) {
                // console.log("%s is an operator", chunk);
                while (
                    _stack.length() > 0 &&
                    _ctx.opsPriors(chunk) <= _ctx.opsPriors(_stack.seeLast().getString())
                ) {
                    // console.log("result push:", _stack.seeLast().getString());
                    result.push(_stack.pop().getString());
                }
                pushStringToStack(_stack, chunk);
            } else if (chunk.equal('(')) {
                pushStringToStack(_stack, chunk);
            } else if (chunk.equal(')')) {
                while (!_stack.seeLast().getString().equal('(')) {
                    // console.log("result push: %s", _stack.seeLast().getString());
                    result.push(_stack.pop().getString());
                }
                _stack.pop(); // remove '(' that is left
            } else {
                // operand found
                // console.log("result push: %s", chunk);
                result.push(chunk);
            }

            i += 1;
        }

        while (_stack.length() > 0) {
            // console.log("result push: %s", _stack.seeLast().getString());
            result.push(_stack.pop().getString());
        }

        return result;
    }

    function pushStringToStack(Stack stack_, string memory value) internal {
        StackValue stackValue = new StackValue();
        stackValue.setString(value);
        stack_.push(stackValue);
    }

    function isOperator(IContext _ctx, string memory op) internal view returns (bool) {
        for (uint256 i = 0; i < _ctx.operatorsLen(); i++) {
            if (op.equal(_ctx.operators(i))) return true;
        }
        return false;
    }

    /**
    *  Returns the index of the symbol or
    *  the index of the last symbol of the program
    */
    function _findEndSymbol(
        uint256 _indexStart,
        string[] memory _code,
        string memory _endSymbol) internal pure returns (uint256) {

        string memory chunk;
        for (uint256 indexEnd = _indexStart; indexEnd < _code.length; indexEnd++) {
            chunk = _code[indexEnd];
            if(chunk.equal(_endSymbol)) {
                return indexEnd;
            }
        }
        return _code.length-1;
    }
}
