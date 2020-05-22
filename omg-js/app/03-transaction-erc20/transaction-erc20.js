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

import { ChildChain, OmgUtil } from "@omisego/omg-js";
import BigNumber from "bn.js";
import Web3 from "web3";
import wait from "../helpers/wait.js";
import config from "../../config.js";

const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const bobAddress = config.bob_eth_address;
const transferAmount = new BigNumber(
  web3.utils.toWei(config.alice_erc20_transfer_amount, "ether")
);

async function logBalances() {
  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceErc20Object = alicesBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const alicesChildchainERC20Balance = aliceErc20Object
    ? aliceErc20Object.amount
    : 0;

  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobErc20Object = bobsBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const bobsChildchainERC20Balance = bobErc20Object ? bobErc20Object.amount : 0;

  console.log(
    `Alice's childchain ERC20 balance: ${web3.utils.fromWei(
      alicesChildchainERC20Balance.toString(),
      "ether"
    )}`
  );
  console.log(
    `Bob's childchain ERC20 balance: ${web3.utils.fromWei(
      bobsChildchainERC20Balance.toString(),
      "ether"
    )}`
  );
  return { bobERC20Balance: bobsChildchainERC20Balance };
}

async function transactionErc20() {
  if (!config.erc20_contract_address) {
    console.log("Please define an ERC20 contract address in your .env");
    return;
  }
  const { bobERC20Balance } = await logBalances();
  console.log("-----");

  const payments = [
    {
      owner: bobAddress,
      currency: config.erc20_contract_address,
      amount: transferAmount,
    },
  ];
  const fee = {
    currency: OmgUtil.transaction.ETH_CURRENCY,
  };

  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
    metadata: "data",
  });
  console.log(
    `Created a childchain transaction of ${web3.utils.fromWei(
      transferAmount.toString(),
      "ether"
    )} ERC20 from Alice to Bob.`
  );
  // type/sign/build/submit
  const typedData = OmgUtil.transaction.getTypedData(
    createdTxn.transactions[0],
    rootChainPlasmaContractAddress
  );
  const privateKeys = new Array(createdTxn.transactions[0].inputs.length).fill(
    alicePrivateKey
  );

  console.log("Signing transaction...");
  const signatures = childChain.signTransaction(typedData, privateKeys);

  console.log("Building transaction...");
  const signedTxn = childChain.buildSignedTransaction(typedData, signatures);

  console.log("Submitting transaction...");
  const receipt = await childChain.submitTransaction(signedTxn);
  console.log("Transaction submitted: " + receipt.txhash);

  console.log("Waiting for a transaction to be recorded by the watcher...");
  const expectedAmount = Number(transferAmount) + Number(bobERC20Balance);

  await wait.waitForBalance(
    childChain,
    bobAddress,
    expectedAmount,
    config.erc20_contract_address
  );

  console.log("-----");
  await logBalances();
}

export { transactionErc20 };
