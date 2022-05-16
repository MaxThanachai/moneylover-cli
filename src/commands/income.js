module.exports.command = 'income [wallet] [amount]'
module.exports.describe = 'Add an income'
module.exports.builder = (yargs) => yargs
  .positional('wallet', {
    describe: 'The wallet name',
    type: 'string'
  })
  .positional('amount', {
    describe: 'Amount of money',
    type: 'number'
  })
  .option('category', {
    describe: 'Category',
    alias: 'c',
    type: 'string'
  })
  .option('note', {
    describe: 'Transaction note',
    alias: 'm',
    type: 'string'
  })
  .option('date', {
    describe: 'Transaction date',
    alias: 'd',
    type: 'string'
  })
  .option('exclude', {
    describe: 'Exclude from report',
    alias: 'e',
    type: 'boolean'
  })

module.exports.handler = async (argv) => {
  const chrono = require('chrono-node')
  const { getMoneyLover, printTransaction, promptOne } = require('../util')
  const MoneyLover = require('../moneylover')

  const ml = await getMoneyLover()
  const wallets = await ml.getWalletNames()

  if (argv.amount == null) {
    argv.amount = await promptOne({
      message: 'Amount',
      type: 'input'
    })
  }

  if (argv.wallet == null) {
    argv.wallet = await promptOne({
      message: 'Wallet',
      type: 'list',
      choices: wallets,
      transformer: (input, answer) => answer.name
    })
  }
  let wallet = wallets.find(({ _id, name }) => _id === argv.wallet || name === argv.wallet)
  const categories = await ml.getCategories(wallet._id)

  if (argv.category == null) {
    argv.category = await promptOne({
      message: 'Category',
      type: 'list',
      choices: categories,
      tranformer: (input, answer) => answer.name,
      default: categories.find(({ metadata }) => metadata === 'IS_OTHER_INCOME')
    })
  }
  let category = argv.category != null && categories.find(({ name, type, _id }) => type === MoneyLover.CATEGORY_TYPE_INCOME && (name === argv.category || _id === argv.category))
  if (!category) {
    category = categories.find(({ metadata }) => metadata === 'IS_OTHER_INCOME')
  }

  if (argv.date == null) {
    // argv.date = await promptOne({
    //   message: 'Date',
    //   type: 'input',
    //   default: 'today'
    // })
    argv.date = 'today'
  }
  const date = chrono.parseDate(argv.date)

  if (argv.note == null) {
    // argv.note = await promptOne({
    //   message: 'Note',
    //   type: 'input'
    // })
    argv.note = 'logged by API'
  }

  const isExcludeFromReport = argv.exclude == null ? false : argv.exclude


  try {
    await ml.addTransaction({
      account: wallet._id,
      category: category._id,
      amount: `${argv.amount}`,
      note: argv.note || '',
      date,
      exclude_report: isExcludeFromReport
    })
    console.log('✔ Income added')
    printTransaction({
      wallet,
      category,
      amount: argv.amount,
      note: argv.note || '',
      date
    })
  } catch (e) {
    console.error('Could not add income', e)
    process.exit(1)
  }
}
