# Omg-js Sample Application

## Description

A Javascript application that allows interacting with `omg-js` library. Examples provided in the project will help to deposit funds to the OMG Network, show the best ways to make transfers between the wallets, submit valid and challenge invalid exits.

## Contents

| File/folder            | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `app`                  | Sample source files.                                                 |
| `dist`                 | Build files that can be hosted on a server.                          |
| `01-balances`          | Implementation for retrieving rootchain and childchain balances.     |
| `02-deposit-eth`       | Implementation for depositing ETH to the OMG Network.                |
| `03-deposit-erc20`     | Implementation for depositing ERC20 tokens to the OMG Network.       |
| `04-transaction-eth`   | Implementation for making ETH transactions on the OMG Network.       |
| `05-transaction-erc20` | Implementation for ERC-20 transactions on the OMG Network.           |
| `06-merge-utxos`       | Implementation for merging UTXOs of a given account.                 |
| `07-show-utxos`        | Implementation for showing UTXOs for a given account.                |
| `08-exit-eth`          | Implementation for exiting of ETH from the OMG Network.              |
| `09-exit-erc20`        | Implementation for exiting of ERC20 tokens from the OMG Network.     |
| `10-inflight-exit-eth` | Implementation for in-fligh exits of ETH funds from the OMG Network. |
| `11-process-exits`     | Implementation for processing exits on the OMG Network.              |
| `helpers`              | Scripts that help to run certain parts of code samples.              |
| `assets`               | Project assets (images, css, fonts, etc).                            |
| `index.js`             | Script that generates UI for the project.                            |
| `.gitignore`           | Defines what to ignore at commit time.                               |
| `package.json`         | Package manifest for npm.                                            |
| `package-lock.json`    | Package manifest for npm (extended).                                 |
| `config.js`            | Configuration parameters for the sample.                             |
| `webpack.config.js`    | Webpack configurations.                                              |
| `CHANGELOG.md`         | List of changes to the sample.                                       |
| `README.md`            | Project's README file.                                               |
| `LICENSE`              | The license for the sample.                                          |

## Prerequisites

- [Node](https://nodejs.org/en) >= 8.11.3 < 13.0.0
- [Web3](https://github.com/ethereum/web3.js) > 1.2.2. Earlier versions have the issue with async functions.
- Basic understanding of Ethereum and the OMG Network concepts: UTXOs, gas, smart contracts, deposits, transfers, exits, challenges.
- Access to two Web3 wallets where you can export private keys. Consider using [MetaMask](https://metamask.io/download.html) if you want flexibility in working with ERC20 tokens.
- Funds on both of the Web3 wallets. For working with a testnet, you can get free tokens using [MetaMask Ropsten faucet](https://faucet.metamask.io).

## Setup

1. Clone OMG code samples repository:

```
git clone https://github.com/omisego/omg-samples.git
```

2. Enter the root of `omg-js` folder:

```
cd omg-js
```

3. Install dependencies:

```
npm install
```

4. Create `.env` file and provide the required configuration values:

```
ETH_NODE=                           <entry point to an ethereum node>
WATCHER_URL=                        <url of an informational watcher>
WATCHER_PROXY_URL=                  <*optional* proxy server to catch all watcher requests>
PLASMAFRAMEWORK_CONTRACT_ADDRESS=   <address of the plasma_framework contract>
ERC20_CONTRACT_ADDRESS=             <*optional* address of the erc20 contract that Alice will deposit and transfer to Bob>
ALICE_ETH_ADDRESS=                  <address of Alice's account>
ALICE_ETH_ADDRESS_PRIVATE_KEY=      <Alice's private key>
ALICE_ETH_DEPOSIT_AMOUNT=           <ETH amount Alice will deposit into the childchain>
ALICE_ERC20_DEPOSIT_AMOUNT=         <ERC20 amount Alice will deposit into the childchain>
ALICE_ETH_TRANSFER_AMOUNT=          <ETH amount Alice will transfer to Bob>
ALICE_ERC20_TRANSFER_AMOUNT=        <ERC20 amount Alice will transfer to Bob>
BOB_ETH_ADDRESS=                    <address of Bob's account>
BOB_ETH_ADDRESS_PRIVATE_KEY=        <Bob's private key>
MILLIS_TO_WAIT_FOR_NEXT_BLOCK=      <interval when checking for block confirmation>
BLOCKS_TO_WAIT_FOR_TXN=             <number of blocks to wait for confirmation>
```

- You can set up `ETH_NODE` by launching a local Ethereum node. But due to substantial time consumption this process requires, it's recommended using one of the services that provide such functionality for free: [Infura](https://infura.io), [QuickNode](https://www.quiknode.io), [Rivet](https://rivet.cloud).
- If you encounter some issues with connecting to the network, make sure to check the latest details for `WATCHER_URL`, `PLASMAFRAMEWORK_CONTRACT_ADDRESS` on [the official documentation page](https://docs.omg.network/network-connection-details).
- Put `WATCHER_PROXY_URL` only if you run your watcher. Otherwise, you might not be able to run any of the code samples in this project.
- To find `ERC20_CONTRACT_ADDRESS` for a particular token you want to use, check [Etherscan Token Tracker](https://etherscan.io/tokens). If you're looking for ERC20 faucets, you can send 0 Ropsten ETH to a corresponding smart contract. Some of the projects typically send back test tokens to work with.
- In most of the code samples, Alice refers to the account of a sender, Bob refers to the account that receives funds.

Feel free to use the following configurations if you don't have time to set up your own:

```
WATCHER_URL=https://watcher-info.ropsten.v1.omg.network
WATCHER_PROXY_URL=
PLASMAFRAMEWORK_CONTRACT_ADDRESS=0x96d5d8bc539694e5fa1ec0dab0e6327ca9e680f9
ERC20_CONTRACT_ADDRESS=0xd74ef52053204c9887df4a0e921b1ae024f6fe31
ALICE_ETH_ADDRESS=0x0dC8e240d90F3B0d511b6447543b28Ea2471401a
ALICE_ETH_ADDRESS_PRIVATE_KEY=CD5994C7E2BF03202C59B529B76E5582266CEB384F02D32B470AC57112D0C6E7
ALICE_ETH_DEPOSIT_AMOUNT=0.01
ALICE_ERC20_DEPOSIT_AMOUNT=20
ALICE_ETH_TRANSFER_AMOUNT=0.005
ALICE_ERC20_TRANSFER_AMOUNT=0.34
BOB_ETH_ADDRESS=0x8b63BB2B829813ECe5C2F378d47b2862bE271c6C
BOB_ETH_ADDRESS_PRIVATE_KEY=1027c05dcc6dba6b8fb6bb6efc90e374fee7da73e1069279be61a2dcf533b856
MILLIS_TO_WAIT_FOR_NEXT_BLOCK=1000
BLOCKS_TO_WAIT_FOR_TXN=20
```

> Private keys presented in this config file have only Ropsten testnet tokens. Please, spend them considerably, share with others. Make sure to never share your private keys to anyone if you deal with real funds (Ethereum mainnet).

## Running the sample

1. Run the app:

```
npm run start
```

You will see a `dist` folder created with static `.js`, `.css` and `index.html` files. The project uses Webpack and Webpack server for demonstration purposes. Feel free to change it to your preferred way of building js files.

2. Open your browser at [http://localhost:3000](http://localhost:3000).

3. Select the sample you're most interested in on the left side, observe the logs on the right.

![img](app/assets/images/01.png)

## Contributing

This project welcomes contributions and suggestions. Please follow the contribution flow as stated below:

1. Clone the repository.
2. Checkout to the branch with `<GIT_USERNAME>/dev` name.
3. Make changes.
4. Submit PR to the latest version branch (e.g. 1.3.1). Please, don't submit PRs to the master branch, they will be rejected automatically.
