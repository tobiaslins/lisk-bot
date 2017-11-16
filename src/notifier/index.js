import Queue from 'bull'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { watchTransactions, getTransactionUrl } from './lisk'

dotenv.config()

const transactions = new Queue('transactions', process.env.REDIS_URL)

let db
const main = async () => {
  console.log('connecting to db')
  db = await MongoClient.connect(process.env.MONGO_URL)
  console.log('connected')
  startWatching()
}

const startWatching = () =>
  watchTransactions(async e => {
    try {
      const res = await db
        .collection('sessions')
        .findOne({ 'data.accounts': { $in: [e.senderId, e.recipientId] } })
      if (res) {
        console.log('User found to send notification')
        const amount = e.amount / Math.pow(10, 8)
        const received = res.data.accounts.includes(e.recipientId)
        if (received) {
          console.log('received')
          const name = e.knownSender !== null ? e.knownSender.owner : e.senderId
          transactions.add({
            chat: res.key,
            message: `You received *${amount}* LSK from ${
              name
            } (${getTransactionUrl(e.id)})`
          })
        }
        if (!received) {
          console.log('sent')
          const name =
            e.knownRecipient !== null ? e.knownRecipient.owner : e.recipientId
          transactions.add({
            chat: res.key,
            message: `You have sent *${amount}* LSK to ${
              name
            } (${getTransactionUrl(e.id)})`
          })
        }
        console.log('over')
      }
    } catch (err) {
      console.error(err)
    }
  })
main()
