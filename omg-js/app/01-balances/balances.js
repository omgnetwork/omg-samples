/*
  Copyright 2020 OmiseGO Pte Ltd
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

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
const aliceAddress = config.alice_eth_address;
const bobAddress = config.bob_eth_address;
const erc20ContractAddress = config.erc20_contract_address;

async function logBalances() {
  // child chain balances for Alice
  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceChildchainBalance = alicesBalanceArray.map((i) => {
    return {
      currency:
        i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
      amount: web3.utils.fromWei(String(i.amount)),
    };
  });
  console.log(
    `Alice's child chain balance: ${JSON.stringify(
      aliceChildchainBalance,
      null,
      2
    )}`
  );

  // ETH root chain balance for Alice
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  const aliceRootchainBalances = [
    {
      currency: "ETH",
      amount: web3.utils.fromWei(String(aliceRootchainBalance), "ether"),
    },
  ];

  // ERC20 root chain balance for Alice
  if (erc20ContractAddress) {
    const aliceRootchainERC20Balance = await OmgUtil.getErc20Balance({
      web3,
      address: aliceAddress,
      erc20Address: erc20ContractAddress,
    });
    aliceRootchainBalances.push({
      currency: erc20ContractAddress,
      amount: web3.utils.fromWei(String(aliceRootchainERC20Balance)),
    });
  }

  console.log(
    `Alice's root chain balance: ${JSON.stringify(
      aliceRootchainBalances,
      null,
      2
    )}`
  );

  // child chain balances for Bob
  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobChildchainBalance = bobsBalanceArray.map((i) => {
    return {
      currency:
        i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
      amount: web3.utils.fromWei(String(i.amount)),
    };
  });
  console.log(
    `Bob's child chain balance: ${JSON.stringify(bobChildchainBalance, null, 2)}`
  );

  // ETH root chain balance for Bob
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);
  const bobRootchainBalances = [
    {
      currency: "ETH",
      amount: web3.utils.fromWei(String(bobRootchainBalance), "ether"),
    },
  ];

  // ERC20 root chain balance for Bob
  if (erc20ContractAddress) {
    const bobRootchainERC20Balance = await OmgUtil.getErc20Balance({
      web3,
      address: bobAddress,
      erc20Address: erc20ContractAddress,
    });
    bobRootchainBalances.push({
      currency: erc20ContractAddress,
      amount: web3.utils.fromWei(String(bobRootchainERC20Balance)),
    });
  }
  console.log(
    `Bob's root chain balance: ${JSON.stringify(bobRootchainBalances, null, 2)}`
  );
}

export { logBalances };