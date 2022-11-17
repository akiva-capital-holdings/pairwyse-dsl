## Parser

_Parser of DSL code
This contract is a singleton and should not be deployed more than once

One of the core contracts of the project. It parses DSL expression
that comes from user. After parsing code in Parser
a bytecode of the DSL program is generated as stored in Context

DSL code in postfix notation as string -> Parser -> raw bytecode_

### program

```solidity
bytes program
```

### cmds

```solidity
string[] cmds
```

### cmdIdx

```solidity
uint256 cmdIdx
```

### labelPos

```solidity
mapping(string => uint256) labelPos
```

### parse

```solidity
function parse(address _preprAddr, address _ctxAddr, string _codeRaw) external
```

_Transform DSL code from array in infix notation to raw bytecode_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _preprAddr | address |  |
| _ctxAddr | address | Context contract interface address |
| _codeRaw | string | Input code as a string in infix notation |

### asmSetLocalBool

```solidity
function asmSetLocalBool() public
```

_Updates the program with the bool value

Example of a command:
```
bool true
```_

### asmSetUint256

```solidity
function asmSetUint256() public
```

_Updates the program with the local variable value

Example of a command:
```
(uint256 5 + uint256 7) setUint256 VARNAME
```_

### asmDeclare

```solidity
function asmDeclare(address _ctxAddr) public
```

_Updates the program with the name(its position) of the array

Example of a command:
```
declare ARR_NAME
```_

### asmGet

```solidity
function asmGet() public
```

_Updates the program with the element by index from the provived array's name

Example of a command:
```
get 3 USERS
```_

### asmPush

```solidity
function asmPush() public
```

_Updates the program with the new item for the array, can be `uint256`,
`address` and `struct name` types.

Example of a command:
```
push ITEM ARR_NAME
```_

### asmVar

```solidity
function asmVar() public
```

_Updates the program with the loadLocal variable

Example of command:
```
var NUMBER
```_

### asmLoadRemote

```solidity
function asmLoadRemote(address _ctxAddr) public
```

_Updates the program with the loadRemote variable

Example of a command:
```
loadRemote bool MARY_ADDRESS 9A676e781A523b5d0C0e43731313A708CB607508
```_

### asmBool

```solidity
function asmBool() public
```

_Concatenates and updates previous `program` with the `0x01`
bytecode of `true` value otherwise `0x00` for `false`_

### asmUint256

```solidity
function asmUint256() public
```

_Concatenates and updates previous `program` with the
bytecode of uint256 value_

### asmSend

```solidity
function asmSend() public
```

_Updates previous `program` with the amount that will be send (in wei)

Example of a command:
```
sendEth RECEIVER 1234
```_

### asmTransfer

```solidity
function asmTransfer() public
```

_Updates previous `program` with the amount of tokens
that will be transfer to reciever(in wei). The `TOKEN` and `RECEIVER`
parameters should be stored in smart contract

Example of a command:
```
transfer TOKEN RECEIVER 1234
```_

### asmTransferVar

```solidity
function asmTransferVar() public
```

_Updates previous `program` with the amount of tokens
that will be transfer to reciever(in wei). The `TOKEN`, `RECEIVER`, `AMOUNT`
parameters should be stored in smart contract

Example of a command:
```
transferVar TOKEN RECEIVER AMOUNT
```_

### asmTransferFrom

```solidity
function asmTransferFrom() public
```

_Updates previous `program` with the amount of tokens
that will be transfer from the certain address to reciever(in wei).
The `TOKEN`, `FROM`, `TO` address parameters should be stored in smart contract

Example of a command:
```
transferFrom TOKEN FROM TO 1234
```_

### asmTransferFromVar

```solidity
function asmTransferFromVar() public
```

_Updates previous `program` with the amount of tokens
that will be transfer from the certain address to reciever(in wei).
The `TOKEN`, `FROM`, `TO`, `AMOUNT` parameters should be stored in smart contract

Example of a command:
```
transferFromVar TOKEN FROM TO AMOUNT
```_

### asmBalanceOf

```solidity
function asmBalanceOf() public
```

_Updates previous `program` with getting the amount of tokens
The `TOKEN`, `USER` address parameters should be stored in smart contract

Example of a command:
```
balanceOf TOKEN USER
```_

### asmLengthOf

```solidity
function asmLengthOf() public
```

_Updates previous `program` with getting the length of the dsl array by its name
The command return non zero value only if the array name was declared and have at least one value.
Check: `declareArr` and `push` commands for DSL arrays

Example of a command:
```
lengthOf ARR_NAME
```_

### asmSumOf

```solidity
function asmSumOf() public
```

_Updates previous `program` with the name of the dsl array that will
be used to sum uint256 variables

Example of a command:
```
sumOf ARR_NAME
```_

### asmSumThroughStructs

```solidity
function asmSumThroughStructs() public
```

_Updates previous `program` with the name of the dsl array and
name of variable in the DSL structure that will
be used to sum uint256 variables

Example of a command:
```
struct BOB {
  lastPayment: 3
}

struct ALISA {
  lastPayment: 300
}

sumThroughStructs USERS.lastPayment
or shorter version
sumOf USERS.lastPayment
```_

### asmIfelse

```solidity
function asmIfelse() public
```

_Updates previous `program` for positive and negative branch position

Example of a command:
```
6 > 5 // condition is here must return true or false
ifelse AA BB
end

branch AA {
  // code for `positive` branch
}

branch BB {
  // code for `negative` branch
}
```_

### asmIf

```solidity
function asmIf() public
```

_Updates previous `program` for positive branch position

Example of a command:
```
6 > 5 // condition is here must return true or false
if POSITIVE_ACTION
end

POSITIVE_ACTION {
  // code for `positive` branch
}
```_

### asmFunc

```solidity
function asmFunc() public
```

_Updates previous `program` for function code

Example of a command:
```
func NAME_OF_FUNCTION

NAME_OF_FUNCTION {
  // code for the body of function
}
```_

### asmStruct

```solidity
function asmStruct(address _ctxAddr) public
```

_Updates previous `program` for DSL struct.
This function rebuilds variable parameters using a name of the structure, dot symbol
and the name of each parameter in the structure

Example of DSL command:
```
struct BOB {
  account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
  lastPayment: 3
}
```

Example of commands that uses for this functions:
`cmds = ['struct', 'BOB', 'lastPayment', '3', 'account', '0x47f..', 'endStruct']`

`endStruct` word is used as an indicator for the ending loop for the structs parameters_

### asmForLoop

```solidity
function asmForLoop() public
```

_Parses variable names in for-loop & skip the unnecessary `in` parameter
Ex. ['for', 'LP_INITIAL', 'in', 'LPS_INITIAL']_

### asmEnableRecord

```solidity
function asmEnableRecord() public
```

_Parses the `record id` and the `agreement address` parameters
Ex. ['enableRecord', 'RECORD_ID', 'at', 'AGREEMENT_ADDRESS']_

### _isLabel

```solidity
function _isLabel(string _name) internal view returns (bool)
```

_returns `true` if the name of `if/ifelse branch` or `function` exists in the labelPos list
otherwise returns `false`_

### _parseCode

```solidity
function _parseCode(address _ctxAddr, string[] code) internal
```

_Сonverts a list of commands to bytecode_

### _parseOpcodeWithParams

```solidity
function _parseOpcodeWithParams(address _ctxAddr) internal
```

_Updates the bytecode `program` in dependence on
commands that were provided in `cmds` list_

### _nextCmd

```solidity
function _nextCmd() internal returns (string)
```

_Returns next commad from the cmds list, increases the
command index `cmdIdx` by 1_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | nextCmd string |

### _parseVariable

```solidity
function _parseVariable() internal
```

_Updates previous `program` with the next provided command_

### _parseBranchOf

```solidity
function _parseBranchOf(address _ctxAddr, string baseOpName) internal
```

_Updates previous `program` with the branch name, like `loadLocal` or `loadRemote`
of command and its additional used type_

### _parseAddress

```solidity
function _parseAddress() internal
```

_Updates previous `program` with the address command that is a value_

