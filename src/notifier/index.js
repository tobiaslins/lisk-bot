import Queue from 'bull'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { getTransaction, watchTransactions, getTransactionUrl } from './lisk'

dotenv.config()

const transactions = new Queue('transactions', process.env.REDIS_URL)
const notifications = new Queue('notifications', process.env.REDIS_URL)

let db
const main = async () => {
  console.log('connecting to db')
  db = await MongoClient.connect(process.env.MONGO_URL)
  console.log('connected')
  startWatching()
}

const findUser = wallets =>
  db.collection('sessions').findOne({ 'data.accounts': { $in: wallets } })

const sendNotification = ({
  user,
  amount,
  transaction,
  received,
  senderName,
  recipientName
}) => {
  if (user.settings && user.settings.notifyMail) {
    notifications.add({
      type: 'mail',
      mail: user.mail
    })
  }
}

const handleTransaction = async t => {
  const user = await findUser([t.senderId, t.recipientId])
  if (user) {
    const transaction = await getTransaction(t.id)
    const received = user.data.accounts.includes(t.recipientId)

    sendNotification({
      user,
      amount: t.amount / Math.pow(10, 8),
      transaction,
      received,
      senderName: t.knownSender !== null ? t.knownSender.owner : t.senderId,
      recipientName:
        t.knownRecipient !== null ? t.knownRecipient.owner : t.recipientId
    })

    // if (received) {
    //   const name = e.knownSender !== null ? e.knownSender.owner : e.senderId
    //   transactions.add({
    //     chat: res.key,
    //     message: `You received *${amount}* LSK from ${
    //       name
    //     } (${getTransactionUrl(e.id)})`
    //   })
    // }
    // if (!received) {
    //   const name =
    //     e.knownRecipient !== null ? e.knownRecipient.owner : e.recipientId
    //   transactions.add({
    //     chat: res.key,
    //     message: `You have sent *${amount}* LSK to ${name} (${getTransactionUrl(
    //       e.id
    //     )})`
    //   })
    // }
  }
}

const handleVote = async ({ id }) => {
  console.log('Handle Vote : ' + id)
  const transaction = await getTransaction(id)
  const user = await findUser([transaction.senderId, transaction.recipientId])
  console.log(transaction)
  if (user) {
    transactions.add({
      chat: res.key,
      message: `You have sent *${amount}* LSK to ${name} (${getTransactionUrl(
        e.id
      )})`
    })
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
  })
main()
