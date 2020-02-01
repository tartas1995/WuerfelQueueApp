const { ipcMain } = require('electron')
const { lcuRequest, lcuWebSocket } = require(`${__dirname}/../../../node/lcu/connector`)

class Interface {
  constructor() {
    this.init = this.init.bind(this)
    this.initOn = this.initOn.bind(this)
    this.request = this.request.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.unsubscribe = this.unsubscribe.bind(this)
    this.init()
  }

  init() {
    this.initOn()
    this.request()
  }

  request() {
    this.requestPromise = lcuRequest({
      url: '/lol-summoner/v1/current-summoner',
      method: 'GET'
    })
  }

  subscribe(event) {
    this.lcuCurrentSummonerID = lcuWebSocket.subscribe('/lol-summoner/v1/current-summoner', (data, wsevent) => {
      event.reply('header-data', data)
    })
  }

  unsubscribe() {
      lcuWebSocket.unsubscribe('/lol-summoner/v1/current-summoner', this.lcuCurrentSummonerID)
  }

  initOn() {
    ipcMain.on('header-connect', (event, arg) => {
      this.event = event
      this.subscribe(event)
      this.requestPromise.then(data => {
        event.reply('header-data', data)
      }).catch(() => {
        this.event.reply('header-data', null)
      })
    })
    ipcMain.on('header-disconnect', (event, arg) => {
      this.unsubscribe()
    })
  }
}

module.exports = new Interface()
