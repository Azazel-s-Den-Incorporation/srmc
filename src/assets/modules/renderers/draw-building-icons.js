"use strict";

function drawBuildingIcons() {
  TIME && console.time("drawBuildingIcons");

  icons.selectAll("circle, use").remove(); // cleanup

  // buildings

  const building = pack.buildings.filter(b => b.i && !b.removed);
  const buildingsIcons = buildingIcons.select("#buildings");
  const buildingSize = buildingsIcons.attr("size") || 1;

  buildingsIcons
    .selectAll("circle")
    .data(building)
    .enter()
    .append("circle")
    .attr("id", b => "building" + b.i)
    .attr("data-id", b => b.i)
    .attr("cx", b => b.x)
    .attr("cy", b => b.y)
    .attr("r", buildingSize);

  const production = pack.buildings.filter(b => b.i && !b.removed);
  const productionIcons = buildingIcons.select("#production");
  const productionSize = productionIcons.attr("size") || 1;

  productionIcons
    .selectAll("circle")
    .data(production)
    .enter()
    .append("circle")
    .attr("id", b => "building" + b.i)
    .attr("data-id", b => b.i)
    .attr("cx", b => b.x)
    .attr("cy", b => b.y)
    .attr("r", productionSize);

  const logistics = pack.buildings.filter(b => b.i && !b.removed);
  const logisticsIcons = buildingIcons.select("#logistics");
  const logisticsSize = logisticsIcons.attr("size") || 1;
  logisticsIcons
    .selectAll("circle")
    .data(logistics)
    .enter()
    .append("circle")
    .attr("id", b => "building" + b.i)
    .attr("data-id", b => b.i)
    .attr("cx", b => b.x)
    .attr("cy", b => b.y)
    .attr("r", logisticsSize);

  const power = pack.buildings.filter(b => b.i && !b.removed);
  const powerIcons = buildingIcons.select("#power");
  const powerSize = powerIcons.attr("size") || 1;
  powerIcons
    .selectAll("circle")
    .data(power)
    .enter()
    .append("circle")
    .attr("id", b => "building" + b.i)
    .attr("data-id", b => b.i)
    .attr("cx", b => b.x)
    .attr("cy", b => b.y)
    .attr("r", powerSize);

  TIME && console.timeEnd("drawBuildingIcons");
}
