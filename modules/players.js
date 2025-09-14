"use strict";

// init
let playerState = "";
let sps = "pack.states";

async function initPlayer(spsi) {
  playerState = spsi;
  sps = pack.states[playerState];
};

document.getElementById("popularity").innerHTML = 0;
document.getElementById("population").innerHTML = 0;
document.getElementById("economy").innerHTML = 0;
document.getElementById("piety").innerHTML = 0;
document.getElementById("army").innerHTML = 0;
document.getElementById("navy").innerHTML = 0;
document.getElementById("airforce").innerHTML = 0;
document.getElementById("satelites").innerHTML = 0;



// select player state
async function selectPlayerState(spsi) {
  try {
    WARN && console.warn("Setting Player State");
        initPlayer(spsi);
    WARN && console.warn("Set Player State to "+spsi.name+" ID:["+spsi+"].");
  } catch (error) {
    ERROR && console.error(error);
  }
  WARN && console.warn("Setting National Stats");
    refreshPlayerStats();
  WARN && console.warn("Stats Set:"+" "+sps.population+" "+sps.popularity+" "+sps.wealth+" "+sps.piety+" "+sps.army+" "+sps.navy+" "+sps.airforce+" "+sps.satelites);
        
};

document.getElementById("opsStats").on("click", event => {
  let $element = event.target;
  let classList = $element.classList;
  if ($element.tagName === "FILL-BOX") stateChangeFill($element);
  else if (classList.contains("name")) editStateName(playerState);
  else if (classList.contains("coaIcon")) editEmblem("state", "stateCOA" + playerState, pack.states[playerState]);
  else if (classList.contains("icon-star-empty")) stateCapitalZoomIn(playerState);
  else if (classList.contains("icon-dot-circled")) overviewBurgs({playerState});
  else if (classList.contains("statePopulation")) changePopulation(playerState);
  else if (classList.contains("stateWealth")) changeWealth(playerState);
  else if (classList.contains("stateWages")) changeWealth(playerState);
  else if (classList.contains("icon-pin")) toggleFog(playerState, classList);
  else if (classList.contains("icon-trash-empty")) stateRemovePrompt(playerState);
  else if (classList.contains("icon-lock") || classList.contains("icon-lock-open"))
  updateLockStatus(playerState, classList);
});



// refresh player data
async function refreshPlayerStats() {
    // let unit = getAreaUnit();
    // let capital = pack.burgs[playerState.capital].name;
    // let area = getArea(sps.area);
    // let name = sps.name;
    // let rural = rn(sps.rural * populationRate);
    // let urban = rn(sps.urban * populationRate * urbanization);
    // sps.youngpop = rn(sps.population);
    // sps.workingpop = rn(sps.population);
    // sps.elderpop = rn(sps.population);
    // let wages = sps.wages;
    // let wealth = sps.wealth;
    // let popularity = sps.popularity;
    // let piety = sps.piety;
    // let army = sps.army;
    // let navy = sps.navy;
    // let airforce = sps.airforce;
    // let satelites = sps.satelites;        
    let populationTip = `Total population: ${si(sps.population)}; Rural population: ${si(rural)}; Urban population: ${si(urban)}. Click to change`;
    // let culture = sps.culture;
    // let type = sps.type;
    // let formName = sps.formName;
    // let burgs = sps.burgs;
    // let expansionism = sps.expansionism;
    // let color = sps.color;

    // Updating Stats Bar
    let ssemblem = '<svg id="selected-nation-emblem" viewbox="0 0 200 200" id="selected-nation-coa"><use href="#stateCOA'+playerState+'"></use></svg>';
    document.getElementById("selected-nation").innerHTML = ssemblem;
    let ssCOA = "stateCOA" + playerState;
    COArenderer.trigger(ssCOA, playerState.coa);
    let ssoCOA = "#stateCOA" + playerState;
    document.getElementById("opsEmblem").setAttribute("href", ssoCOA);
    // Population
    document.getElementById("population").innerHTML = si(sps.population);
    document.getElementById("population").setAttribute("data-tip", "Total population: "+sps.population+".");
    // Popularity
    document.getElementById("popularity").innerHTML = sps.popularity;
    document.getElementById("popularity").setAttribute("data-tip", "Total popularity: "+sps.popularity+".");
    // Economy
    document.getElementById("economy").innerHTML = cv(sps.wealth);
    document.getElementById("economy").setAttribute("data-tip", "Total wealth: "+sps.wealth+".");
    // Piety / Religion
    document.getElementById("piety").innerHTML = sps.piety;
    document.getElementById("piety").setAttribute("data-tip", "Total piety: "+sps.piety+".");
    // Army Units
    document.getElementById("army").innerHTML = sps.army;
    document.getElementById("army").setAttribute("data-tip", "Total army: "+sps.army+".");
    // Navy Units
    document.getElementById("navy").innerHTML = sps.navy;
    document.getElementById("airforce").setAttribute("data-tip", "Total airforce: "+sps.airforce+".");
    // Airforce Units
    document.getElementById("airforce").innerHTML = sps.airforce;
    document.getElementById("navy").setAttribute("data-tip", "Total navy: "+sps.navy+".");
    // Satelite Units
    document.getElementById("satelites").innerHTML = sps.satelites;
    document.getElementById("satelites").setAttribute("data-tip", "Total satelites: "+sps.satelites+".");

};


// Open Player State Overview
function openOPS() {
  closeDialogs("#overviewPlayerState, .stable");
  if (!layerIsOn("toggleStates")) toggleStates();
  if (!layerIsOn("toggleBorders")) toggleBorders();
  if (layerIsOn("toggleCultures")) toggleCultures();
  if (layerIsOn("toggleBiomes")) toggleBiomes();
  if (layerIsOn("toggleReligions")) toggleReligions();

  refreshPlayerStats();

    $("#overviewPlayerState").dialog({
    title: "Player State",
    resizable: false,
    close: closePlayerStateOverview,
    position: {my: "left top", at: "left-9 top+100", of: "#selected-nation", collision: "fit", within: "#main-ui"}
  });

};

function closePlayerStateOverview() {
  debug.selectAll(".highlight").remove();
}