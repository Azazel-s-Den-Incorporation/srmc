"use strict";

function drawBuildingLabels() {
  TIME && console.time("drawBuildingLabels");

  buildingLabels.selectAll("text").remove(); // cleanup
  
  const building = pack.buildings.filter(b => b.i && !b.removed);
  const buildingSize = buildingIcons.select("#buildings").attr("size") || 0.5;
  buildingLabels
    .select("#buildings")
    .selectAll("text")
    .data(building)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", b => "buildingLabel" + b.i)
    .attr("data-id", b => b.i)
    .attr("x", b => b.x)
    .attr("y", b => b.y)
    .attr("dy", `${buildingSize * -2}px`)
    .text(b => b.name);

  const production = pack.buildings.filter(b => b.i && !b.removed);
  const productionSize = buildingIcons.select("#production").attr("size") || 0.5;
  productionLabels
    .select("#production")
    .selectAll("text")
    .data(production)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", b => "buildingLabel" + b.i)
    .attr("data-id", b => b.i)
    .attr("x", b => b.x)
    .attr("y", b => b.y)
    .attr("dy", `${productionSize * -2}px`)
    .text(b => b.name);

  const logistics = pack.buildings.filter(b => b.i && !b.removed);
  const logisticsSize = buildingIcons.select("#logistics").attr("size") || 0.5;
  logisticsLabels
    .select("#logistics")
    .selectAll("text")
    .data(logistics)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", b => "buildingLabel" + b.i)
    .attr("data-id", b => b.i)
    .attr("x", b => b.x)
    .attr("y", b => b.y)
    .attr("dy", `${logisticsSize * -2}px`)
    .text(b => b.name);

  const power = pack.buildings.filter(b => b.i &&!b.removed);
  const powerSize = powerIcons.select("#power").attr("size") || 0.5;
  powerLabels
    .select("#power")
    .selectAll("text")
    .data(power)
    .enter()
    .append("text")
    .attr("text-rendering", "optimizeSpeed")
    .attr("id", b => "buildingLabel" + b.i)
    .attr("data-id", b => b.i)
    .attr("x", b => b.x)
    .attr("y", b => b.y)
    .attr("dy", `${powerSize * -2}px`)
    .text(b => b.name);
      
  TIME && console.timeEnd("drawBuildingLabels");
}
