module.exports.command = 'transfer [from wallet] [to wallet] [amount]'
module.exports.describe = 'Transfer money'
module.exports.builder = (yargs) => yargs
  .positional('fromWallet', {
    describe: 'The origin wallet name',
    type: 'string'
  })
  .positional('toWallet', {
    describe: 'The destination wallet name',
    type: 'string'
  })
  .positional('amount', {
    describe: 'Amount of money',
    type: 'number'
  })
  .option('fromCategory', {
    describe: 'Origin category',
    alias: 'fc',
    type: 'string'
  })
  .option('toCategory', {
    describe: 'Destination category',
    alias: 'dc',
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
  .option('isOnlineTransaction', {
    describe: 'Use category Online transaction',
    alias: 'o',
    type: 'boolean'
  })

module.exports.handler = async (argv) => {
  console.log('Start logging money transfer')
  const chrono = require('chrono-node')
  const { getMoneyLover, printTransaction, promptOne } = require('../util')
  const MoneyLover = require('../moneylover')

  const ml = await getMoneyLover()
  const wallets = await ml.getWalletNames()

  if (argv.amount === null) {
    argv.amount = await promptOne({
      message: 'Amount',
      type: 'input'
    })
  }

  if (argv.fromWallet === null) {
    argv.fromWallet = await promptOne({
      message: 'Origin wallet',
      type: 'list',
      choices: wallets,
      transformer: (input, answer) => answer.name
    })
  }
  const fromWallet = wallets.find(({ _id, name }) => _id === argv.fromWallet || name === argv.fromWallet)
  const fromCategories = await ml.getCategories(fromWallet._id)

  if (argv.toWallet === null) {
    argv.toWallet = await promptOne({
      message: 'To wallet',
      type: 'list',
      choices: wallets,
      transformer: (input, answer) => answer.name
    })
  }
  const toWallet = wallets.find(({ _id, name }) => _id === argv.toWallet || name === argv.toWallet)
  const toCategories = await ml.getCategories(toWallet._id)

  if (argv.isOnlineTransaction) {
    argv.fromCategory = 'Online transaction';
    argv.toCategory = 'Online transaction';
  }

  if (argv.fromCategory === null) {
    argv.fromCategory = await promptOne({
      message: 'From category',
      type: 'list',
      choices: fromCategories,
      tranformer: (input, answer) => answer.name,
    //   default: fromWalletCategories.find(({ name }) => name === 'Online transaction')
      default: fromCategories.find(({ metadata }) => metadata === 'IS_OTHER_EXPENSE')
    })
  }

  if (argv.toCategory === null) {
    argv.toCategory = await promptOne({
      message: 'To category',
      type: 'list',
      choices: toCategories,
      tranformer: (input, answer) => answer.name,
    //   default: toWalletCategories.find(({ name }) => name === 'Online transaction')
      default: toCategories.find(({ metadata }) => metadata === 'IS_OTHER_EXPENSE')
    })
  }

  let fromCategory = argv.fromCategory != null && fromCategories.find(({ name, type, _id }) => type === MoneyLover.CATEGORY_TYPE_EXPENSE && (name === argv.fromCategory || _id === argv.fromCategory))
  let toCategory = argv.toCategory != null && toCategories.find(({ name, type, _id }) => type === MoneyLover.CATEGORY_TYPE_EXPENSE && (name === argv.toCategory || _id === argv.toCategory))
  
  if (!fromCategory) {
    fromCategory = fromCategories.find(({ metadata }) => metadata === 'IS_OTHER_EXPENSE')
  }
  if (!toCategory) {
    toCategory = toCategories.find(({ metadata }) => metadata === 'IS_OTHER_EXPENSE')
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
    argv.note == 'Logged by API'
    // argv.note = await promptOne({
    //   message: 'Note',
    //   type: 'input'
    // })
  }

  try {
    await ml.addMultipleTransaction({
      fromWallet,
      toWallet,
      amount: argv.amount,
      fromCategory,
      toCategory,
      date: argv.date,
      note: argv.note
    //   account: wallet._id,
    //   category: category._id,
    //   amount: `${argv.amount}`,
    //   note: argv.note || '',
    //   date,
    //   exclude_report: isExcludeFromReport
    })
    console.log('✔ Money transfering logged')
    // printTransaction({
    //   wallet,
    //   category,
    //   amount: argv.amount,
    //   note: argv.note || '',
    //   date
    // })
  } catch (e) {
    console.error('Could not log money transfering', e)
    process.exit(1)
  }
}
