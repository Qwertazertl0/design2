"use strict";




var mydata = [
    ["England", "Season 2"],
    ["England", "Season 3"],
    ["England", "Season 5"],
    ["France", "Season 1"],
    ["France", "Season 6"],
    ["France", "Season 7"],
    ["US", "Season 2"],
    ["US", "Season 4"],
    ["US", "Season 8"]
];


function makeDropDown(data, level1Filter) {
    const filteredArray = data.filter(r => r[0] === level1Filter);

    const uniqueList = getUniqueValues(filteredArray, 1);
    
    const selectLevel2 = document.getElementById("level2");

    populateDropDown(selectLevel2, uniqueList);
    
}

function applyDropDown() {
    const selectLevel1Value = document.getElementById("level1").value;
    makeDropDown(mydata, selectLevel1Value)
}


function afterDocumentLoads() {
    populateFirstLevelDropDown();
    applyDropDown();
}


function getUniqueValues(data, index) {
    const uniqueOptions = new Set();
    data.forEach(r => uniqueOptions.add(r[index]));
    return [...uniqueOptions];
    
}

function populateFirstLevelDropDown() {
    const uniqueList = getUniqueValues(mydata, 0);
    const element = document.getElementById("level1");

    populateDropDown(element, uniqueList);

    
}

function populateDropDown(element, listAsArray) {
    element.innerHTML = "";
    
    listAsArray.forEach(item => {
        const option = document.createElement("option");
        option.textContent = item;
        element.appendChild(option);
    });
}


document.getElementById("level1").addEventListener("change", applyDropDown);
document.addEventListener("DOMContentLoaded", afterDocumentLoads);




