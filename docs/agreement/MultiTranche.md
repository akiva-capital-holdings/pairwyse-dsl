## MultiTranche

Financial Agreement written in DSL between two or more users
Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

### deadline

```solidity
uint256 deadline
```

### token

```solidity
address token
```

### wrappedUSDC1

```solidity
contract ERC20Token wrappedUSDC1
```

### baseRecord

```solidity
mapping(uint256 => bool) baseRecord
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _token, address _dslContext, uint256 _deadline) public
```

Sets parser address, creates new Context instance, and setups Context

### mintWrappedUSDC

```solidity
function mintWrappedUSDC(address spender) external
```

