import Stage from 'telegraf/stage'
import Scene from 'telegraf/scenes/base'
import Extra from 'telegraf/extra'
import Markup from 'telegraf/markup'

import axios from 'axios'

const { enter, leave } = Stage

const getPendingLisk = async wallet => {
  console.log('Sending request')
  const response = await axios.get(`https://pending-api.lisk.ws/${wallet}`)
  console.log('Got response')
  return response.data.total
}

const replyWithLiskAmount = (ctx, wallet) => {
  getPendingLisk(wallet).then(amount => ctx.reply(amount))
}

const getPending = async ctx => {
  const accounts = ctx.user.accounts
  if (accounts && accounts.length > 0) {
    const wallets = accounts.map(a => [Markup.callbackButton(a, `pending${a}`)])
    ctx.reply(
      'Please choose a wallet',
      Markup.inlineKeyboard([...wallets]).extra()
    )
  } else {
    ctx.reply('Please add an account first')
  }
  leave()
}

const processPending = (ctx, wallet) => {
  ctx.editMessageText(`Please wait ${loading[0]}`)
  let start = 1
  let loader = setInterval(() => {
    ctx.editMessageText(`Please wait ${loading[start]}`)
    start += 1
    if (start === loading.length) start = 0
  }, 1000)

  getPendingLisk(wallet)
    .then(amount => {
      ctx.editMessageText(`You got ${amount} LSK pending`)
      clearInterval(loader)
      leave()
    })
    .catch(() => {
      ctx.editMessageText(`Sorry, something went wrong 😥`)
      clearInterval(loader)
      leave()
    })
}

const loading = ['🙌', '👐', '👏', '💁', '🤦‍', '💩']

const pendingScene = new Scene('pending')
pendingScene.enter(getPending)
pendingScene.action(/pending(.*)/, ctx => {
  const wallet = ctx.match[1]
  processPending(ctx, wallet)
})

export default pendingScene
