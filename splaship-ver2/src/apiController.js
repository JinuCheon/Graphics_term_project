function getTopScore() {
    axios.get('http://13.125.60.165/rank')
    .then((res) => {
        scoreList = res.data;
        var paragraph = "<b>Top 10 Honorable Captains!</b><br>";
        for(var i=0;i<scoreList.length;i++) {
            paragraph += "<p>";
            paragraph += `${i+1}.${scoreList[i].score}point, ${scoreList[i].userName}`;
            paragraph += "</p>";
        }
        rankText.innerHTML = paragraph;
    })
    .catch(() => {
        rankText.innerHTML = "<b>off-line mode</b><br>";
    })
}

function setNewScore(name, newScore) {
    axios.get(`http://13.125.60.165/new-score?name=${name.slice(-10)}&score=${newScore}`)
}
