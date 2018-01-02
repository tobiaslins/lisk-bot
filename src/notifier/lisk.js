import axios from 'axios'

let lastBlock = 0

const endpoint = process.env.LISK_ENDPOINT || 'https://explorer.lisk.io'

export const getLastBlock = async () => {
  const tx = await getLastTransactions()
  return tx ? tx[0].height : 0
}

const getLastTransactions = async () => {
  const res = await axios.get(`${endpoint}/api/getLastTransactions`)
  return res.data.success ? res.data.transactions : false
}

export const getTransaction = async id => {
  const url = `${endpoint}/api/getTransaction?transactionId=${id}`
  const res = await axios.get(url)
  return res.data.transaction || []
}

export const getTransactionUrl = id => `[${id}](${endpoint}/tx/${id})`

export const watchTransactions = async newTransaction => {
  lastBlock = await getLastBlock()
  const watcher = setInterval(async () => {
    if (!lastBlock) lastBlock = 0
    console.log('Getting new TX after block id ' + lastBlock)
    const tx = await getLastTransactions()
    const f = tx.filter(t => t.height > lastBlock)
    if (f.length !== 0) console.log(`Processing ${f.length} transactions`)
    f.forEach(newTransaction)
    if (f[0]) lastBlock = f[0].height
  }, 5000)
}
