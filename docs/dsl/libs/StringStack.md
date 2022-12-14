## StringStack

### pushToStack

```solidity
function pushToStack(string[] _stack, string _element) external pure returns (string[])
```

_Push element to array in the first position
As the array has fixed size, we drop the last element when addind a new one to the beginning of the array_

### popFromStack

```solidity
function popFromStack(string[] _stack) external pure returns (string[], string)
```

### stackLength

```solidity
function stackLength(string[] _stack) public pure returns (uint256)
```

### seeLastInStack

```solidity
function seeLastInStack(string[] _stack) public pure returns (string)
```

