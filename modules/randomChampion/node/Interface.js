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
      url: '/lol-champion-select/v1/pickable-champion-ids',
      method: 'GET'
    })
  }

  getRandomChampion() {
    //generate random champion if champion is not available anymore
  }

  subscribe(event) {
    this.lcuCurrentSummonerID = lcuWebSocket.subscribe('/lol-champion-select/v1/pickable-champion-ids', (data, wsevent) => {
      event.reply('random-champion-data', data)
    })
  }

  unsubscribe() {
      lcuWebSocket.unsubscribe('/lol-champion-select/v1/pickable-champion-ids', this.lcuCurrentSummonerID)
  }

  initOn() {
    ipcMain.on('random-champion-connect', (event, arg) => {
      this.event = event
      this.subscribe(event)
      this.requestPromise.then(data => {
        event.reply('random-champion-data', data)
      }).catch(() => {
        this.event.reply('random-champion-data', null)
      })
    })
    ipcMain.on('random-champion-disconnect', (event, arg) => {
      this.unsubscribe()
    })
  }
}

module.exports = new Interface()
