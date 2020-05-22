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

import promiseRetry from "promise-retry";

function wait(ms) {
  console.log(`Waiting for ${ms * 0.00001667} min...`);
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

async function waitForChallengePeriodToEnd(rootChain) {
  const minExitPeriod =
    (await rootChain.plasmaContract.methods.minExitPeriod().call()) * 1000;
  const waitMs = Number(minExitPeriod) * 2;

  await wait(waitMs);
  console.log("Challenge period finished");
}

async function waitForUtxo(childChain, address, utxo) {
  return promiseRetry(
    async (retry, number) => {
      console.log(`Waiting for utxo: ${number}`);
      const utxos = await childChain.getUtxos(address);
      const found = utxos.find(
        (u) =>
          u.oindex === utxo.oindex &&
          u.txindex === utxo.txindex &&
          u.blknum === utxo.blknum
      );
      if (!found) {
        retry();
      }
    },
    {
      minTimeout: 6000,
      factor: 1,
      retries: 50,
    }
  );
}

async function waitForBalance(childChain, address, expectedAmount, currency) {
  return promiseRetry(
    async (retry, number) => {
      const balanceArray = await childChain.getBalance(address);
      const balance = balanceArray
        .map((i) => {
          return {
            currency: i.currency,
            amount: i.amount,
          };
        })
        .filter((i) => i.currency === currency);

      console.log(`Waiting for balance: ${number}`);
      const found = balance.find((b) => Number(b.amount) === expectedAmount);
      if (!found) {
        retry();
      }
    },
    {
      minTimeout: 6000,
      factor: 1,
      retries: 50,
    }
  );
}

export default {
  waitForChallengePeriodToEnd,
  wait,
  waitForUtxo,
  waitForBalance,
};
