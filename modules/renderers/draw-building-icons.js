"use strict";

function drawBuildingIcons() {
  TIME && console.time("drawBuildingIcons");

  icons.selectAll("circle, use").remove(); // cleanup

  // buildings
  const production = pack.buildings.filter(d => d.i && !d.removed);
  const productionIcons = buildingIcons.select("#production");
  const productionSize = productionIcons.attr("size") || 0.5;

  productionIcons
    .selectAll("circle")
    .data(production)
    .enter()
    .append("circle")
    .attr("id", d => "building" + d.i)
    .attr("data-id", d => d.i)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", productionSize);

  const logistics = pack.buildings.filter(d => d.i && !d.removed);
  const logisticsIcons = buildingIcons.select("#logistics");
  const logisticsSize = logisticsIcons.attr("size") || 0.5;
  logisticsIcons
    .selectAll("circle")
    .data(logistics)
    .enter()
    .append("circle")
    .attr("id", d => "building" + d.i)
    .attr("data-id", d => d.i)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", logisticsSize);

  const power = pack.buildings.filter(d => d.i && !d.removed);
  const powerIcons = buildingIcons.select("#power");
  const powerSize = powerIcons.attr("size") || 0.5;
  powerIcons
    .selectAll("circle")
    .data(power)
    .enter()
    .append("circle")
    .attr("id", d => "building" + d.i)
    .attr("data-id", d => d.i)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", powerSize);

  TIME && console.timeEnd("drawBuildingIcons");
}
