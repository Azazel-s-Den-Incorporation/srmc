"use strict";
<<<<<<< HEAD:modules/io/save.js
// Data groups
  // data[0] map params
  // data[1] settings
  // data[2] map coords
  // data[3] biomes
  // data[4] notes
  // data[5] svg
  // data[6] grid
  // data[7] cells h
  // data[8] cells prec
  // data[9] cells f
  // data[10] cells t
  // data[11] cell temp
  // data[12] features
  // data[13] cultures
  // data[14] states
  // data[15] burgs
  // data[16] cells biome
  // data[17] cells burg
  // data[18] cells conf
  // data[19] cells culture
  // data[20] cells fl
  // data[21] cells pop
  // data[22] cells r
  // data[23] had deprecated cells.road
  // data[24] cells s
  // data[25] cells state
  // data[26] cells religion
  // data[27] cells province
  // data[28] had deprecated cells.crossroad
  // data[29] religions
  // data[30] provinces
  // data[31] names DL
  // data[32] rivers
  // data[33] rulers
  // data[34] used fonts
  // data[35] markers
  // data[36] cells routes
  // data[37] routes
  // data[38] zones
  // data[39] wealth
  // data[40] buildings
  // data[41] cells buildings

=======
>>>>>>> a3549c6f8c0131bffb916343273945dbe61ccc33:src/assets/modules/io/save.js
// functions to save the project to a file
async function saveMap(method) {
  if (customization) return tip("Map cannot be saved in EDIT mode, please complete the edit and retry", false, "error");
  closeDialogs("#alert");

  try {
    const mapData = prepareMapData();
    const filename = getFileName() + ".map";

    saveToStorage(mapData, method === "storage"); // any method saves to indexedDB
    if (method === "server") saveToServer(mapData);
    if (method === "machine") saveToMachine(mapData, filename);
    if (method === "dropbox") saveToDropbox(mapData, filename);
  } catch (error) {
    ERROR && console.error(error);
    alertMessage.innerHTML = /* html */ `An error is occured on map saving. If the issue persists, please copy the message below and report it on ${link(
      "https://github.com/AzazelMango/azmap/issues",
      "GitHub"
    )}. <p id="errorBox">${parseError(error)}</p>`;

    $("#alert").dialog({
      resizable: false,
      title: "Saving error",
      width: "28em",
      buttons: {
        Retry: function () {
          $(this).dialog("close");
          saveMap(method);
        },
        Close: function () {
          $(this).dialog("close");
        }
      },
      position: {my: "center", at: "center", of: "svg", collision: "fit", within: "#main-ui"}
    });
  }
}

function prepareMapData() {
  const date = new Date();
  const dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  const license = "File can be loaded in azazelmango.github.io/azmap";
  const params = [VERSION, license, dateString, seed, graphWidth, graphHeight, mapId].join("|");
  const settings = [
    distanceUnitInput.value,
    distanceScale,
    areaUnit.value,
    heightUnit.value,
    heightExponentInput.value,
    temperatureScale.value,
    "", // previously used for barSize.value
    "", // previously used for barLabel.value
    "", // previously used for barBackColor.value
    "", // previously used for barBackColor.value
    "", // previously used for barPosX.value
    "", // previously used for barPosY.value
    populationRate,
    urbanization,
    mapSizeOutput.value,
    latitudeOutput.value,
    "", // previously used for temperatureEquatorOutput.value
    "", // previously used for tempNorthOutput.value
    precOutput.value,
    JSON.stringify(options),
    mapName.value,
    +hideLabels.checked,
    stylePreset.value,
    +rescaleLabels.checked,
    urbanDensity,
    longitudeOutput.value,
    growthRate.value
  ].join("|");
  const coords = JSON.stringify(mapCoordinates);
  const biomes = [biomesData.color, biomesData.habitability, biomesData.name].join("|");
  const notesData = JSON.stringify(notes);
  const rulersString = rulers.toString();
  const fonts = JSON.stringify(getUsedFonts(svg.node()));

  // save svg
  const cloneEl = document.getElementById("map").cloneNode(true);

  // reset transform values to default
  cloneEl.setAttribute("width", graphWidth);
  cloneEl.setAttribute("height", graphHeight);
  cloneEl.querySelector("#viewbox").removeAttribute("transform");

  cloneEl.querySelector("#ruler").innerHTML = ""; // always remove rulers

  const serializedSVG = new XMLSerializer().serializeToString(cloneEl);

  const {spacing, cellsX, cellsY, boundary, points, features, cellsDesired} = grid;
  const gridGeneral = JSON.stringify({spacing, cellsX, cellsY, boundary, points, features, cellsDesired});
  const packFeatures = JSON.stringify(pack.features);
  const cultures = JSON.stringify(pack.cultures);
  const states = JSON.stringify(pack.states);
  const burgs = JSON.stringify(pack.burgs);
  const religions = JSON.stringify(pack.religions);
  const provinces = JSON.stringify(pack.provinces);
  const rivers = JSON.stringify(pack.rivers);
  const markers = JSON.stringify(pack.markers);
  const cellRoutes = JSON.stringify(pack.cells.routes);
  const routes = JSON.stringify(pack.routes);
  const zones = JSON.stringify(pack.zones);
  const buildings = JSON.stringify(pack.buildings);

  // store name array only if not the same as default
  const defaultNB = Names.getNameBases();
  const namesData = nameBases
    .map((b, i) => {
      const names = defaultNB[i] && defaultNB[i].b === b.b ? "" : b.b;
      return `${b.name}|${b.min}|${b.max}|${b.d}|${b.m}|${names}`;
    })
    .join("/");

  // round population to save space
  const pop = Array.from(pack.cells.pop).map(p => p);

  // data format as below
  const mapData = [
    params,
    settings,
    coords,
    biomes,
    notesData,
    serializedSVG,
    gridGeneral,
    grid.cells.h,
    grid.cells.prec,
    grid.cells.f,
    grid.cells.t,
    grid.cells.temp,
    packFeatures,
    cultures,
    states,
    burgs,
    pack.cells.biome,
    pack.cells.burg,
    pack.cells.conf,
    pack.cells.culture,
    pack.cells.fl,
    pop,
    pack.cells.r,
    [], // deprecated pack.cells.road
    pack.cells.s,
    pack.cells.state,
    pack.cells.religion,
    pack.cells.province,
    [], // deprecated pack.cells.crossroad
    religions,
    provinces,
    namesData,
    rivers,
    rulersString,
    fonts,
    markers,
    cellRoutes,
    routes,
    zones,
    pack.cells.wealth,
<<<<<<< HEAD:modules/io/save.js
    buildings,
    pack.cells.building
=======
    pack.cells.habitability
>>>>>>> a3549c6f8c0131bffb916343273945dbe61ccc33:src/assets/modules/io/save.js
  ].join("\r\n");
  return mapData;
}

// save map file to indexedDB
async function saveToStorage(mapData, showTip = false) {
  const blob = new Blob([mapData], {type: "text/plain"});
  await ldb.set("lastMap", blob);
  showTip && tip("Map is saved to the browser storage", false, "success");
}

// save map to server
function saveToServer(mapData){
  const blob = new Blob([mapData], {type: "text/plain"});
  const oldfilename = "/saves/loaded.map";
  const newfilename = ("/saves/loaded-old" + Date.now() + ".map");
  FileSystem.rename(oldfilename, newfilename, (err) => {
    if (err) throw err;
    console.log('Rename complete!');
  });
  FileSystem.writeFile(old, blob, (err) => {
    if (err) throw err;
    console.log('Rename complete!');
  });
  showTip && tip("Map is saved to the server storage", false, "success");
}

// download map file
function saveToMachine(mapData, filename) {
  const blob = new Blob([mapData], {type: "text/plain"});
  const URL = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = URL;
  link.click();

  tip('Map is saved to the "Downloads" folder (CTRL + J to open)', true, "success", 8000);
  window.URL.revokeObjectURL(URL);
}

async function saveToDropbox(mapData, filename) {
  await Cloud.providers.dropbox.save(filename, mapData);
  tip("Map is saved to your Dropbox", true, "success", 8000);
}

async function initiateAutosave() {
  const MINUTE = 60000; // munite in milliseconds
  let lastSavedAt = Date.now();

  async function autosave() {
    const timeoutMinutes = byId("autosaveIntervalOutput").valueAsNumber;
    if (!timeoutMinutes) return;

    const diffInMinutes = (Date.now() - lastSavedAt) / MINUTE;
    if (diffInMinutes < timeoutMinutes) return;
    if (customization) return tip("Autosave: map cannot be saved in edit mode", false, "warning", 2000);

    try {
      tip("Autosave: saving map...", false, "warning", 3000);
      const mapData = prepareMapData();
      await saveToStorage(mapData);
      tip("Autosave: map is saved", false, "success", 2000);

      lastSavedAt = Date.now();
    } catch (error) {
      ERROR && console.error(error);
    }
  }

  setInterval(autosave, MINUTE / 2);
}

// TODO: unused code
async function compressData(uncompressedData) {
  const compressedStream = new Blob([uncompressedData]).stream().pipeThrough(new CompressionStream("gzip"));

  let compressedData = [];
  for await (const chunk of compressedStream) {
    compressedData = compressedData.concat(Array.from(chunk));
  }

  return new Uint8Array(compressedData);
}

const saveReminder = function () {
  if (localStorage.getItem("noReminder")) return;
  const message = [
    "Please don't forget to save the project to desktop from time to time",
    "Please remember to save the map to your desktop",
    "Saving will ensure your data won't be lost in case of issues",
    "Safety is number one priority. Please save the map",
    "Don't forget to save your map on a regular basis!",
    "Just a gentle reminder for you to save the map",
    "Please don't forget to save your progress (saving to desktop is the best option)",
    "Don't want to get reminded about need to save? Press CTRL+Q"
  ];
  const interval = 15 * 60 * 1000; // remind every 15 minutes

  saveReminder.reminder = setInterval(() => {
    if (customization) return;
    tip(ra(message), true, "warn", 2500);
  }, interval);
  saveReminder.status = 1;
};
saveReminder();

function toggleSaveReminder() {
  if (saveReminder.status) {
    tip("Save reminder is turned off. Press CTRL+Q again to re-initiate", true, "warn", 2000);
    clearInterval(saveReminder.reminder);
    localStorage.setItem("noReminder", true);
    saveReminder.status = 0;
  } else {
    tip("Save reminder is turned on. Press CTRL+Q to turn off", true, "warn", 2000);
    localStorage.removeItem("noReminder");
    saveReminder();
  }
}
