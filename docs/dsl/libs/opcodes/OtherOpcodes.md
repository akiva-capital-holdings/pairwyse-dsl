## OtherOpcodes

### opLoadRemoteAny

```solidity
function opLoadRemoteAny(address _ctxProgram, address _ctxDSL) public
```

### opCompound

```solidity
function opCompound(address _ctxProgram, address _ctxDSL) public
```

### _mustDelegateCall

```solidity
function _mustDelegateCall(address _ctxProgram, address _ctxDSL, string _opcode) internal
```

### opBlockNumber

```solidity
function opBlockNumber(address _ctxProgram, address) public
```

### opBlockTimestamp

```solidity
function opBlockTimestamp(address _ctxProgram, address) public
```

### opBlockChainId

```solidity
function opBlockChainId(address _ctxProgram, address) public
```

### opMsgSender

```solidity
function opMsgSender(address _ctxProgram, address) public
```

### opMsgValue

```solidity
function opMsgValue(address _ctxProgram, address) public
```

### opSetLocalBool

```solidity
function opSetLocalBool(address _ctxProgram, address) public
```

_Sets boolean variable in the application contract.
The value of bool variable is taken from DSL code itself_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opSetUint256

```solidity
function opSetUint256(address _ctxProgram, address) public
```

_Sets uint256 variable in the application contract. The value of the variable is taken from stack_

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

### opLoadLocalUint256

```solidity
function opLoadLocalUint256(address _ctxProgram, address) public
```

### opLoadLocalAddress

```solidity
function opLoadLocalAddress(address _ctxProgram, address) public
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

### opBool

```solidity
function opBool(address _ctxProgram, address) public
```

### opUint256

```solidity
function opUint256(address _ctxProgram, address) public
```

### opSendEth

```solidity
function opSendEth(address _ctxProgram, address) public
```

### _getAddress

```solidity
function _getAddress(address _ctxProgram) internal returns (address result)
```

### opTransfer

```solidity
function opTransfer(address _ctxProgram, address) public
```

### opTransferVar

```solidity
function opTransferVar(address _ctxProgram, address) public
```

### opTransferFrom

```solidity
function opTransferFrom(address _ctxProgram, address) public
```

### opTransferFromVar

```solidity
function opTransferFromVar(address _ctxProgram, address) public
```

### opBalanceOf

```solidity
function opBalanceOf(address _ctxProgram, address) public
```

### opAllowance

```solidity
function opAllowance(address _ctxProgram, address) public
```

### opMint

```solidity
function opMint(address _ctxProgram, address) public
```

### opBurn

```solidity
function opBurn(address _ctxProgram, address) public
```

### opLengthOf

```solidity
function opLengthOf(address _ctxProgram, address) public
```

### opUint256Get

```solidity
function opUint256Get(address _ctxProgram, address) public returns (uint256)
```

### opLoadLocalGet

```solidity
function opLoadLocalGet(address _ctxProgram, string funcSignature) public returns (bytes32 result)
```

### opAddressGet

```solidity
function opAddressGet(address _ctxProgram, address) public returns (address)
```

### opLoadLocal

```solidity
function opLoadLocal(address _ctxProgram, string funcSignature) public
```

### opLoadRemote

```solidity
function opLoadRemote(address _ctxProgram, string funcSignature) public
```

### opCompoundDeposit

```solidity
function opCompoundDeposit(address _ctxProgram) public
```

### opCompoundWithdraw

```solidity
function opCompoundWithdraw(address _ctxProgram) public
```

### _getTokenInfo

```solidity
function _getTokenInfo(address _ctxProgram) public returns (address, uint256)
```

### opEnableRecord

```solidity
function opEnableRecord(address _ctxProgram, address) public
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

