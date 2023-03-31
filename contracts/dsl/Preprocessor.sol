/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { IDSLContext } from './interfaces/IDSLContext.sol';
import { IPreprocessor } from './interfaces/IPreprocessor.sol';
import { StringStack } from './libs/StringStack.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ErrorsPreprocessor } from './libs/Errors.sol';

/**
 * @dev Preprocessor of DSL code
 * @dev This contract is a singleton and should not be deployed more than once
 *
 * It can remove comments that were created by user in the DSL code string. It
 * transforms the users DSL code string to the list of commands that can be used
 * in a Parser contract.
 *
 * DSL code in postfix notation as
 * user's string code -> Preprocessor -> each command is separated in the commands list
 */
library Preprocessor {
    using StringUtils for string;
    using StringStack for string[];

    /************************
     * == MAIN FUNCTIONS == *
     ***********************/

    /**
     * @dev The main function that transforms the user's DSL code string to the list of commands.
     *
     * Example:
     * The user's DSL code string is
     * ```
     * uint256 6 setUint256 A
     * ```
     * The end result after executing a `transform()` function is
     * ```
     * ['uint256', '6', 'setUint256', 'A']
     * ```
     *
     * @param _ctxAddr is a context contract address
     * @param _program is a user's DSL code string
     * @return code The list of commands that storing `result`
     */
    function transform(
        address _ctxAddr,
        string memory _program
    ) external view returns (string[] memory code) {
        // _program = removeComments(_program);
        code = split(_program, '\n ,:(){}', '(){}');
        code = removeSyntacticSugar(code);
        code = simplifyCode(code, _ctxAddr);
        code = infixToPostfix(_ctxAddr, code);
        return code;
    }

    /**
     * @dev Searches the comments in the program and removes comment lines
     * Example:
     * The user's DSL code string is
     * ```
     *  bool true
     *  // uint256 2 * uint256 5
     * ```
     * The end result after executing a `removeComments()` function is
     * ```
     * bool true
     * ```
     * @param _program is a current program string
     * @return _cleanedProgram new string program that contains only clean code without comments
     */
    function removeComments(
        string memory _program
    ) public pure returns (string memory _cleanedProgram) {
        bool isCommented;

        // searchedSymbolLen is a flag that uses for searching a correct end symbol
        uint256 searchedSymbolLen; // 1 - search \n symbol, 2 - search */ symbol
        uint256 tempIndex; // uses for checking if the index was changed
        uint256 i;
        string memory char;

        while (i < _program.length()) {
            char = _program.char(i);
            tempIndex = i;
            if (isCommented) {
                (tempIndex, isCommented) = _getEndCommentSymbol(
                    searchedSymbolLen,
                    i,
                    _program,
                    char
                );
            } else {
                (searchedSymbolLen, tempIndex, isCommented) = _getCommentSymbol(i, _program, char);
            }

            if (tempIndex > i) {
                i = tempIndex;
                continue;
            }

            if (isCommented) {
                i += 1;
                continue;
            }

            _cleanedProgram = _cleanedProgram.concat(char);
            i += 1;
        }
    }

    /**
     * @dev Splits the user's DSL code string to the list of commands
     * avoiding several symbols:
     * - removes additional and useless symbols as ' ', `\\n`
     * - defines and adding help 'end' symbol for the ifelse condition
     * - defines and cleans the code from `{` and `}` symbols
     *
     * Example:
     * The user's DSL code string is
     * ```
     * (var TIMESTAMP > var INIT)
     * ```
     * The end result after executing a `split()` function is
     * ```
     * ['var', 'TIMESTAMP', '>', 'var', 'INIT']
     * ```
     *
     * @param _program is a user's DSL code string
     * @param _separators Separators that will be used to split the string
     * @param _separatorsToKeep we're using symbols from this string as separators but not removing
     *                          them from the resulting array
     * @return The list of commands that storing in `result`
     */
    function split(
        string memory _program,
        string memory _separators,
        string memory _separatorsToKeep
    ) public pure returns (string[] memory) {
        string[] memory _result = new string[](50);
        uint256 resultCtr;
        string memory buffer; // here we collect DSL commands, var names, etc. symbol by symbol
        string memory char;

        for (uint256 i = 0; i < _program.length(); i++) {
            char = _program.char(i);

            if (char.isIn(_separators)) {
                if (buffer.length() > 0) {
                    _result[resultCtr++] = buffer;
                    buffer = '';
                }
            } else {
                buffer = buffer.concat(char);
            }

            if (char.isIn(_separatorsToKeep)) {
                _result[resultCtr++] = char;
            }
        }

        if (buffer.length() > 0) {
            _result[resultCtr++] = buffer;
            buffer = '';
        }

        return _result;
    }

    /**
     * @dev Removes scientific notation from numbers and removes currency symbols
     * Example
     * 1e3 = 1,000
     * 1 GWEI = 1,000,000,000
     * 1 ETH = 1,000,000,000,000,000,000
     * @param _code Array of DSL commands
     * @return Code without syntactic sugar
     */
    function removeSyntacticSugar(string[] memory _code) public pure returns (string[] memory) {
        string[] memory _result = new string[](50);
        uint256 _resultCtr;
        string memory _chunk;
        string memory _prevChunk;
        uint256 i;

        while (i < _nonEmptyArrLen(_code)) {
            _prevChunk = i == 0 ? '' : _code[i - 1];
            _chunk = _code[i++];

            _chunk = _checkScientificNotation(_chunk);
            if (_isCurrencySymbol(_chunk)) {
                (_resultCtr, _chunk) = _processCurrencySymbol(_resultCtr, _chunk, _prevChunk);
            }

            _result[_resultCtr++] = _chunk;
        }
        return _result;
    }

    /**
     * @dev Depending on the type of the command it gets simplified
     * @param _code Array of DSL commands
     * @param _ctxAddr Context contract address
     * @return Simplified code
     */
    function simplifyCode(
        string[] memory _code,
        address _ctxAddr
    ) public view returns (string[] memory) {
        string[] memory _result = new string[](50);
        uint256 _resultCtr;
        string memory _chunk;
        string memory _prevChunk;
        uint256 i;

        while (i < _nonEmptyArrLen(_code)) {
            _prevChunk = i == 0 ? '' : _code[i - 1];
            _chunk = _code[i++];

            if (IDSLContext(_ctxAddr).isCommand(_chunk)) {
                (_result, _resultCtr, i) = _processCommand(_result, _resultCtr, _code, i, _ctxAddr);
            } else if (_isCurlyBracket(_chunk)) {
                (_result, _resultCtr) = _processCurlyBracket(_result, _resultCtr, _chunk);
            } else if (_isAlias(_chunk, _ctxAddr)) {
                (_result, _resultCtr) = _processAlias(_result, _resultCtr, _ctxAddr, _chunk);
            } else if (_chunk.equal('insert')) {
                (_result, _resultCtr, i) = _processArrayInsert(_result, _resultCtr, _code, i);
            } else {
                (_result, _resultCtr) = _checkIsNumberOrAddress(_result, _resultCtr, _chunk);
                _result[_resultCtr++] = _chunk;
            }
        }
        return _result;
    }

    /**
     * @dev Transforms code in infix format to the postfix format
     * @param _code Array of DSL commands
     * @param _ctxAddr Context contract address
     * @return Code in the postfix format
     */
    function infixToPostfix(
        address _ctxAddr,
        string[] memory _code
    ) public view returns (string[] memory) {
        string[] memory _result = new string[](50);
        string[] memory _stack = new string[](50);
        uint256 _resultCtr;
        string memory _chunk;
        uint256 i;

        while (i < _nonEmptyArrLen(_code)) {
            _chunk = _code[i++];

            if (_isOperator(_chunk, _ctxAddr)) {
                (_result, _resultCtr, _stack) = _processOperator(
                    _stack,
                    _result,
                    _resultCtr,
                    _ctxAddr,
                    _chunk
                );
            } else if (_isParenthesis(_chunk)) {
                (_result, _resultCtr, _stack) = _processParenthesis(
                    _stack,
                    _result,
                    _resultCtr,
                    _chunk
                );
            } else {
                _result[_resultCtr++] = _chunk;
            }
        }

        // Note: now we have a stack with DSL commands and we will pop from it and save to the resulting array to move
        //       from postfix to infix notation
        while (_stack.stackLength() > 0) {
            (_stack, _result[_resultCtr++]) = _stack.popFromStack();
        }
        return _result;
    }

    /***************************
     * == PROCESS FUNCTIONS == *
     **************************/

    /**
     * @dev Process insert into array command
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _code Current DSL code that we're processing
     * @param i Current pointer to the element in _code array that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified `i`
     */
    function _processArrayInsert(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    ) internal pure returns (string[] memory, uint256, uint256) {
        // Get the necessary params of `insert` command
        // Notice: `insert 1234 into NUMBERS` -> `push 1234 NUMBERS`
        string memory _insertVal = _code[i];
        string memory _arrName = _code[i + 2];

        _result[_resultCtr++] = 'push';
        _result[_resultCtr++] = _insertVal;
        _result[_resultCtr++] = _arrName;

        return (_result, _resultCtr, i + 3);
    }

    /**
     * @dev Process summing over array comand
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _code Current DSL code that we're processing
     * @param i Current pointer to the element in _code array that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified `i`
     */
    function _processSumOfCmd(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    ) internal pure returns (string[] memory, uint256, uint256) {
        // Ex. (sumOf) `USERS.balance` -> ['USERS', 'balance']
        // Ex. (sumOf) `USERS` ->['USERS']
        string[] memory _sumOfArgs = split(_code[i], '.', '');

        // Ex. `sumOf USERS.balance` -> sum over array of structs
        // Ex. `sumOf USERS` -> sum over a regular array
        if (_nonEmptyArrLen(_sumOfArgs) == 2) {
            // process `sumOf` over array of structs
            _result[_resultCtr++] = 'sumThroughStructs';
            _result[_resultCtr++] = _sumOfArgs[0];
            _result[_resultCtr++] = _sumOfArgs[1];
        } else {
            // process `sumOf` over a regular array
            _result[_resultCtr++] = 'sumOf';
            _result[_resultCtr++] = _sumOfArgs[0];
        }

        return (_result, _resultCtr, i + 1);
    }

    /**
     * @dev Process for-loop
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _code Current DSL code that we're processing
     * @param i Current pointer to the element in _code array that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified `i`
     */
    function _processForCmd(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    ) internal pure returns (string[] memory, uint256, uint256) {
        // TODO
    }

    /**
     * @dev Process `struct` comand
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _code Current DSL code that we're processing
     * @param i Current pointer to the element in _code array that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified `i`
     */
    function _processStruct(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    ) internal pure returns (string[] memory, uint256, uint256) {
        // 'struct', 'BOB', '{', 'balance', '456', '}'
        _result[_resultCtr++] = 'struct';
        _result[_resultCtr++] = _code[i]; // struct name
        // skip `{` (index is i + 1)

        uint256 j = i + 1;
        while (!_code[j + 1].equal('}')) {
            _result[_resultCtr++] = _code[j + 1]; // struct key
            _result[_resultCtr++] = _code[j + 2]; // struct value

            j = j + 2;
        }
        _result[_resultCtr++] = 'endStruct';

        return (_result, _resultCtr, j + 2);
    }

    /**
     * @dev Process `ETH`, `WEI` symbols in the code
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _chunk The current piece of code that we're processing (should be the currency symbol)
     * @param _prevChunk The previous piece of code
     * @return Mofified _resultCtr, and modified `_prevChunk`
     */
    function _processCurrencySymbol(
        uint256 _resultCtr,
        string memory _chunk,
        string memory _prevChunk
    ) internal pure returns (uint256, string memory) {
        uint256 _currencyMultiplier = _getCurrencyMultiplier(_chunk);

        try _prevChunk.toUint256() {
            _prevChunk = StringUtils.toString(_prevChunk.toUint256() * _currencyMultiplier);
        } catch {
            _prevChunk = StringUtils.toString(
                _prevChunk.parseScientificNotation().toUint256() * _currencyMultiplier
            );
        }

        // this is to rewrite old number (ex. 100) with an extended number (ex. 100 GWEI = 100000000000)
        if (_resultCtr > 0) {
            --_resultCtr;
        }

        return (_resultCtr, _prevChunk);
    }

    /**
     * @dev Process DSL alias
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _ctxAddr Context contract address
     * @param _chunk The current piece of code that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified `i`
     */
    function _processAlias(
        string[] memory _result,
        uint256 _resultCtr,
        address _ctxAddr,
        string memory _chunk
    ) internal view returns (string[] memory, uint256) {
        uint256 i;

        // Replace alises with base commands
        _chunk = IDSLContext(_ctxAddr).aliases(_chunk);

        // Process multi-command aliases
        // Ex. `uint256[]` -> `declareArr uint256`
        string[] memory _chunks = split(_chunk, ' ', '');

        // while we've not finished processing all the program - keep going
        while (i < _nonEmptyArrLen(_chunks)) {
            _result[_resultCtr++] = _chunks[i++];
        }

        return (_result, _resultCtr);
    }

    /**
     * @dev Process any DSL command
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _code Current DSL code that we're processing
     * @param i Current pointer to the element in _code array that we're processing
     * @param _ctxAddr Context contract address
     * @return Modified _result array, mofified _resultCtr, and modified `i`
     */
    function _processCommand(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i,
        address _ctxAddr
    ) internal view returns (string[] memory, uint256, uint256) {
        string memory _chunk = _code[i - 1];
        if (_chunk.equal('struct')) {
            (_result, _resultCtr, i) = _processStruct(_result, _resultCtr, _code, i);
        } else if (_chunk.equal('sumOf')) {
            (_result, _resultCtr, i) = _processSumOfCmd(_result, _resultCtr, _code, i);
        } else if (_chunk.equal('for')) {
            (_result, _resultCtr, i) = _processForCmd(_result, _resultCtr, _code, i);
        } else {
            uint256 _skipCtr = IDSLContext(_ctxAddr).numOfArgsByOpcode(_chunk) + 1;

            i--; // this is to include the command name in the loop below
            // add command arguments
            while (_skipCtr > 0) {
                _result[_resultCtr++] = _code[i++];
                _skipCtr--;
            }
        }

        return (_result, _resultCtr, i);
    }

    /**
     * @dev Process open and closed parenthesis
     * @param _stack Stack that is used to process parenthesis
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _chunk The current piece of code that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified _stack
     */
    function _processParenthesis(
        string[] memory _stack,
        string[] memory _result,
        uint256 _resultCtr,
        string memory _chunk
    ) internal pure returns (string[] memory, uint256, string[] memory) {
        if (_chunk.equal('(')) {
            // opening bracket
            _stack = _stack.pushToStack(_chunk);
        } else if (_chunk.equal(')')) {
            // closing bracket
            (_result, _resultCtr, _stack) = _processClosingParenthesis(_stack, _result, _resultCtr);
        }

        return (_result, _resultCtr, _stack);
    }

    /**
     * @dev Process closing parenthesis
     * @param _stack Stack that is used to process parenthesis
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @return Modified _result array, mofified _resultCtr, and modified _stack
     */
    function _processClosingParenthesis(
        string[] memory _stack,
        string[] memory _result,
        uint256 _resultCtr
    ) public pure returns (string[] memory, uint256, string[] memory) {
        while (!_stack.seeLastInStack().equal('(')) {
            (_stack, _result[_resultCtr++]) = _stack.popFromStack();
        }
        (_stack, ) = _stack.popFromStack(); // remove '(' that is left
        return (_result, _resultCtr, _stack);
    }

    /**
     * @dev Process curly brackets
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _chunk The current piece of code that we're processing
     * @return Modified _result array, mofified _resultCtr
     */
    function _processCurlyBracket(
        string[] memory _result,
        uint256 _resultCtr,
        string memory _chunk
    ) internal pure returns (string[] memory, uint256) {
        // if `_chunk` equal `{` - do nothing
        if (_chunk.equal('}')) {
            _result[_resultCtr++] = 'end';
        }

        return (_result, _resultCtr);
    }

    /**
     * @dev Process any operator in DSL
     * @param _stack Stack that is used to process parenthesis
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _ctxAddr Context contract address
     * @param _chunk The current piece of code that we're processing
     * @return Modified _result array, mofified _resultCtr, and modified _stack
     */
    function _processOperator(
        string[] memory _stack,
        string[] memory _result,
        uint256 _resultCtr,
        address _ctxAddr,
        string memory _chunk
    ) internal view returns (string[] memory, uint256, string[] memory) {
        while (
            _stack.stackLength() > 0 &&
            IDSLContext(_ctxAddr).opsPriors(_chunk) <=
            IDSLContext(_ctxAddr).opsPriors(_stack.seeLastInStack())
        ) {
            (_stack, _result[_resultCtr++]) = _stack.popFromStack();
        }
        _stack = _stack.pushToStack(_chunk);

        return (_result, _resultCtr, _stack);
    }

    /**************************
     * == HELPER FUNCTIONS == *
     *************************/

    /**
     * @dev Checks if chunk is a currency symbol
     * @param _chunk is a current chunk from the DSL string code
     * @return True or false based on whether chunk is a currency symbol or not
     */
    function _isCurrencySymbol(string memory _chunk) internal pure returns (bool) {
        return _chunk.equal('ETH') || _chunk.equal('GWEI');
    }

    /**
     * @dev Checks if chunk is an operator
     * @param _ctxAddr Context contract address
     * @return True or false based on whether chunk is an operator or not
     */
    function _isOperator(string memory _chunk, address _ctxAddr) internal view returns (bool) {
        for (uint256 i = 0; i < IDSLContext(_ctxAddr).operatorsLen(); i++) {
            if (_chunk.equal(IDSLContext(_ctxAddr).operators(i))) return true;
        }
        return false;
    }

    /**
     * @dev Checks if a string is an alias to a command from DSL
     * @param _ctxAddr Context contract address
     * @return True or false based on whether chunk is an alias or not
     */
    function _isAlias(string memory _chunk, address _ctxAddr) internal view returns (bool) {
        return !IDSLContext(_ctxAddr).aliases(_chunk).equal('');
    }

    /**
     * @dev Checks if chunk is a parenthesis
     * @param _chunk Current piece of code that we're processing
     * @return True or false based on whether chunk is a parenthesis or not
     */
    function _isParenthesis(string memory _chunk) internal pure returns (bool) {
        return _chunk.equal('(') || _chunk.equal(')');
    }

    /**
     * @dev Checks if chunk is a curly bracket
     * @param _chunk Current piece of code that we're processing
     * @return True or false based on whether chunk is a curly bracket or not
     */
    function _isCurlyBracket(string memory _chunk) internal pure returns (bool) {
        return _chunk.equal('{') || _chunk.equal('}');
    }

    /**
     * @dev Parses scientific notation in the chunk if there is any
     * @param _chunk Current piece of code that we're processing
     * @return Chunk without a scientific notation
     */
    function _checkScientificNotation(string memory _chunk) internal pure returns (string memory) {
        if (_chunk.mayBeNumber() && !_chunk.mayBeAddress()) {
            return _parseScientificNotation(_chunk);
        }
        return _chunk;
    }

    /**
     * @dev As the string of values can be simple and complex for DSL this function returns a number in
     * Wei regardless of what type of number parameter was provided by the user.
     * For example:
     * `uint256 1000000` - simple
     * `uint256 1e6 - complex`
     * @param _chunk provided number
     * @return updatedChunk amount in Wei of provided _chunk value
     */
    function _parseScientificNotation(
        string memory _chunk
    ) internal pure returns (string memory updatedChunk) {
        try _chunk.toUint256() {
            updatedChunk = _chunk;
        } catch {
            updatedChunk = _chunk.parseScientificNotation();
        }
    }

    /**
     * @dev Checks if chunk is a number or address and processes it if so
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @param _chunk Current piece of code that we're processing
     * @return Modified _result array, mofified _resultCtr
     */
    function _checkIsNumberOrAddress(
        string[] memory _result,
        uint256 _resultCtr,
        string memory _chunk
    ) internal pure returns (string[] memory, uint256) {
        if (_chunk.mayBeAddress()) return (_result, _resultCtr);
        if (_chunk.mayBeNumber()) {
            (_result, _resultCtr) = _addUint256(_result, _resultCtr);
        }

        return (_result, _resultCtr);
    }

    /**
     * @dev Adds `uint256` to a number
     * @param _result Output array that the function is modifying
     * @param _resultCtr Current pointer to the empty element in the _result param
     * @return Modified _result array, mofified _resultCtr
     */
    function _addUint256(
        string[] memory _result,
        uint256 _resultCtr
    ) internal pure returns (string[] memory, uint256) {
        if (_resultCtr == 0 || (!(_result[_resultCtr - 1].equal('uint256')))) {
            _result[_resultCtr++] = 'uint256';
        }
        return (_result, _resultCtr);
    }

    /**
     * @dev checks the value, and returns the corresponding multiplier.
     * If it is Ether, then it returns 1000000000000000000,
     * If it is GWEI, then it returns 1000000000
     * @param _chunk is a command from DSL command list
     * @return returns the corresponding multiplier.
     */
    function _getCurrencyMultiplier(string memory _chunk) internal pure returns (uint256) {
        if (_chunk.equal('ETH')) {
            return 1000000000000000000;
        } else if (_chunk.equal('GWEI')) {
            return 1000000000;
        } else return 0;
    }

    /**
     * @dev Checks if a symbol is a comment, then increases `i` to the next
     * no-comment symbol avoiding an additional iteration
     * @param i is a current index of a char that might be changed
     * @param _program is a current program string
     * @param _char Current character
     * @return Searched symbol length
     * @return New index
     * @return Is code commented or not
     */
    function _getCommentSymbol(
        uint256 i,
        string memory _program,
        string memory _char
    ) internal pure returns (uint256, uint256, bool) {
        if (_canGetSymbol(i + 1, _program)) {
            string memory nextChar = _program.char(i + 1);
            if (_char.equal('/') && nextChar.equal('/')) {
                return (1, i + 2, true);
            } else if (_char.equal('/') && nextChar.equal('*')) {
                return (2, i + 2, true);
            }
        }
        return (0, i, false);
    }

    /**
     * @dev Checks if a symbol is an end symbol of a comment, then increases _index to the next
     * no-comment symbol avoiding an additional iteration
     * @param _ssl is a searched symbol len that might be 0, 1, 2
     * @param i is a current index of a char that might be changed
     * @param _p is a current program string
     * @param _char Current character
     * @return A new index of a char
     * @return Is code commented or not
     */
    function _getEndCommentSymbol(
        uint256 _ssl,
        uint256 i,
        string memory _p,
        string memory _char
    ) internal pure returns (uint256, bool) {
        if (_ssl == 1 && _char.equal('\n')) {
            return (i + 1, false);
        } else if (_ssl == 2 && _char.equal('*') && _canGetSymbol(i + 1, _p)) {
            string memory nextChar = _p.char(i + 1);
            if (nextChar.equal('/')) {
                return (i + 2, false);
            }
        }
        return (i, true);
    }

    /**
     * @dev Checks if it is possible to get next char from a _program
     * @param _index is a current index of a char
     * @param _program is a current program string
     * @return True if program has the next symbol, otherwise is false
     */
    function _canGetSymbol(uint256 _index, string memory _program) internal pure returns (bool) {
        try _program.char(_index) {
            return true;
        } catch Error(string memory) {
            return false;
        }
    }

    /**
     * @dev Returns the length of a string array excluding empty elements
     * Ex. nonEmptyArrLen['h', 'e', 'l', 'l', 'o', '', '', '']) == 5 (not 8)
     * @param _arr Input string array
     * @return i The legth of the array excluding empty elements
     */
    function _nonEmptyArrLen(string[] memory _arr) internal pure returns (uint256 i) {
        while (i < _arr.length && !_arr[i].equal('')) {
            i++;
        }
    }
}
