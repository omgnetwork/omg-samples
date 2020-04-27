import BigNumber from "bn.js";
import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const bobAddress = config.bob_eth_address;

async function logBalances() {
  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const alicesEthObject = alicesBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const alicesChildchainETHBalance = alicesEthObject
    ? `${web3.utils.fromWei(String(alicesEthObject.amount))} ETH`
    : "0 ETH";

  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobsEthObject = bobsBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const bobsChildchainETHBalance = bobsEthObject
    ? `${web3.utils.fromWei(String(bobsEthObject.amount))} ETH`
    : "0 ETH";

  console.log(`Alice's child chain ETH balance: ${alicesChildchainETHBalance}`);
  console.log(`Bob's child chain ETH balance: ${bobsChildchainETHBalance}`);
  return { bobETHBalance: bobsEthObject ? bobsEthObject.amount : 0 };
}

async function transactionEth() {
  const { bobETHBalance } = await logBalances();
  console.log("-----");

  const transferAmount = new BigNumber(
    web3.utils.toWei(config.alice_eth_transfer_amount, "ether")
  );

  const payments = [
    {
      owner: bobAddress,
      currency: OmgUtil.transaction.ETH_CURRENCY,
      amount: Number(transferAmount),
    },
  ];

  const fee = {
    currency: OmgUtil.transaction.ETH_CURRENCY,
  };

  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
    metadata: "omg",
  });

  console.log(
    `Created a child chain transaction of ${web3.utils.fromWei(
      payments[0].amount.toString(),
      "ether"
    )} ETH from Alice to Bob.`
  );

  // sign/build/submit
  const typedData = OmgUtil.transaction.getTypedData(
    createdTxn.transactions[0],
    rootChainPlasmaContractAddress
  );
  const privateKeys = new Array(createdTxn.transactions[0].inputs.length).fill(
    alicePrivateKey
  );
  const signatures = childChain.signTransaction(typedData, privateKeys);
  const signedTxn = childChain.buildSignedTransaction(typedData, signatures);
  const receipt = await childChain.submitTransaction(signedTxn);
  console.log("Transaction submitted: " + receipt.txhash);

  // wait for transaction to be recorded by the watcher
  console.log("Waiting for a transaction to be recorded by the watcher...");
  const expectedAmount = transferAmount.add(new BigNumber(bobETHBalance));
  await OmgUtil.waitForChildchainBalance({
    childChain,
    address: bobAddress,
    expectedAmount,
  });

  console.log("-----");
  await logBalances();
}

export { transactionEth };
