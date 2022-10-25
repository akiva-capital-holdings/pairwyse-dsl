# Agreement: DAI <-> ETH lender-borrower

## Versions

```
➜ node -v
v16.13.1
➜  yarn -v
1.22.17
```

Node

## Steps to reproduce

### Launch Mainnet fork

1. Run a hardhat node as a fork of Ethereum Mainnet

```
yarn hardhat node --fork https://mainnet.infura.io/v3/<YOUR_INFURA_KEY>
```

### Impersonate EOAs having DAI balances & Aggregate at least 5000 DAI to Alice's account

2. In a new terminal run

```
hh --network localhost impersonate-dai-holders
```
