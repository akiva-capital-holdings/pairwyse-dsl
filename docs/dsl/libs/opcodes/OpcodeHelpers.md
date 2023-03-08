## OpcodeHelpers

Opcode helper functions that are used in other opcode libraries

_Opcode libraries are: ComparisonOpcodes, BranchingOpcodes, LogicalOpcodes, and OtherOpcodes_

### putToStack

```solidity
function putToStack(address _ctxProgram, uint256 _value) public
```

### getNextBytes

```solidity
function getNextBytes(address _ctxProgram, uint256 _size) public returns (bytes out)
```

_Gets next {size} bytes from the program_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
| _size | uint256 | Size of the chunk |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| out | bytes | Resulting chunk of type bytes |

### getNextBytes32

```solidity
function getNextBytes32(address _ctxProgram, uint256 _size) public returns (bytes32 result)
```

_Get next parameter from the program that is executing now_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _size | uint256 | Size of the chunk |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes32 | The bytes32-sized slice of the program |

### addItemToArray

```solidity
function addItemToArray(address _ctxProgram, bytes32 _varValue, bytes32 _arrNameB32) public
```

_add value in bytes32 to array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
| _varValue | bytes32 | added value |
| _arrNameB32 | bytes32 | name of array |

### readBytesSlice

```solidity
function readBytesSlice(address _ctxProgram, uint256 _start, uint256 _end) public view returns (bytes32 result)
```

_Reads the slice of bytes from the raw program
Warning! The maximum slice size can only be 32 bytes!_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
| _start | uint256 | Start position to read |
| _end | uint256 | End position to read |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes32 | Bytes32 slice of the raw program |

### nextBranchSelector

```solidity
function nextBranchSelector(address _ctxDSL, address _ctxProgram, string baseOpName) public returns (bytes4 result)
```

### mustCall

```solidity
function mustCall(address addr, bytes data) public returns (bytes)
```

_Check .call() function and returns data_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Context contract address |
| data | bytes | Abi fubction with params |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | callData returns data from call |

### mustDelegateCall

```solidity
function mustDelegateCall(address addr, bytes data) public returns (bytes)
```

_Check .delegatecall() function and returns data_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Context contract address |
| data | bytes | Abi fubction with params |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | delegateCallData returns data from call |

### getAddress

```solidity
function getAddress(address _ctxProgram) public returns (address result)
```

_Reads a variable of type `address`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | address | The address value |

### getUint256

```solidity
function getUint256(address _ctxProgram, address) public returns (uint256 result)
```

_Reads a uint256 number from the program_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | uint256 | uint256 value from the program |

### getLocalVar

```solidity
function getLocalVar(address _ctxProgram, string _funcSignature) public returns (bytes32 result)
```

_Read local variable by delegatecalling a "read" function by its signature_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _funcSignature | string | Signature of the "read" function |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes32 | Local variable value |

