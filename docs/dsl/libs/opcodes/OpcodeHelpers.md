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
function mustCall(address addr, bytes data) public
```

### getNextBytes

```solidity
function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32)
```

