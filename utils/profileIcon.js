module.exports = (version, profileIconId) => {
  return fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`)
    .then(response => response.blob())
}
