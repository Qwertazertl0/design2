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
    
    updateBarchart(data)
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
    d3.json('http://localhost:12345/data/shots_v2.json')
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


//BARCHART

const padding = { top: 50, left: 50, right: 50, bottom: 50 }


window.addEventListener("load", baseBarChart);

//maxShots finds new max for yaxis based on new 'counts'
function maxShots(data) {
    let current = 0;
    for(let i = 0; i < Object.keys(data).length; i++) {
        if (data[i]['count'] > current) {
            current = data[i]['count']
        }
    }
    if (current == 0) {
        current = 1
    }
    return current;
}

function baseBarChart() {
    const svg = d3.select('#barchart');
    const TIME = ["15", "30", "45", "60", "75", "90"];
    // TODO: get mode selection; $("#id")
    const xForTime = d3.scaleBand()
        .domain(TIME)
        .range([0 + padding.left, svg.attr("width") - padding.right]) // TODO
        .padding(0.5);

    var yForNumber = d3.scaleLinear()
        .domain([0, 15]) // TODO
        .range([svg.attr("height") - padding.top, 0 + padding.bottom]);
    
    var yAxis = svg.append("g")
        .call(d3.axisLeft(yForNumber))
        .attr("transform", `translate(${padding.left} , 0)`);
    const xAxis = svg.append("g")
        .call(d3.axisBottom(xForTime)) // d3 creates a bunch of elements inside the <g>
        .attr("transform", `translate(0, ${svg.attr("height") - padding.bottom})`); 

    svg.append("text")
        .attr("font-size", 12) // This code duplication signals that these properties
        .attr("font-weight", "bold") // should be moved to CSS. For now, the code is this
        .attr("font-family", "sans-serif") // way to simplify our directions to you.
        .attr("transform", `translate(${padding.left/3}, ${svg.attr("height")/2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .text("Number of Shots"); 
    svg.append("text")
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .attr("x", svg.attr("width")/2)
        .attr("y", svg.attr("height")-(padding.bottom/3))
        .style("text-anchor", "middle")
        .text("Time of Goal"); 
}


function updateBarchart(data) {    
    const svg = d3.select('#barchart');
    const TIME = ["15", "30", "45", "60", "75", "90"];
    // TODO: get mode selection; $("#id")
    let aggregateData = aggregate(data, 'technique') // TODO: use mode variable

    let maxnumber = maxShots(aggregateData)

    
    const xForTime = d3.scaleBand()
        .domain(TIME)
        .range([0 + padding.left, svg.attr("width") - padding.right]) 
        .padding(0.5);

    
    var yForNumber = d3.scaleLinear()
        .domain([0, maxnumber]) 
        .range([svg.attr("height") - padding.top, 0 + padding.bottom]);
    
    var yAxis = svg.append("g")
        .call(d3.axisLeft(yForNumber))
        .attr("transform", `translate(${padding.left} , 0)`);
    const xAxis = svg.append("g")
        .call(d3.axisBottom(xForTime)) 
        .attr("transform", `translate(0, ${svg.attr("height") - padding.bottom})`); 

    svg.append("text")
        .attr("font-size", 12) 
        .attr("font-weight", "bold") 
        .attr("font-family", "sans-serif") 
        .attr("transform", `translate(${padding.left/3}, ${svg.attr("height")/2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .text("Number of Shots"); 
    svg.append("text")
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .attr("x", svg.attr("width")/2)
        .attr("y", svg.attr("height")-(padding.bottom/3))
        .style("text-anchor", "middle")
        .text("Time of Goal");   

    svg.selectAll("rect")
        .data(aggregateData) // (Hardcoded) only Urbana’s data
        .join("rect")
            .attr("x", (dataPoint, i) => xForTime(TIME[i])) // i is dataPoint’s index in the data array
            .attr("y", (dataPoint, i) => yForNumber(dataPoint['count']))
            .attr("width", (dataPoint, i) => xForTime.bandwidth())
            .attr("height", (dataPoint, i) => (svg.attr("height") - yForNumber(dataPoint['count']) - padding.bottom))
            .attr("fill", "black")


}

function timeConvert(time) {
    let [t, decimal] = time.split('.')
    let [h, m, s] = t.split(':');
    var numbert = m + '.' + s
    return Number(numbert)

}

/**
 * input: [{keys:values, 'timestamp':blah},{}], mode
 * output: [{'time': 15, 'count': ##},{...},{},{},{},{}]
 */
function aggregate(data, mode) {
    console.log(data)
    // mode = 'time'

    // Example shot:
    // body_part: {id: 38, name: "Left Foot"}
    // end_location: (3) [120, 48.1, 2.7]
    // first_time: true
    // key_pass_id: "b4bfb05d-f2e0-43d2-a844-49a96cec802f"
    // outcome: {id: 98, name: "Off T"}
    // statsbomb_xg: 0.4365348
    // team: "Cádiz"
    // technique: {id: 91, name: "Half Volley"}
    // timestamp: "00:08:52.321"
    // type: {id: 87, name: "Open Play"}
    if (mode == 'time') {
        var dict = [
            {'time': 15, 'count' : 0},
            {'time': 30,'count' : 0},
            {'time': 45, 'count' : 0},
            {'time': 60, 'count' : 0},
            {'time': 75, 'count' : 0},
            {'time': 90, 'count' : 0},
    
        ];
    }
    if (mode == 'bodypart') {
        var dict = [
            {'bodypart': 'head', 'count' : 0},
            {'bodypart': 'leftfoot','count' : 0},
            {'bodypart': 'rightfoot', 'count' : 0},
            {'bodypart': 'other', 'count' : 0}
        ];
    }
    if (mode == 'technique') {
        var dict = [
            {'technique': 'backheel', 'count' : 0},
            {'technique': 'diving header','count' : 0},
            {'technique': 'halfvolley', 'count' : 0},
            {'technique': 'lob', 'count' : 0},
            {'technique': 'normal', 'count' : 0},
            {'technique': 'overhead kick', 'count' : 0},
            {'technique': 'volley', 'count' : 0}
        ];    
    }

    console.log(Object.keys(data).length)

    for(var i = 0; i < Object.keys(data).length; i++) {
        if (mode == 'time') {
            if (data[i]['timestamp'] != null) {
                var timestamp = data[i]['timestamp']
                var outcome = data[i]['outcome']['name']

                var ntime = timeConvert(timestamp)

                if (outcome == 'Goal') {
                    if (ntime <= 15) {
                        dict[0]['count'] += 1
                    }
                    if (15 < ntime && ntime <= 30) {
                        dict[1]['count'] += 1
                    }
                    if (30.00 < ntime && ntime <= 45.00) {
                        dict[2]['count'] += 1
                    }
                    if (45.00 < ntime && ntime <= 60.00) {
                        dict[3]['count'] += 1
                    }
                    if (60.00 < ntime && ntime <= 75.00) {
                        dict[4]['count'] += 1
                    }
                    if (75.00 < ntime && ntime <= 90.00) {
                        dict[5]['count'] += 1
                    }
                }
            }
        }
        if (mode == 'bodypart') {

            if (data[i]['body_part']['name'] == 'Head') {
                dict[0]['count'] += 1
            }
            if (data[i]['body_part']['name'] == 'Left Foot') {
                dict[1]['count'] += 1
            }
            if (data[i]['body_part']['name'] == 'Right Foot') {
                dict[2]['count'] += 1
                console.log("HERE")
            }
            if (data[i]['body_part']['name'] == 'Other') {
                dict[3]['count'] += 1
            }
        }
        if (mode == 'technique') {

            if (data[i]['technique']['name'] == 'Backheel') {
                dict[0]['count'] += 1
            }
            if (data[i]['technique']['name'] == 'Diving Header') {
                dict[1]['count'] += 1
            }
            if (data[i]['technique']['name'] == 'Half Volley') {
                dict[2]['count'] += 1
                console.log("HERE")
            }
            if (data[i]['technique']['name'] == 'Lob') {
                dict[3]['count'] += 1
            }
            if (data[i]['technique']['name'] == 'Normal') {
                dict[4]['count'] += 1
            }
            if (data[i]['technique']['name'] == 'Overhead Kick') {
                dict[5]['count'] += 1
            }
            if (data[i]['technique']['name'] == 'Volley') {
                dict[6]['count'] += 1
            }
        }

        
    }
    console.log(dict)
    return dict;
}