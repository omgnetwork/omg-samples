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

import BigNumber from "bn.js";
import JSONBigNumber from "omg-json-bigint";
import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
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
const currencyToSplit = OmgUtil.transaction.ETH_CURRENCY;

async function showUtxo() {
  const aliceUtxosAll = await childChain.getUtxos(aliceAddress);
  const aliceEthUtxos = aliceUtxosAll.filter(
    (u) => u.currency === currencyToSplit
  );
  const aliceErc20Utxos = aliceUtxosAll.filter(
    (u) =>
      u.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );

  console.log(
    `Alice has ${aliceEthUtxos.length} ETH UTXOs and ${aliceErc20Utxos.length} ERC20 UTXOs`
  );

  console.log(
    `Alice ETH UTXOs: ${JSONBigNumber.stringify(aliceEthUtxos, undefined, 2)}`
  );
  console.log(
    `Alice ERC20 UTXOs: ${JSONBigNumber.stringify(
      aliceErc20Utxos,
      undefined,
      2
    )}`
  );
}

async function logBalances() {
  const aliceBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceEthObject = aliceBalanceArray.find(
    (i) => i.currency === currencyToSplit
  );
  return { aliceEthBalance: aliceEthObject ? aliceEthObject.amount : 0 };
}

async function splitUtxo() {
  showUtxo();
  const { aliceEthBalance } = await logBalances();

  const aliceSplitAmount = new BigNumber(
    web3.utils.toWei(config.alice_eth_transfer_amount, "ether")
  );

  const payments = [
    {
      owner: aliceAddress,
      currency: currencyToSplit,
      amount: Number(aliceSplitAmount),
    },
    {
      owner: aliceAddress,
      currency: currencyToSplit,
      amount: Number(aliceSplitAmount),
    },
  ];

  const fee = {
    currency: OmgUtil.transaction.ETH_CURRENCY,
  };

  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
  });

  // sign/build/submit
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

  // wait for transaction to be recorded by the watcher
  console.log("Waiting for a transaction to be recorded by the watcher...");
  const expectedAmount = Number(aliceEthBalance) - Number(fee);

  await wait.waitForBalance(
    childChain,
    aliceAddress,
    expectedAmount,
    currencyToSplit
  );

  console.log("-----");
  showUtxo();
}

export { splitUtxo };
