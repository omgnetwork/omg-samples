# Retrieve rootchain and childchain balances

_By the end of this tutorial you should know how to retrieve rootchain and childchain balances for Alice and Bob._

## Intro

The example uses `getBalance` function provided by [web3.js](https://github.com/ethereum/web3.js) to retrieve the balance from the roothchain (Ethereum network), and `getBalance` or `getErc20Balance` functions provided by [omg-js](https://github.com/omisego/omg-js) to retrieve balance from the childchain (OMG Network).

## Steps

1. App setup.
2. Logging childchain balances for Alice.
3. Logging rootchain balances for Alice.
4. Logging childchain balances for Bob.
5. Logging rootchain balances for Bob.

### 1. App setup

You can find the full Javascript segment of this tutorial in `01-balances/balance.js`. The first lines define dependent libraries, packages, and configs:

```
import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
```

### 2. Logging childchain balances for Alice
- `getBalance` function returns an array of balances that contain BigNum objects ([BN.js](https://github.com/indutny/bn.js)). It helps to calculate big numbers in Javascript. A typical array has the following structure:
```
[
  {
    "amount": "01cdda4faccd0000",
    "currency": "0x0000000000000000000000000000000000000000"
  }
]
``` 
- The amount in balance array is an encoded amount in WEI (e.g. `429903000000000000`), the smallest denomination of ether, ETH. You can use `fromWei` utils function to convert the balance to human-readable format.
- The `currency` in balance array contains either `0x0000000000000000000000000000000000000000` (states that this is ETH currency) or ERC20 smart contract address (e.g. `0xd74ef52053204c9887df4a0e921b1ae024f6fe31`).

```
const alicesBalanceArray = await childChain.getBalance(
  config.alice_eth_address
);
const aliceChildchainBalance = alicesBalanceArray.map((i) => {
  return {
    currency:
      i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
    amount:
      i.currency === OmgUtil.transaction.ETH_CURRENCY
        ? `${web3.utils.fromWei(String(i.amount))} ETH`
        : i.amount,
  };
});
console.log(
  `Alice's rootchain balance: ${JSON.stringify(
    aliceRootchainBalances,
    null,
    2
  )}`
);
```
  
Example output:
```
Alice's childchain balance: [
  {
    "currency": "ETH",
    "amount": "0.449903 ETH"
  },
  {
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "amount": "02e5a104dcdce00008"
  }
]
```
### 3. Logging rootchain balances for Alice

```
// ETH rootchain balance for Alice
const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
const aliceRootchainBalances = [
  {
    currency: "ETH",
    amount: `${web3.utils.fromWei(String(aliceRootchainBalance), "ether")} ETH`,
  },
];
// ERC20 rootchain balance for Alice
if (erc20ContractAddress) {
  const aliceRootchainERC20Balance = await OmgUtil.getErc20Balance({
    web3,
    address: aliceAddress,
    erc20Address: erc20ContractAddress,
  });
  aliceRootchainBalances.push({
    currency: erc20ContractAddress,
    amount: aliceRootchainERC20Balance,
  });
}

console.log(
  `Alice's rootchain balance: ${JSON.stringify(
    aliceRootchainBalances,
    null,
    2
  )}`
);
```

Example output:
```
Alice's rootchain balance: [
  {
    "currency": "ETH",
    "amount": "4.52147852070024 ETH"
  },
  {
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "amount": "45199999999999999982"
  }
]
```

4. Logging childchain balances for Bob 
```
// childchain balances for Bob
const bobsBalanceArray = await childChain.getBalance(bobAddress);
const bobChildchainBalance = bobsBalanceArray.map((i) => {
  return {
    currency:
      i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
    amount:
      i.currency === OmgUtil.transaction.ETH_CURRENCY
        ? `${web3.utils.fromWei(String(i.amount))} ETH`
        : i.amount,
  };
});
console.log(
  `Bob's childchain balance: ${JSON.stringify(bobChildchainBalance, null, 2)}`
);
```
Example output:
```
Bob's childchain balance: [
  {
    "currency": "ETH",
    "amount": "0.02319 ETH"
  },
  {
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "amount": "12dfb0cb5e88000a"
  }
]
```

5. Logging rootchain balances for Bob
```
// ETH rootchain balance for Bob
const bobRootchainBalance = await web3.eth.getBalance(bobAddress);
const bobRootchainBalances = [
  {
    currency: "ETH",
    amount: `${web3.utils.fromWei(String(bobRootchainBalance), "ether")} ETH`,
  },
];
// ERC20 rootchain balance for Bob
if (erc20ContractAddress) {
  const bobRootchainERC20Balance = await OmgUtil.getErc20Balance({
    web3,
    address: bobAddress,
    erc20Address: erc20ContractAddress,
  });
  bobRootchainBalances.push({
    currency: erc20ContractAddress,
    amount: bobRootchainERC20Balance,
  });
}
console.log(
  `Bob's rootchain balance: ${JSON.stringify(bobRootchainBalances, null, 2)}`
);

```

Example outputs:
```
Bob's rootchain balance: [
  {
    "currency": "ETH",
    "amount": "3.297270599 ETH"
  },
  {
    "currency": "0xd74ef52053204c9887df4a0e921b1ae024f6fe31",
    "amount": "0"
  }
]
```