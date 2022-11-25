## OtherOpcodes

### opLoadRemoteAny

```solidity
function opLoadRemoteAny(address _ctxDSL, address _ctxProgram) public
```

### opBlockNumber

```solidity
function opBlockNumber(address _ctxProgram) public
```

### opBlockTimestamp

```solidity
function opBlockTimestamp(address _ctxProgram) public
```

### opBlockChainId

```solidity
function opBlockChainId(address _ctxProgram) public
```

### opMsgSender

```solidity
function opMsgSender(address _ctxProgram) public
```

### opMsgValue

```solidity
function opMsgValue(address _ctxProgram) public
```

### opSetLocalBool

```solidity
function opSetLocalBool(address _ctxProgram) public
```

_Sets boolean variable in the application contract.
The value of bool variable is taken from DSL code itself_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opSetUint256

```solidity
function opSetUint256(address _ctxProgram) public
```

_Sets uint256 variable in the application contract. The value of the variable is taken from stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opGet

```solidity
function opGet(address _ctxProgram) public
```

_Gets an element by its index in the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opSumOf

```solidity
function opSumOf(address _ctxDSL, address _ctxProgram) public
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxDSL | address | DSLContext contract instance address |
| _ctxProgram | address | ProgramContext contract address |

### opSumThroughStructs

```solidity
function opSumThroughStructs(address _ctxDSL, address _ctxProgram) public
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxDSL | address | DSLContext contract instance address |
| _ctxProgram | address | ProgramContext contract address |

### opStruct

```solidity
function opStruct(address _ctxProgram) public
```

_Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
the structs parameters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opPush

```solidity
function opPush(address _ctxProgram) public
```

_Inserts an item to array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opDeclare

```solidity
function opDeclare(address _ctxProgram) public
```

_Declares an empty array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

### opLoadLocalUint256

```solidity
function opLoadLocalUint256(address _ctxProgram) public
```

### opLoadLocalAddress

```solidity
function opLoadLocalAddress(address _ctxProgram) public
```

### opLoadRemoteUint256

```solidity
function opLoadRemoteUint256(address _ctxProgram) public
```

### opLoadRemoteBytes32

```solidity
function opLoadRemoteBytes32(address _ctxProgram) public
```

### opLoadRemoteBool

```solidity
function opLoadRemoteBool(address _ctxProgram) public
```

### opLoadRemoteAddress

```solidity
function opLoadRemoteAddress(address _ctxProgram) public
```

### opBool

```solidity
function opBool(address _ctxProgram) public
```

### opUint256

```solidity
function opUint256(address _ctxProgram) public
```

### opSendEth

```solidity
function opSendEth(address _ctxProgram) public
```

### opTransfer

```solidity
function opTransfer(address _ctxProgram) public
```

### opTransferVar

```solidity
function opTransferVar(address _ctxProgram) public
```

### opTransferFrom

```solidity
function opTransferFrom(address _ctxProgram) public
```

### opBalanceOf

```solidity
function opBalanceOf(address _ctxProgram) public
```

### opLengthOf

```solidity
function opLengthOf(address _ctxProgram) public
```

### opTransferFromVar

```solidity
function opTransferFromVar(address _ctxProgram) public
```

### opUint256Get

```solidity
function opUint256Get(address _ctxProgram) public returns (uint256)
```

### opLoadLocalGet

```solidity
function opLoadLocalGet(address _ctxProgram, string funcSignature) public returns (bytes32 result)
```

### opAddressGet

```solidity
function opAddressGet(address _ctxProgram) public returns (address)
```

### opLoadLocal

```solidity
function opLoadLocal(address _ctxProgram, string funcSignature) public
```

### opLoadRemote

```solidity
function opLoadRemote(address _ctxProgram, string funcSignature) public
```

### opEnableRecord

```solidity
function opEnableRecord(address _ctxProgram) public
```

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

### _getArrLength

```solidity
function _getArrLength(address _ctxProgram, bytes32 _arrNameB32) internal returns (bytes32)
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
| [0] | bytes32 | Array's length in bytecode |

