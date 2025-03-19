/**
 * Load data from CSV file asynchronously and render charts
 */

/*
 * notes; this is what main.js does:
 * - initialize views
 * - filter data
 * - listen to events and update views
 * - listen to select box changes
 */
// global visualizations
let lexisChart, barChart, scatterPlot;

// Global variable to track selected group (default: OECD)
let selectedGroup = "oecd";

// global sets for 2 filters
let filteredData = []; // Stores country-filtered data
let genderFilteredData = []; // Stores additional gender-filtered data

// for selection for scatterplot and lexis interaction
let selectedPoints = new Set(); // Global set for selection

d3.csv("data/leaderlist.csv").then((_data) => {
  data = _data;

  // Convert columns to numerical values
  data.forEach((d) => {
    Object.keys(d).forEach((attr) => {
      if (attr == "pcgdp") {
        d[attr] = d[attr] == "NA" ? null : +d[attr];
      } else if (attr != "country" && attr != "leader" && attr != "gender") {
        d[attr] = +d[attr];
      }
    });
  });

  data.sort((a, b) => a.label - b.label);

  // init lexisChart, barChart, and scatterPlot
  lexisChart = new LexisChart({ parentElement: "#lexis-chart" }, data);
  barChart = new BarChart({ parentElement: "#bar-chart" }, data);
  scatterPlot = new ScatterPlot({ parentElement: "#scatter-plot" }, data);

  // Add event listener for the dropdown filter
  d3.select("#country-selector").on("change", function () {
    resetSelections(); // Clear selected gender, arrows, and points upon CHANGE
    selectedGroup = this.value; // set Selected Group to user input
    filterData(); // Apply filter
  });

  // Initial filtering with default group (OECD)
  filterData();
});

function resetSelections() {
  // Clear selected gender filters
  barChart.genderFilter = [];

  // Clear selected points/arrows in scatter plot & lexis chart
  selectedPoints.clear();
  lexisChart.selectedPoints.clear();
  scatterPlot.selectedPoints.clear();

  // Ensure all charts reflect reset state
  updateSelections();
  barChart.updateVis();
}

// Filters data for 1) global country seleciton and duration > 0 
// 2) applies gender filter based on the user clicking on barchart
// updates visualizations accordingly
function filterData() {
  // Apply Global Filter: Country Selection & Duration > 0
  filteredData = data.filter((d) => d[selectedGroup] === 1 && d.duration > 0);

  // Apply Gender Filter **on top of filteredData**
  if (barChart.genderFilter.length > 0) {
    genderFilteredData = filteredData.filter((d) =>
      barChart.genderFilter.includes(d.gender)
    );
  } else {
    genderFilteredData = filteredData; // No gender filter applied
  }

  // Update datasets for each visualization
  lexisChart.data = genderFilteredData; // Lexis Chart only sees the final filtered data
  
  barChart.data = filteredData; // Bar Chart always sees country-filtered data (no gender filtering)

  scatterPlot.data = filteredData; // ScatterPlot gets to see country-filtered data as well. BUT needs to change opacity.
  scatterPlot.updateOpacity(); // Scatter Plot updates opacity based on gender selection

  // Re-render views and update
  lexisChart.updateVis();
  barChart.updateVis();
  scatterPlot.updateVis();
}

// Update selected points for: scatterplot and lexis chart interaction
// Updates the selectedPoliticians set initialized at top
function updateSelections() {
  lexisChart.selectedPoints = selectedPoints;
  scatterPlot.selectedPoints = selectedPoints;

  lexisChart.updateVis();
  scatterPlot.updateVis();
}

// Function to toggle point selection
function toggleSelection(leader) {
  if (selectedPoints.has(leader)) {
    selectedPoints.delete(leader); // Deselect
  } else {
    selectedPoints.add(leader); // Select
  }
  updateSelections();
}
