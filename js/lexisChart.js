class LexisChart {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 380,
      margin: { top: 15, right: 15, bottom: 20, left: 25 },
      tooltipPadding: 15
    };

    this.data = _data;
    this.selectedArrows = new Set(); // Track selected arrows

    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate chart dimensions
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Create SVG element
    vis.svg = d3.select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.chartArea = vis.svg.append("g")
      .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Apply clipping mask
    vis.chart = vis.chartArea.append("g")
      .attr("clip-path", "url(#chart-mask)"); 

    // Initialize scales
    vis.xScale = d3.scaleLinear().domain([1950, 2021]).range([0, vis.width]);
    vis.yScale = d3.scaleLinear().domain([25, 95]).range([vis.height, 0]);

    // Create axes
    vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d3.format("d"));
    vis.yAxis = d3.axisLeft(vis.yScale)
      .tickValues(d3.range(40, 100, 10))
      .tickFormat(d3.format("d"));

    // Append axes
    vis.xAxisGroup = vis.chartArea.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${vis.height})`);

    vis.yAxisGroup = vis.chartArea.append("g")
      .attr("class", "y-axis");

    // Remove axis lines
    vis.xAxisGroup.selectAll(".domain, .tick line").remove();
    vis.yAxisGroup.selectAll(".domain, .tick line").remove();

    // Axis labels
    vis.chartArea.append("text")
      .attr("x", -vis.config.margin.left)
      .attr("y", -2)
      .attr("class", "axis-label")
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .text("Age");

    vis.chartArea.append("text")
      .attr("x", vis.width)
      .attr("y", vis.height + 35)
      .attr("text-anchor", "end")
      .attr("class", "axis-label")
      .text("Year");

    // Initialize tooltips
    vis.tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

      vis.chart.append("defs")
          .append("clipPath")
          .attr("id", "chart-mask")
          .append("rect")
          .attr("width", vis.width)  // Clipping width
          .attr("height", vis.height); // Clipping height
      
      // Apply the mask to the group containing arrows
      vis.chartArea = vis.chart.append("g")
          .attr("clip-path", "url(#chart-mask)");
    // Create arrow markers
    this.createMarkerEnds();

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // Ensure data exists before proceeding
    if (!vis.data || vis.data.length === 0) {
      console.error("No valid data available in updateVis()");
      return;
    }

    // Filter data to ensure duration > 0
    vis.filteredData = vis.data.filter(d => +d.duration > 0);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Update axes
    vis.xAxisGroup.call(vis.xAxis).selectAll(".domain").remove();
    vis.yAxisGroup.call(vis.yAxis).selectAll(".domain").remove();

    // Bind data to arrows
    vis.chartArea.selectAll(".arrow")
      .data(vis.filteredData, d => d.leader)
      .join(
        enter => enter.append("line")
          .attr("class", "arrow")
          .attr("x1", d => vis.xScale(d.start_year))
          .attr("x2", d => vis.xScale(d.end_year))
          .attr("y1", d => vis.yScale(d.start_age))
          .attr("y2", d => vis.yScale(d.end_age))
          .attr("stroke", d => d.label === 1 ? "#aeaeca" : "#ddd")
          .attr("stroke-width", d => d.label === 1 ? 3 : 2)
          .attr("marker-end", d => vis.getArrowMarker(d))
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            d3.select(this).attr("stroke", "#888").attr("stroke-width", 4).attr("marker-end", "url(#arrow-head-hovered)");

            vis.tooltip.html(`
              <strong>${d.leader}</strong><br>
              Country: ${d.country} <br>
              Years: ${d.start_year} - ${d.end_year} <br>
              Age: ${d.start_age} - ${d.end_age} <br>
              Duration: ${d.duration} years <br>
              GDP per capita: ${d.pcgdp ? "$" + d.pcgdp : "N/A"}
            `)
              .style("left", (event.pageX + vis.config.tooltipPadding) + "px")
              .style("top", (event.pageY - vis.config.tooltipPadding) + "px")
              .style("opacity", 1);
          })
          .on("mouseout", function () {
            d3.select(this)
              .attr("stroke", d => vis.selectedArrows.has(d.leader) ? "#e89f03" : (d.label === 1 ? "#aeaeca" : "#ddd"))
              .attr("stroke-width", d => vis.selectedArrows.has(d.leader) ? 4 : (d.label === 1 ? 3 : 2))
              .attr("marker-end", d => vis.getArrowMarker(d));

            vis.tooltip.style("opacity", 0);
          })
          .on("click", function (event, d) {
            vis.toggleSelection(d.leader);
            vis.renderVis(); // Re-render to update styles
          })
      );
  }

  getArrowMarker(d) {
    if (this.selectedArrows.has(d.leader)) return "url(#arrow-head-highlighted-selected)";
    if (d.label === 1) return "url(#arrow-head-highlighted)";
    return "url(#arrow-head)";
  }

  toggleSelection(leader) {
    if (this.selectedArrows.has(leader)) {
      this.selectedArrows.delete(leader);
    } else {
      this.selectedArrows.add(leader);
    }
  }

   /**
//    * Create all of the different arrow heads.
//    * Styles: default, hover, highlight, highlight-selected
//    * To switch between these styles you can switch between the CSS class.
//    * We populated an example css class with how to use the marker-end attribute.
//    * See link for more info.
//    * https://observablehq.com/@stvkas/interacting-with-marker-ends
//    */
  createMarkerEnds() {
    let vis = this;
    // Default arrow head
    // id: arrow-head
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#ddd')
      .attr('fill', 'none');

    // Hovered arrow head
    // id: arrow-head-hovered
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-hovered')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#888')
      .attr('fill', 'none');

    // Highlight arrow head
    // id: arrow-head-highlighted
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-highlighted')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#aeaeca')
      .attr('fill', 'none');

    // Highlighted-selected arrow head
    // id: arrow-head-highlighted-selected
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-highlighted-selected')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#e89f03')
      .attr('fill', 'none');
  }
}
  // createMarkerEnds() {
  //   let vis = this;

  //   const markers = [
  //     { id: "arrow-head", color: "#ddd" },
  //     { id: "arrow-head-hovered", color: "#888" },
  //     { id: "arrow-head-highlighted", color: "#aeaeca" },
  //     { id: "arrow-head-highlighted-selected", color: "#e89f03" }
  //   ];

  //   markers.forEach(marker => {
  //     vis.chart.append("defs").append("marker")
  //       .attr("id", marker.id)
  //       .attr("markerUnits", "strokeWidth")
  //       .attr("refX", 2).attr("refY", 2)
  //       .attr("markerWidth", 10).attr("markerHeight", 10)
  //       .attr("orient", "auto")
  //       .append("path")
  //       .attr("d", "M0,0 L2,2 L 0,4")
  //       .attr("stroke", marker.color)
  //       .attr("fill", "none");
  //   });
  // }


// class LexisChart {

//   /**
//    * Class constructor with initial configuration
//    * @param {Object}
//    */
//   // Todo: Add or remove parameters from the constructor as needed
//   constructor(_config, _data) {
//     this.config = {
//       parentElement: _config.parentElement,
//       containerWidth: 1000,
//       containerHeight: 380,
//       margin: {
//         top: 15,
//         right: 15,
//         bottom: 20,
//         left: 25
//       }
//       // Todo: Add or remove attributes from config as needed
//     }
//     this.data = _data;

//     this.selectedArrows = new Set(); 

//     this.initVis();
//   }

//   initVis() {
//     let vis = this;

//     // Calculate inner chart size. Margin specifies the space around the actual chart.
//     vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
//     vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

//     // Define size of SVG drawing area
//     vis.svg = d3.select(vis.config.parentElement)
//       .attr('width', vis.config.containerWidth)
//       .attr('height', vis.config.containerHeight);

//     // Append group element that will contain our actual chart
//     // and position it according to the given margin config
//     vis.chartArea = vis.svg.append('g')
//       .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

//     // Apply clipping mask to 'vis.chart' to clip arrows
//     vis.chart = vis.chartArea.append('g')
//       .attr('clip-path', 'url(#chart-mask)');

//     // Initialize clipping mask that covers the whole chart
//     vis.chart.append('defs')
//       .append('clipPath')
//       .attr('id', 'chart-mask')
//       .append('rect')
//       .attr('width', vis.config.width + 5)
//       .attr('y', -vis.config.margin.top)
//       .attr('height', vis.config.height);

//     // Helper function to create the arrows and styles for our various arrow heads
//     vis.createMarkerEnds();

    

//     // Todo: initialize scales, axes, static elements, etc.

//     // Initialize scales with static domains
//     vis.xScale = d3.scaleLinear()
//     .domain([1950, 2021])
//     .range([0, vis.config.width]);

// vis.yScale = d3.scaleLinear()
//     .domain([25, 95])
//     .range([vis.config.height, 0]);

// // Create axes
// vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d3.format("d"));

// vis.yAxis = d3.axisLeft(vis.yScale)
//     .tickValues(d3.range(40, 100, 10)) // Sets ticks at [30, 40, 50, ..., 90]
//     .tickFormat(d3.format("d")); // Ensures whole numbers

// // Append axes
// vis.xAxisGroup = vis.chartArea.append("g")
//     .attr("class", "x-axis")
//     .attr("transform", `translate(0, ${vis.config.height})`)
//     .call(vis.xAxis);

// vis.yAxisGroup = vis.chartArea.append("g")
//     .attr("class", "y-axis")
//     .call(vis.yAxis);

// // Axis labels
// vis.chartArea.append("text")
//     .attr("x", -vis.config.margin.left)
//     .attr("y", -2)
//     .attr("class", "axis-label")
//     .attr("font-size", 11)
//     .attr("font-weight", "bold")
//     .text("Age");

// vis.chartArea.append("text")
//     .attr("x", vis.config.width)
//     .attr("y", vis.config.height + 35)
//     .attr("text-anchor", "end")
//     .attr("class", "axis-label")
//     .text("Year");

//       // Initialize tooltip
//       vis.tooltip = d3.select("body").append("div")
//       .attr("class", "tooltip")
//       .style("opacity", 0);

//       vis.chart.append("defs")
//     .append("clipPath")
//     .attr("id", "chart-mask")
//     .append("rect")
//     .attr("width", vis.width)  // Clipping width
//     .attr("height", vis.height); // Clipping height

// // Apply the mask to the group containing arrows
// vis.chartArea = vis.chart.append("g")
//     .attr("clip-path", "url(#chart-mask)");


//       // call update

//   vis.updateVis();


//   }


//   updateVis() {
//     let vis = this;
//     // Todo: prepare data

//      // Filter data to ensure duration > 0

//      console.log("hi", vis.data)
//      vis.filteredData = vis.data.filter(d => +d.duration > 0);
//      vis.renderVis();

//   }

//   renderVis() {
//     let vis = this;

//     vis.xAxisGroup.call(vis.xAxis).selectAll(".domain").remove(); // Removes x-axis line
//     vis.yAxisGroup.call(vis.yAxis).selectAll(".domain").remove(); // Removes y-axis line


//     vis.chartArea.selectAll(".arrow")
//         .data(vis.filteredData, d => d.leader)

//         .join("line")
//         .attr("class", "arrow")
//         .attr("x1", d => vis.xScale(d.start_year))
//         .attr("x2", d => vis.xScale(d.end_year))
//         .attr("y1", d => vis.yScale(d.start_age))
//         .attr("y2", d => vis.yScale(d.end_age))
//         .attr("stroke", d => d.label === 1 ? "#aeaeca" : "#ddd")
//         .attr("stroke-width", d => d.label === 1 ? 3 : 2)
//         .attr("marker-end", d => {
//             if (vis.selectedArrows.has(d.leader)) return "url(#arrow-head-highlighted-selected)";
//             if (d.label === 1) return "url(#arrow-head-highlighted)";
//             return "url(#arrow-head)";
//         })
//         .style("cursor", "pointer")
//         .on("mouseover", function (event, d) {
//             d3.select(this)
//                 .attr("stroke", "#888")
//                 .attr("stroke-width", 4)
//                 .attr("marker-end", "url(#arrow-head-hovered)");

//             vis.tooltip
//                 .html(`
//                     <strong>${d.leader}</strong><br>
//                     Country: ${d.country} <br>
//                     Years: ${d.start_year} - ${d.end_year} <br>
//                     Age: ${d.start_age} - ${d.end_age} <br>
//                     Duration: ${d.duration} years <br>
//                     GDP per capita: ${d.pcgdp ? "$" + d.pcgdp : "N/A"}
//                 `)
//                 .style("left", (event.pageX + vis.config.tooltipPadding) + "px")
//                 .style("top", (event.pageY - vis.config.tooltipPadding) + "px")
//                 .style("opacity", 1);
//         })
//         .on("mouseout", function () {
//             d3.select(this)
//                 .attr("stroke", d => vis.selectedArrows.has(d.leader) ? "#e89f03" : (d.label === 1 ? "#aeaeca" : "#ddd"))
//                 .attr("stroke-width", d => vis.selectedArrows.has(d.leader) ? 4 : (d.label === 1 ? 3 : 2))
//                 .attr("marker-end", d => {
//                     if (vis.selectedArrows.has(d.leader)) return "url(#arrow-head-highlighted-selected)";
//                     if (d.label === 1) return "url(#arrow-head-highlighted)";
//                     return "url(#arrow-head)";
//                 });

//             vis.tooltip.style("opacity", 0);
//         })
//         .on("click", function (event, d) {
//             if (vis.selectedArrows.has(d.leader)) {
//                 vis.selectedArrows.delete(d.leader);
//             } else {
//                 vis.selectedArrows.add(d.leader);
//             }
//             vis.renderVis(); // Re-render to update styles
//         });      
// }


//   /**
//    * Create all of the different arrow heads.
//    * Styles: default, hover, highlight, highlight-selected
//    * To switch between these styles you can switch between the CSS class.
//    * We populated an example css class with how to use the marker-end attribute.
//    * See link for more info.
//    * https://observablehq.com/@stvkas/interacting-with-marker-ends
//    */
//   createMarkerEnds() {
//     let vis = this;
//     // Default arrow head
//     // id: arrow-head
//     vis.chart.append('defs').append('marker')
//       .attr('id', 'arrow-head')
//       .attr('markerUnits', 'strokeWidth')
//       .attr('refX', '2')
//       .attr('refY', '2')
//       .attr('markerWidth', '10')
//       .attr('markerHeight', '10')
//       .attr('orient', 'auto')
//       .append('path')
//       .attr('d', 'M0,0 L2,2 L 0,4')
//       .attr('stroke', '#ddd')
//       .attr('fill', 'none');

//     // Hovered arrow head
//     // id: arrow-head-hovered
//     vis.chart.append('defs').append('marker')
//       .attr('id', 'arrow-head-hovered')
//       .attr('markerUnits', 'strokeWidth')
//       .attr('refX', '2')
//       .attr('refY', '2')
//       .attr('markerWidth', '10')
//       .attr('markerHeight', '10')
//       .attr('orient', 'auto')
//       .append('path')
//       .attr('d', 'M0,0 L2,2 L 0,4')
//       .attr('stroke', '#888')
//       .attr('fill', 'none');

//     // Highlight arrow head
//     // id: arrow-head-highlighted
//     vis.chart.append('defs').append('marker')
//       .attr('id', 'arrow-head-highlighted')
//       .attr('markerUnits', 'strokeWidth')
//       .attr('refX', '2')
//       .attr('refY', '2')
//       .attr('markerWidth', '10')
//       .attr('markerHeight', '10')
//       .attr('orient', 'auto')
//       .append('path')
//       .attr('d', 'M0,0 L2,2 L 0,4')
//       .attr('stroke', '#aeaeca')
//       .attr('fill', 'none');

//     // Highlighted-selected arrow head
//     // id: arrow-head-highlighted-selected
//     vis.chart.append('defs').append('marker')
//       .attr('id', 'arrow-head-highlighted-selected')
//       .attr('markerUnits', 'strokeWidth')
//       .attr('refX', '2')
//       .attr('refY', '2')
//       .attr('markerWidth', '10')
//       .attr('markerHeight', '10')
//       .attr('orient', 'auto')
//       .append('path')
//       .attr('d', 'M0,0 L2,2 L 0,4')
//       .attr('stroke', '#e89f03')
//       .attr('fill', 'none');
//   }
// }