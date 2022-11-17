## Preprocessor

_Preprocessor of DSL code
This contract is a singleton and should not be deployed more than once

It can remove comments that were created by user in the DSL code string. It
transforms the users DSL code string to the list of commands that can be used
in a Parser contract.

DSL code in postfix notation as
user's string code -> Preprocessor -> each command is separated in the commands list_

### transform

```solidity
function transform(address _ctxAddr, string _program) external view returns (string[])
```

_The main function that transforms the user's DSL code string to the list of commands.

Example:
The user's DSL code string is
```
uint256 6 setUint256 A
```
The end result after executing a `transform()` function is
```
['uint256', '6', 'setUint256', 'A']
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxAddr | address | is a context contract address |
| _program | string | is a user's DSL code string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | the list of commands that storing `result` |

### removeComments

```solidity
function removeComments(string _program) public pure returns (string _cleanedProgram)
```

_Searches the comments in the program and removes comment lines
Example:
The user's DSL code string is
```
 bool true
 // uint256 2 * uint256 5
```
The end result after executing a `removeComments()` function is
```
bool true
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _program | string | is a current program string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _cleanedProgram | string | new string program that contains only clean code without comments |

### split

```solidity
function split(string _program, string _separators, string _separatorsToKeep) public pure returns (string[])
```

_Splits the user's DSL code string to the list of commands
avoiding several symbols:
- removes additional and useless symbols as ' ', `\\n`
- defines and adding help 'end' symbol for the ifelse condition
- defines and cleans the code from `{` and `}` symbols

Example:
The user's DSL code string is
```
(var TIMESTAMP > var INIT)
```
The end result after executing a `split()` function is
```
['var', 'TIMESTAMP', '>', 'var', 'INIT']
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _program | string | is a user's DSL code string |
| _separators | string |  |
| _separatorsToKeep | string |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | the list of commands that storing in `result` |

### removeSyntacticSugar

```solidity
function removeSyntacticSugar(string[] _code) public pure returns (string[])
```

### simplifyCode

```solidity
function simplifyCode(string[] _code, address _ctxAddr) public view returns (string[])
```

### infixToPostfix

```solidity
function infixToPostfix(address _ctxAddr, string[] _code) public view returns (string[])
```

### _processArrayInsert

```solidity
function _processArrayInsert(string[] _result, uint256 _resultCtr, string[] _code, uint256 i) internal pure returns (string[], uint256, uint256)
```

### _processSumOfCmd

```solidity
function _processSumOfCmd(string[] _result, uint256 _resultCtr, string[] _code, uint256 i) internal pure returns (string[], uint256, uint256)
```

### _processForCmd

```solidity
function _processForCmd(string[] _result, uint256 _resultCtr, string[] _code, uint256 i) internal pure returns (string[], uint256, uint256)
```

### _processStruct

```solidity
function _processStruct(string[] _result, uint256 _resultCtr, string[] _code, uint256 i) internal pure returns (string[], uint256, uint256)
```

### _processCurrencySymbol

```solidity
function _processCurrencySymbol(uint256 _resultCtr, string _chunk, string _prevChunk) internal pure returns (uint256, string)
```

### _processAlias

```solidity
function _processAlias(string[] _result, uint256 _resultCtr, address _ctxAddr, string _chunk) internal view returns (string[], uint256)
```

### _processCommand

```solidity
function _processCommand(string[] _result, string[] _code, uint256 _resultCtr, address _ctxAddr, uint256 i) internal view returns (string[], uint256, uint256)
```

### _processParenthesis

```solidity
function _processParenthesis(string[] _stack, string[] _result, uint256 _resultCtr, string _chunk) internal pure returns (string[], uint256, string[])
```

### _processClosingParenthesis

```solidity
function _processClosingParenthesis(string[] _stack, string[] _result, uint256 _resultCtr) public pure returns (string[], uint256, string[])
```

### _processCurlyBracket

```solidity
function _processCurlyBracket(string[] _result, uint256 _resultCtr, string _chunk) internal pure returns (string[], uint256)
```

### _processOperator

```solidity
function _processOperator(string[] _stack, string[] _result, uint256 _resultCtr, address _ctxAddr, string _chunk) internal view returns (string[], uint256, string[])
```

### _isCurrencySymbol

```solidity
function _isCurrencySymbol(string _chunk) internal pure returns (bool)
```

_Check is chunk is a currency symbol_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a current chunk from the DSL string code |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true or false based on whether chunk is a currency symbol or not |

### _isOperator

```solidity
function _isOperator(address _ctxAddr, string op) internal view returns (bool)
```

### _isAlias

```solidity
function _isAlias(address _ctxAddr, string _cmd) internal view returns (bool)
```

_Checks if a string is an alias to a command from DSL_

### _isParenthesis

```solidity
function _isParenthesis(string _chunk) internal pure returns (bool)
```

### _isCurlyBracket

```solidity
function _isCurlyBracket(string _chunk) internal pure returns (bool)
```

### _checkScientificNotation

```solidity
function _checkScientificNotation(string _chunk) internal pure returns (string)
```

### _parseScientificNotation

```solidity
function _parseScientificNotation(string _chunk) internal pure returns (string updatedChunk)
```

_As the string of values can be simple and complex for DSL this function returns a number in
Wei regardless of what type of number parameter was provided by the user.
For example:
`uint256 1000000` - simple
`uint256 1e6 - complex`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | provided number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| updatedChunk | string | amount in Wei of provided _chunk value |

### _checkIsNumberOrAddress

```solidity
function _checkIsNumberOrAddress(string[] _result, uint256 _resultCtr, string _chunk) internal pure returns (string[], uint256)
```

### _addUint256

```solidity
function _addUint256(string[] _result, uint256 _resultCtr) internal pure returns (string[], uint256)
```

### _getCurrencyMultiplier

```solidity
function _getCurrencyMultiplier(string _chunk) internal pure returns (uint256)
```

_checks the value, and returns the corresponding multiplier.
If it is Ether, then it returns 1000000000000000000,
If it is GWEI, then it returns 1000000000_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a command from DSL command list |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns the corresponding multiplier. |

### _getCommentSymbol

```solidity
function _getCommentSymbol(uint256 _index, string _program, string char) internal pure returns (uint256, uint256, bool)
```

_Checks if a symbol is a comment, then increases _index to the next
no-comment symbol avoiding an additional iteration_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a current index of a char that might be changed |
| _program | string | is a current program string |
| char | string |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | new index |
| [1] | uint256 | searchedSymbolLen |
| [2] | bool | isCommeted |

### _getEndCommentSymbol

```solidity
function _getEndCommentSymbol(uint256 _ssl, uint256 _i, string _p, string char) internal pure returns (uint256, bool)
```

_Checks if a symbol is an end symbol of a comment, then increases _index to the next
no-comment symbol avoiding an additional iteration_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ssl | uint256 | is a searched symbol len that might be 0, 1, 2 |
| _i | uint256 | is a current index of a char that might be changed |
| _p | string | is a current program string |
| char | string |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | index is a new index of a char |
| [1] | bool | isCommeted |

### _canGetSymbol

```solidity
function _canGetSymbol(uint256 _index, string _program) internal pure returns (bool)
```

_Checks if it is possible to get next char from a _program_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a current index of a char |
| _program | string | is a current program string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if program has the next symbol, otherwise is false |

### _nonEmptyArrLen

```solidity
function _nonEmptyArrLen(string[] _arr) internal pure returns (uint256 i)
```

_Returns the length of a string array excluding empty elements
Ex. nonEmptyArrLen['h', 'e', 'l', 'l', 'o', '', '', '']) == 5 (not 8)_

