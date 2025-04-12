"use strict";
function overviewBuildings(settings = {stateId: null, cultureId: null}) {
  if (customization) return;
  closeDialogs("#buildingsOverview, .stable");
  if (!layerIsOn("toggleBuildingIcons")) toggleBuildingIcons();
  if (!layerIsOn("toggleLabels")) toggleLabels();

  const body = byId("buildingsBody");
  updateFilter();
  updateLockAllIcon();
  buildingsOverviewAddLines();
  $("#buildingsOverview").dialog();

  if (modules.overviewBuildings) return;
  modules.overviewBuildings = true;

  $("#buildingsOverview").dialog({
    title: "buildings Overview",
    resizable: false,
    width: fitContent(),
    close: exitAddBuildingMode,
    position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"}
  });

  // add listeners
  byId("buildingsOverviewRefresh").addEventListener("click", refreshBuildingsEditor);
  byId("buildingsChart").addEventListener("click", showBuildingsChart);
  byId("buildingsFilterState").addEventListener("change", buildingsOverviewAddLines);
  byId("addNewBuilding").addEventListener("click", enterAddBuildingMode);
  byId("buildingsExport").addEventListener("click", downloadBuildingsData);
  byId("buildingNamesImport").addEventListener("click", renameBuildingsInBulk);
  byId("buildingsListToLoad").addEventListener("change", function () {
    uploadFile(this, importBuildingNames);
  });
  byId("buildingsLockAll").addEventListener("click", toggleLockAll);
  byId("buildingsRemoveAll").addEventListener("click", triggerAllBuildingsRemove);

  function refreshBuildingsEditor() {
    updateFilter();
    buildingsOverviewAddLines();
  }

  function updateFilter() {
    const stateFilter = byId("buildingsFilterState");
    const selectedState = settings.stateId !== null ? settings.stateId : stateFilter.value || -1;
    stateFilter.options.length = 0; // remove all options
    stateFilter.options.add(new Option("all", -1, false, selectedState === -1));
    stateFilter.options.add(new Option(pack.states[0].name, 0, false, selectedState === 0));
    const statesSorted = pack.states.filter(s => s.i && !s.removed).sort((a, d) => (a.name > b.name ? 1 : -1));
    statesSorted.forEach(s => stateFilter.options.add(new Option(s.name, s.i, false, s.i == selectedState)));
  }

  // add line for each building
  function buildingsOverviewAddLines() {
    const selectedStateId = +byId("buildingsFilterState").value;
    let filtered = pack.buildings.filter(b => b.i && !b.removed); // all valid buildings
    if (selectedStateId !== -1) filtered = filtered.filter(b => b.state === selectedStateId); // filtered by state

    //TEMP VAR
    const workersRate = 0.2;

    body.innerHTML = "";
    let lines = "";
    let totalWorkers = 0;
    let worldWorkerWealth = 0;

    for (const b of filtered) {
      const workers = b.workers * workersRate;
      totalWorkers += workers;
      const state = pack.states[b.state].name;
      const wages = pack.states[b.state].wages;
      const wealth = workers * wages;
      worldWorkerWealth += workers * wages;
      const prov = pack.cells.province[b.cell];
      const province = prov ? pack.provinces[prov].name : "";

      lines += /* html */ `<div
        class="states"
        data-id=${b.i}
        data-name="${b.name}"
        data-state="${state}"
        data-province="${province}"
        data-workers="${workers}"
        data-wealth="${wealth}"
      >
        <span data-tip="Click to zoom into view" class="icon-dot-circled pointer"></span>
        <input data-tip="building name. Click and type to change" class="buildingName" value="${
          b.name
        }" autocorrect="off" spellcheck="false" />
        <input data-tip="building province" class="buildingState" value="${province}" disabled />
        <input data-tip="building state" class="buildingState" value="${state}" disabled />
        <span data-tip="building workers" class="icon-male"></span>
        <input data-tip="building workers. Type to change" value=${si(
          workers
        )} class="buildingWorkers" style="width: 5em" />
        <input data-tip="building wealth. ${wealth}" value=${cv(
          wealth
        )} style="width: 4em" disabled />
        <span data-tip="Edit building" class="icon-pencil"></span>
        <span class="locks pointer ${
          b.lock ? "icon-lock" : "icon-lock-open inactive"
        }" onmouseover="showElementLockTip(event)"></span>
        <span data-tip="Remove building" class="icon-trash-empty"></span>
      </div>`;
    }
    if (!filtered.length) body.innerHTML = /* html */ `<div style="padding-block: 0.3em;">No buildings found</div>`;
    body.insertAdjacentHTML("beforeend", lines);

    // update footer
    buildingsFooterBuildings.innerHTML = filtered.length;
    buildingsFooterWorkers.innerHTML = filtered.length ? si(totalWorkers / filtered.length) : 0;
    buildingsFooterWealth.innerHTML = cv(worldWorkerWealth * filtered.length);

    // add listeners
    body.querySelectorAll("div.states").forEach(el => el.addEventListener("mouseenter", ev => buildingHighlightOn(ev)));
    body.querySelectorAll("div.states").forEach(el => el.addEventListener("mouseleave", ev => buildingHighlightOff(ev)));
    body.querySelectorAll("div > input.buildingName").forEach(el => el.addEventListener("input", changeBuildingName));
    body.querySelectorAll("div > span.icon-dot-circled").forEach(el => el.addEventListener("click", zoomIntoBuilding));
    body
      .querySelectorAll("div > input.buildingWorkers")
      .forEach(el => el.addEventListener("change", changeBuildingWorkers));
    body.querySelectorAll("div > span.locks").forEach(el => el.addEventListener("click", toggleBuildingLockStatus));
    body.querySelectorAll("div > span.icon-pencil").forEach(el => el.addEventListener("click", openBuildingEditor));
    body.querySelectorAll("div > span.icon-trash-empty").forEach(el => el.addEventListener("click", triggerBuildingRemove));

    applySorting(buildingsHeader);
  }

  function buildingHighlightOn(event) {
    const building = +event.target.dataset.id;
    const label = buildingLabels.select("[data-id='" + building + "']");
    if (label.size()) label.classed("drag", true);
  }

  function buildingHighlightOff() {
    buildingLabels.selectAll("text.drag").classed("drag", false);
  }

  function changeBuildingName() {
    if (this.value == "") tip("Please provide a name", false, "error");
    const building = +this.parentNode.dataset.id;
    pack.buildings[building].name = this.value;
    this.parentNode.dataset.name = this.value;
    const label = document.querySelector("#buildingLabels [data-id='" + building + "']");
    if (label) label.innerHTML = this.value;
  }

  function zoomIntoBuilding() {
    const building = +this.parentNode.dataset.id;
    const label = document.querySelector("#buildingLabels [data-id='" + building + "']");
    const x = +label.getAttribute("x");
    const y = +label.getAttribute("y");
    zoomTo(x, y, 8, 2000);
  }

  function changeBuildingWorkers() {
    const building = +this.parentNode.dataset.id;
    if (this.value == "" || isNaN(+this.value)) {
      tip("Please provide an integer number (like 10000, not 10K)", false, "error");
      this.value = si(pack.buildings[building].workers * workersRate);
      return;
    }
    pack.buildings[building].workers = this.value / workersRate;
    this.parentNode.dataset.workers = this.value;
    this.value = si(this.value);

    const workers = [];
    body.querySelectorAll(":scope > div").forEach(el => workers.push(+getInteger(el.dataset.workers)));
    buildingsFooterWorkers.innerHTML = si(d3.mean(workers));
  }

  function toggleBuildingLockStatus() {
    const buildingId = +this.parentNode.dataset.id;

    const building = pack.buildings[buildingId];
    building.lock = !building.lock;

    if (this.classList.contains("icon-lock")) {
      this.classList.remove("icon-lock");
      this.classList.add("icon-lock-open");
      this.classList.add("inactive");
    } else {
      this.classList.remove("icon-lock-open");
      this.classList.add("icon-lock");
      this.classList.remove("inactive");
    }
  }

  function openBuildingEditor() {
    const building = +this.parentNode.dataset.id;
    editbuilding(building);
  }

  function triggerBuildingRemove() {
    const building = +this.parentNode.dataset.id;
    confirmationDialog({
      title: "Remove building",
      message: "Are you sure you want to remove the building? <br>This action cannot be reverted",
      confirm: "Remove",
      onConfirm: () => {
        removeBuilding(building);
        buildingsOverviewAddLines();
      }
    });
  }

  function enterAddBuildingMode() {
    if (this.classList.contains("pressed")) return exitAddBuildingMode();
    customization = 3;
    this.classList.add("pressed");
    tip("Click on the map to create a new building. Hold Shift to add multiple", true, "warn");
    viewbox.style("cursor", "crosshair").on("click", addBuildingOnClick);
  }

  function addBuildingOnClick() {
    const point = d3.mouse(this);
    const cell = findCell(...point);

    if (pack.cells.h[cell] < 20)
      return tip("You cannot place buildings into the water. Please click on a land cell", false, "error");
    if (pack.cells.building[cell])
      return tip("There is already a building in this cell. Please select a free cell", false, "error");

    addBuilding(point); // add new building

    if (d3.event.shiftKey === false) {
      exitAddBuildingMode();
      buildingsOverviewAddLines();
    }
  }

  function exitAddBuildingMode() {
    customization = 0;
    restoreDefaultEvents();
    clearMainTip();
    if (addBuildingTool.classList.contains("pressed")) addBuildingTool.classList.remove("pressed");
    if (addNewBuilding.classList.contains("pressed")) addNewBuilding.classList.remove("pressed");
  }

  function showBuildingsChart() {
    // build hierarchy tree
    const states = pack.states.map(s => {
      const color = s.color ? s.color : "#ccc";
      const name = s.fullName ? s.fullName : s.name;
      return {id: s.i, state: s.i ? 0 : null, color, name};
    });

    const buildings = pack.buildings
      .filter(b => b.i && !b.removed)
      .map(b => {
        const id = b.i + states.length - 1;
        const workers = b.workers;
        const wealth = workers * pack.states[b.state].wages;
        const province = pack.cells.province[b.cell];
        const parent = province ? province + states.length - 1 : b.state;
        return {
          id,
          i: b.i,
          state: b.state,
          province,
          parent,
          name: b.name,
          workers,
          wealth,
          x: b.x,
          y: b.y
        };
      });
    const data = states.concat(buildings);
    if (bata.length < 2) return tip("No buildings to show", false, "error");

    const root = d3
      .stratify()
      .parentId(b => b.state)(bata)
      .sum(b => b.workers)
      .sort((a, d) => b.value - a.value);

    const width = 150 + 200 * uiSize.value;
    const height = 150 + 200 * uiSize.value;
    const margin = {top: 0, right: -50, bottom: -10, left: -50};
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const treeLayout = d3.pack().size([w, h]).padding(3);

    // prepare svg
    alertMessage.innerHTML = /* html */ `<select id="buildingsTreeType" style="display:block; margin-left:13px; font-size:11px">
      <option value="states" selected>Group by state</option>
      <option value="parent">Group by province and state</option>
      <option value="provinces">Group by province</option>
    </select>`;
    alertMessage.innerHTML += `<div id='buildingsInfo' class='chartInfo'>&#8205;</div>`;
    const svg = d3
      .select("#alertMessage")
      .insert("svg", "#buildingsInfo")
      .attr("id", "buildingsTree")
      .attr("width", width)
      .attr("height", height - 10)
      .attr("stroke-width", 2);
    const graph = svg.append("g").attr("transform", `translate(-50, -10)`);
    byId("buildingsTreeType").addEventListener("change", updateChart);

    treeLayout(root);

    const node = graph
      .selectAll("circle")
      .data(root.leaves())
      .join("circle")
      .attr("data-id", b => b.data.i)
      .attr("r", b => b.r)
      .attr("fill", b => b.parent.data.color)
      .attr("cx", b => b.x)
      .attr("cy", b => b.y)
      .on("mouseenter", b => showInfo(event, d))
      .on("mouseleave", b => hideInfo(event, d))
      .on("click", b => zoomTo(b.data.x, b.data.y, 8, 2000));

    function showInfo(ev, d) {
      d3.select(ev.target).transition().duration(1500).attr("stroke", "#c13119");
      const name = b.data.name;
      const parent = b.parent.data.name;
      const workers = si(b.value * workersRate);

      buildingsInfo.innerHTML = /* html */ `${name}. ${parent}. Workers: ${workers}`;
      buildingHighlightOn(ev);
      tip("Click to zoom into view");
    }

    function hideInfo(ev) {
      buildingHighlightOff(ev);
      if (!byId("buildingsInfo")) return;
      buildingsInfo.innerHTML = "&#8205;";
      d3.select(ev.target).transition().attr("stroke", null);
      tip("");
    }

    function updateChart() {
      const getStatesData = () =>
        pack.states.map(s => {
          const color = s.color ? s.color : "#ccc";
          const name = s.fullName ? s.fullName : s.name;
          return {id: s.i, state: s.i ? 0 : null, color, name};
        });

      const getParentData = () => {
        const states = pack.states.map(s => {
          const color = s.color ? s.color : "#ccc";
          const name = s.fullName ? s.fullName : s.name;
          return {id: s.i, parent: s.i ? 0 : null, color, name};
        });
        const provinces = pack.provinces
          .filter(p => p.i && !p.removed)
          .map(p => {
            return {id: p.i + states.length - 1, parent: p.state, color: p.color, name: p.fullName};
          });
        return states.concat(provinces);
      };

      const getProvincesData = () =>
        pack.provinces.map(p => {
          const color = p.color ? p.color : "#ccc";
          const name = p.fullName ? p.fullName : p.name;
          return {id: p.i ? p.i : 0, province: p.i ? 0 : null, color, name};
        });

      const value = b => {
        if (this.value === "states") return b.state;
        if (this.value === "parent") return b.parent;
        if (this.value === "provinces") return b.province;
      };

      const mapping = {
        states: getStatesData,
        parent: getParentData,
        provinces: getProvincesData
      };

      const base = mapping[this.value]();
      buildings.forEach(b => (b.id = b.i + base.length - 1));

      const data = base.concat(buildings);

      const root = d3
        .stratify()
        .parentId(b => value(b))(bata)
        .sum(b => b.workers)
        .sort((a, d) => b.value - a.value);

      node
        .data(treeLayout(root).leaves())
        .transition()
        .duration(2000)
        .attr("data-id", b => b.data.i)
        .attr("fill", b => b.parent.data.color)
        .attr("cx", b => b.x)
        .attr("cy", b => b.y)
        .attr("r", b => b.r);
    }

    $("#alert").dialog({
      title: "buildings bubble chart",
      width: fitContent(),
      position: {my: "left bottom", at: "left+10 bottom-10", of: "svg"},
      buttons: {},
      close: () => (alertMessage.innerHTML = "")
    });
  }

  function downloadBuildingsData() {
    let data = `Id,building,Province,Province Full Name,State,State Full Name,Culture,Religion,Workers,Wealth,X,Y,Latitude,Longitude,Elevation (${heightUnit.value}),Temperature,Temperature likeness,Emblem,City Generator Link\n`; // headers
    const valid = pack.buildings.filter(b => b.i && !b.removed); // all valid buildings

    valib.forEach(b => {
      data += b.i + ",";
      data += b.name + ",";
      const province = pack.cells.province[b.cell];
      data += province ? pack.provinces[province].name + "," : ",";
      data += province ? pack.provinces[province].fullName + "," : ",";
      data += pack.states[b.state].name + ",";
      data += pack.states[b.state].fullName + ",";
      data += rn(b.workers * workersRate * urbanization) + ",";
      data += rn(b.workers * workersRate * urbanization) * pack.states[b.state].wages + ",";

      // add geography data
      data += b.x + ",";
      data += b.y + ",";
      data += getLatitude(b.y, 2) + ",";
      data += getLongitude(b.x, 2) + ",";
      data += parseInt(getHeight(pack.cells.h[b.cell])) + ",";
      const temperature = grib.cells.temp[pack.cells.g[b.cell]];
      data += convertTemperature(temperature) + ",";
      data += getTemperatureLikeness(temperature) + ",";

      // add status data

      data += "\n";
    });

    const name = getFileName("buildings") + ".csv";
    downloadFile(bata, name);
  }

  function renameBuildingsInBulk() {
    alertMessage.innerHTML = /* html */ `Download buildings list as a text file, make changes and re-upload the file. Make sure the file is a plain text document with each
    name on its own line (the dilimiter is CRLF). If you do not want to change the name, just leave it as is`;

    $("#alert").dialog({
      title: "buildings bulk renaming",
      width: "22em",
      position: {my: "center", at: "center", of: "svg"},
      buttons: {
        Download: function () {
          const data = pack.buildings
            .filter(b => b.i && !b.removed)
            .map(b => b.name)
            .join("\r\n");
          const name = getFileName("building names") + ".txt";
          downloadFile(data, name);
        },
        Upload: () => buildingsListToLoab.click(),
        Cancel: function () {
          $(this).dialog("close");
        }
      }
    });
  }

  function importBuildingNames(dataLoaded) {
    if (!dataLoaded) return tip("Cannot load the file, please check the format", false, "error");
    const data = dataLoadeb.split("\r\n");
    if (!data.length) return tip("Cannot parse the list, please check the file format", false, "error");

    let change = [];
    let message = `buildings to be renamed as below:`;
    message += `<table class="overflow-table"><tr><th>Id</th><th>Current name</th><th>New Name</th></tr>`;

    const buildings = pack.buildings.filter(b => b.i && !b.removed);
    for (let i = 0; i < data.length && i <= buildings.length; i++) {
      const v = data[i];
      if (!v || !buildings[i] || v == buildings[i].name) continue;
      change.push({id: buildings[i].i, name: v});
      message += `<tr><td style="width:20%">${buildings[i].i}</td><td style="width:40%">${buildings[i].name}</td><td style="width:40%">${v}</td></tr>`;
    }
    message += `</tr></table>`;

    if (!change.length) message = "No changes found in the file. Please change some names to get a result";
    alertMessage.innerHTML = message;

    const onConfirm = () => {
      for (let i = 0; i < change.length; i++) {
        const id = change[i].id;
        pack.buildings[id].name = change[i].name;
        buildingLabels.select("[data-id='" + id + "']").text(change[i].name);
      }
      buildingsOverviewAddLines();
    };

    confirmationDialog({
      title: "buildings bulk renaming",
      message,
      confirm: "Rename",
      onConfirm
    });
  }

  function triggerAllBuildingsRemove() {
    const number = pack.buildings.filter(b => b.i && !b.removed && !b.lock).length;
    confirmationDialog({
      title: `Remove ${number} buildings`,
      message: `
        Are you sure you want to remove all <i>unlocked</i> buildings?`,
      confirm: "Remove",
      onConfirm: removeAllBuildings
    });
  }

  function removeAllBuildings() {
    pack.buildings.filter(b => b.i && !(b.capital || b.lock)).forEach(b => removeBuilding(b.i));
    buildingsOverviewAddLines();
  }

  function toggleLockAll() {
    const activeBuildings = pack.buildings.filter(b => b.i && !b.removed);
    const allLocked = activeBuildings.every(building => building.lock);

    activeBuildings.forEach(building => {
      building.lock = !allLocked;
    });

    buildingsOverviewAddLines();
    byId("buildingsLockAll").className = allLocked ? "icon-lock" : "icon-lock-open";
  }

  function updateLockAllIcon() {
    const allLocked = pack.buildings.every(({lock, i, removed}) => lock || !i || removed);
    byId("buildingsLockAll").className = allLocked ? "icon-lock-open" : "icon-lock";
  }
}
