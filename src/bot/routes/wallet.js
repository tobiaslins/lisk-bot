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
    const currency = ctx.user.currency || 'USD'
    const priceData = liskTicker.data[0]
    const price =
      currency === 'USD' ? priceData['price_usd'] : priceData['price_eur']
    let result = ''
    for (let account of ctx.user.accounts) {
      try {
        let res = await axios.get(
          `https://explorer.lisk.io/api/getAccount?address=${account}`
        )
        if (res.data.success) {
          const lsk = res.data.balance / Math.pow(10, 8)
          result += `*${account}*\n - ${lsk} _LSK_\n - ${Math.round(
            lsk * price
          )} ${currency}\n`
        }
      } catch (err) {}
    }
    result += `Current lisk price: ${Number(price).toFixed(2)} ${currency}`
    ctx.replyWithMarkdown(result)
  } else {
    ctx.replyWithMarkdown(
      'No wallets found. Please add one first with [/help](/help)'
    )
  }
}
