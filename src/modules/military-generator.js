"use strict";

window.Military = (function () {
  const generate = function () {
    TIME && console.time("generateMilitaryForces");
    const {cells, states} = pack;
    const {p} = cells;
    const valid = states.filter(s => s.i && !s.removed); // valid states
    if (!options.military) options.military = getDefaultOptions();

    const expn = d3.sum(valid.map(s => s.expansionism)); // total expansion
    const area = d3.sum(valid.map(s => s.area)); // total area
    const rate = {x: 0, Ally: -0.2, Friendly: -0.1, Neutral: 0, Suspicion: 0.1, Enemy: 1, Unknown: 0, Rival: 0.5, Vassal: 0.5, Suzerain: -0.5};

    const stateModifier = {
      private: {Nomadic: 0.5, Highland: 1.2, Lake: 1, Naval: 0.7, Hunting: 1.2, River: 1.1},
      levy: {Nomadic: 0.9, Highland: 1.3, Lake: 1, Naval: 0.8, Hunting: 2, River: 0.8},
      regular: {Nomadic: 0.3, Highland: 0.6, Lake: 1.7, Naval: 1.3, Hunting: 0.7, River: 0.8},
      religious: {Nomadic: 0.3, Highland: 0.6, Lake: 0.7, Naval: 0.3, Hunting: 0.7, River: 0.8},
      naval: {Nomadic: 0.5, Highland: 0.5, Lake: 1.2, Naval: 1.8, Hunting: 0.7, River: 1.2}
    };

    const cellTypeModifier = {
      nomadic: {private: 0.2, levy: 0.5, regular: 0.3, religious: 0.4, naval: 0.3},
      wetland: {private: 0.8, levy: 2, regular: 0.6, religious: 1.2, naval: 1.0},
      highland: {private: 1.2, levy: 1.6, regular: 0.6, religious: 3, naval: 1.0}
    };

    const burgTypeModifier = {
      nomadic: {private: 0.3, levy: 0.8, regular: 3, religious: 0.4, naval: 1.0},
      wetland: {private: 1, levy: 1.6, regular: 1.2, religious: 1.2, naval: 1.0},
      highland: {private: 1.2, levy: 2, regular: 1.3, religious: 3, naval: 1.0}
    };

    valid.forEach(s => {
      s.temp = {};
      const d = s.diplomacy;

      const expansionRate = minmax(s.expansionism / expn / (s.area / area), 0.25, 4); // how much state expansionism is realized
      const diplomacyRate = d.some(d => d === "Enemy") ? 1 : d.some(d => d === "Rival") ? 0.8 : d.some(d => d === "Suspicion") ? 0.5 : 0.1; // peacefulness
      const neighborsRateRaw = s.neighbors.map(n => (n ? pack.states[n].diplomacy[s.i] : "Suspicion")).reduce((s, r) => (s += rate[r]), 0.5);
      const neighborsRate = minmax(neighborsRateRaw, 0.3, 3); // neighbors rate
      s.alert = minmax(rn(expansionRate * diplomacyRate * neighborsRate, 2), 0.1, 5); // alert rate (area modifier)
      s.temp.platoons = [];

      // apply overall state modifiers for unit types based on state features
      for (const unit of options.military) {
        if (!stateModifier[unit.type]) continue;

        let modifier = stateModifier[unit.type][s.type] || 1;
        if (unit.type === "naval" && s.form === "Republic") modifier *= 1.2;
        s.temp[unit.name] = modifier * s.alert;
      }
    });

    const getType = cell => {
      if ([1, 2, 3, 4].includes(cells.biome[cell])) return "nomadic";
      if ([7, 8, 9, 12].includes(cells.biome[cell])) return "wetland";
      if (cells.h[cell] >= 70) return "highland";
      return "generic";
    };

    function passUnitLimits(unit, biome, state, culture, religion) {
      if (unit.biomes && !unit.biomes.includes(biome)){return false;}
      if (unit.states && !unit.states.includes(state)) {return false;}
      if (unit.cultures && !unit.cultures.includes(culture)) { return false;}
      if (unit.religions && !unit.religions.includes(religion)) {return false;}
      return true;
    }

    // rural cells
    for (const cellID of cells.i) {
      if (!cells.pop[cellID]) continue;
      const biome = cells.biome[cellID];
      const state = cells.state[cellID];
      const culture = cells.culture[cellID];
      const religion = cells.religion[cellID];

      const stateObj = states[state];
      
      if (!state || stateObj.removed) continue;

      let modifier = cells.pop[cellID] / 100; // basic rural army in percentages
      if (culture !== stateObj.culture) modifier = stateObj.form === "Union" ? modifier / 1.2 : modifier / 2; // non-dominant culture
      if (religion !== cells.religion[stateObj.center]) modifier = stateObj.form === "Theocracy" ? modifier / 2.2 : modifier / 1.4; // non-dominant religion
      if (cells.f[cellID] !== cells.f[stateObj.center]) modifier = stateObj.type === "Naval" ? modifier / 1.2 : modifier / 1.8; // different landmass
      const terrainType = getType(cellID);
      let residual = 0;
      for (const unit of options.military) {
        const perc = +unit.rural;
        if (isNaN(perc) || perc <= 0 || !stateObj.temp[unit.name]) continue;
        if (!passUnitLimits(unit, biome, state, culture, religion)) continue;
        if (unit.type === "naval" && !cells.haven[cellID]) continue; // only near-ocean cells create naval units

        const cellTypeMod = terrainType === "generic" ? 1 : cellTypeModifier[terrainType][unit.type]; // cell specific modifier
        const army = modifier * perc * cellTypeMod/200; // rural cell army
        let total = residual+(army * stateObj.temp[unit.name] * populationRate); // total troops
        if (total<1) {residual+=total; continue;}
        residual=0;
        let [x, y] = p[cellID];
        let n = 0;

        // place naval units to sea
        if (unit.type === "naval") {
          const haven = cells.haven[cellID];
          [x, y] = p[haven];
          n = 1;
        }
        if(total<=1||pack.cells.province[cellID]===0){
          residual=total;
          continue;}
          residual=(residual-1)>0?residual-1:0;
          if(!stateObj.temp.batallions){
            stateObj.temp.batallions = [];
          }
          try{
            const type=["levy", "private", "regular", "religious"][Math.floor(Math.random()*4)];
          stateObj.temp.batallions.push({
            cell: cellID,
            strength:100, 
            x, 
            y, 
            unit: unit.name,
            naval:n, 
            separate: unit.separate, 
            type: type,
            cultureID:culture,
            religionID:religion,
            inRegiment:false,
            icon:unit.icon,
            skirmish:unit.skirmish,
            melee:unit.melee,
            shock:unit.shock,
            armor:unit.armor,
            provinceID:pack.cells.province[cellID],
            i:pack.provinces[pack.cells.province[cellID]].unitCounts[unit.name]+1
          });
          pack.provinces[pack.cells.province[cellID]].unitCounts[unit.name] += 1;
        }catch(e){
          console.warn("PROVINCE: ", pack.cells.province[cellID], "UNIT: ", unit.name)
          debugger;
        }
       
 }
    }

    // burgs
    for (const b of pack.burgs) {
      if (!b.i || b.removed || !b.state || !b.population) continue;

      const biome = cells.biome[b.cell];
      const state = b.state;
      const culture = b.culture;
      const religion = cells.religion[b.cell];

      const stateObj = states[state];
      let m = (b.population * urbanization) / 100; // basic urban army in percentages
      if (b.capital) m *= 1.2; // capital has household troops
      if (culture !== stateObj.culture) m = stateObj.form === "Union" ? m / 1.2 : m / 2; // non-dominant culture
      if (religion !== cells.religion[stateObj.center]) m = stateObj.form === "Theocracy" ? m / 2.2 : m / 1.4; // non-dominant religion
      if (cells.f[b.cell] !== cells.f[stateObj.center]) m = stateObj.type === "Naval" ? m / 1.2 : m / 1.8; // different landmass
      const type = getType(b.cell);

      for (const unit of options.military) {
        const perc = +unit.urban;
        if (isNaN(perc) || perc <= 0 || !stateObj.temp[unit.name]) continue;
        if (!passUnitLimits(unit, biome, state, culture, religion)) continue;
        if (unit.type === "naval" && (!b.port || !cells.haven[b.cell])) continue; // only ports create naval units

        const mod = type === "generic" ? 1 : burgTypeModifier[type][unit.type]; // cell specific modifier
        const army = m * perc * mod/100; // urban cell army
        const total = rn(army * stateObj.temp[unit.name] * populationRate); // total troops
        if (!total) continue;

        let [x, y] = p[b.cell];
        let n = 0;

        // place naval to sea
        if (unit.type === "naval") {
          const haven = cells.haven[b.cell];
          [x, y] = p[haven];
          n = 1;
        }
        if(total<=1||pack.cells.province[b.cell]===0){continue;}
        if(!stateObj.temp.batallions){
          stateObj.temp.batallions = [];
        }
        try{
          const type=["levy", "private", "regular", "religious"][Math.floor(Math.random()*4)];
          stateObj.temp.batallions.push({
            cell: b.cell,
            strength:100, 
            x, 
            y, 
            unit: unit.name,
            naval:n, 
            separate: unit.separate, 
            type: type,
            cultureID:culture,
            religionID:religion, 
            inRegiment:false,
            icon:unit.icon,
            skirmish:unit.skirmish,
            melee:unit.melee,
            shock:unit.shock,
            armor:unit.armor,
            provinceID:pack.cells.province[b.cell],
            i:pack.provinces[pack.cells.province[b.cell]].unitCounts[unit.name]+1

        });
        pack.provinces[pack.cells.province[b.cell]].unitCounts[unit.name] += 1;
       }catch(e){
        console.warn("PROVINCE: ", pack.provinces[pack.cells.province[b.cell]], "UNIT: ", unit.name)
        debugger;
      }
    }} 
    
    const expected = 0.3* populationRate; // expected regiment size

    // get regiments for each state
    valid.forEach(state => {
      //state.military = createRegiments(state.temp.platoons, state);
      nameBatallions(state.temp.batallions,state);
    state.military=createRegimentsTsyxy(state.temp.batallions, state);
    console.log("state.military",state.military,"expected size of regiments: ", expected);
      delete state.temp; // do not store temp data
    });

    redraw();

    function distance(a,b){
      return (a.x-b.x)**2+(a.y-b.y)**2;
    }

    

    function createRegimentsTsyxy(batallions, state){
      if(!batallions?.length){
        return [];}
      const regimentBases=[];
      for(let i=0;i<batallions.length;i++){
        if(!batallions[i].inRegiment){
          const regimentBase={
            batallions:[batallions[i]],
            i:regimentBases.length,
            cell:batallions[i].cell,
            n:batallions[i].naval,
            x:batallions[i].x,
            y:batallions[i].y,
            state:state.i,
            n:batallions[i].naval,
          }
          regimentBases.push(regimentBase)
        batallions[i].inRegiment=true;
        const copyBatallions=batallions.filter(b=>!b.inRegiment&&pack.cells.province[b.cell]===pack.cells.province[batallions[i].cell]);
        copyBatallions.sort((a,b)=>distance(a,batallions[i])-distance(b,batallions[i]));
          for(let j=0;j<copyBatallions.length;j++){
        regimentBase.batallions.push(copyBatallions[j]);
        copyBatallions[j].inRegiment=true;
        if(regimentBase.batallions.length>=expected){
        
          break;}
          }
        }
      }
      const military=[];
      if(regimentBases.length){
        regimentBases.forEach(regimentBase=>{

          const unitCounts={};
          options.military.forEach(unit=>{
            const batallions=regimentBase.batallions?.filter(batallion => batallion.unit === unit.name);
            unitCounts[unit.name]=batallions?.length||0;
          });
          
          const realRegiment={
            n:regimentBase.n,
            cell:regimentBase.cell,
            name: getName(regimentBase, regimentBases),
            icon : getEmblem(regimentBase),
            x:regimentBase.x,
            y:regimentBase.y,
            bx:regimentBase.x,
            by:regimentBase.y,
            batallions:regimentBase.batallions,
            unitCounts:unitCounts,
            i:regimentBase.i,
            state:regimentBase.state,
          }
          realRegiment.batallions.forEach(batallion=>batallion.regiment=realRegiment.i);
          realRegiment.batallions.forEach(batallion=>generateBatallionHistory(batallion,realRegiment));
          generateNote(realRegiment,pack.states[realRegiment.state]);
          military.push(realRegiment);
        });
      }
      console.log("military",military);
      return military;
    }
  
    TIME && console.timeEnd("generateMilitaryForces");
  };

  function generateBatallionHistory(batallion,regiment){
    const regimentName=regiment.name;
    batallion.note="At the year "+options.year+" "+ "the "+ batallion.name + "was a part of the "+regimentName+" regiment.";
  
  }

  function nameBatallions(batallions,stateObj){
    if(!batallions||batallions?.length===0){
      return;}
    stateObj.provinces.forEach(provinceID=>{
      const province=pack.provinces[provinceID];
      const provinceName=province.name;
    options.military.forEach(unit=>{
      const filteredBatallions=batallions.filter(b=>(b.unit===unit.name&&provinceID===pack.provinces[b.provinceID].i));
      filteredBatallions.forEach((batallion)=>{
        const cultureName=pack.cultures[batallion.cultureID].name;
        batallion.name=(batallion.i)+'. '+cultureName+' '+unit.name+" batallion of "+provinceName;
     }); });});
  }


  function redraw() {
    const validStates = pack.states.filter(s => s.i && !s.removed);
    armies.selectAll("g > g").each(function () {
      const index = notes.findIndex(n => n.id === this.id);
      if (index != -1) notes.splice(index, 1);
    });
    armies.selectAll("g").remove();
    validStates.forEach(s => drawRegiments(s.military, s.i));
  }

  const defaultUnitPics={
    
  }


  const getDefaultOptions = function () {
    return [
      /*{icon: "⚔️", name: "infantry", rural: 0.25, urban: 0.2, crew: 1, power: 1, type: "melee", separate: 0},
      {icon: "🏹", name: "archers", rural: 0.12, urban: 0.2, crew: 1, power: 1, type: "ranged", separate: 0},
      {icon: "🐴", name: "cavalry", rural: 0.12, urban: 0.03, crew: 2, power: 2, type: "mounted", separate: 0},
      {icon: "💣", name: "artillery", rural: 0, urban: 0.03, crew: 8, power: 12, type: "machinery", separate: 0},
      {icon: "🌊", name: "fleet", rural: 0, urban: 0.015, crew: 100, power: 50, type: "naval", separate: 1},*/
      //okey so this is how units would look in my version. Most of the properties are the same, but I added a few new ones, and changed some of the old ones.
      //the power property should be separated into skirmish, shock, melee and armor in every place it is used in the editor.
      {icon: "🔔", name: "light spearmen", rural: 0.65, urban: 0.015, crew: 1, skirmish:2, shock:2, melee: 4, armor:0, separate: 0},
      {icon: "⚖️", name: "raider", rural: 0.25, urban: 0.015, crew: 1, skirmish:5, shock:4, melee: 2, armor:0, separate: 0},
      {icon: "🛡️", name: "noble", rural: 0.25, urban: 0.015, crew: 1, skirmish:3, shock:5, melee: 7, armor:3, separate: 0},
      {icon: "🐴", name: "knight", rural: 0.25, urban: 0.015, crew: 1, skirmish:3, shock:9, melee: 5, armor:4, separate: 0},
      {icon: "💂", name: "heavy infantry", rural: 0.05, urban: 0.55, crew: 1, skirmish:1, shock:4, melee: 8, armor:4, separate: 0},
      {icon: "🐎", name: "dragoon", rural: 0.05, urban: 0.25, crew: 1, skirmish:5, shock:5, melee: 5, armor:1, separate: 0},
      {icon: "🏹", name: "skirmisher", rural: 0.05, urban: 0.05, crew: 1, skirmish:7, shock:4, melee: 2, armor:0, separate: 0}
    ];
  };

  const drawRegiments = function (regiments, s) {
    const size = +armies.attr("box-size");
    const w = d => (d.n ? size * 4 : size * 6);
    const h = size * 2;
    const x = d => rn(d.x - w(d) / 2, 2);
    const y = d => rn(d.y - size, 2);

    const baseColor = pack.states[s].color[0] === "#" ? pack.states[s].color : "#999";
    const darkerColor = d3.color(baseColor).darker().hex();
    const army = armies
      .append("g")
      .attr("id", "army" + s)
      .attr("fill", baseColor);

    const g = army
      .selectAll("g")
      .data(regiments)
      .enter()
      .append("g")
      .attr("id", d => "regiment" + s + "-" + d.i)
      .attr("data-name", d => d.name)
      .attr("data-state", s)
      .attr("data-id", d => d.i);
    g.append("rect")
      .attr("x", d => x(d))
      .attr("y", d => y(d))
      .attr("width", d => w(d))
      .attr("height", h);
    g.append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .text(d => getTotal(d));
    g.append("rect")
      .attr("fill", darkerColor)
      .attr("x", d => x(d) - h)
      .attr("y", d => y(d))
      .attr("width", h)
      .attr("height", h);
    g.append("text")
      .attr("class", "regimentIcon")
      .attr("x", d => x(d) - size)
      .attr("y", d => d.y)
      .text(d => d.icon);
  };

  const drawRegiment = function (reg, s) {
    const size = +armies.attr("box-size");
    const w = reg.n ? size * 4 : size * 6;
    const h = size * 2;
    const x1 = rn(reg.x - w / 2, 2);
    const y1 = rn(reg.y - size, 2);

    let army = armies.select("g#army" + s);
    if (!army.size()) {
      const baseColor = pack.states[s].color[0] === "#" ? pack.states[s].color : "#999";
      army = armies
        .append("g")
        .attr("id", "army" + s)
        .attr("fill", baseColor);
    }
    const darkerColor = d3.color(army.attr("fill")).darker().hex();
    const g = army
      .append("g")
      .attr("id", "regiment" + s + "-" + reg.i)
      .attr("data-name", reg.name)
      .attr("data-state", s)
      .attr("data-id", reg.i);
    g.append("rect").attr("x", x1).attr("y", y1).attr("width", w).attr("height", h);
    g.append("text").attr("x", reg.x).attr("y", reg.y).text(getTotal(reg));
    g.append("rect")
      .attr("fill", darkerColor)
      .attr("x", x1 - h)
      .attr("y", y1)
      .attr("width", h)
      .attr("height", h);
    g.append("text")
      .attr("class", "regimentIcon")
      .attr("x", x1 - size)
      .attr("y", reg.y)
      .text(reg.icon);
  };

  // move one regiment to another
  const moveRegiment = function (reg, x, y) {
    const el = armies.select("g#army" + reg.state).select("g#regiment" + reg.state + "-" + reg.i);
    if (!el.size()) return;

    const duration = Math.hypot(reg.x - x, reg.y - y) * 8;
    reg.x = x;
    reg.y = y;
    const size = +armies.attr("box-size");
    const w = reg.n ? size * 4 : size * 6;
    const h = size * 2;
    const x1 = x => rn(x - w / 2, 2);
    const y1 = y => rn(y - size, 2);

    const move = d3.transition().duration(duration).ease(d3.easeSinInOut);
    el.select("rect").transition(move).attr("x", x1(x)).attr("y", y1(y));
    el.select("text").transition(move).attr("x", x).attr("y", y);
    el.selectAll("rect:nth-of-type(2)")
      .transition(move)
      .attr("x", x1(x) - h)
      .attr("y", y1(y));
    el.select(".regimentIcon")
      .transition(move)
      .attr("x", x1(x) - size)
      .attr("y", y);
  };

  // utilize si function to make regiment total text fit regiment box
  const getTotal = (reg )=> {
    let count=0;
    for(const key in reg.unitCounts) {
      count+=reg.unitCounts[key];
    }
    return count > (reg.n ? 999 : 99999) ? si(count) : count; }

  const getName = function (regiment, regiments) {
    const cells = pack.cells;
    const proper = regiment.n
      ? null
      : cells.province[regiment.cell] && pack.provinces[cells.province[regiment.cell]]
      ? pack.provinces[cells.province[regiment.cell]].name
      : cells.burg[regiment.cell] && pack.burgs[cells.burg[regiment.cell]]
      ? pack.burgs[cells.burg[regiment.cell]].name
      : null;
    const number = nth(regiments.filter(reg => reg.n === regiment.n && reg.i < regiment.i).length + 1);
    const form = regiment.n ? "Fleet" : "Regiment";
    return `${number}${proper ? ` (${proper}) ` : ` `}${form}`;
  };

  // get default regiment emblem
  const getEmblem = function (regiment) {
    if (!regiment.n && !Object.values(regiment.batallions).length) return "🔰"; // "Newbie" regiment without troops
    if (!regiment.n && pack.states[regiment.state].form === "Monarchy" && pack.cells.burg[regiment.cell] && pack.burgs[pack.cells.burg[regiment.cell]].capital) return "👑"; // "Royal" regiment based in capital
    /*const mainUnit = Object.entries(regiment.u).sort((a, b) => b[1] - a[1])[0][0]; // unit with more troops in regiment
    const unit = options.military.find(u => u.name === mainUnit);*/
    //here we shoould search regiment.batallions for the most frequent unit
    let mostFrequentUnit = options.military[0];
    let mostFrequentUnitCount = 0;
    if(regiment.batallions?.length > 0){
      options.military.forEach(unit => {
        const count=regiment.batallions.filter(batallion => batallion.unit === unit.name).length;
        if(count>mostFrequentUnitCount){
          mostFrequentUnitCount=count;
          mostFrequentUnit=unit;
        }
      });
    }
    return mostFrequentUnit.icon;
  };

  const generateNote = function (regiment, state) {
    const cells = pack.cells;
    const base =
      cells.burg[regiment.cell] && pack.burgs[cells.burg[regiment.cell]]
        ? pack.burgs[cells.burg[regiment.cell]].name
        : cells.province[regiment.cell] && pack.provinces[cells.province[regiment.cell]]
        ? pack.provinces[cells.province[regiment.cell]].fullName
        : null;
    const station = base ? `${regiment.name} is ${regiment.n ? "based" : "stationed"} in ${base}. ` : "";

    const composition = regiment.a
      ? Object.keys(regiment.u)
          .map(t => `— ${t}: ${regiment.u[t]}`)
          .join("\r\n")
      : null;
    const troops = composition ? `\r\n\r\nRegiment composition in ${options.year} ${options.eraShort}:\r\n${regiment.unitCounts}.` : "";

    const campaign = state.campaigns ? ra(state.campaigns) : null;
    const year = campaign ? rand(campaign.start, campaign.end) : gauss(options.year - 100, 150, 1, options.year - 6);
    const conflict = campaign ? ` during the ${campaign.name}` : "";
    const legend = `Regiment was formed in ${year} ${options.era}${conflict}. ${station}${troops}`;
    notes.push({id: `regiment${state.i}-${regiment.i}`, name: `${regiment.icon} ${regiment.name}`, legend});
  };
  /**updates the regiment.unitCounts property based on the current number of regiments/type */
  const updateUnitCounts= function (regiment){
    const unitCounts={};
    regiment.batallions.forEach(b=>{
      if(!unitCounts[b.unit]){
        unitCounts[b.unit]=1;
      }else{
        unitCounts[b.unit]+=1;
      }
    });
    return unitCounts;
  }
  return {generate, redraw, getDefaultOptions, getName, generateNote, drawRegiments, drawRegiment, moveRegiment, getTotal, getEmblem,updateUnitCounts};
})();