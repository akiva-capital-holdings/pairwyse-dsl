// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';

// import "hardhat/console.sol";

contract Preprocessor {
    using StringUtils for string;

    string[] internal result;

    function transform(IContext _ctx, string memory _program) external returns (string[] memory) {
        Stack stack = new Stack();
        string[] memory code = split(_program);
        return infixToPostfix(_ctx, code, stack);
    }

    /*
    * Returns if the symbol exists by the index
    */
    function canGetSymbol(uint256 _index, string memory _program) public returns(bool) {
        try _program.char(_index) {
            return true;
        } catch Error(string memory) {
            return false;
        }
    }

    function split(string memory _program) public returns (string[] memory) {
        delete result;
        // a flag for checking if the part of a string is a comment
        bool isCommented;
        // a flag that uses for searching a correct end symbol
        uint256 searchedSymbolLen;
        uint256 i;
        string memory buffer;
        string memory nextChar;
        
        while(i < _program.length()) {
            string memory char = _program.char(i);
            string memory nextChar;
            // if-else conditions parsing
            if (char.equal('{')) {
                i += 1;
                continue;
            }
            if (char.equal('}')) {
                result.push('end');
                i += 1;
                continue;
            }

            if(!isCommented) {
                if(canGetSymbol(i+1, _program)) { 
                    nextChar = _program.char(i+1);
                    if(char.equal('/') && nextChar.equal('/')) {
                        searchedSymbolLen = 1;
                        isCommented = true; // the comment string is appeared
                        // change index to the next no-comment symbol
                        // avoiding an additional iteration
                        i += 2;
                        continue;
                    } else if(char.equal('/') && nextChar.equal('*')) {
                        searchedSymbolLen = 2;
                        isCommented = true;
                        i += 2;
                        continue;
                    }
                }
            } else if(isCommented) {
                if(searchedSymbolLen == 1) {
                    if(char.equal('\n')) {
                        i += 1;
                        isCommented = false;
                        continue;
                    }
                } else if(char.equal('*')) {
                    if(canGetSymbol(i+1, _program)) {
                        nextChar = _program.char(i+1);
                        if(nextChar.equal('/')) {
                            i += 2;
                            isCommented = false;
                            continue;
                        }
                    }
                }
                i += 1;
                continue;
            }

            // console.log("char: %s", char);
            if (char.equal(' ') || char.equal('\n') || char.equal('(') || char.equal(')')) {
                if (buffer.length() > 0) {
                    result.push(buffer);
                    buffer = '';
                }
                
            } else {
                buffer = buffer.concat(char);
            }

            if (char.equal('(') || char.equal(')')) {
                result.push(char);
            }

            i += 1;
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
    
        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];

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
}
