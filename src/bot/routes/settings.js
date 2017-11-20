import Stage from 'telegraf/stage'
import Scene from 'telegraf/scenes/base'
import Extra from 'telegraf/extra'
import Markup from 'telegraf/markup'

const showSettings = ctx => {
  ctx.reply(
    'What do you want to change?',
    Markup.keyboard([['Set currency']])
      .resize()
      .extra()
  )
}

export default bot => {
  bot.command('settings', showSettings)
  bot.hears('⚙️', showSettings)
  bot.hears('Set currency', ctx => {
    ctx.reply(
      'Setting currency?',
      Markup.keyboard([
        ['Get pending lisk', 'List wallets'],
        ['Donate', 'Help', '⚙️']
      ])
        .resize()
        .extra()
    )
    ctx.reply(
      `Which currency do you want to see? (Current ${ctx.user.currency ||
        'USD'})`,
      Markup.inlineKeyboard([
        Markup.callbackButton('USD', `USD`),
        Markup.callbackButton('EUR', `EUR`)
      ]).extra()
    )
  })
  bot.action('USD', ctx => {
    ctx.user.currency = 'USD'
    ctx.editMessageText(`Successfully set to USD`)
  })
  bot.action('EUR', ctx => {
    ctx.user.currency = 'EUR'
    ctx.editMessageText(`Successfully set to EUR`)
  })
}
