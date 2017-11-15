import Telegraf from 'telegraf'
import Markup from 'telegraf/markup'
import Extra from 'telegraf/extra'

import { MongoClient } from 'mongodb'
import MongoSession from 'telegraf-session-mongo'
import commandParts from 'telegraf-command-parts'
import axios from 'axios'
import { createServer } from 'http'

const startKeyboard = Markup.keyboard([
  [Markup.callbackButton('/addWallet'), Markup.callbackButton('/showWallets')],
  [Markup.callbackButton('/pending'), Markup.callbackButton('/donate')]
])

import { watchTransactions, getLastBlock, getTransactionUrl } from './lisk'

const app = new Telegraf(process.env.TELEGRAM_TOKEN)
const mongoURL = process.env.MONGO_URL
const connectDB = async () => MongoClient.connect(mongoURL)
let db

const setupMiddlewares = () => {
  app.use(commandParts())
  app.telegram.getMe().then(({ username }) => {
    console.log(`${username} is running!`)
    app.options.username = username
  })

  app.start(ctx => {
    ctx.reply(
      `Hi ${ctx.from.username}, how can I help you today?`,
      Extra.markup(startKeyboard)
    )
  })
  app.command('/addWallet', ctx => {
    const address = ctx.state.command.splitArgs[0]
    if (/\d{19}L/.test(address)) {
      const old = ctx.session.accounts || []
      ctx.session.name = ctx.from.username
      ctx.session.accounts = [...old, address]
      ctx.reply('Added successfully')
    } else {
      console.log('Invalid address: ', address)
      ctx.reply('Invalid lisk address')
    }
  })
  app.command('/showWallets', ctx => {
    ctx.reply(ctx.session.accounts)
  })
  app.command('/pending', async ctx => {
    const address = ctx.state.command.splitArgs[0]
    if (address && /\d{19}L/.test(address)) {
    }
    const accounts = ctx.session.accounts
    if (accounts && accounts.length > 0) {
      if (accounts.length === 1) {
        await replyWithLiskAmount(ctx, accounts[0])
      } else if (accounts.length > 1) {
        const wallets = accounts.map(a =>
          Markup.callbackButton(a, `/pending ${a}`)
        )
        ctx.reply(
          'Please choose a wallet',
          Markup.inlineKeyboard([wallets]).extra()
        )
      }
    } else {
      ctx.reply('Please add an account first')
    }
  })
}

const replyWithLiskAmount = async (ctx, wallet) => {
  try {
    const response = await axios.get(`https://lisk.now.sh/${wallet}`)
    ctx.reply(response.data.total)
  } catch (err) {}
}

const sendNotification = async e => {
  const res = await db
    .collection('sessions')
    .findOne({ 'data.accounts': { $in: [e.senderId, e.recipientId] } })
  if (res !== null) {
    console.log('Notification to ', e.senderId, e.recipientId)
    const amount = e.amount / Math.pow(10, 8)
    const received = res.data.accounts.includes(e.recipientId)
    if (received) {
      const name = e.knownSender !== null ? e.knownSender.owner : e.senderId
      app.telegram.sendMessage(
        res.key,
        `You received *${amount}* LSK from ${name} (${getTransactionUrl(
          e.id
        )})`,
        { parse_mode: 'markdown' }
      )
    } else {
      const name =
        e.knownRecipient !== null ? e.knownRecipient.owner : e.recipientId
      app.telegram.sendMessage(
        res.key,
        `You have sent *${amount}* LSK to ${name} (${getTransactionUrl(e.id)})`,
        { parse_mode: 'markdown' }
      )
    }
  }
}

const main = async () => {
  console.log('Starting up')
  db = await connectDB()
  console.log('Connected db')
  const session = new MongoSession(db, {
    ttl: 3600 * 1000000
  })
  await session.setup()
  app.use(session.middleware)
  setupMiddlewares(session)
  app.startPolling()
  console.log('Bot starts polling')
  watchTransactions(sendNotification)
}

main()

const server = createServer((req, res) => {
  res.write('ok')
  res.end()
})
server.listen(process.env.PORT || 3000)
