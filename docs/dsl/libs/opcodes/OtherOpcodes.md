## OtherOpcodes

### opLoadRemoteAny

```solidity
function opLoadRemoteAny(address _ctx) public
```

### opBlockNumber

```solidity
function opBlockNumber(address _ctx) public
```

### opBlockTimestamp

```solidity
function opBlockTimestamp(address _ctx) public
```

### opBlockChainId

```solidity
function opBlockChainId(address _ctx) public
```

### opMsgSender

```solidity
function opMsgSender(address _ctx) public
```

### opMsgValue

```solidity
function opMsgValue(address _ctx) public
```

### opSetLocalBool

```solidity
function opSetLocalBool(address _ctx) public
```

_Sets boolean variable in the application contract.
The value of bool variable is taken from DSL code itself_

### opSetUint256

```solidity
function opSetUint256(address _ctx) public
```

_Sets uint256 variable in the application contract. The value of the variable is taken from stack_

### opGet

```solidity
function opGet(address _ctx) public
```

_Gets an element by its index in the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opSumOf

```solidity
function opSumOf(address _ctx) public
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opSumThroughStructs

```solidity
function opSumThroughStructs(address _ctx) public
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opStruct

```solidity
function opStruct(address _ctx) public
```

_Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
the structs parameters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opPush

```solidity
function opPush(address _ctx) public
```

_Inserts an item to array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opDeclare

```solidity
function opDeclare(address _ctx) public
```

_Declares an empty array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opLoadLocalUint256

```solidity
function opLoadLocalUint256(address _ctx) public
```

### opLoadLocalAddress

```solidity
function opLoadLocalAddress(address _ctx) public
```

### opLoadRemoteUint256

```solidity
function opLoadRemoteUint256(address _ctx) public
```

### opLoadRemoteBytes32

```solidity
function opLoadRemoteBytes32(address _ctx) public
```

### opLoadRemoteBool

```solidity
function opLoadRemoteBool(address _ctx) public
```

### opLoadRemoteAddress

```solidity
function opLoadRemoteAddress(address _ctx) public
```

### opBool

```solidity
function opBool(address _ctx) public
```

### opUint256

```solidity
function opUint256(address _ctx) public
```

### opSendEth

```solidity
function opSendEth(address _ctx) public
```

### opTransfer

```solidity
function opTransfer(address _ctx) public
```

### opTransferVar

```solidity
function opTransferVar(address _ctx) public
```

### opTransferFrom

```solidity
function opTransferFrom(address _ctx) public
```

### opBalanceOf

```solidity
function opBalanceOf(address _ctx) public
```

### opLengthOf

```solidity
function opLengthOf(address _ctx) public
```

### opTransferFromVar

```solidity
function opTransferFromVar(address _ctx) public
```

### opUint256Get

```solidity
function opUint256Get(address _ctx) public returns (uint256)
```

### opLoadLocalGet

```solidity
function opLoadLocalGet(address _ctx, string funcSignature) public returns (bytes32 result)
```

### opAddressGet

```solidity
function opAddressGet(address _ctx) public returns (address)
```

### opLoadLocal

```solidity
function opLoadLocal(address _ctx, string funcSignature) public
```

### opLoadRemote

```solidity
function opLoadRemote(address _ctx, string funcSignature) public
```

### opEnableRecord

```solidity
function opEnableRecord(address _ctx) public
```

### _sumOfStructVars

```solidity
function _sumOfStructVars(address _ctx, bytes32 _arrNameB32, bytes4 _varName, bytes32 _length) internal returns (uint256 total)
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _varName | bytes4 | Struct's name in bytecode |
| _length | bytes32 | Array's length in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | Total sum of each element in the `struct` type of array |

### _getItem

```solidity
function _getItem(address _ctx, uint256 _index, bytes32 _arrNameB32) internal returns (bytes)
```

_Returns the element from the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _index | uint256 | Array's index |
| _arrNameB32 | bytes32 | Array's name in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | item Item from the array by its index |

### _sumOfVars

```solidity
function _sumOfVars(address _ctx, bytes32 _arrNameB32, bytes32 _length) internal returns (uint256 total)
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _length | bytes32 | Array's length in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | Total sum of each element in the `uint256` type of array |

### _checkArrType

```solidity
function _checkArrType(address _ctx, bytes32 _arrNameB32, string _typeName) internal
```

_Checks the type for array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _typeName | string | Type of the array, ex. `uint256`, `address`, `struct` |

### _getArrLength

```solidity
function _getArrLength(address _ctx, bytes32 _arrNameB32) internal returns (bytes32)
```

_Returns array's length_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | Array's length in bytecode |

