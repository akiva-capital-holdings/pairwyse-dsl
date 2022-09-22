# Agreement Transferring Funds Demo

## Versions

```
➜ node -v
v16.13.1
➜  yarn -v
1.22.17
```

Node

## Steps to reproduce

### Setup Solidity SC

1. Open a new terminal window.
2. `git clone https://github.com/akiva-capital-holdings/solidity-dsl.git`
3. `cd solidity-dsl`
4. `git checkout 40daf2a339f1e639e2d7961596bd55efd1eaca99`
5. `yarn`
6. In one terminal window: `npx hardhat node`
7. In another terminal window: `npx hardhat run --network localhost scripts/deploy.demoV2.ts`. Write down the ContextFactory, Parser, and Preprocessor addresses that are displayed in the console. This script also have generated a new file: `scripts/agreement.bytecode`. The file contents Agreement bytecode; copy this bytecode.

### Setup FE

1. Open a new terminal window.
2. `git clone https://github.com/akiva-capital-holdings/dsl-fe.git`
3. `cd dsl-fe`
4. `git checkout e1533d71a1422ea8b8fae5b5828a6e31d5fb3a3f`
5. `yarn`
6. Modify `.env.locale`:

   - Set `REACT_APP_PARSER` to Parser address that you've written down
   - Set `REACT_APP_PREPROCESSOR` to Preprocessor address that you've written down
   - Set `REACT_APP_CONTEXT_FACTORY` to ContextFactory address that you've written down

7. Copy a bytecode of Agreement that you've written down and paste it in `src/data/agreement.json` file in the `bytecode` section.

8. `yarn start:locale`

### Setup MetaMask

1. Add a new network:
   - Network name: `Localhost` or any other
   - New RPC URL: `http://localhost:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
2. Import a new account with private key `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`. Call it `Alice (hardhat)`
3. Import a new account with private key `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`. Call it `Bob (hardhat)`

![MetaMask-Setup](img/MetaMask-setup.png)

### Reset MetaMask nonce (needed for localhost)

1. Go to Metamask -> Settings -> Advanced -> Click Reset Account -> Confirm the reset
   ![MetaMask-Reset](img/MetaMask-reset.png)

### Interact with website

1. Open http://localhost:3000 in the browser where you've set up MetaMask
2. Manually connect with `Alice (hardhat)` account to the website
3. Manually switch to the `Localhost` network
4. Click on `Agreement Interaction` button to go to http://localhost:3000/create-agreement
5. Open developer console in your browser to see some logs

#### -> Agreement Creation

6. Fill in the Agreement `Creation` form:
   - Requestor label: ...any text...
   - Agreement model: choose the only option available `Lending agreement with capital stack`
7. Hit `Create Agreement` button
8. Confirm the transaction via MetaMask pop up
9. The transaction is successful if you get a transaction ID in a status block located on the right of the screen

![Agreement Creation](img/Agreement-creation.png)

#### -> Agreement Definition

10. Go to `Definition` tab
11. Fill in the `Definition` form:
    - Agreement: should be pre-defined / do not modify
    - Definition: `BOB`
    - Specifications: the address of `Bob (hardhat)` from the MetaMask
12. Hit `Request Approval` button
13. Confirm the transaction via MetaMask pop up
14. The transaction is successful if you get a transaction ID in a status block located on the right of the screen

![Agreement Definition](img/Agreement-definition.png)

#### -> Agreement Update

15. Go to `Update` tab
16. Fill in the `Update` form:
    - ID: `1`
    - Agreement: should be pre-defined / do not modify
    - Required Transactions: leave this field empty
    - Signatories: copy & paste an `Alice (hardhat)` addess from MetaMask
    - Conditions: `bool true`
    - Transaction: `msgValue == 1e18`
17. Hit `Request Approval` button
18. Confirm all the transactions via MetaMask pop ups
19. The transaction is successful if you get a transaction ID in a status block located on the right of the screen

![Agreement Update](img/Agreement-update.png)

#### -> Agreement Update

20. Go to `Update` tab
21. Fill in the `Update` form:
    - ID: `2`
    - Agreement: should be pre-defined / do not modify
    - Required Transactions: `1`
    - Signatories: copy & paste an `Alice (hardhat)` addess from MetaMask
    - Conditions: `bool true`
    - Transaction: `sendEth BOB 1e18`
22. Hit `Request Approval` button
23. Confirm all the transactions via MetaMask pop ups
24. The transaction is successful if you get a transaction ID in a status block located on the right of the screen

#### -> Agreement Execution

25. Go to `Execution` tab
26. Fill in the `Execution` form:
    - ID: `1`
    - Agreement: should be pre-defined / do not modify
    - Transaction Value (in Wei): `1000000000000000000`
27. Hit `Execute` button
28. Confirm the transaction via MetaMask pop up
29. The transaction is successful if you get a transaction ID in a status block located on the right of the screen

![Agreement Execution](img/Agreement-execution.png)

#### -> Agreement Execution

30. Go to `Execution` tab
31. Fill in the `Execution` form:
    - ID: `2`
    - Agreement: should be pre-defined / do not modify
    - Transaction Value (in Wei): leave this field empty
32. Hit `Execute` button
33. Confirm the transaction via MetaMask pop up
34. The transaction is successful if you get a transaction ID in a status block located on the right of the screen

Now `Bob (hardhat)` balance should be increased by 1 ETH

## Summary

As a result of this demo Alice transferred 1 ETH to Bob with the usage of Agreement. She first created two necessary conditional transactions: one to top-up Agreement with 1 ETH and the second one to transfer these funds from Agreement to Bob. Then she executed these transactions one-by-one and Bob received the funds.
