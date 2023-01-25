## OpcodeHelpersMock

### putToStack

```solidity
function putToStack(address _ctxProgram, uint256 _value) public
```

### nextBytes

```solidity
function nextBytes(address _ctxProgram, uint256 _size) public returns (bytes)
```

### nextBytes1

```solidity
function nextBytes1(address _ctxProgram) public returns (bytes1)
```

### nextBranchSelector

```solidity
function nextBranchSelector(address _ctxDSL, address _ctxProgram, string _baseOpName) public returns (bytes4)
```

### mustCall

```solidity
function mustCall(address _addr, bytes _data) public
```

### mustDelegateCall

```solidity
function mustDelegateCall(address _addr, bytes _data) public
```

### getNextBytes

```solidity
function getNextBytes(address _ctxProgram, uint256 _bytesNum) public returns (bytes32)
```


