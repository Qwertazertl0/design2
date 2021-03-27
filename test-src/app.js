"use strict";

const topLeftX = 130;
const topLeftY = 70;
const bottomRightX = 710;
const bottomRightY = 375;

window.addEventListener("load", init);
var shotData;
var xScale, yScale;

function selectData(team) {
    return shotData[team];
}

function getXCoord(endLoc) { return endLoc[1]; }
function getYCoord(endLoc) { return (endLoc.length > 2 ? endLoc[2] : 0); }

function updateShots(data) {
    console.log(data)
    const svg = d3.select("svg");
    svg.selectAll("circle")
        .data(data["season1"])
        .join(
            enterSelection => {
                enterSelection.append("circle")
                    .attr("cx", d => xScale(getXCoord(d['end_location'])))
                    .attr("cy", d => yScale(getYCoord(d['end_location'])))
                    .attr("r", 10)
                    .attr("opacity", 0)
                    .transition()
                        .duration(500)
                        .attr("opacity", 1);
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(500)
                    .attr("cx", d => xScale(getXCoord(d['end_location'])))
                    .attr("cy", d => yScale(getYCoord(d['end_location'])))
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
    const svg = d3.select("svg");
    
    xScale = d3.scaleLinear()
        .domain([36, 44])
        .range([topLeftX, bottomRightX]);
    yScale = d3.scaleLinear()
        .domain([2.67, 0])
        .range([topLeftY, bottomRightY]);

    d3.json('http://localhost:12345/test.json')
        .then(function(data) {
            console.log(data);
            shotData = data;
            updateShots(selectData('team1'));
        })
        .catch(function(err) {
            console.log(err);
        });
    
    // TODO: Dropdown handlers
    $("#options").change(function(e) {
        console.log($("#options").val());
        let t = $("#options").val();
        updateShots(selectData(t));
    })
}