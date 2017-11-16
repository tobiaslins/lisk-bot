import axios from 'axios'

export const addWallet = ctx => {
  const address = ctx.state.command.splitArgs[0]
  if (/\d{19}L/.test(address)) {
    const old = ctx.user.accounts || []
    ctx.user.name = ctx.from.username
    ctx.user.accounts = [...old, address]
    ctx.reply('Added successfully')
  } else {
    console.log('Invalid address: ', address)
    ctx.reply('Invalid lisk address')
  }
}

export const removeWallet = ctx => {
  const address = ctx.state.command.splitArgs[0]
  if (/\d{19}L/.test(address)) {
    const old = ctx.user.accounts || []
    ctx.user.name = ctx.from.username
    ctx.user.accounts = old.filter(a => a !== address)
    ctx.reply('Removed successfully')
  } else {
    console.log('Invalid address: ', address)
    ctx.reply('Invalid lisk address')
  }
}

export const showWallets = async ctx => {
  if (ctx.user.accounts) {
    const liskTicker = await axios.get(
      'https://api.coinmarketcap.com/v1/ticker/lisk/?convert=EUR'
    )
    const usd = liskTicker.data[0].price_usd
    let result = ''
    for (let account of ctx.user.accounts) {
      try {
        let res = await axios.get(
          `https://explorer.lisk.io/api/getAccount?address=${account}`
        )
        if (res.data.success) {
          const lsk = res.data.balance / Math.pow(10, 8)
          result += `*${account}*\n - ${lsk} _LSK_\n - ${Math.round(
            lsk * usd
          )} $\n`
        }
      } catch (err) {}
    }
    ctx.replyWithMarkdown(result)
  } else {
    ctx.replyWithMarkdown(
      'No wallets found. Please add one first with [/help](/help)'
    )
  }
}
