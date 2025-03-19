class ScatterPlot {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 500,
      containerHeight: 300,
      margin: { top: 40, right: 40, bottom: 50, left: 50 },
      tooltipPadding: 10,
    };

    this.data = _data;
    this.selectedPoints = new Set(); // Track selected points
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate chart dimensions
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Create SVG
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("id", "scatter-plot")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Initialize scales
    vis.xScale = d3.scaleLinear().range([0, vis.width]);
    vis.yScale = d3.scaleLinear().domain([25, 95]).range([vis.height, 0]); // Static y-axis

    // Create axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append axes
    vis.xAxisGroup = vis.chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${vis.height})`);

    vis.yAxisGroup = vis.chart.append("g").attr("class", "y-axis");

    // Axis labels
    vis.chart
      .append("text")
      .attr("class", "axis-label")
      .attr("x", vis.width)
      .attr("y", vis.height + 40)
      .attr("text-anchor", "end")
      .style("font-weight", "bold")

      .text("GDP per Capita (US$)");

    vis.chart
      .append("text")
      .attr("class", "axis-label")
      .attr("x", -vis.config.margin.left + 5)
      .attr("y", -10)
      .style("font-weight", "bold")
      .text("Age");

    // Initialize tooltip
    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // Filter data to only include points where GDP per capita is known
    vis.filteredData = vis.data.filter((d) => d.pcgdp !== null);

    // Update x-scale domain dynamically
    vis.xScale.domain([0, d3.max(vis.filteredData, (d) => d.pcgdp) || 1]);

    vis.renderVis();
  }

  // update opacity helper
  updateOpacity() {
    let vis = this;

    let activeGenders = barChart.genderFilter;
    let hasFilter = activeGenders.length > 0;

    // set the opacity to 0.7 for active and 0.15 for inactive points.
    vis.chart
      .selectAll(".point")
      .transition()
      .duration(300)
      .style("opacity", (d) => {
        if (!hasFilter) return 1;
        return activeGenders.includes(d.gender) ? 0.7 : 0.15;
      })
      .style("pointer-events", (d) => {
        if (!hasFilter) return "auto";
        return activeGenders.includes(d.gender) ? "auto" : "none";
      });
  }

  renderVis() {
    let vis = this;

    // remove prev lines
    vis.chart.selectAll(".grid").remove();

    // ** Append Y-axis gridlines **
    vis.gridGroup = vis.chart
      .append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0,0)") // Remove any offset
      .call(
        d3
          .axisLeft(vis.yScale)
          //   .ticks(5) // Ensure it matches Y-axis ticks
          .tickSize(-vis.width) // Extend across chart
          .tickFormat("") // Hide labels
      );

    vis.gridGroup.lower(); // **Send grid to the very back**

    // Remove unwanted default Y-axis line
    vis.gridGroup.select(".domain").remove();

    vis.gridGroupX = vis.chart
      .append("g")
      .attr("class", "grid grid-x")
      .attr("transform", `translate(0, ${vis.height})`) // ✅ Aligns with X-axis
      .call(
        d3
          .axisBottom(vis.xScale)
          .tickSize(-vis.height) // Extend lines across the chart
          .tickFormat("") // Hide tick labels
      );

    // Send grid lines to the back
    vis.gridGroupX.lower();

    // Remove unwanted default x-axis line
    vis.gridGroupX.select(".domain").remove();

    // Style grid lines
    vis.gridGroupX
      .selectAll(".tick line")
      .attr("stroke", "#ddd") // Light grey
      .attr("stroke-width", 0.8);

    // Background rectangle to capture clicks outside of points
    vis.chart
      .selectAll(".background-rect")
      .data([null])
      .join("rect")
      .attr("class", "background-rect")
      .attr("width", vis.width)
      .attr("height", vis.height)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("click", function () {
        vis.selectedPoints.clear(); // Clear all selections
        vis.updateVis(); // Update scatter plot
        lexisChart.updateVis();
      });

    // Bind data to points
    const circles = vis.chart
      .selectAll(".point")
      .data(vis.filteredData, (d) => d.leader)
      .join("circle")
      .attr("class", "point")
      .attr("cx", (d) => vis.xScale(d.pcgdp))
      .attr("cy", (d) => vis.yScale(d.start_age))
      .attr("r", 5)

      .attr("fill", (d) =>
        vis.selectedPoints.has(d.leader) ? "#e89f03" : "#4f4f4f"
      )
      .style("cursor", "pointer")
      .style("fill-opacity", (d) =>
        vis.selectedPoints.has(d.leader) ? 0.95 : 0.7
      )

      // Hover: Outline and darken
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2);

        // **D3 Tooltip**
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY - vis.config.tooltipPadding + "px").html(`
                    <div><strong>${d.leader}</strong></div>
                    <div><i>${
                      d.country
                    }, ${d.start_year} - ${d.end_year}</i></div>
                    <div> • Age at Inaguration: ${d.start_age}</div>
                    <div> • Duration: ${d.duration} years</div>
                    <div> • GDP per capita: ${
                      d.pcgdp ? "$" + d.pcgdp : "N/A"
                    }</div>
                `);
      })

      .on("mouseout", function () {
        d3.select(this).attr("stroke", "none");
        vis.tooltip.style("opacity", 0);

        // Hide tooltip
        d3.select("#tooltip").style("display", "none");
      })

      .on("click", function (event, d) {
        // const isActive = vis.selectedPoints.has(d.leader);

        if (selectedPoints.has(d.leader)) {
          selectedPoints.delete(d.leader); // Deselect point
        } else {
          selectedPoints.add(d.leader); // Select point
        }

        updateSelections(); // Update Lexis and Scatter Plot
        // d3.select(this).classed('active', !isActive); // Add class to style active filters with CSS
      });
    // update opacity
    vis.updateOpacity();
    // Update axes
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);

    // Update axes (remove domain lines)
    vis.xAxisGroup.call(vis.xAxis).select(".domain").remove();
    vis.yAxisGroup.call(vis.yAxis).select(".domain").remove();
  }
}
