import Telegraf from 'telegraf'
import session from 'telegraf/session'
import Markup from 'telegraf/markup'
import Extra from 'telegraf/extra'

import dotenv from 'dotenv'
import Stage from 'telegraf/stage'
import Scene from 'telegraf/scenes/base'
import MongoSession from 'telegraf-session-mongo'
import commandParts from 'telegraf-command-parts'
import Queue from 'bull'

const { enter, leave } = Stage

import pendingScene from './routes/pending'
import setupSettings from './routes/settings'

import { showWallets, addWallet, removeWallet } from './routes/wallet'
import { connect } from './db'

dotenv.config()

const bot = new Telegraf(process.env.BOT_TOKEN)
const transactions = new Queue('transactions', process.env.REDIS_URL)

const showHelp = ctx => {
  ctx.replyWithMarkdown(`Following commands are available:

[/add](/add) _yourwallet_ (Add a new wallet)
[/list](/list) (List all wallets and their lisk amount)
[/pending](/pending) (Get the pending payouts from pools)
[/remove](/remove) _yourwallet_ (Remove a wallet)
[/settings](/settings) Settings for the bot (currency)

Feel free to donate 😇 16786801026697706054L
`)
}

const showDonate = ctx => {
  ctx.replyWithMarkdown('Feel free to donate 😇 *16786801026697706054L*')
}

const main = async () => {
  const db = await connect()
  const mongoSession = new MongoSession(db, {
    ttl: 3600 * 1000000,
    property: 'user'
  })
  await mongoSession.setup()

  const stage = new Stage([pendingScene])

  bot.use(session())
  bot.use(commandParts())
  bot.use(stage.middleware())
  bot.use(mongoSession.middleware)
  bot.start(ctx =>
    ctx.reply(
      'Welcome, how can I help you today?',
      Markup.keyboard([
        ['Get pending lisk', 'List wallets'],
        ['Donate', 'Help', '⚙️']
      ])
        .resize()
        .extra()
    )
  )
  bot.command('add', addWallet)
  bot.command('remove', removeWallet)
  bot.command('pending', enter('pending'))
  bot.command('list', showWallets)
  bot.command('help', showHelp)
  bot.command('donate', showDonate)

  bot.hears('Get pending lisk', enter('pending'))
  bot.hears('List wallets', showWallets)
  bot.hears('Help', showHelp)
  bot.hears('Donate', showDonate)

  setupSettings(bot)

  bot.on('message', showHelp)

  bot.startPolling()

  transactions.process((job, done) => {
    console.log('Received message', job.data)
    const { chat, message } = job.data
    if (chat && message) {
      bot.telegram.sendMessage(job.data.chat, job.data.message, {
        parse_mode: 'markdown'
      })
    }
    done()
  })
  console.log('Bot starts polling')
}

main()
