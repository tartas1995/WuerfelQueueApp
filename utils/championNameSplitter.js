module.exports = (alias) => {
  return alias.replace(/([A-Z])/g, ' $1').trim()
}
