## OpcodeHelpers

Opcode helper functions that are used in other opcode libraries

_Opcode libraries are: ComparisonOpcodes, BranchingOpcodes, LogicalOpcodes, and OtherOpcodes_

### putToStack

```solidity
function putToStack(address _ctx, uint256 _value) public
```

### nextBytes

```solidity
function nextBytes(address _ctx, uint256 size) public returns (bytes out)
```

### nextBytes1

```solidity
function nextBytes1(address _ctx) public returns (bytes1)
```

### readBytesSlice

```solidity
function readBytesSlice(address _ctx, uint256 _start, uint256 _end) public view returns (bytes32 res)
```

_Reads the slice of bytes from the raw program
Warning! The maximum slice size can only be 32 bytes!_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |
| _start | uint256 | Start position to read |
| _end | uint256 | End position to read |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| res | bytes32 | Bytes32 slice of the raw program |

### nextBranchSelector

```solidity
function nextBranchSelector(address _ctx, string baseOpName) public returns (bytes4)
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

### getNextBytes

```solidity
function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32)
```

