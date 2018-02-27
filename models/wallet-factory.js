const walletFactory = {}

walletFactory.build = body => {
  const wallet = {}
  wallet.name    = body.name
  wallet.address = body.address
  wallet.key     = body.key
  return wallet
}

module.exports = walletFactory
