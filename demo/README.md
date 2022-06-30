# Demo steps

## Remote Ganache node addresses

Deployer (Ganache[0]): 0x801f54bE16B0d824Cd96CFc67f4E142327Ccde46

Alice (Ganache[1]): 0x764E1431Bc7f0D2351Daf2e771729F5D230493A0

Bob (Ganache[2]): 0x7e57B32aCB1FE54Ae92F8aDe15Fa026512b80819

Mnemonic: key tennis float pole always invite spray bread motion crack gossip begin

## Deploy AgreementFactory, ContextFactory, and Parser

### (remote Ganache node)

Note: use solidity-dsl repo for this

```
npx hardhat run --network remoteGanache scripts/deploy.agreementFactory.ts
```

```
npx hardhat run --network remoteGanache scripts/deploy.contextFactory.ts
```

```
npx hardhat run --network remoteGanache scripts/deploy.parser.ts
```

## Copy variables to front end

Note: use dsl-fe repo for this

Copy generated addresses of the smart contracts to front end React app to `.env.development` file as `REACT_APP_AGREEMENT_FACTORY`, `REACT_APP_CONTEXT_FACTORY`, and `REACT_APP_PARSER`.

## Run front end

Note: use dsl-fe repo for this

```
yarn start
```

## Create Agreement

Connect to the website using Metamask. The connected account should be Deployer (0x801f54bE16B0d824Cd96CFc67f4E142327Ccde46). The network should be our remote Ganache Node (RPC URL: http://18.212.246.132:8545/; Chain ID: 5777)

On FE open console in the dev tools in you browser. Go to 'Agreement Interaction' -> 'Agreement Request' and create Agreement. The address of the newly created Agreement will appear in console as `lastAgrAddr`. Copy this address, you'll need it later.

## Define variables

On FE go to 'Agreement Interaction' -> 'Agreement Request' and define a new variable. To do that fill in the following input field accordingly:

- Agreement - <the address that you've got on the previous step>
- Definition - this is the variable name. Put `RECEIVER` here
- Specification (address) - this is the value of the variable that should be of type address. Put `0x7e57B32aCB1FE54Ae92F8aDe15Fa026512b80819` which is Bob address

Hit `Request Approval` button to define a new variable

## Add conditional transactions to Agreement

On FE go to 'Agreement Interaction' -> 'Update Request' and add new conditional transaction to Agreement. To do that fill in the following input field accordingly:

- ID - unique per Agreement identifier. Could be any number if this is your first conditional transaction
- Agreement - <the address that you've got on the previous step>
- Signatory - signatory of the conditional transaction. Put `0x764E1431Bc7f0D2351Daf2e771729F5D230493A0` which is Alice address
- Condition. Put `bool true`
- Transaction. Put `sendEth RECEIVER 100000000000000000`

Hit `Request Approval` and confirm ALL of the following transactions

## Top up ConditionalTxs contract

Note: use solidity-dsl repo for this

Update `agreementAddr` variable. Then run

```
npx hardhat run --network remoteGanache demo/4-topUpAgreement.ts
```

## Execute Agreement

Update `agreementAddr` and `txId` variables. for `txId` use the value that you've used in 'Update Agreement' step.

Check the current balance of Bob. When you execute the transaction it will increase by 0.1 ETH.

Run

```
npx hardhat run --network remoteGanache demo/5-executeAgreement.ts
```

Check Bob balance and make sure it increased by 0.1 ETH.
