## Array

### ValueTypes

```solidity
enum ValueTypes {
  ADDRESS,
  UINT256,
  BYTES32,
  BOOL
}
```

### setStorage

```solidity
function setStorage(string arrName, bool isArray, uint8 elemsType, bytes4 nextPtr) external
```

### getStorage

```solidity
function getStorage(string arrName) external view returns (bool isArray, uint8 elemsType, bytes4 nextPrt)
```


