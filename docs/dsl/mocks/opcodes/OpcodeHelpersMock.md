## OpcodeHelpersMock

### putToStack

```solidity
function putToStack(address _ctxProgram, uint256 _value) public
```

### getNextBytes

```solidity
function getNextBytes(address _ctxProgram, uint256 _size) public returns (bytes)
```

### getNextBytes32

```solidity
function getNextBytes32(address _ctxProgram, uint256 _size) public returns (bytes32)
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


