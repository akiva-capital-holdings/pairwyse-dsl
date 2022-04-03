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

    function canGetSymbol(uint256 _index, string memory _program) public returns(bool) {
        try _program.char(_index) {
            return true;
        } catch Error(string memory) {
            return false;
        }
    }

    function split(string memory _program) public returns (string[] memory) {
        delete result;
        string memory buffer;
        
        for (uint256 i = 0; i < _program.length(); i++) {
            string memory char = _program.char(i);
            string memory nextChar;
            string memory nextChar2;
            // if-else conditions parsing
            if (char.equal('{')) continue;
            if (char.equal('}')) {
                result.push('end');
                continue;
            }

            if (char.equal('\n')) {
                result.push(char);
                continue;
            }

            /*
            1. //smth
            2. smth//
            3. smth//smth 123
            4. smth//smth\n123
            */

            if(canGetSymbol(i+1, _program) && canGetSymbol(i+2, _program)) {
                nextChar = _program.char(i+1);
                nextChar2 = _program.char(i+2);
                if (nextChar.equal('/') && nextChar2.equal('/')) {
                    if (buffer.length() > 0) {
                        if(nextChar.equal(' ')) {
                            buffer = buffer.concat(char);
                        }
                        result.push(buffer);
                        buffer = '';
                        result.push('//');
                        continue;
                    }
                    // result.push('//');
                }
            }
            if (char.equal('/') && canGetSymbol(i+1, _program)) {
                nextChar = _program.char(i+1);
                if (nextChar.equal('/') || nextChar.equal(' ')) {
                    if (buffer.length() > 0) {        
                        result.push(buffer);
                        buffer = '';
                        continue;
                    }
                }
            }

            // console.log("char: %s", char);
            if (char.equal(' ') || char.equal('(') || char.equal(')')) {
                if (buffer.length() > 0) {
                    result.push(buffer);
                    buffer = '';
                }
                // TODO: looks like it needs to remove the double check here
                
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
        console.log("", chunk);
        uint256 i = 0;

        while(i < _code.length) {
            chunk = _code[i];
            // console.log(chunk);
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
        string memory _endSymbol) internal returns (uint256) {

        string memory chunk;
        for (uint256 indexEnd = _indexStart; indexEnd < _code.length; indexEnd++) {
            chunk = _code[indexEnd];
            console.log(chunk);
            if(chunk.equal(_endSymbol)) {
                return indexEnd;
            }
        }
        return _code.length-1;
    }
}
