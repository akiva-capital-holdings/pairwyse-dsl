// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { IPreprocessor } from './interfaces/IPreprocessor.sol';
import { StringStack } from './libs/StringStack.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ErrorsPreprocessor } from './libs/Errors.sol';

// import 'hardhat/console.sol';

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
contract Preprocessor is IPreprocessor {
    using StringUtils for string;
    using StringStack for string[];

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
     * @return the list of commands that storing `result`
     */
    function transform(address _ctxAddr, string memory _program)
        external
        view
        returns (string[] memory)
    {
        _program = _cleanString(_program);
        string[] memory _code = _split(_program, '\n ,:(){}', '(){}');
        _code = _removeSyntacticSugar(_code);
        _code = _simplifyCode(_code, _ctxAddr);
        _code = _infixToPostfix(
            _ctxAddr,
            _code /*, tmpStrStack*/
        );
        return _code;
    }

    /**
     * @dev Searches the comments in the program and removes comment lines
     * Example:
     * The user's DSL code string is
     * ```
     *  bool true
     *  // uint256 2 * uint256 5
     * ```
     * The end result after executing a `cleanString()` function is
     * ```
     * bool true
     * ```
     * @param _program is a current program string
     * @return _cleanedProgram new string program that contains only clean code without comments
     */
    function _cleanString(string memory _program)
        internal
        pure
        returns (string memory _cleanedProgram)
    {
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

    // /**
    //  * @dev Push element to array in the first position
    //  * @dev As the array has fixed size, we drop the last element when addind a new one to the beginning of the array
    //  */
    // function _pushToStack(string[] memory _stack, string memory _element)
    //     internal
    //     pure
    //     returns (string[] memory)
    // {
    //     // console.log('push to stack');
    //     _stack[_stackLength(_stack)] = _element;
    //     return _stack;
    // }

    // function _popFromStack(string[] memory _stack)
    //     internal
    //     pure
    //     returns (string[] memory, string memory)
    // {
    //     // console.log('pop from stack');
    //     string memory _topElement = _seeLastInStack(_stack);
    //     _stack[_stackLength(_stack) - 1] = '';
    //     return (_stack, _topElement);
    // }

    // function _stackLength(string[] memory _stack) internal pure returns (uint256) {
    //     // console.log('_stackLength');
    //     uint256 i;
    //     while (!_stack[i].equal('')) {
    //         i++;
    //     }
    //     return i;
    // }

    // function _seeLastInStack(string[] memory _stack) internal pure returns (string memory) {
    //     // console.log('last in stack is:', _stack[_stackLength(_stack) - 1]);
    //     return _stack[_stackLength(_stack) - 1];
    // }

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
     * @return the list of commands that storing in `result`
     */
    // _separatorsToKeep - we're using symbols from this string as separators but not removing
    // them from the resulting array
    function _split(
        string memory _program,
        string memory _separators,
        string memory _separatorsToKeep
    ) internal pure returns (string[] memory) {
        string[] memory _result = new string[](50);
        uint256 resultCtr;
        string memory buffer; // here we collect DSL commands, var names, etc. symbol by symbol
        string memory char;

        for (uint256 i = 0; i < _program.length(); i++) {
            char = _program.char(i);

            // char.isIn(_separators)
            if (char.isIn(_separators)) {
                // if (char.equal(' ') || char.equal('\n') || char.equal('(') || char.equal(')')) {
                if (buffer.length() > 0) {
                    _result[resultCtr++] = buffer;
                    buffer = '';
                }
            } else {
                buffer = buffer.concat(char);
            }

            if (char.isIn(_separatorsToKeep)) {
                // if (char.equal('(') || char.equal(')')) {
                _result[resultCtr++] = char;
            }
        }

        if (buffer.length() > 0) {
            _result[resultCtr++] = buffer;
            buffer = '';
        }

        return _result;
    }

    // if chunk is a number removes scientific notation if any
    function _removeSyntacticSugar(string[] memory _code) internal pure returns (string[] memory) {
        // console.log('\n    -> removeSyntacticSugar');
        string[] memory _result = new string[](50);
        uint256 _resultCtr;
        string memory _chunk;
        string memory _prevChunk;
        uint256 i;

        while (i < _nonEmptyArrLen(_code)) {
            _prevChunk = i == 0 ? '' : _code[i - 1];
            _chunk = _code[i++];

            // if chunk is a number removes scientific notation if any
            // (_resultCtr, chunk) = _removeSyntacticSugar(_resultCtr, chunk, _prevChunk);

            _chunk = _checkScientificNotation(_chunk);
            // console.log('_removeSyntacticSugar chunk =', _chunk);
            if (_isCurrencySymbol(_chunk)) {
                // console.log('This is a currency symbol');
                (_resultCtr, _chunk) = _processCurrencySymbol(_resultCtr, _chunk, _prevChunk);
                // console.log('_removeSyntacticSugar 2');
            }

            _result[_resultCtr++] = _chunk;
        }
        return _result;
    }

    function _simplifyCode(string[] memory _code, address _ctxAddr)
        internal
        view
        returns (string[] memory)
    {
        // console.log('\n    -> Simplify Code');
        string[] memory _result = new string[](50);
        uint256 _resultCtr;
        string memory _chunk;
        string memory _prevChunk;
        // uint256 _skipCtr; // counter to skip preprocessing of command params; just directly add them
        // to the output
        uint256 i;

        while (i < _nonEmptyArrLen(_code)) {
            _prevChunk = i == 0 ? '' : _code[i - 1];
            _chunk = _code[i++];

            // console.log('chunk =', _chunk);

            if (IContext(_ctxAddr).isCommand(_chunk)) {
                (_result, _resultCtr, i) = _processCommand(
                    _result,
                    _code,
                    _resultCtr,
                    _ctxAddr,
                    _chunk,
                    i
                );
            } else if (_isCurlyBracket(_chunk)) {
                // console.log('curly bracket');
                (_result, _resultCtr) = _processCurlyBracket(_result, _resultCtr, _chunk);
            } else if (_isAlias(_ctxAddr, _chunk)) {
                // console.log('alias');
                (_result, _resultCtr) = _processAlias(_result, _resultCtr, _ctxAddr, _chunk);
            } else if (_chunk.equal('insert')) {
                (_result, _resultCtr, i) = _processArrayInsert(_result, _resultCtr, _code, i);
            } else {
                // console.log('other');
                (_result, _resultCtr) = _checkIsNumberOrAddress(_result, _resultCtr, _chunk);
                _result[_resultCtr++] = _chunk;
            }
        }
        return _result;
    }

    function _infixToPostfix(address _ctxAddr, string[] memory _code)
        internal
        view
        returns (string[] memory)
    {
        // console.log('\n    ->infix to postfix');
        string[] memory _result = new string[](50);
        string[] memory _stack = new string[](50);
        uint256 _resultCtr;
        string memory _chunk;
        uint256 i;

        while (i < _nonEmptyArrLen(_code)) {
            _chunk = _code[i++];
            // console.log('chunk =', _chunk);

            if (_isOperator(_ctxAddr, _chunk)) {
                // console.log('operator');
                // operator
                (_result, _resultCtr, _stack) = _processOperator(
                    _stack,
                    _result,
                    _resultCtr,
                    _ctxAddr,
                    _chunk
                );
                // console.log('after operator');
            } else if (_isParenthesis(_chunk)) {
                // console.log('parenthesis');
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

        // console.log(4);
        while (_stack.stackLength() > 0) {
            (_stack, _result[_resultCtr++]) = _stack.popFromStack();
        }
        return _result;
    }

    // function _removeSyntacticSugar(
    //     uint256 _resultCtr,
    //     string memory _chunk,
    //     string memory _prevChunk
    // ) internal view returns (uint256, string memory) {
    //     console.log('_removeSyntacticSugar');
    //     _chunk = _checkScientificNotation(_chunk);
    //     console.log('_removeSyntacticSugar chunk =', _chunk);
    //     if (_isCurrencySymbol(_chunk)) {
    //         console.log('This is a currency symbol');
    //         (_resultCtr, _chunk) = _processCurrencySymbol(_resultCtr, _chunk, _prevChunk);
    //         console.log('_removeSyntacticSugar 2');
    //     }
    //     return (_resultCtr, _chunk);
    // }

    function _checkScientificNotation(string memory _chunk) internal pure returns (string memory) {
        // console.log('_checkScientificNotation');
        // console.log('isAddress =', _chunk.mayBeAddress());
        // console.log('isNumber =', _chunk.mayBeNumber());
        // console.log('1111');
        if (_chunk.mayBeNumber() && !_chunk.mayBeAddress()) {
            return _parseScientificNotation(_chunk);
        }
        return _chunk;
    }

    // /**
    //  * @dev As the string of values can be simple and complex for DSL this function returns a number in
    //  * Wei regardless of what type of number parameter was provided by the user.
    //  * For example:
    //  * `uint256 1000000` - simple
    //  * `uint256 1e6 - complex`
    //  * @param _chunk provided number
    //  * @param _currencyMultiplier provided number of the multiplier
    //  * @return updatedChunk amount in Wei of provided _chunk value
    //  */
    function _parseScientificNotation(
        string memory _chunk /*, uint256 _currencyMultiplier*/
    ) internal pure returns (string memory updatedChunk) {
        try _chunk.toUint256() {
            updatedChunk = _chunk;
        } catch {
            updatedChunk = _chunk.parseScientificNotation();
        }
    }

    function _processArrayInsert(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    )
        internal
        pure
        returns (
            string[] memory,
            uint256,
            uint256
        )
    {
        // console.log('_processArrayInsert');

        // Get the necessary params of `insert` command
        // Notice: `insert 1234 into NUMBERS` -> `push 1234 NUMBERS`
        string memory _insertVal = _code[i];
        string memory _arrName = _code[i + 2];

        _result[_resultCtr++] = 'push';
        _result[_resultCtr++] = _insertVal;
        _result[_resultCtr++] = _arrName;

        return (_result, _resultCtr, i + 3);
    }

    function _processSumOfCmd(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    )
        internal
        pure
        returns (
            string[] memory,
            uint256,
            uint256
        )
    {
        // console.log('_processSumOfCmd');

        // Ex. (sumOf) `USERS.balance` -> ['USERS', 'balance']
        // Ex. (sumOf) `USERS` ->['USERS']
        string[] memory _sumOfArgs = _split(_code[i], '.', '');

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

    function _processStruct(
        string[] memory _result,
        uint256 _resultCtr,
        string[] memory _code,
        uint256 i
    )
        internal
        pure
        returns (
            string[] memory,
            uint256,
            uint256
        )
    {
        // console.log('_processStruct');

        // Ex. (sumOf) `USERS.balance` -> ['USERS', 'balance']
        // Ex. (sumOf) `USERS` ->['USERS']
        // 'struct', 'BOB', '{', 'balance', '456', '}'
        _result[_resultCtr++] = 'struct';
        // console.log('struct name:', _code[i]);
        _result[_resultCtr++] = _code[i]; // struct name
        // skip `{` (index is i + 1)

        uint256 j = i + 1;
        while (!_code[j + 1].equal('}')) {
            // console.log('struct key:', _code[j + 1]);
            // console.log('struct value:', _code[j + 2]);
            _result[_resultCtr++] = _code[j + 1]; // struct key
            _result[_resultCtr++] = _code[j + 2]; // struct value

            j = j + 2;
        }
        _result[_resultCtr++] = 'endStruct';

        return (_result, _resultCtr, j + 2);
    }

    function _processCurrencySymbol(
        uint256 _resultCtr,
        string memory _chunk,
        string memory _prevChunk
    ) internal pure returns (uint256, string memory) {
        // console.log('_processCurrencySymbol');
        uint256 _currencyMultiplier = _getCurrencyMultiplier(_chunk);
        // console.log('_currencyMultiplier =', _currencyMultiplier);

        try _prevChunk.toUint256() {
            // console.log('try');
            // console.log(_prevChunk.toUint256() * _currencyMultiplier);
            _prevChunk = StringUtils.toString(_prevChunk.toUint256() * _currencyMultiplier);
        } catch {
            // console.log('catch');
            _prevChunk = StringUtils.toString(
                _prevChunk.parseScientificNotation().toUint256() * _currencyMultiplier
            );
        }

        // console.log('result ctr =', _resultCtr);
        // this is to rewrite old number (ex. 100) with an extended number (ex. 100 GWEI = 100000000000)
        if (_resultCtr > 0) {
            --_resultCtr;
        }

        return (_resultCtr, _prevChunk);
    }

    function _processAlias(
        string[] memory _result,
        uint256 _resultCtr,
        address _ctxAddr,
        string memory _chunk
    ) internal view returns (string[] memory, uint256) {
        uint256 i;

        // Replace alises with base commands
        _chunk = IContext(_ctxAddr).aliases(_chunk);

        // Process multi-command aliases
        // Ex. `uint256[]` -> `declareArr uint256`
        string[] memory _chunks = _split(_chunk, ' ', '');

        while (i < _nonEmptyArrLen(_chunks)) {
            _result[_resultCtr++] = _chunks[i++];
        }

        return (_result, _resultCtr);
    }

    function _processCommand(
        string[] memory _result,
        string[] memory _code,
        uint256 _resultCtr,
        address _ctxAddr,
        string memory _chunk,
        // uint256 _skipCtr,
        uint256 i // TODO: reduce the number of input & output params
    )
        internal
        view
        returns (
            string[] memory,
            uint256,
            uint256
        )
    {
        // console.log('process command');

        if (_chunk.equal('struct')) {
            (_result, _resultCtr, i) = _processStruct(_result, _resultCtr, _code, i);
        } else if (_chunk.equal('sumOf')) {
            (_result, _resultCtr, i) = _processSumOfCmd(_result, _resultCtr, _code, i);
        } else {
            uint256 _skipCtr = IContext(_ctxAddr).numOfArgsByOpcode(_chunk) + 1;
            // console.log(_skipCtr);

            i--; // this is to include the command name in the loop below
            // add command arguments
            while (_skipCtr > 0) {
                // console.log('cmd argument =', _code[i + 1]);
                _result[_resultCtr++] = _code[i++];
                _skipCtr--;
            }
        }

        return (_result, _resultCtr, i);
    }

    function _isParenthesis(string memory _chunk) internal pure returns (bool) {
        return _chunk.equal('(') || _chunk.equal(')');
    }

    function _isCurlyBracket(string memory _chunk) internal pure returns (bool) {
        return _chunk.equal('{') || _chunk.equal('}');
    }

    function _processParenthesis(
        string[] memory _stack,
        string[] memory _result,
        uint256 _resultCtr,
        string memory _chunk
    )
        internal
        pure
        returns (
            string[] memory,
            uint256,
            string[] memory
        )
    {
        if (_chunk.equal('(')) {
            // opening bracket
            _stack = _stack.pushToStack(_chunk);
        } else if (_chunk.equal(')')) {
            // closing bracket
            (_result, _resultCtr, _stack) = _processClosingParenthesis(_stack, _result, _resultCtr);
        }

        return (_result, _resultCtr, _stack);
    }

    function _processClosingParenthesis(
        string[] memory _stack,
        string[] memory _result,
        uint256 _resultCtr
    )
        public
        pure
        returns (
            string[] memory,
            uint256,
            string[] memory
        )
    {
        // console.log('_processClosingParenthesis');
        while (!_stack.seeLastInStack().equal('(')) {
            (_stack, _result[_resultCtr++]) = _stack.popFromStack();
        }
        (_stack, ) = _stack.popFromStack(); // remove '(' that is left
        return (_result, _resultCtr, _stack);
    }

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

    function _processOperator(
        string[] memory _stack,
        string[] memory _result,
        uint256 _resultCtr,
        address _ctxAddr,
        string memory _chunk
    )
        internal
        view
        returns (
            string[] memory,
            uint256,
            string[] memory
        )
    {
        while (
            _stack.stackLength() > 0 &&
            IContext(_ctxAddr).opsPriors(_chunk) <=
            IContext(_ctxAddr).opsPriors(_stack.seeLastInStack())
        ) {
            // console.log('while iteration');
            (_stack, _result[_resultCtr++]) = _stack.popFromStack();
        }
        // console.log('_processOperator: push to stack');
        _stack = _stack.pushToStack(_chunk);
        // }

        // console.log('return updated chunk');
        return (_result, _resultCtr, _stack);
    }

    function _checkIsNumberOrAddress(
        string[] memory _result,
        uint256 _resultCtr,
        string memory _chunk
    ) internal pure returns (string[] memory, uint256) {
        // console.log('_checkIsNumberOrAddress');
        if (_chunk.mayBeAddress()) return (_result, _resultCtr);
        if (_chunk.mayBeNumber()) {
            (_result, _resultCtr) = _addUint256(_result, _resultCtr);
        }

        return (_result, _resultCtr);
    }

    function _addUint256(string[] memory _result, uint256 _resultCtr)
        internal
        pure
        returns (string[] memory, uint256)
    {
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
     * @dev Check is chunk is a currency symbol
     * @param _chunk is a current chunk from the DSL string code
     * @return true or false based on whether chunk is a currency symbol or not
     */
    function _isCurrencySymbol(string memory _chunk) internal pure returns (bool) {
        if (_chunk.equal('ETH') || _chunk.equal('GWEI')) return true;
        return false;
    }

    /**
     * @dev Returns updated parameters for the `func` opcode processing
     * Pushes the command that saves parameter in the smart contract instead
     * of the parameters that were provided for parsing.
     * The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
     * remove the parameter like `uint256 7`.
     * The DSL command will be stored before the function body.
     * For the moment it works only with uint256 type.
     * @param _chunk is a current chunk from the DSL string code
     * @param _currentName is a current name of function
     * @param _isFunc describes if the func opcode was occured
     * @param _isName describes if the name for the function was already set
     * @return isFunc the new state of _isFunc for function processing
     * @return isName the new state of _isName for function processing
     * @return name the new name of the function
     */
    function _parseFuncMainData(
        string memory _chunk,
        string memory _currentName,
        bool _isFunc,
        bool _isName
    )
        internal
        pure
        returns (
            bool,
            bool,
            string memory
        )
    {
        if (_chunk.equal('endf')) {
            // finish `Functions block` process
            // example: `func NAME <number_of_params> endf`
            // updates only for: isFunc => false - end of func opcode
            return (false, _isName, _currentName);
        } else {
            // updates only for:
            // isName => true - setting the name of function has occurred
            // name => current cunk
            return (_isFunc, true, _chunk);
        }
    }

    function _isOperator(address _ctxAddr, string memory op) internal view returns (bool) {
        for (uint256 i = 0; i < IContext(_ctxAddr).operatorsLen(); i++) {
            if (op.equal(IContext(_ctxAddr).operators(i))) return true;
        }
        return false;
    }

    /**
     * @dev Checks if a string is an alias to a command from DSL
     */
    function _isAlias(address _ctxAddr, string memory _cmd) internal view returns (bool) {
        return !IContext(_ctxAddr).aliases(_cmd).equal('');
    }

    /**
     * @dev Checks if a symbol is a comment, then increases _index to the next
     * no-comment symbol avoiding an additional iteration
     * @param _index is a current index of a char that might be changed
     * @param _program is a current program string
     * @return new index
     * @return searchedSymbolLen
     * @return isCommeted
     */
    function _getCommentSymbol(
        uint256 _index,
        string memory _program,
        string memory char
    )
        internal
        pure
        returns (
            uint256,
            uint256,
            bool
        )
    {
        if (_canGetSymbol(_index + 1, _program)) {
            string memory nextChar = _program.char(_index + 1);
            if (char.equal('/') && nextChar.equal('/')) {
                return (1, _index + 2, true);
            } else if (char.equal('/') && nextChar.equal('*')) {
                return (2, _index + 2, true);
            }
        }
        return (0, _index, false);
    }

    /**
     * @dev Checks if a symbol is an end symbol of a comment, then increases _index to the next
     * no-comment symbol avoiding an additional iteration
     * @param _i is a current index of a char that might be changed
     * @param _ssl is a searched symbol len that might be 0, 1, 2
     * @param _p is a current program string
     * @return index is a new index of a char
     * @return isCommeted
     */
    function _getEndCommentSymbol(
        uint256 _ssl,
        uint256 _i,
        string memory _p,
        string memory char
    ) internal pure returns (uint256, bool) {
        if (_ssl == 1 && char.equal('\n')) {
            return (_i + 1, false);
        } else if (_ssl == 2 && char.equal('*') && _canGetSymbol(_i + 1, _p)) {
            string memory nextChar = _p.char(_i + 1);
            if (nextChar.equal('/')) {
                return (_i + 2, false);
            }
        }
        return (_i, true);
    }

    /**
     * @dev Checks if it is possible to get next char from a _program
     * @param _index is a current index of a char
     * @param _program is a current program string
     * @return true if program has the next symbol, otherwise is false
     */
    function _canGetSymbol(uint256 _index, string memory _program) internal pure returns (bool) {
        try _program.char(_index) {
            return true;
        } catch Error(string memory) {
            return false;
        }
    }

    /**
     * @dev This function is used to check if 'transferFrom',
     * 'sendEth' and 'transfer' functions(opcodes) won't use 'uint256' opcode during code
     * execution directly. So it needs to be sure that executed code won't mess up
     * parameters for the simple number and a number that be used for these functions.
     * @param _directUseUint256 set by default from the outer function. Allows to keep current state of a contract
     * @param _chunk is a current chunk from the outer function
     * @return _isDirect is true if a chunk is matched one from the opcode list, otherwise is false
     */
    function _isDirectUseUint256(
        bool _directUseUint256,
        bool _isStruct,
        string memory _chunk
    ) internal pure returns (bool _isDirect) {
        _isDirect = _directUseUint256;
        if (
            _chunk.equal('transferFrom') ||
            _chunk.equal('sendEth') ||
            _chunk.equal('transfer') ||
            _chunk.equal('get') ||
            _isStruct
        ) {
            _isDirect = true;
        }
    }

    /**
     * @dev As a 'loadRemote' opcode has 4 parameters in total and two of them are
     * numbers, so it is important to be sure that executed code under 'loadRemote'
     * won't mess parameters with the simple uint256 numbers.
     * @param _loadRemoteFlag is used to check if it was started the set of parameters for 'loadRemote' opcode
     * @param _loadRemoteVarCount is used to check if it was finished the set of parameters for 'loadRemote' opcode
     * @param _chunk is a current chunk from the outer function
     * @return _flag is an updated or current value of _loadRemoteFlag
     * @return _count is an updated or current value of _loadRemoteVarCount
     */
    function _updateRemoteParams(
        bool _loadRemoteFlag,
        uint256 _loadRemoteVarCount,
        string memory _chunk
    ) internal pure returns (bool _flag, uint256 _count) {
        _count = _loadRemoteVarCount;
        _flag = _loadRemoteFlag;

        if (_chunk.equal('loadRemote')) {
            _flag = true;
        }

        if (_flag && _loadRemoteVarCount < 4) {
            _count = _loadRemoteVarCount + 1;
        }

        return (_flag, _count);
    }

    /**
     * @dev Returns the length of a string array excluding empty elements
     * Ex. nonEmptyArrLen['h', 'e', 'l', 'l', 'o', '', '', '']) == 5 (not 8)
     */
    function _nonEmptyArrLen(string[] memory _arr) internal pure returns (uint256 i) {
        while (i < _arr.length && !_arr[i].equal('')) {
            i++;
        }
    }
}
