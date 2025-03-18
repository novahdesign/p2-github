/**
 * Load data from CSV file asynchronously and render charts
 */

let lexisChart, barChart, scatterPlot;
// Global variable to track selected group (default: OECD)
let selectedGroup = "oecd";


d3.csv('data/leaderlist.csv').then(_data => {
  data = _data;

  // Convert columns to numerical values
  data.forEach(d => {
    Object.keys(d).forEach(attr => {
      if (attr == 'pcgdp') {
        d[attr] = (d[attr] == 'NA') ? null : +d[attr];
      } else if (attr != 'country' && attr != 'leader' && attr != 'gender') {
        d[attr] = +d[attr];
      }
    });
  });

  data.sort((a,b) => a.label - b.label);

  // init lexisChart
  // init barChart
  // init scatterPlot <3

  lexisChart = new LexisChart({ parentElement: "#lexis-chart" }, data);
  barChart = new BarChart({ parentElement: "#bar-chart" }, data);
  scatterPlot = new ScatterPlot({ parentElement: "#scatter-plot" }, data);


 // Add event listener for the dropdown filter
 d3.select("#country-selector").on("change", function () {
     selectedGroup = this.value;
    //  resetSelections(); // Clear selected gender, arrows, and points
     filterData(); // Apply filter
 });

 // Initial filtering with default group (OECD)
 filterData();
});

// Function to filter data based on selected group
function filterData() {
 let filteredData;
 // Apply the country group filter + ensure duration > 0
filteredData = data.filter(d => d[selectedGroup] === 1 && d.duration > 0);

  // Apply gender filter (only if something is selected)
  if (barChart.genderFilter.length > 0) {
    filteredData = filteredData.filter(d => barChart.genderFilter.includes(d.gender));
}
console.log(`Filtering by: ${selectedGroup}`, filteredData);
console.log(`Filtering by 2: ${barChart.genderFilter}`, filteredData);

 // Update datasets in each visualization and re-render
 lexisChart.data = filteredData;
 barChart.data = filteredData;
 scatterPlot.data = filteredData;

 // Call updateVis() directly
 lexisChart.updateVis();
 barChart.updateVis();
 scatterPlot.updateVis();
}

// // Function to reset selections when dropdown changes
// function resetSelections() {
//  // Clear selected gender, arrows, and points
//  lexisChart.selectedArrows.clear();
//  scatterPlot.selectedPoints = new Set();
//  barChart.selectedGender = null;

//  // Ensure visualizations update to reflect deselections
//  lexisChart.updateVis();
//  scatterPlot.updateVis();
//  barChart.updateVis();
// }

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 * - listen to select box changes
 */
