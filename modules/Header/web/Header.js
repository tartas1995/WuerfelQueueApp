const { ipcRenderer } = require('electron')

class Header extends HTMLElement {
  constructor() {
    super()
    this.loadTemplate = this.loadTemplate.bind(this)
    this.updateDisplay = this.updateDisplay.bind(this)
    this.updateIcon = this.updateIcon.bind(this)
    this.updateSummonerName = this.updateSummonerName.bind(this)

    this.currentSummoner = null

    this.loadTemplate()
  }

  loadTemplate() {
    this.templateLoaded = fetch(`${__dirname}/Header.html`)
    .then(response => response.text())
    .then(text => {
      let shadow = this.attachShadow({mode: 'open'})
      const container = document.createElement('div')
      container.innerHTML = text;
      for (let i in container.childNodes) {
        if (Object.hasOwnProperty.call(container.childNodes, i)) {
          shadow.appendChild(container.childNodes[i])
        }
      }
      fetch(`${__dirname}/Header.css`)
      .then(response => response.text())
      .then(text => {
        shadow.querySelector('style').innerHTML = text
      })
    })
  }

  updateDisplay() {
    this.updateIcon()
    this.updateSummonerName()
  }

  updateIcon() {
    if (this.currentSummoner !== null) {
      require(`${__dirname}/../../../utils/version`)().then((version) => {
        require(`${__dirname}/../../../utils/profileIcon`)(version, this.currentSummoner.profileIconId).then((blob) => {
          const image = URL.createObjectURL(blob)
          this.shadowRoot.querySelector('#profileIcon').src = `${image}`
        })
      })
    } else {
      require(`${__dirname}/../../../utils/version`)().then((version) => {
        require(`${__dirname}/../../../utils/profileIcon`)(version, 0).then((blob) => {
          const image = URL.createObjectURL(blob)
          this.shadowRoot.querySelector('#profileIcon').src = `${image}`
        })
      })
    }
  }

  updateSummonerName() {
    if (this.currentSummoner !== null) {
      this.shadowRoot.querySelector('#summonerName').innerHTML = this.currentSummoner.displayName
    }
  }

  connectedCallback() {
    this.templateLoaded.then(() => {
      ipcRenderer.on('header-data', (event, data) => {
        if (data !== null) {
          this.currentSummoner = data
          this.updateDisplay()
        }
      })
      this.updateDisplay()
      ipcRenderer.send('header-connect', 'connect')
    })
  }

  disconnectedCallback() {
    ipcRenderer.send('header-disconnect', 'disconnect')
  }
}

module.exports = (customElements) => {
  customElements.define('custom-header', Header)
}
