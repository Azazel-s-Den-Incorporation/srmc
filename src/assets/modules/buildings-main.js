"use strict";

window.BuildingsMain = (() => {
  const generate = () => {
    TIME && console.time("generateBuildings");
    const {cells} = pack;
    const n = cells.i.length;

    cells.building = new Uint16Array(n); // cell building
    pack.buildings = placeBuildings();
    specifyBuildings();
    
    // place secondary settlements based on geo and economical evaluation
    function placeBuildings() {
      TIME && console.time("placeBuildings");
      let buildings = [0];

      const rand = () => 0.5 + Math.random() * 0.5;
      const score = new Int16Array(cells.s.map(s => s * rand())); // cell score for capitals placement
      const sorted = cells.i.filter(i => score[i] > 0 && cells.culture[i]).sort((a, b) => score[b] - score[a]); // filtered and sorted array of indexes

      const desiredNumber =
        manorsInput.value == 1000
          ? rn(sorted.length / 5 / (grid.points.length / 10000) ** 0.8)
          : manorsInput.valueAsNumber;
      const buildingsNumber = Math.min(desiredNumber, sorted.length); // buildings to generate
      let buildingsAdded = 0;
      

      let buildingsTree = d3.quadtree();
      let spacing = (graphWidth + graphHeight) / 150 / (buildingsNumber ** 0.7 / 66); // min distance between capitals

      buildings[0] = buildingsTree;

      for (let i = 0; buildings.length <= buildingsNumber; i++) {
        const cell = sorted[i];
        const [x, y] = cells.p[cell];

        if (buildingsTree.find(x, y, spacing) === undefined) {
          buildings.push({cell, x, y});
          buildingsTree.add([x, y]);
        }

        if (i === sorted.length - 1) {
          WARN && console.warn("Cannot place capitals with current spacing. Trying again with reduced spacing");
          buildingsTree = d3.quadtree();
          i = -1;
          buildings = [0];
          spacing /= 1.2;
        }
      }


      while (buildingsAdded < buildingsNumber && spacing > 1) {
        for (let i = 0; buildingsAdded < buildingsNumber && i < sorted.length; i++) {
          if (cells.building[sorted[i]]) continue;
          const cell = sorted[i];
          const [x, y] = cells.p[cell];
          const s = spacing * gauss(1, 0.3, 0.2, 2, 2); // randomize to make placement not uniform
          if (buildingsTree.find(x, y, s) !== undefined) continue; // to close to existing building
          const building = buildings.length;
          const culture = cells.culture[cell];
          const type = "Generic";
          const name = Names.getCulture(culture);
          const workers = 10;
          buildings.push({cell, x, y, state: 0, i: building, name, culture, type, workers});
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
      return buildings;
    }
  };

  // define building coordinates, coa, port status and define details
  const specifyBuildings = () => {
    TIME && console.time("specifyBuildings");
    const {cells, features} = pack;
    const temp = grid.cells.temp;

    for (const b of pack.buildings) {
      if (!b.i || b.lock) continue;
      const i = b.cell;

      // asign port status to some coastline buildings with temp > 0 °C
      const haven = cells.haven[i];
      if (haven && temp[cells.g[i]] > 0) {
        const f = cells.f[haven]; // water body id
        // port is a capital with any harbor OR town with good harbor
        const port = features[f].cells > 1 && (cells.harbor[i] === 1);
        b.port = port ? f : 0; // port is defined by water body id it lays on
      } else b.port = 0;

      // define building workers (keep urbanization at about 10% rate)
      b.workers = rn(Math.max(cells.s[i] / 8 + b.i / 1000 + (i % 100) / 1000, 0.1), 3);

      if (b.port) {
        b.workers = b.workers * 1.3; // increase port workers
        const [x, y] = getCloseToEdgePoint(i, haven);
        b.x = x;
        b.y = y;
      }

      // add random factor
      b.workers = rn(b.workers * gauss(2, 3, 0.6, 20, 3), 3);

      // shift buildings on rivers semi-randomly and just a bit
      if (!b.port && cells.r[i]) {
        const shift = Math.min(cells.fl[i] / 150, 1);
        if (i % 2) b.x = rn(b.x + shift, 2);
        else b.x = rn(b.x - shift, 2);
        if (cells.r[i] % 2) b.y = rn(b.y + shift, 2);
        else b.y = rn(b.y - shift, 2);
      }

      // define emblem
      const state = pack.states[b.state];
      const stateCOA = state.coa;
      let kinship = 0.25;
      if (b.culture !== state.culture) kinship -= 0.25;
      b.type = getType(i, b.port);
      const type = "Generic";
      b.coa = COA.generate(stateCOA, kinship, null, type);
      b.coa.shield = COA.getShield(b.culture, b.state);
    }

    TIME && console.timeEnd("specifyBuildings");
  };


  const defineBuildingFeatures = buildings => {
    const {cells} = pack;

    // pack.buildings
    //   .filter(b => (buildings ? b.i == buildings.i : b.i && !b.removed && !b.lock))
    //   .forEach(b => {
    //   });

    buildings.filter(b => b.i && !b.removed).forEach(b => (b.state = cells.state[b.cell])); // assign state to buildings
    
  };
  TIME && console.timeEnd("generateBuildings");
  return {
    generate,
    specifyBuildings,
    defineBuildingFeatures,
  };
})();
