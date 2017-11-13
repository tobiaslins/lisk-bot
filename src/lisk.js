import axios from 'axios'

let lastBlock = 0

const endpoint = 'https://explorer.lisk.io'

export const getLastBlock = async () => {
  const tx = await getLastTransactions()
   const {height} = tx[0]
   return height
}

const getLastTransactions = async () => {
  const res = await axios.get(`${endpoint}/api/getLastTransactions`)
  return res.data.transactions || []
}

export const getTransactionUrl = id => `[${id}](${endpoint}/tx/${id})`

export const watchTransactions = async (sendNotification) => {
  lastBlock = await getLastBlock()
  const watcher = setInterval(async () => {
    console.log('Getting new TX after block id ' + lastBlock)
    const tx = await getLastTransactions()
    const f = tx.filter(t => t.height > lastBlock)
    console.log(`Processing ${f.length} transactions`)
    f.forEach(sendNotification)
    if(f[0]) lastBlock = f[0].height
  }, 15000)
}
