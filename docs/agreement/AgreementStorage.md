## AgreementStorage

AgreementStorage used to manage all variables

### isReserved

```solidity
modifier isReserved(bytes32 position)
```

### getStorageBool

```solidity
function getStorageBool(bytes32 position) external view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) external view returns (address data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) external view returns (uint256 data)
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, uint256 data) external
```

### setStorageBytes32

```solidity
function setStorageBytes32(bytes32 position, bytes32 data) external
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, address data) external
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bool data) external
```

