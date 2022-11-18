## StringStack

_This library has all the functions to use solidity string array as a struct_

### pushToStack

```solidity
function pushToStack(string[] _stack, string _element) external pure returns (string[])
```

_Push element to array in the first position
As the array has fixed size, we drop the last element when addind a new one to the beginning of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _stack | string[] | String stack |
| _element | string | String to be added to the stack |

### popFromStack

```solidity
function popFromStack(string[] _stack) external pure returns (string[], string)
```

_Removes the top element from the stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _stack | string[] | String stack |

### stackLength

```solidity
function stackLength(string[] _stack) public pure returns (uint256)
```

_Returns the current length of stack (excluding empty strings!)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _stack | string[] | String stack |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The length of the stack excluding empty strings |

### seeLastInStack

```solidity
function seeLastInStack(string[] _stack) public pure returns (string)
```

_Returns the top element in the stack without removing it_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _stack | string[] | String stack |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The top element in the stack |

