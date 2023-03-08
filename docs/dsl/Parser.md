## Parser

_Parser of DSL code. This contract is a singleton and should not
be deployed more than once

One of the core contracts of the project. It parses DSL expression
that comes from user. After parsing code in Parser
a bytecode of the DSL program is generated as stored in ProgramContext

DSL code in postfix notation as string -> Parser -> raw bytecode_

### cmds

```solidity
string[] cmds
```

### cmdIdx

```solidity
uint256 cmdIdx
```

### parse

```solidity
function parse(address _preprAddr, address _dslCtxAddr, address _programCtxAddr, string _codeRaw) external
```

_Transform DSL code from array in infix notation to raw bytecode_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _preprAddr | address |  |
| _dslCtxAddr | address | DSLContext contract address |
| _programCtxAddr | address | ProgramContext contract address |
| _codeRaw | string | Input code as a string in infix notation |

### parseCode

```solidity
function parseCode(address _dslCtxAddr, address _programCtxAddr, string[] _code) public
```

_Сonverts a list of commands to bytecode_

### asmSetLocalBool

```solidity
function asmSetLocalBool(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates the program with the bool value

Example of a command:
```
bool true
```_

### asmSetUint256

```solidity
function asmSetUint256(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates the program with the local variable value

Example of a command:
```
(uint256 5 + uint256 7) setUint256 VARNAME
```_

### asmDeclare

```solidity
function asmDeclare(bytes _program, address _ctxDSLAddr, address) public returns (bytes newProgram)
```

_Updates the program with the name (its position) of the array

Example of a command:
```
declare ARR_NAME
```_

### asmCompound

```solidity
function asmCompound(bytes _program, address _ctxDSLAddr, address) public returns (bytes newProgram)
```

_Interacts with Compound cUSDC smart contract to make a deposit or withdrawal

Example of a command:
```
compound deposit USDC
compound withdraw USDC
```_

### asmGet

```solidity
function asmGet(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates the program with the element by index from the provived array's name

Example of a command:
```
get 3 USERS
```_

### asmPush

```solidity
function asmPush(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates the program with the new item for the array, can be `uint256`,
`address` and `struct name` types.

Example of a command:
```
push ITEM ARR_NAME
```_

### asmVar

```solidity
function asmVar(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates the program with the loadLocal variable

Example of command:
```
var NUMBER
```_

### asmLoadRemote

```solidity
function asmLoadRemote(bytes _program, address _ctxDSLAddr, address) public returns (bytes newProgram)
```

_Updates the program with the loadRemote variable

Example of a command:
```
loadRemote bool MARY_ADDRESS 9A676e781A523b5d0C0e43731313A708CB607508
```_

### asmBool

```solidity
function asmBool(bytes _program, address, address) public returns (bytes newProgram)
```

_Concatenates and updates previous `program` with the `0x01`
bytecode of `true` value otherwise `0x00` for `false`_

### asmUint256

```solidity
function asmUint256(bytes _program, address, address) public returns (bytes)
```

_Concatenates and updates previous `program` with the
bytecode of uint256 value_

### asmSend

```solidity
function asmSend(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates previous `program` with the amount that will be send (in wei)

Example of a command:
```
sendEth RECEIVER 1234
```_

### asmTransfer

```solidity
function asmTransfer(bytes _program, address, address) public returns (bytes newProgram)
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
function asmTransferVar(bytes _program, address, address) public returns (bytes newProgram)
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
function asmTransferFrom(bytes _program, address, address) public returns (bytes newProgram)
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
function asmTransferFromVar(bytes _program, address, address) public returns (bytes newProgram)
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
function asmBalanceOf(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates previous `program` with getting the amount of tokens
The `TOKEN`, `USER` address parameters should be stored in smart contract

Example of a command:
```
balanceOf TOKEN USER
```_

### asmAllowanceMintBurn

```solidity
function asmAllowanceMintBurn(bytes _program, address, address) public returns (bytes newProgram)
```

### asmLengthOf

```solidity
function asmLengthOf(bytes _program, address, address) public returns (bytes)
```

_Updates previous `program` with getting the length of the dsl array by its name
The command return non zero value only if the array name was declared and have at least one value.
Check: `declareArr` and `push` commands for DSL arrays

Example of a command:
```
lengthOf ARR_NAME
```_

### asmVotersbalance

```solidity
function asmVotersbalance(bytes _program, address, address) public returns (bytes newProgram)
```

_Updates previous `program` with getting the sum of voters tokens
The `TOKEN`, `ARRAY` address parameters should be stored in smart contract

Example of a command:
```
votersBalance TOKEN ARRAY_NAME
```_

### asmSumOf

```solidity
function asmSumOf(bytes _program, address, address) public returns (bytes)
```

_Updates previous `program` with the name of the dsl array that will
be used to sum uint256 variables

Example of a command:
```
sumOf ARR_NAME
```_

### asmSumThroughStructs

```solidity
function asmSumThroughStructs(bytes _program, address, address) public returns (bytes newProgram)
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
function asmIfelse(bytes _program, address, address _programCtxAddr) public returns (bytes newProgram)
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
function asmIf(bytes _program, address, address _programCtxAddr) public returns (bytes newProgram)
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
function asmFunc(bytes _program, address, address _programCtxAddr) public returns (bytes newProgram)
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
function asmStruct(bytes _program, address, address _programCtxAddr) public returns (bytes newProgram)
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
function asmForLoop(bytes _program, address, address) public returns (bytes newProgram)
```

_Parses variable names in for-loop & skip the unnecessary `in` parameter
Ex. ['for', 'LP_INITIAL', 'in', 'LPS_INITIAL']_

### asmEnableRecord

```solidity
function asmEnableRecord(bytes _program, address, address) public returns (bytes newProgram)
```

_Parses the `record id` and the `agreement address` parameters
Ex. ['enableRecord', 'RECORD_ID', 'at', 'AGREEMENT_ADDRESS']_

### _isLabel

```solidity
function _isLabel(address _programCtxAddr, string _name) internal view returns (bool)
```

_returns `true` if the name of `if/ifelse branch` or `function` exists in the labelPos list
otherwise returns `false`_

### _getLabelPos

```solidity
function _getLabelPos(address _programCtxAddr, string _name) internal view returns (uint256)
```

### _parseOpcodeWithParams

```solidity
function _parseOpcodeWithParams(address _dslCtxAddr, address _programCtxAddr, bytes _program) internal returns (bytes newProgram)
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
function _parseVariable(bytes _program) internal returns (bytes newProgram)
```

_Updates previous `program` with the next provided command_

### _parseBranchOf

```solidity
function _parseBranchOf(bytes _program, address _ctxDSLAddr, string baseOpName) internal returns (bytes newProgram)
```

_Updates previous `program` with the branch name, like `loadLocal` or `loadRemote`
of command and its additional used type_

### _parseAddress

```solidity
function _parseAddress(bytes _program) internal returns (bytes newProgram)
```

_Updates previous `program` with the address command that is a value_

### _setCmdsArray

```solidity
function _setCmdsArray(string[] _input) internal
```

_Deletes empty elements from the _input array and sets the result as a `cmds` storage array_

### _setLabelPos

```solidity
function _setLabelPos(address _programCtxAddr, string _name, uint256 _value) internal
```


