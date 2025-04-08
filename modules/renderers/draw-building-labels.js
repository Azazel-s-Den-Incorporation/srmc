"use strict";

function drawBuildingLabels() {
  TIME && console.time("drawBuildingLabels");

  buildingLabels.selectAll("text").remove(); // cleanup
  
  const production = pack.buildings.filter(d => d.i && !d.removed);
  const productionSize = buildingIcons.select("#production").attr("size") || 0.5;
  productionLabels
    .selectAll("text")
    .data(production)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", d => "buildingLabel" + d.i)
    .attr("data-id", d => d.i)
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", `${productionSize * -2}px`)
    .text(d => d.name);

  const logistics = pack.buildings.filter(d => d.i && !d.removed);
  const logisticsSize = buildingIcons.select("#logistics").attr("size") || 0.5;
  logisticsLabels
    .selectAll("text")
    .data(logistics)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", d => "buildingLabel" + d.i)
    .attr("data-id", d => d.i)
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", `${logisticsSize * -2}px`)
    .text(d => d.name);

  const power = pack.buildings.filter(d => d.i &&!d.removed);
  const powerSize = powerIcons.select("#power").attr("size") || 0.5;
  powerLabels
    .selectAll("text")
    .data(power)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", d => "buildingLabel" + d.i)
    .attr("data-id", d => d.i)
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", `${powerSize * -2}px`)
    .text(d => d.name);
      
  TIME && console.timeEnd("drawBuildingLabels");
}
