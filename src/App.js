"use strict";

const topLeftX = 130;
const topLeftY = 70;
const bottomRightX = 710;
const bottomRightY = 375;
const NO_TEAM_MSG = "(Select Team First)"
const SHOT_TYPES = ['All', 'Corner', 'Free Kick', 'Open Play', 'Penalty', 'Kick Off']

window.addEventListener("load", init);
var shotData;
var xScale, yScale;

function selectData() {
    let team = $("#team-sel").val();
    if (team == '--') { return []; }
    let season = $("#season-sel").val();
    let type = $("#type-sel").val();
    console.log(team, season, type)

    let teamData = shotData[team];
    let shotFilter = function(shots, type) {
        if (type == 'All') { return shots; }
        else { return shots.filter(s => s['type']['name'] == type); }
    }
    if (season == 'All') { 
        let allShots = Object.values(teamData).reduce((a,b) => (a.concat(b)));
        return shotFilter(allShots, type);
    } else { return shotFilter(teamData[season], type); }
}

function getXCoord(endLoc) { return endLoc[1]; }
function getYCoord(endLoc) { return (endLoc.length > 2 ? endLoc[2] : 0); }
function encodeColor(shot) {
    let outcome = shot['outcome'];
    return (outcome['name'] == 'Goal' ? 'red' : 'black')
}
function encodeOpacity(shot) { return shot['statsbomb_xg']; }

function updateShots() {
    let data = selectData()
    const svg = d3.select("svg");
    svg.selectAll("circle")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("circle")
                    .attr("cx", d => xScale(getXCoord(d['end_location'])))
                    .attr("cy", d => yScale(getYCoord(d['end_location'])))
                    .attr("r", 5)
                    .attr("opacity", 0)
                    .transition()
                        .duration(500)
                        .attr("opacity", d => encodeOpacity(d))
                        .attr("fill", d => encodeColor(d))
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(500)
                    .attr("cx", d => xScale(getXCoord(d['end_location'])))
                    .attr("cy", d => yScale(getYCoord(d['end_location'])))
                    .attr("opacity", d => encodeOpacity(d))
                    .attr("fill", d => encodeColor(d))
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
        .domain([36, 44])
        .range([topLeftX, bottomRightX]);
    yScale = d3.scaleLinear()
        .domain([2.67, 0])
        .range([topLeftY, bottomRightY]);

    // data loading and handling
    d3.json('http://localhost:12345/src/shots_v2.json')
        .then(function(data) {
            console.log(data);
            shotData = data;

            // Populate dropdowns
            let teams = Object.keys(data);
            $("#team-sel").append(new Option('-- No Team Selected --', '--'));
            teams.sort().forEach(function(teamOption) {
                $("#team-sel").append(new Option(teamOption, teamOption))
            });
            $("#season-sel").append(new Option(NO_TEAM_MSG, ''));
            $("#type-sel").append(new Option(NO_TEAM_MSG, ''));

            // Set-up Handlers
            $("#team-sel").on('change', function(event) {
                teamSelectionHandler();
                updateShots()
            });
            $("#season-sel").on('change', updateShots);
            $("#type-sel").on('change', updateShots);
        })
        .catch(function(err) {
            console.log(err);
        });
}

function teamSelectionHandler() {
    let selTeam = $("#team-sel").val();
    $("#season-sel").empty();
    if (selTeam == '--') {
        $("#type-sel").empty()
        $("#season-sel").append(new Option(NO_TEAM_MSG, ''));
        $("#type-sel").append(new Option(NO_TEAM_MSG, ''));
    } else {
        $("#season-sel").append(new Option('All', 'All'))
        Object.keys(shotData[selTeam]).sort().forEach(function(season) {
            $("#season-sel").append(new Option(season, season))
        });
        if ($("#type-sel").children().length == 1) {
            $("#type-sel").empty()
            SHOT_TYPES.forEach(function(shot) {
                $("#type-sel").append(new Option(shot, shot))
            });
        }
    }
}
