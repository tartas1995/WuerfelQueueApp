module.exports = () => {
  return fetch('https://ddragon.leagueoflegends.com/api/versions.json')
  .then(response => response.json())
  .then(json => {
    return new Promise((resolve, reject) => {
      let newestVersion = [];
      for (let i in json) {
        if (Object.prototype.hasOwnProperty.call(json, i)) {
          const version = String.prototype.split.call(json[i], '.')
          if (newestVersion[0] === undefined) {
            newestVersion = version
          } else {
            const length = newestVersion.length > version.length
              ? newestVersion.length
              : version.length
            for (let i = 0; i < length; i++) {
              let versionNbr = version[i]
              let newestVersionNbr = newestVersion[i]
              if (i === 0) {
                versionNbr = String.prototype.replace.call(version[i], /lolpatch_/, '')
                newestVersionNbr = String.prototype.replace.call(newestVersion[i], /lolpatch_/, '')
              }
              if (parseInt(versionNbr) > parseInt(newestVersionNbr)) {
                newestVersion = version
              } else if (parseInt(versionNbr) < parseInt(newestVersionNbr)) {
                break;
              }
            }
          }
        }
      }
      resolve(Array.prototype.join.call(newestVersion, '.'))
    })
  })
}
