"use strict";

const topLeftX = 20;
const topLeftY = 20;
const bottomRightX = 437;
const bottomRightY = 290;

window.addEventListener("load", init);
var passData;
var xScale, yScale;
var widthScale, colorScale;

function selectData() {
    let season = $("#passes-season-sel").val();
    console.log(season)
    return passData[season]
}

function getStartPoint(pass) {
    let start = pass['start_location'];
    return [xScale(start[0]), yScale(start[1])];
}
function getEndPoint(pass) { 
    let end = pass['end_location'];
    return [xScale(end[0]), yScale(end[1])];
}
function encodeColor(pass) {
    return colorScale(pass['complete']); // TODO
}
function encodeOpacity(pass) { return pass['count']; }

function updatePasses() {
    let data = selectData();
    let maxClusterSize = data.map(p => p['count']).reduce((x,y) => x > y ? x : y);
    let line = d3.line();
    widthScale = d3.scaleLinear()
        .domain(d3.extent(data.map(p => p['count'])))
        .range([1, 2.5]);
    
    const svg = d3.select("svg");
    svg.selectAll("path")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("path")
                    .attr("d", pass => line([getStartPoint(pass), getEndPoint(pass)]))
                    .attr("opacity", 0)
                    .attr("stroke", pass => encodeColor(pass))
                    .attr("stroke-width", pass => widthScale(pass['count']))
                    .transition()
                        .duration(500)
                        .attr("opacity", pass => encodeOpacity(pass) / maxClusterSize)
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(100)
                    .attr("d", pass => line([getStartPoint(pass), getEndPoint(pass)]))
                    .attr("stroke", pass => encodeColor(pass))
                    .attr("stroke-width", pass => widthScale(pass['count']))
                    .attr("opacity", pass => encodeOpacity(pass) / maxClusterSize)
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(500)
                    .attr('opacity', 0)
                    .remove();
            }
        );
}

function init() {
    // data to SVG coordinate transforms
    xScale = d3.scaleLinear()
        .domain([0, 120])
        .range([topLeftX, bottomRightX]);
    yScale = d3.scaleLinear()
        .domain([0, 80])
        .range([topLeftY, bottomRightY]);
    colorScale = d3.scaleLinear().domain([0,1])
        .range(["red", "blue"])

    // data loading and handling
    d3.json('http://localhost:12345/data/passes_barcelona_aggregate.json')
        .then(function(data) {
            console.log(data);
            passData = data;

            // Populate dropdowns
            let seasons = Object.keys(data);
            $("#passes-team-sel").append(new Option('Barcelona', 'Barcelona'));
            seasons.sort().forEach(function(seasonOption) {
                $("#passes-season-sel").append(new Option(seasonOption, seasonOption))
            });
            // Set-up Handlers
            $("#passes-season-sel").on('change', function(event) {
                updatePasses()
            });

            updatePasses()
        })
        .catch(function(err) {
            console.log(err);
        });
}
