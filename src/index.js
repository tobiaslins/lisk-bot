import Telegraf from 'telegraf'
import {MongoClient} from 'mongodb'
import MongoSession from 'telegraf-session-mongo'
import commandParts from 'telegraf-command-parts'
import axios from 'axios'


import { watchTransactions, getLastBlock, getTransactionUrl } from './lisk'

const app = new Telegraf(process.env.TELEGRAM_TOKEN)
const mongoURL = process.env.MONGO_URL
const connectDB = async () => MongoClient.connect(mongoURL)
let db

const setupMiddlewares = () => {
  app.use(commandParts())
  app.command('/add', (ctx) => {
    const address = ctx.state.command.splitArgs[0]
    if(/\d{19}L/.test(address)) {
      const old = ctx.session.accounts || []
      ctx.session.name = 'dere'
      ctx.session.accounts = [...old, address]
      ctx.reply('Added successfully')
    } else {
      console.log('Invalid address: ', address)
      ctx.reply('Invalid lisk address')
    }
  })
  app.command('/list', ctx => {
    ctx.reply(ctx.session.accounts)
  })
  app.command('/pending', async ctx => {
    if(ctx.session.accounts && ctx.session.accounts.length >= 1) {
      try {
        const response = await axios.get(`https://lisk.now.sh/${ctx.session.accounts[0]}`)
        ctx.reply(response.data.total)
      } catch(err){}
    }
  })
}

const sendNotification = async e => {
  const res = await db.collection('sessions').findOne({ "data.accounts": {$in: [e.senderId, e.recipientId]}})
  console.log(res)
  if(res !== null) {
    console.log('Notification to ', e.senderId, e.recipientId)
    const amount = e.amount / Math.pow(10, 8)
    const received = res.data.accounts.includes(e.recipientId)
    if(received) {
      const name = e.knownSender !== null ? e.knownSender.owner : e.senderId
      app.telegram.sendMessage(res.key, `You received *${amount}* LSK from ${name} (${getTransactionUrl(e.id)})`, {parse_mode: 'markdown'})
    } else {
      const name = e.knownRecipient !== null ? e.knownRecipient.owner : e.recipientId
      app.telegram.sendMessage(res.key, `You have sent *${amount}* LSK to ${name} (${getTransactionUrl(e.id)})`, {parse_mode: 'markdown'})
    }
  }
}

const main = async () => {
  console.log('Starting up')
  db = await connectDB()
  console.log('Connected db')
  const session = new MongoSession(db, {})
  await session.setup()
  app.use(session.middleware)
  setupMiddlewares(session)
  app.startPolling()
  console.log('Bot starts polling')
  watchTransactions(sendNotification)
}

main()
