const fs = require('fs-extra')
const cp = require('child_process')
const util = require('util')
const requestPromise = require('request-promise')
const https = require('https')
const WebSocket = require('ws')

class LeagueWebSocket {
  constructor() {
    this.subscribe = this.subscribe.bind(this)
    this.unsubscribe = this.unsubscribe.bind(this)
    this.reconnect = this.reconnect.bind(this)
    this.initRequest = this.initRequest.bind(this)
    this.initOn = this.initOn.bind(this)
    this.init = this.init.bind(this)

    this.subscriptions = {}
    this.autoReconnectInterval = 5 * 1000

    this.init()
  }

  init() {
    lcuAuth().then(creds => {
      this.instance = new WebSocket(`wss://riot:${creds.token}@127.0.0.1:${creds.port}`, {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`riot:${creds.token}`).toString('base64')
        },
        rejectUnauthorized: false
      })
      this.initOn()
      this.initRequest()
    }).catch(err => {
      setTimeout(this.init, this.autoReconnectInterval)
    })
  }

  initRequest() {
    for (let path in this.subscriptions) {
      if (Object.prototype.hasOwnProperty.call(this.subscriptions, path)) {
        lcuRequest({
          url: path,
          method: 'GET'
        }).then(data => {
          for (let id in this.subscriptions[path].effects) {
            if (Object.prototype.hasOwnProperty.call(this.subscriptions[path].effects, id)) {
              this.subscriptions[path].effects[id](data, null)
            }
          }
        })
      }
    }
  }

  initOn() {
    this.instance.on('message', (json) => {
      if (json.length > 0) {
        const payload = JSON.parse(json)
        const res = payload.slice(2)[0]
        if (this.subscriptions[res.uri] !== undefined) {
          for (let i in this.subscriptions[res.uri].effects) {
            if (Object.prototype.hasOwnProperty.call(this.subscriptions[res.uri].effects, i)) {
              this.subscriptions[res.uri].effects[i](res.data, res)
            }
          }
        }
      }
    })

    this.instance.on('open', () => {
      this.instance.send(JSON.stringify([5, 'OnJsonApiEvent']))
    })

    this.instance.on('close', (e) => {
      switch (e.code) {
        case 1000:
          console.log('WebSocket: closed')
          break;
        default:
          this.reconnect(e)
          break;
      }
    })

    this.instance.on('error', (e) => {
      switch (e.code) {
        case 'ECONNREFUSED':
          this.reconnect(e)
          break;
        default:
          this.onerror(e)
          break;
      }
    })
  }

  reconnect(e) {
    console.log(`WebSocket: reconnect in ${this.autoReconnectInterval}ms`)
    this.instance.removeAllListeners()
    this.init();
  }

  subscribe(path, effect) {
    if (!Object.prototype.hasOwnProperty.call(this.subscriptions, path)) {
      this.subscriptions[path] = {
        counter: 0,
        effects: {}
      }
    }
    const id = this.subscriptions[path].counter++
    this.subscriptions[path].effects[id] = effect
    return id
  }

  unsubscribe(path, id) {
    delete this.subscriptions[path].effects[id]
  }
}

const exec = util.promisify(cp.exec)

function lcuAuth() {
  return new Promise((resolve, reject) => {
    const re = process.platform === 'win32' ? /"--install-directory=(.*?)"/ : /--install-directory=(.*?)( --|\n|$)/
    const cmd = process.platform === 'win32' ? 'WMIC PROCESS WHERE name=\'LeagueClientUx.exe\' GET CommandLine' : 'ps x -o args | grep \'LeagueClientUx\''

    exec(cmd).then(data => {
      const { stdout } = data
      const [_, path] = stdout.match(re) || []


      fs.readFile(`${path}/lockfile`, 'utf8').then(content => {
        const [name, pid, port, token, protocol] = content.split(':')
        resolve({
          name,
          pid: Number(pid),
          port: Number(port),
          token,
          protocol
        })
      }).catch(err => {
        reject('League Client could not be located.')
      })
    }).catch(err => {
      reject(err)
    })
  })
}

function lcuRequest(options) {
  return lcuAuth().then(creds => {
    const { url } = options

    return requestPromise({
      strictSSL: false,
      url: `${creds.protocol}://127.0.0.1:${creds.port}${options.url}`,
      method: options.method,
      json: true,
      body: typeof options.body === "undefined" ? undefined : options.body,
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`riot:${creds.token}`).toString('base64')
      },
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
  }).catch(() => {
    return null
  })
}

function lcuFetch(options) {
  return lcuAuth().then(creds => {
    const { url } = options

    return fetch(`${creds.protocol}://127.0.0.1:${creds.port}${options.url}`, {
      method: options.method,
      body: typeof options.body === "undefined" ? undefined : JSON.stringify(options.body),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`riot:${creds.token}`)
      },
    })
  }).catch(() => {
    return null
  })
}

module.exports = {
  lcuRequest,
  lcuFetch,
  lcuWebSocket: new LeagueWebSocket()
}
