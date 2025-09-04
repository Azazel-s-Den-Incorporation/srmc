"use strict";
function hideLoading() {
  d3.select("#loading").transition().duration(3000).style("opacity", 0);
  d3.select("#main-menu-screen").transition().duration(2000).style("opacity", 1);
  d3.select("#tooltip").transition().duration(3000).style("opacity", 1);
}

function showLoading() {
  d3.select("#loading").transition().duration(200).style("opacity", 1);
  d3.select("#main-menu-screen").transition().duration(300).style("opacity", 0);
  d3.select("#tooltip").transition().duration(200).style("opacity", 0);
}

async function checkLoadParameters() {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  // of there is a valid maplink, try to load .map/.gz file from URL
  if (params.get("maplink")) {
    WARN && console.warn("Load map from URL");
    const maplink = params.get("maplink");
    const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    const valid = pattern.test(maplink);
    if (valid) {
      setTimeout(() => {
        loadMapFromURL(maplink, 1);
      }, 1000);
      return;
    } else showUploadErrorMessage("Map link is not a valid URL", maplink);
  }

  // loading from the server
  if (byId("onloadBehavior").value === "server") {
    WARN && console.warn("Load map from Server");
    loadMapFromServer();
    return;
    } else showUploadErrorMessage("Map file is not a valid.");

  // if there is a seed (user of MFCG provided), generate map for it
  if (params.get("seed")) {
    WARN && console.warn("Generate map for seed");
    generateMapOnLoad();
    return;
  }

  // check if there is a map saved to indexedDB
  if (byId("onloadBehavior").value === "lastSaved") {
    try {
      const blob = await ldb.get("lastMap");
      if (blob) {
        WARN && console.warn("Loading last stored map");
        uploadMap(blob);
        return;
      }
    } catch (error) {
      ERROR && console.error(error);
    }
  }

  // else generate random map
  WARN && console.warn("Generate random map");
  generateMapOnLoad();
}

function mainMenuButton() {
  document.getElementById("main-menu").style.display = "flex";
  document.getElementById("load-menu").style.display = "none";
  document.getElementById("options-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("dropbox-menu").style.display = "none";
} 

function newMapButton() {
  window.location.href = "gamesession.html";
  loadFunction = "new"
  generateMapOnLoad();
} 

function loadMapButton() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("load-menu").style.display = "flex";
  document.getElementById("options-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("dropbox-menu").style.display = "none";
} 

function optionsButton() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("load-menu").style.display = "none";
  document.getElementById("options-menu").style.display = "flex";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("dropbox-menu").style.display = "none";
} 

function settingsButton() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("load-menu").style.display = "none";
  document.getElementById("options-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "flex";
  document.getElementById("dropbox-menu").style.display = "none";
} 

function dropboxButton() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("load-menu").style.display = "none";
  document.getElementById("options-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("dropbox-menu").style.display = "flex";
}

function exitButton() {
    window.location.href = "https://azazelsden.xyz";
}