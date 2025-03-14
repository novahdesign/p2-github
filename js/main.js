/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/leaderlist.csv').then(data => {

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
  // Initialize and update chart
  console.log(data)
 
  const vis = new LexisChart({ parentElement: "#lexisChart" }, data);

  console.log("heeyyy", vis.data)

  vis.updateVis();

});

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 * - listen to select box changes
 */
