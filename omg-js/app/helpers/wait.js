import promiseRetry from 'promise-retry'

function wait (ms) {
  console.log(`Waiting for ${ms * 0.00001667} min...`)
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

async function waitForChallengePeriodToEnd (rootChain) {
  const minExitPeriod =
    (await rootChain.plasmaContract.methods.minExitPeriod().call()) * 1000
  const waitMs = Number(minExitPeriod) * 2

  await wait(waitMs)
  console.log('Challenge period finished')
}

async function waitForUtxo (childChain, address, utxo) {
  return promiseRetry(
    async (retry, number) => {
      console.log(
        `Waiting for utxo: ${number}`
      )
      const utxos = await childChain.getUtxos(address)
      const found = utxos.find(
        (u) =>
          u.oindex === utxo.oindex &&
          u.txindex === utxo.txindex &&
          u.blknum === utxo.blknum
      )
      if (!found) {
        retry()
      }
    },
    {
      minTimeout: 6000,
      factor: 1,
      retries: 50
    }
  )
}

export default {
  waitForChallengePeriodToEnd,
  wait,
  waitForUtxo
}