## StringStack

_This library has all the functions to use solidity string array as a struct_

### pushToStack

```solidity
function pushToStack(string[] _stack, string _element) external pure returns (string[])
```

_Push element to array in the first position
As the array has fixed size, we drop the last element
when addind a new one to the beginning of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _stack | string[] | String stack |
| _element | string | String to be added to the stack |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | Modified stack |

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


