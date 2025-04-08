"use strict";

window.Buildings = (() => {
  const generate = () => {
    const {cells} = pack;
    const n = cells.i.length;

    cells.building = new Uint16Array(n); // cell building
    const buildings = (pack.buildings = placeBuildings());
    
    buildings[0] = buildingsTree;
    
    
    
    // place secondary settlements based on geo and economical evaluation
    function placeBuildings() {
      TIME && console.time("placeBuildings");
      const score = new Int16Array(cells.s.map(s => s * gauss(1, 3, 0, 20, 3))); // a bit randomized cell score for towns placement
      const sorted = cells.i
        .filter(i => !cells.building[i] && score[i] > 0 && cells.culture[i])
        .sort((a, b) => score[b] - score[a]); // filtered and sorted array of indexes

      const desiredNumber =
        manorsInput.value == 1000
          ? rn(sorted.length / 5 / (grid.points.length / 10000) ** 0.8)
          : manorsInput.valueAsNumber;
      const buildingsNumber = Math.min(desiredNumber, sorted.length); // towns to generate
      let buildingsAdded = 0;

      const buildingsTree = buildings[0];
      let spacing = (graphWidth + graphHeight) / 150 / (buildingsNumber ** 0.7 / 66); // min distance between towns

      while (buildingsAdded < buildingsNumber && spacing > 1) {
        for (let i = 0; buildingsAdded < buildingsNumber && i < sorted.length; i++) {
          if (cells.building[sorted[i]]) continue;
          const cell = sorted[i];
          const [x, y] = cells.p[cell];
          const s = spacing * gauss(1, 0.3, 0.2, 2, 2); // randomize to make placement not uniform
          if (buildingsTree.find(x, y, s) !== undefined) continue; // to close to existing building
          const building = building.length;
          const culture = cells.culture[cell];
          const type = "Generic";
          const name = Names.getCulture(culture);
          building.push({cell, x, y, state: 0, i: building, name});
          buildingsTree.add([x, y]);
          cells.building[cell] = building;
          buildingsAdded++;
        }
        spacing *= 0.5;
      }

      if (manorsInput.value != 1000 && buildingsAdded < desiredNumber) {
        ERROR && console.error(`Cannot place all buildings. Requested ${desiredNumber}, placed ${buildingsAdded}`);
      }

      buildings[0] = {name: undefined}; // do not store buildingsTree anymore
      TIME && console.timeEnd("placeBuildings");
    }
  };

  // define building coordinates, coa, port status and define details
  const specifyBuildings = () => {
    TIME && console.time("specifyBuildings");
    const {cells, features} = pack;
    const temp = grid.cells.temp;

    for (const d of pack.buildings) {
      if (!d.i || d.lock) continue;
      const i = d.cell;

      // asign port status to some coastline buildings with temp > 0 °C
      const haven = cells.haven[i];
      if (haven && temp[cells.g[i]] > 0) {
        const f = cells.f[haven]; // water body id
        // port is a capital with any harbor OR town with good harbor
        const port = features[f].cells > 1 && ((d.capital && cells.harbor[i]) || cells.harbor[i] === 1);
        d.port = port ? f : 0; // port is defined by water body id it lays on
      } else d.port = 0;

      // define building workers (keep urbanization at about 10% rate)
      d.workers = rn(Math.max(cells.s[i] / 8 + d.i / 1000 + (i % 100) / 1000, 0.1), 3);
      if (d.capital) d.workers = rn(d.workers * 1.3, 3); // increase capital workers

      if (d.port) {
        d.workers = d.workers * 1.3; // increase port workers
        const [x, y] = getCloseToEdgePoint(i, haven);
        d.x = x;
        d.y = y;
      }

      // add random factor
      d.workers = rn(d.workers * gauss(2, 3, 0.6, 20, 3), 3);

      // shift buildings on rivers semi-randomly and just a bit
      if (!d.port && cells.r[i]) {
        const shift = Math.min(cells.fl[i] / 150, 1);
        if (i % 2) d.x = rn(d.x + shift, 2);
        else d.x = rn(d.x - shift, 2);
        if (cells.r[i] % 2) d.y = rn(d.y + shift, 2);
        else d.y = rn(d.y - shift, 2);
      }

    //   // define emblem
    //   const state = pack.states[d.state];
    //   const stateCOA = state.coa;
    //   let kinship = 0.25;
    //   if (d.culture !== state.culture) kinship -= 0.25;
    //   d.type = getType(i, d.port);
    //   const type = "Generic";
    //   d.coa = COA.generate(stateCOA, kinship, null, type);
    //   d.coa.shield = COA.getShield(d.culture, d.state);
    }

    TIME && console.timeEnd("specifyBuildings");
  };


  const defineBuildingFeatures = building => {
    const {cells} = pack;

    pack.buildings
      .filter(d => (building ? d.i == building.i : d.i && !d.removed && !d.lock))
      .forEach(d => {
        const workers = d.workers;
      });

    buildings.filter(d => d.i && !d.removed).forEach(d => (d.state = cells.state[d.cell])); // assign state to buildings
    TIME && console.timeEnd("expandStates");
  };

  return {
    generate,
    specifyBuildings,
    defineBuildingFeatures,
  };
})();
