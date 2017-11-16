import axios from 'axios'

let lastBlock = 0

const endpoint = 'https://testnet-explorer.lisk.io'

export const getLastBlock = async () => {
  const tx = await getLastTransactions()
  return tx[0] ? tx[0].height : 0
}

const getLastTransactions = async () => {
  const res = await axios.get(`${endpoint}/api/getLastTransactions`)
  return res.data.transactions || []
}

export const getTransactionUrl = id => `[${id}](${endpoint}/tx/${id})`

export const watchTransactions = async newTransaction => {
  lastBlock = 0 //await getLastBlock()
  const watcher = setInterval(async () => {
    if (!lastBlock) lastBlock = 0
    console.log('Getting new TX after block id ' + lastBlock)
    const tx = await getLastTransactions()
    const f = tx.filter(t => t.height > lastBlock)
    console.log(`Processing ${f.length} transactions`)
    f.forEach(newTransaction)
    if (f[0]) lastBlock = f[0].height
  }, 10000)
}
