import Queue from 'bull'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { getTransaction, watchTransactions, getTransactionUrl } from './lisk'

dotenv.config()

const transactions = new Queue('transactions', process.env.REDIS_URL)

let db
const main = async () => {
  console.log('lola ist cool')
  console.log('connecting to db')
  db = await MongoClient.connect(process.env.MONGO_URL)
  console.log('connected')
  startWatching()
}

const findUser = wallets =>
  db.collection('sessions').findOne({ 'data.accounts': { $in: wallets } })

const handleTransaction = async t => {
  console.log('Handle Transaction')
  const user = await findUser([t.senderId, t.recipientId])
  if (user) {
    const amount = e.amount / Math.pow(10, 8)
    const received = user.data.accounts.includes(e.recipientId)
    if (received) {
      const name = e.knownSender !== null ? e.knownSender.owner : e.senderId
      transactions.add({
        chat: res.key,
        message: `You received *${amount}* LSK from ${
          name
        } (${getTransactionUrl(e.id)})`
      })
    }
    if (!received) {
      const name =
        e.knownRecipient !== null ? e.knownRecipient.owner : e.recipientId
      transactions.add({
        chat: res.key,
        message: `You have sent *${amount}* LSK to ${name} (${getTransactionUrl(
          e.id
        )})`
      })
    }
  }
}

const handleVote = async ({ id }) => {
  console.log('Handle Vote : ' + id)
  const transaction = await getTransaction(id)
  const user = await findUser([transaction.senderId, transaction.recipientId])
  console.log(transaction)
  if (user) {
  }
}

const startWatching = () =>
  watchTransactions(async e => {
    switch (e.type) {
      case 0:
        handleTransaction(e)
        break
      case 3:
        handleVote(e)
        break
      default:
        console.log('Ignoring transaction type')
        break
    }
    console.log('User found to send notification')
  })
main()
