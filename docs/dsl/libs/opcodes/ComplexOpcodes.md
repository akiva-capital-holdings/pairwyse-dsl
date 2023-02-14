## ComplexOpcodes

_You should add to this file opcodes for some complex structures. These may be arrays, structs and others_

### opLoadRemoteAny

```solidity
function opLoadRemoteAny(address _ctxProgram, address _ctxDSL) public
```

### opLoadRemoteUint256

```solidity
function opLoadRemoteUint256(address _ctxProgram, address) public
```

### opLoadRemoteBytes32

```solidity
function opLoadRemoteBytes32(address _ctxProgram, address) public
```

### opLoadRemoteBool

```solidity
function opLoadRemoteBool(address _ctxProgram, address) public
```

### opLoadRemoteAddress

```solidity
function opLoadRemoteAddress(address _ctxProgram, address) public
```

### opDeclare

```solidity
function opDeclare(address _ctxProgram, address) public
```

_Declares an empty array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opPush

```solidity
function opPush(address _ctxProgram, address) public
```

_Inserts an item to array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opGet

```solidity
function opGet(address _ctxProgram, address) public
```

_Gets an element by its index in the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opLengthOf

```solidity
function opLengthOf(address _ctxProgram, address) public
```

_Get length of an array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opSumOf

```solidity
function opSumOf(address _ctxProgram, address _ctxDSL) public
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSLContext contract instance address |

### opSumThroughStructs

```solidity
function opSumThroughStructs(address _ctxProgram, address _ctxDSL) public
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSLContext contract instance address |

### opVotersBalance

```solidity
function opVotersBalance(address _ctxProgram, address) public
```

_Finds a sum of all tokens of users in the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opStruct

```solidity
function opStruct(address _ctxProgram, address) public
```

_Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
the structs parameters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompound

```solidity
function opCompound(address _ctxProgram, address _ctxDSL) public
```

_Master opcode to interact with Compound V2. Needs sub-commands to be executed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSLContext contract address |

### opCompoundDeposit

```solidity
function opCompoundDeposit(address _ctxProgram) public
```

Sub-command of Compound V2. Makes a deposit of funds to Compound V2

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opCompoundWithdraw

```solidity
function opCompoundWithdraw(address _ctxProgram) public
```

Sub-command of Compound V2. Makes a withdrawal of funds to Compound V2

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### _sumOfStructVars

```solidity
function _sumOfStructVars(address _ctxProgram, bytes32 _arrNameB32, bytes4 _varName, bytes32 _length) internal returns (uint256 total)
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _varName | bytes4 | Struct's name in bytecode |
| _length | bytes32 | Array's length in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | Total sum of each element in the `struct` type of array |

### _opLoadRemote

```solidity
function _opLoadRemote(address _ctxProgram, string _funcSignature) internal
```

_Loads a variable value from another smart contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _funcSignature | string | Signature of the "read" function |

### _mustDelegateCall

```solidity
function _mustDelegateCall(address _ctxProgram, address _ctxDSL, string _opcode) internal
```

_Makes a delegate call and ensures it is successful_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSLContext contract address |
| _opcode | string | Opcode string |

### _getArrLength

```solidity
function _getArrLength(address _ctxProgram, bytes32 _arrNameB32) internal returns (bytes32 result)
```

_Returns array's length_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _arrNameB32 | bytes32 | Array's name in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes32 | Array's length in bytecode |

### _getItem

```solidity
function _getItem(address _ctxProgram, uint256 _index, bytes32 _arrNameB32) internal returns (bytes item)
```

_Returns the element from the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _index | uint256 | Array's index |
| _arrNameB32 | bytes32 | Array's name in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| item | bytes | Item from the array by its index |

### _sumOfVars

```solidity
function _sumOfVars(address _ctxProgram, bytes32 _arrNameB32, bytes32 _length) internal returns (uint256 total)
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _length | bytes32 | Array's length in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | Total sum of each element in the `uint256` type of array |

### _checkArrType

```solidity
function _checkArrType(address _ctxDSL, address _ctxProgram, bytes32 _arrNameB32, string _typeName) internal
```

_Checks the type for array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxDSL | address | DSLContext contract address |
| _ctxProgram | address | ProgramContext contract address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _typeName | string | Type of the array, ex. `uint256`, `address`, `struct` |

