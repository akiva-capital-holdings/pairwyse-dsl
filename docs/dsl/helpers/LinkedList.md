## LinkedList

TODO:
add the possibility to work with arrays on the DSL level
variable ARR_NAME -> [type: array,elementType: uint256, linkToNextEl: 0x123]
(next element): [data: 0x0001, linkToNextEl: 0x124]
(last element): [data: 0x0005, linkToNextEl: 0x000]

### EMPTY

```solidity
bytes32 EMPTY
```

### heads

```solidity
mapping(bytes32 => bytes32) heads
```

### types

```solidity
mapping(bytes32 => bytes1) types
```

### lengths

```solidity
mapping(bytes32 => uint256) lengths
```

### getType

```solidity
function getType(bytes32 _arrName) external view returns (bytes1)
```

_Returns length of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arrName | bytes32 | is a bytecode of the array name |

### getLength

```solidity
function getLength(bytes32 _arrName) external view returns (uint256)
```

_Returns length of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arrName | bytes32 | is a bytecode of the array name |

### get

```solidity
function get(uint256 _index, bytes32 _arrName) public view returns (bytes32 data)
```

_Returns the item data from the array by its index_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is an index of the item in the array that starts from 0 |
| _arrName | bytes32 | is a bytecode of the array name |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes32 | is a bytecode of the item from the array or empty bytes if no item exists by this index |

### declare

```solidity
function declare(bytes1 _type, bytes32 _arrName) external
```

_Declares the new array in dependence of its type_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _type | bytes1 | is a bytecode type of the array. Bytecode of each type can be find in Context contract |
| _arrName | bytes32 | is a bytecode of the array name |

### addItem

```solidity
function addItem(bytes32 _item, bytes32 _arrName) external
```

_Pushed item to the end of the array. Increases the length of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _item | bytes32 | is a bytecode type of the array. Bytecode of each type can be find in Context contract |
| _arrName | bytes32 | is a bytecode of the array name |

### getHead

```solidity
function getHead(bytes32 _arrName) public view returns (bytes32)
```

_Returns the head position of the array:
- `bytes32(0x0)` value if array has not declared yet,
- `bytes32(type(uint256).max` if array was just declared but it is empty
- `other bytecode` with a position of the first element of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arrName | bytes32 | is a bytecode of the array name |

### _insertItem

```solidity
function _insertItem(bytes32 _position, bytes32 _item) internal
```

_Insert item in the array by provided position. Updates new storage pointer
for the future inserting_

### _updateLinkToNextItem

```solidity
function _updateLinkToNextItem(bytes32 _position, bytes32 _nextPosition) internal
```

_Updates the next position for the provided(current) position_

### _getEmptyMemoryPosition

```solidity
function _getEmptyMemoryPosition() internal view returns (bytes32 position)
```

_Uses 0x40 position as free storage pointer that returns value of current free position.
In this contract it 0x40 position value updates by _insertItem function anfter
adding new item in the array. See: mload - free memory pointer in the doc_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| position | bytes32 | is a value that stores in the 0x40 position in the storage |

### _getData

```solidity
function _getData(bytes32 _position) internal view returns (bytes32 data, bytes32 nextPosition)
```

_Returns the value of current position and the position(nextPosition)
to the next object in array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _position | bytes32 | is a current item position in the array |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes32 | is a current data stored in the _position |
| nextPosition | bytes32 | is a next position to the next item in the array |

