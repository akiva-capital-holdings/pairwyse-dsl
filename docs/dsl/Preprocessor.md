## Preprocessor

_Preprocessor of DSL code
This contract is a singleton and should not be deployed more than once

TODO: add description about Preprocessor as a single contract of the project
It can remove comments that were created by user in the DSL code string. It
transforms the users DSL code string to the list of commands that can be used
in a Parser contract.

DSL code in postfix notation as
user's string code -> Preprocessor -> each command is separated in the commands list_

### parameters

```solidity
mapping(uint256 => struct IPreprocessor.FuncParameter) parameters
```

### result

```solidity
string[] result
```

### strStack

```solidity
contract StringStack strStack
```

### DOT_SYMBOL

```solidity
bytes1 DOT_SYMBOL
```

### constructor

```solidity
constructor() public
```

### transform

```solidity
function transform(address _ctxAddr, string _program) external returns (string[])
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

### cleanString

```solidity
function cleanString(string _program) public pure returns (string _cleanedProgram)
```

_Searches the comments in the program and removes comment lines
Example:
The user's DSL code string is
```
 bool true
 // uint256 2 * uint256 5
```
The end result after executing a `cleanString()` function is
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
function split(string _program) public returns (string[])
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

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | the list of commands that storing in `result` |

### infixToPostfix

```solidity
function infixToPostfix(address _ctxAddr, string[] _code, contract StringStack _stack) public returns (string[])
```

_Rebuild and transforms the user's DSL commands (can be prepared by
the `split()` function) to the list of commands.

Example:
The user's DSL command contains
```
['1', '+', '2']
```
The result after executing a `infixToPostfix()` function is
```
['uint256', '1', 'uint256', '2', '+']
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxAddr | address | is a context contract address |
| _code | string[] | is a DSL command list |
| _stack | contract StringStack |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | _stack uses for getting and storing temporary string data rebuild the list of commands |

### _getMultiplier

```solidity
function _getMultiplier(string _chunk) internal pure returns (uint256)
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

### _getNames

```solidity
function _getNames(string _chunk) internal view returns (bool success, string arrName, string structVar)
```

_Searching for a `.` (dot) symbol  and returns names status for complex string name.
Ex. `USERS.balance`:
Where `success` = true`,
`arrName` = `USERS`,
`structVar` = `balance`; otherwise it returns `success` = false` with empty string results_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a command from DSL command list |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| success | bool | if user provides complex name,  result is true |
| arrName | string | if user provided complex name, result is the name of structure |
| structVar | string | if user provided complex name, result is the name of structure variable |

### _parseChunk

```solidity
function _parseChunk(string _chunk, uint256 _currencyMultiplier) internal pure returns (string)
```

_returned parsed chunk, values can be address with 0x parameter or be uint256 type_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | provided string |
| _currencyMultiplier | uint256 | provided number of the multiplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | updated _chunk value in dependence on its type |

### _parseNumber

```solidity
function _parseNumber(string _chunk, uint256 _currencyMultiplier) internal pure returns (string updatedChunk)
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
| _currencyMultiplier | uint256 | provided number of the multiplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| updatedChunk | string | amount in Wei of provided _chunk value |

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

### _updateUINT256param

```solidity
function _updateUINT256param() internal
```

_Pushes additional 'uint256' string to results in case, if there are no
types provided for uint256 values or
loadRemote command, is not in the processing or
the last chunk that was added to results is not 'uint256'_

### _parseFuncParams

```solidity
function _parseFuncParams(string _chunk, string _currentName, bool _isFunc) internal returns (bool)
```

_Checks parameters and updates DSL code depending on what
kind of function was provided.
This internal function expects 'func' that can be with and without parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a current chunk from the DSL string code |
| _currentName | string | is a current name of function |
| _isFunc | bool | describes if the func opcode was occured |

### _parseFuncMainData

```solidity
function _parseFuncMainData(string _chunk, string _currentName, bool _isFunc, bool _isName) internal pure returns (bool, bool, string)
```

_Returns updated parameters for the `func` opcode processing
Pushes the command that saves parameter in the smart contract instead
of the parameters that were provided for parsing.
The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
remove the parameter like `uint256 7`.
The DSL command will be stored before the function body.
For the moment it works only with uint256 type._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a current chunk from the DSL string code |
| _currentName | string | is a current name of function |
| _isFunc | bool | describes if the func opcode was occured |
| _isName | bool | describes if the name for the function was already set |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isFunc the new state of _isFunc for function processing |
| [1] | bool | isName the new state of _isName for function processing |
| [2] | string | name the new name of the function |

### _rebuildParameters

```solidity
function _rebuildParameters(uint256 _paramsCount, string _nameOfFunc) internal
```

_Rebuilds parameters to DSL commands in result's list.
Pushes the command that saves parameter in the smart contract instead
of the parameters that were provided for parsing.
The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
remove the parameter like `uint256 7`.
The DSL command will be stored before the function body.
For the moment it works only with uint256 type._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _paramsCount | uint256 | is an amount of parameters that provided after the name of function |
| _nameOfFunc | string | is a name of function that is used to generate the name of variables |

### _pushParameters

```solidity
function _pushParameters(uint256 _count) internal
```

_Pushes parameters to result's list depend on their type for each value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _count | uint256 | is an amount of parameters provided next to the name of func |

### _saveParameter

```solidity
function _saveParameter(uint256 _index, string _type, string _value, string _nameOfFunc) internal
```

_Saves parameters in mapping checking/using valid type for each value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a current chunk index from temporary chunks |
| _type | string | is a type of the parameter |
| _value | string | is a value of the parameter |
| _nameOfFunc | string | is a name of function that is used to generate the name of the current variable |

### _cleanCode

```solidity
function _cleanCode(uint256 _count) internal
```

_Clears useless variables from the DSL code string as
all needed parameters are already stored in chunks list_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _count | uint256 | is an amount of parameters provided next to the name of func. As parameters are stored with their types, the _count variable was already multiplied to 2 |

### _rebuildParameter

```solidity
function _rebuildParameter(string _type, string _value, string _variableName) internal
```

_Preparing and pushes the DSL command to results.
The comand will save this parameter and its name in the smart contract.
For example: `uint256 7 setUint256 NUMBER_VAR`
For the moment it works only with uint256 types._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _type | string | is a type of the parameter |
| _value | string | is a value of the parameter |
| _variableName | string | is a name of variable that was generated before |

### _pushFuncName

```solidity
function _pushFuncName(string _name) internal
```

_Pushes the func opcode and the name of the function_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | is a current name of the function |

### _isOperator

```solidity
function _isOperator(address _ctxAddr, string op) internal view returns (bool)
```

### _isAlias

```solidity
function _isAlias(address _ctxAddr, string _cmd) internal view returns (bool)
```

_Checks if a string is an alias to a command from DSL_

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

### _isDirectUseUint256

```solidity
function _isDirectUseUint256(bool _directUseUint256, bool _isStruct, string _chunk) internal pure returns (bool _isDirect)
```

_This function is used to check if 'transferFrom',
'sendEth' and 'transfer' functions(opcodes) won't use 'uint256' opcode during code
execution directly. So it needs to be sure that executed code won't mess up
parameters for the simple number and a number that be used for these functions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _directUseUint256 | bool | set by default from the outer function. Allows to keep current state of a contract |
| _isStruct | bool |  |
| _chunk | string | is a current chunk from the outer function |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isDirect | bool | is true if a chunk is matched one from the opcode list, otherwise is false |

### _updateRemoteParams

```solidity
function _updateRemoteParams(bool _loadRemoteFlag, uint256 _loadRemoteVarCount, string _chunk) internal pure returns (bool _flag, uint256 _count)
```

_As a 'loadRemote' opcode has 4 parameters in total and two of them are
numbers, so it is important to be sure that executed code under 'loadRemote'
won't mess parameters with the simple uint256 numbers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _loadRemoteFlag | bool | is used to check if it was started the set of parameters for 'loadRemote' opcode |
| _loadRemoteVarCount | uint256 | is used to check if it was finished the set of parameters for 'loadRemote' opcode |
| _chunk | string | is a current chunk from the outer function |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _flag | bool | is an updated or current value of _loadRemoteFlag |
| _count | uint256 | is an updated or current value of _loadRemoteVarCount |

