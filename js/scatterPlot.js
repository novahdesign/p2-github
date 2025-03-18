class ScatterPlot {
  constructor(_config, _data) {
      this.config = {
          parentElement: _config.parentElement,
          containerWidth: 500,
          containerHeight: 300,
          margin: { top: 40, right: 40, bottom: 50, left: 50 },
          tooltipPadding: 10
      };

      this.data = _data;
      this.selectedPoints = new Set(); // Track selected points
      this.initVis();
  }

  initVis() {
      let vis = this;

      // Calculate chart dimensions
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      // Create SVG
      vis.svg = d3.select(vis.config.parentElement)
          .attr("id", "scatter-plot")
          .attr("width", vis.config.containerWidth)
          .attr("height", vis.config.containerHeight);

      vis.chart = vis.svg.append("g")
          .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

      // Initialize scales
      vis.xScale = d3.scaleLinear().range([0, vis.width]);
      vis.yScale = d3.scaleLinear().domain([25, 95]).range([vis.height, 0]); // Static y-axis

      // Create axes
      vis.xAxis = d3.axisBottom(vis.xScale);
      vis.yAxis = d3.axisLeft(vis.yScale);

      // Append axes
      vis.xAxisGroup = vis.chart.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0, ${vis.height})`);

      vis.yAxisGroup = vis.chart.append("g")
          .attr("class", "y-axis");

      // Axis labels
      vis.chart.append("text")
          .attr("class", "axis-label")
          .attr("x", vis.width)
          .attr("y", vis.height + 40)
          .attr("text-anchor", "end")
          .text("GDP per Capita (US$)");

      vis.chart.append("text")
          .attr("class", "axis-label")
          .attr("x", -vis.config.margin.left)
          .attr("y", -10)
          .style("font-weight", "bold")
          .text("Age");

      // Initialize tooltip
      vis.tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

      vis.updateVis();
  }

  updateVis() {
      let vis = this;

      // Filter data to only include points where GDP per capita is known
      vis.filteredData = vis.data.filter(d => d.pcgdp !== null);

      // Update x-scale domain dynamically
      vis.xScale.domain([0, d3.max(vis.filteredData, d => d.pcgdp) || 1]);

      vis.renderVis();
  }

  // update opacity helper
  updateOpacity() {
    let vis = this;

    let activeGenders = barChart.genderFilter;
    let hasFilter = activeGenders.length > 0;

    // set the opacity to 0.7 for active and 0.15 for inactive points.
    vis.chart.selectAll(".point")
        .transition().duration(300)
        .style("opacity", d => {
            if (!hasFilter) return 1;
            return activeGenders.includes(d.gender) ? 0.7 : 0.15;
        })
        .style("pointer-events", d => {
            if (!hasFilter) return "auto";
            return activeGenders.includes(d.gender) ? "auto" : "none";
        });
  }



  renderVis() {
      let vis = this;

      // Bind data to points
      const circles = vis.chart.selectAll(".point")
          .data(vis.filteredData, d => d.leader)
          .join("circle")
          .attr("class", "point")
          .attr("cx", d => vis.xScale(d.pcgdp))
          .attr("cy", d => vis.yScale(d.start_age))
          .attr("r", 5)
          .attr("fill", d => vis.selectedPoints.has(d.leader) ? "blue" : "#ccc")
          .style("cursor", "pointer")
          .style("fill-opacity", d => vis.selectedPoints.has(d.leader) ? 1 : 0.7)

          // Hover: Outline and darken
          .on("mouseover", function (event, d) {
              d3.select(this)
                  .attr("stroke", "black")
                  .attr("stroke-width", 2);

              vis.tooltip.html(`
                  <strong>${d.leader}</strong><br>
                  Country: ${d.country} <br>
                  GDP per capita: $${d.pcgdp}
              `)
                  .style("left", (event.pageX + vis.config.tooltipPadding) + "px")
                  .style("top", (event.pageY - vis.config.tooltipPadding) + "px")
                  .style("opacity", 1);
          })
          .on("mouseout", function () {
              d3.select(this).attr("stroke", "none");
              vis.tooltip.style("opacity", 0);
          })

          // Click to select/deselect points
          .on("click", function (event, d) {
              if (vis.selectedPoints.has(d.leader)) {
                  vis.selectedPoints.delete(d.leader);
              } else {
                  vis.selectedPoints.add(d.leader);
              }
              vis.renderVis(); // Update selection
          });

      // update opacity
      vis.updateOpacity();

      // Update axes
      vis.xAxisGroup.call(vis.xAxis);
      vis.yAxisGroup.call(vis.yAxis);
  }
}

// class ScatterPlot {

//   /**
//    * Class constructor with basic chart configuration
//    * @param {Object}
//    */
//   // Todo: Add or remove parameters from the constructor as needed
//   constructor(_config, data) {
//     this.config = {
//       parentElement: _config.parentElement,
//       containerWidth: 720,
//       containerHeight: 260,
//       margin: {
//         top: 30,
//         right: 15,
//         bottom: 20,
//         left: 30
//       }
//       // Todo: Add or remove attributes from config as needed
//     }
//     this.initVis();
//   }

//   initVis() {
//     let vis = this;
//     // Todo: Create SVG area, chart, initialize scales and axes, add titles, etc
//   }

//   updateVis() {
//     let vis = this;
//     // Todo: Prepare data and scales
//   }

//   renderVis() {
//     let vis = this;
//     // Todo: Bind data to visual elements, update axes
//   }

// }