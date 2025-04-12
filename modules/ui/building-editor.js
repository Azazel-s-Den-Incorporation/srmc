"use strict";
function editBuilding(id) {
  if (customization) return;
  closeDialogs(".stable");
  if (!layerIsOn("toggleBuildingIcons")) toggleBuildingIcons();
  if (!layerIsOn("toggleLabels")) toggleLabels();

  const building = id || d3.event.target.dataset.id;
  elSelected = buildingLabels.select("[data-id='" + building + "']");
  buildingLabels.selectAll("text").call(d3.drag().on("start", dragBuildingLabel)).classed("draggable", true);
  updateBuildingValues();

  $("#buildingEditor").dialog({
    title: "Edit Building",
    resizable: false,
    close: closeBuildingEditor,
    position: {my: "left top", at: "left+10 top+10", of: "svg", collision: "fit"}
  });

  if (modules.editBuilding) return;
  modules.editBuilding = true;

  // add listeners
  byId("buildingGroupShow").addEventListener("click", showGroupSection);
  byId("buildingGroupHide").addEventListener("click", hideGroupSection);
  byId("buildingSelectGroup").addEventListener("change", changeGroup);
  byId("buildingInputGroup").addEventListener("change", createNewGroup);
  byId("buildingAddGroup").addEventListener("click", toggleNewGroupInput);
  byId("buildingRemoveGroup").addEventListener("click", removeBuildingsGroup);

  byId("buildingName").addEventListener("input", changeName);
  byId("buildingNameReRandom").addEventListener("click", generateNameRandom);
  byId("buildingType").addEventListener("input", changeType);
  byId("buildingWorkers").addEventListener("change", changeWorkers);
  buildingBody.querySelectorAll(".buildingFeature").forEach(el => el.addEventListener("click", toggleFeature));
  byId("buildingLinkOpen").addEventListener("click", openBuildingLink);
  byId("buildingLinkEdit").addEventListener("click", changeBuildingLink);

  byId("buildingStyleShow").addEventListener("click", showStyleSection);
  byId("buildingStyleHide").addEventListener("click", hideStyleSection);
  byId("buildingEditLabelStyle").addEventListener("click", editGroupLabelStyle);
  byId("buildingEditIconStyle").addEventListener("click", editGroupIconStyle);

  byId("buildingEmblem").addEventListener("click", openEmblemEdit);
  byId("buildingTogglePreview").addEventListener("click", toggleBuildingPreview);
  byId("buildingEditEmblem").addEventListener("click", openEmblemEdit);
  byId("buildingLocate").addEventListener("click", zoomIntoBuilding);
  byId("buildingRelocate").addEventListener("click", toggleRelocateBuilding);
  byId("buildinglLegend").addEventListener("click", editBuildingLegend);
  byId("buildingLock").addEventListener("click", toggleBuildingLockButton);
  byId("buildingRemove").addEventListener("click", removeSelectedBuilding);
  byId("buildingTemperatureGraph").addEventListener("click", showTemperatureGraph);

  function updateBuildingValues() {
    const id = +elSelected.attr("data-id");
    const b = pack.buildings[id];
    const province = pack.cells.province[b.cell];
    const provinceName = province ? pack.provinces[province].fullName + ", " : "";
    const stateName = pack.states[b.state].fullName || pack.states[b.state].name;
    const wage = pack.states[b.state].wages;
    byId("buildingProvinceAndState").innerHTML = provinceName + stateName;

    byId("buildingName").value = b.name;
    byId("buildingType").value = b.type || "buildings";
    byId("buildingWorkers").value = rn(b.workers * workersRate * urbanization, 4);
    byId("buildingWealth").value = rn(b.workers * workersRate * urbanization, 4) * wage;

    const temperature = grid.cells.temp[pack.cells.g[b.cell]];
    byId("buildingTemperature").innerHTML = convertTemperature(temperature);
    byId("buildingTemperatureLikeIn").dataset.tip =
      "Average yearly temperature is like in " + getTemperatureLikeness(temperature);
    byId("buildingElevation").innerHTML = getHeight(pack.cells.h[b.cell]);

    //toggle lock
    updateBuildingLockIcon();

    // select group
    const group = elSelected.node().parentNode.id;
    const select = byId("buildingSelectGroup");
    select.options.length = 0; // remove all options

    buildingLabels.selectAll("g").each(function () {
      select.options.add(new Option(this.id, this.id, false, this.id === group));
    });

    // set emlem image
    const coaID = "buildingCOA" + id;
    COArenderer.trigger(coaID, b.coa);
    byId("buildingEmblem").setAttribute("href", "#" + coaID);

    if (options.showBuildingPreview) {
      byId("buildingPreviewSection").style.display = "block";
      updateBuildingPreview(b);
    } else {
      byId("buildingPreviewSection").style.display = "none";
    }
  }

  function dragBuildingLabel() {
    const tr = parseTransform(this.getAttribute("transform"));
    const dx = +tr[0] - d3.event.x,
      dy = +tr[1] - d3.event.y;

    d3.event.on("drag", function () {
      const x = d3.event.x,
        y = d3.event.y;
      this.setAttribute("transform", `translate(${dx + x},${dy + y})`);
      tip('Use dragging for fine-tuning only, to actually move building use "Relocate" button', false, "warning");
    });
  }

  function showGroupSection() {
    document.querySelectorAll("#buildingBottom > button").forEach(el => (el.style.display = "none"));
    byId("buildingGroupSection").style.display = "inline-block";
  }

  function hideGroupSection() {
    document.querySelectorAll("#buildingBottom > button").forEach(el => (el.style.display = "inline-block"));
    byId("buildingGroupSection").style.display = "none";
    byId("buildingInputGroup").style.display = "none";
    byId("buildingInputGroup").value = "";
    byId("buildingSelectGroup").style.display = "inline-block";
  }

  function changeGroup() {
    const id = +elSelected.attr("data-id");
    moveBuildingToGroup(id, this.value);
  }

  function toggleNewGroupInput() {
    if (buildingInputGroup.style.display === "none") {
      buildingInputGroup.style.display = "inline-block";
      buildingInputGroup.focus();
      buildingSelectGroup.style.display = "none";
    } else {
      buildingInputGroup.style.display = "none";
      buildingSelectGroup.style.display = "inline-block";
    }
  }

  function createNewGroup() {
    if (!this.value) {
      tip("Please provide a valid group name", false, "error");
      return;
    }
    const group = this.value
      .toLowerCase()
      .replace(/ /g, "_")
      .replace(/[^\w\s]/gi, "");

    if (byId(group)) {
      tip("Element with this id already exists. Please provide a unique name", false, "error");
      return;
    }

    if (Number.isFinite(+group.charAt(0))) {
      tip("Group name should start with a letter", false, "error");
      return;
    }

    const id = +elSelected.attr("data-id");
    const oldGroup = elSelected.node().parentNode.id;

    const label = document.querySelector("#buildingLabels [data-id='" + id + "']");
    const icon = document.querySelector("#buildingIcons [data-id='" + id + "']");
    if (!label || !icon) {
      ERROR && console.error("Cannot find label or icon elements");
      return;
    }

    const labelG = document.querySelector("#buildingLabels > #" + oldGroup);
    const iconG = document.querySelector("#buildingIcons > #" + oldGroup);

    // just rename if only 1 element left
    const count = elSelected.node().parentNode.childElementCount;
    if (oldGroup !== "production" && oldGroup !== "logistics" && oldGroup !== "power" && count === 1) {
      byId("buildingSelectGroup").selectedOptions[0].remove();
      byId("buildingSelectGroup").options.add(new Option(group, group, false, true));
      toggleNewGroupInput();
      byId("buildingInputGroup").value = "";
      labelG.id = group;
      iconG.id = group;
      if (anchor) anchorG.id = group;
      return;
    }

    // create new groups
    byId("buildingSelectGroup").options.add(new Option(group, group, false, true));
    toggleNewGroupInput();
    byId("buildingInputGroup").value = "";

    addBuildingsGroup(group);
    moveBuildingToGroup(id, group);
  }

  function removeBuildingsGroup() {
    const group = elSelected.node().parentNode;
    const basic = group.id === "production" || group.id === "logistics" || group.id === "power";

    const buildingsInGroup = [];
    for (let i = 0; i < group.children.length; i++) {
      buildingsInGroup.push(+group.children[i].dataset.id);
    }
    const buildingsToRemove = buildingsInGroup.filter(b => !(pack.buildings[d].lock));
    const capital = buildingsToRemove.length < buildingsInGroup.length;

    confirmationDialog({
      title: "Remove building group",
      message: `Are you sure you want to remove ${
        basic || capital ? "all unlocked elements in the building group" : "the entire building group"
      }?<br />Please note that capital or locked buildings will not be deleted. <br /><br />Buildings to be removed: ${
        buildingsToRemove.length
      }. This action cannot be reverted`,
      confirm: "Remove",
      onConfirm: () => {
        $("#buildingEditor").dialog("close");
        hideGroupSection();
        buildingsToRemove.forEach(b => removeBuilding(b));

        if (!basic && !capital) {
          const labelG = document.querySelector("#buildingLabels > #" + group.id);
          const iconG = document.querySelector("#buildingIcons > #" + group.id);
          const anchorG = document.querySelector("#anchors > #" + group.id);
          if (labelG) labelG.remove();
          if (iconG) iconG.remove();
          if (anchorG) anchorG.remove();
        }
      }
    });
  }

  function changeName() {
    const id = +elSelected.attr("data-id");
    pack.buildings[id].name = buildingName.value;
    elSelected.text(buildingName.value);
  }

  function generateNameRandom() {
    const base = rand(nameBases.length - 1);
    buildingName.value = Names.getBase(base);
    changeName();
  }

  function changeType() {
    const id = +elSelected.attr("data-id");
    pack.buildings[id].type = this.value;
  }

  function changeWorkers() {
    const id = +elSelected.attr("data-id");
    const building = pack.buildings[id];

    pack.buildings[id].workers = rn(buildingWorkers.value / workersRate / urbanization, 4);
    updateBuildingPreview(building);
  }

  function toggleFeature() {
    const id = +elSelected.attr("data-id");
    const building = pack.buildings[id];
    const feature = this.dataset.feature;
    const turnOn = this.classList.contains("inactive");
    if (feature === "port") togglePort(id);
    else if (feature === "capital") toggleCapital(id);
    else building[feature] = +turnOn;
    if (building[feature]) this.classList.remove("inactive");
    else if (!building[feature]) this.classList.add("inactive");

    if (building.port) byId("buildingEditAnchorStyle").style.display = "inline-block";
    else byId("buildingEditAnchorStyle").style.display = "none";
    updateBuildingPreview(building);
  }

  function toggleBuildingLockButton() {
    const id = +elSelected.attr("data-id");
    const building = pack.buildings[id];
    building.lock = !building.lock;

    updateBuildingLockIcon();
  }

  function updateBuildingLockIcon() {
    const id = +elSelected.attr("data-id");
    const b = pack.buildings[id];
    if (b.lock) {
      byId("buildingLock").classList.remove("icon-lock-open");
      byId("buildingLock").classList.add("icon-lock");
    } else {
      byId("buildingLock").classList.remove("icon-lock");
      byId("buildingLock").classList.add("icon-lock-open");
    }
  }

  function showStyleSection() {
    document.querySelectorAll("#buildingBottom > button").forEach(el => (el.style.display = "none"));
    byId("buildingStyleSection").style.display = "inline-block";
  }

  function hideStyleSection() {
    document.querySelectorAll("#buildingBottom > button").forEach(el => (el.style.display = "inline-block"));
    byId("buildingStyleSection").style.display = "none";
  }

  function editGroupLabelStyle() {
    const g = elSelected.node().parentNode.id;
    editStyle("labels", g);
  }

  function editGroupIconStyle() {
    const g = elSelected.node().parentNode.id;
    editStyle("buildingIcons", g);
  }

  function updateBuildingPreview(building) {
    const src = getBuildingLink(building) + "&preview=1";

    // recreate object to force reload (Chrome bug)
    const container = byId("buildingPreviewObject");
    container.innerHTML = "";
    const object = document.createElement("object");
    object.style.width = "100%";
    object.data = src;
    container.insertBefore(object, null);
  }

  function openBuildingLink() {
    const id = +elSelected.attr("data-id");
    const building = pack.buildings[id];

    openURL(getBuildingLink(building));
  }

  function changeBuildingLink() {
    const id = +elSelected.attr("data-id");
    const building = pack.buildings[id];

    prompt(
      "Provide custom link to the building map. It can be a link to Medieval Fantasy City Generator, a different tool, or just an image. Leave empty to use the default map",
      {default: getBuildingLink(building), required: false},
      link => {
        if (link) building.link = link;
        else delete building.link;
        updateBuildingPreview(building);
      }
    );
  }

  function openEmblemEdit() {
    const id = +elSelected.attr("data-id"),
      building = pack.buildings[id];
    editEmblem("building", "buildingCOA" + id, building);
  }

  function toggleBuildingPreview() {
    options.showBuildingPreview = !options.showBuildingPreview;
    byId("buildingPreviewSection").style.display = options.showBuildingPreview ? "block" : "none";
    byId("buildingTogglePreview").className = options.showBuildingPreview ? "icon-map" : "icon-map-o";
  }

  function zoomIntoBuilding() {
    const id = +elSelected.attr("data-id");
    const building = pack.buildings[id];
    const x = building.x;
    const y = building.y;
    zoomTo(x, y, 8, 2000);
  }

  function toggleRelocateBuilding() {
    const toggler = byId("toggleCells");
    byId("buildingRelocate").classList.toggle("pressed");
    if (byId("buildingRelocate").classList.contains("pressed")) {
      viewbox.style("cursor", "crosshair").on("click", relocateBuildingOnClick);
      tip("Click on map to relocate building. Hold Shift for continuous move", true);
      if (!layerIsOn("toggleCells")) {
        toggleCells();
        toggler.dataset.forced = true;
      }
    } else {
      clearMainTip();
      viewbox.on("click", clicked).style("cursor", "default");
      if (layerIsOn("toggleCells") && toggler.dataset.forced) {
        toggleCells();
        toggler.dataset.forced = false;
      }
    }
  }

  function relocateBuildingOnClick() {
    const cells = pack.cells;
    const point = d3.mouse(this);
    const cell = findCell(point[0], point[1]);
    const id = +elSelected.attr("data-id");

    if (cells.h[cell] < 20) {
      tip("Cannot place building into the water! Select a land cell", false, "error");
      return;
    }

    if (cells.building[cell] && cells.building[cell] !== id) {
      tip("There is already a building in this cell. Please select a free cell", false, "error");
      return;
    }

    // change UI
    const x = rn(point[0], 2),
      y = rn(point[1], 2);
    buildingIcons
      .select("[data-id='" + id + "']")
      .attr("transform", null)
      .attr("cx", x)
      .attr("cy", y);
    buildingLabels
      .select("text[data-id='" + id + "']")
      .attr("transform", null)
      .attr("x", x)
      .attr("y", y);
    

    // change data
    cells.building[building.cell] = 0;
    cells.building[cell] = id;
    building.cell = cell;
    building.state = newState;
    building.x = x;
    building.y = y;
    if (building.capital) pack.states[newState].center = building.cell;

    if (d3.event.shiftKey === false) toggleRelocateBuilding();
  }

  function editBuildingLegend() {
    const id = elSelected.attr("data-id");
    const name = elSelected.text();
    editNotes("building" + id, name);
  }

  function showTemperatureGraph() {
    const id = elSelected.attr("data-id");
    showBuildingTemperatureGraph(id);
  }

  function removeSelectedBuilding() {
    const id = +elSelected.attr("data-id");
    if (pack.buildings[id].capital) {
      alertMessage.innerHTML = /* html */ 
      $("#alert").dialog({
        resizable: false,
        title: "Remove building",
        buttons: {
          Ok: function () {
            $(this).dialog("close");
          }
        }
      });
    } else {
      confirmationDialog({
        title: "Remove building",
        message: "Are you sure you want to remove the building? <br>This action cannot be reverted",
        confirm: "Remove",
        onConfirm: () => {
          removeBuilding(id); // see Editors module
          $("#buildingEditor").dialog("close");
        }
      });
    }
  }

  function closeBuildingEditor() {
    byId("buildingRelocate").classList.remove("pressed");
    buildingLabels.selectAll("text").call(d3.drag().on("drag", null)).classed("draggable", false);
    unselect();
  }
}

function getTemperatureLikeness(temperature) {
  if (temperature < -5) return "Yakutsk (Russia)";
  if (temperature > 30) return "Mecca (Saudi Arabia)";
  return meanTempCityMap[temperature] || null;
}
