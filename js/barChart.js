class BarChart {
  constructor(_config, _data) {
      this.config = {
          parentElement: _config.parentElement,
          containerWidth: 400,
          containerHeight: 300,
          margin: { top: 40, right: 20, bottom: 50, left: 50 },
          tooltipPadding: 10
      };

      this.data = _data;
      // this.selectedGender = null; // Track selected gender
      
      this.genderFilter = []; // Track selected gender filters

      this.initVis();
  }

  initVis() {
      let vis = this;

      // Calculate chart dimensions
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      // Create SVG element
      vis.svg = d3.select(vis.config.parentElement)
          .attr("id", "bar-chart")
          .attr("width", vis.config.containerWidth)
          .attr("height", vis.config.containerHeight);

      vis.chart = vis.svg.append("g")
          .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

      // Initialize scales
      vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.2);
      vis.yScale = d3.scaleLinear().range([vis.height, 0]);

      // Create axes
      vis.xAxis = d3.axisBottom(vis.xScale);
      vis.yAxis = d3.axisLeft(vis.yScale).ticks(5).tickFormat(d3.format("d"));

      // Append axes
      vis.xAxisGroup = vis.chart.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0, ${vis.height})`);

      vis.yAxisGroup = vis.chart.append("g")
          .attr("class", "y-axis");

      // Add gridlines
      vis.yAxisGroup.append("g")
          .attr("class", "grid")
          .call(d3.axisLeft(vis.yScale)
              .tickSize(-vis.width)
              .tickFormat("")
          );

      // Remove vertical gridlines
      vis.xAxisGroup.selectAll(".domain, .tick line").remove();

      // Axis labels
      vis.chart.append("text")
          .attr("class", "axis-label")
          .attr("x", -vis.config.margin.left)
          .attr("y", -10)
          .style("font-weight", "bold")
          .text("Gender");

      // Initialize tooltip
      vis.tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

      vis.updateVis();
  }

  updateVis() {
      let vis = this;

      // Group and count the number of politicians by gender
      let genderCounts = d3.rollups(
          vis.data,
          v => v.length,
          d => d.gender
      );

      vis.filteredData = genderCounts.map(([gender, count]) => ({
          gender,
          count
      }));

      // Update scales
      vis.xScale.domain(vis.filteredData.map(d => d.gender));
      vis.yScale.domain([0, d3.max(vis.filteredData, d => d.count) || 1]);

      vis.renderVis();
  }

  renderVis() {
      let vis = this;

      // Bind data to bars
      const bars = vis.chart.selectAll(".bar")
          .data(vis.filteredData, d => d.gender)
          .join("rect")
          .attr("class", "bar")
          .attr("x", d => vis.xScale(d.gender))
          .attr("width", vis.xScale.bandwidth())
          .attr("y", d => vis.yScale(d.count))
          .attr("height", d => vis.height - vis.yScale(d.count))
          .attr("fill", d => vis.selectedGender === d.gender ? "steelblue" : "#ccc")
          .style("cursor", "pointer")

          // Hover effect: outline bar
          // added tooltip counting number of politicians
          .on("mouseover", function (event, d) {
              d3.select(this)
                  .attr("stroke", "black")
                  .attr("stroke-width", 2);

                  d3.select("#tooltip")
                        .style("display", "block")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px")
                        .html(`
                          <strong>${d.gender}</strong>: ${d.count} politicians

                        `);
          })
          .on("mouseout", function () {
              d3.select(this).attr("stroke", "none");
              d3.select("#tooltip").style("display", "none");
            })

          
        // Click to filter by gender
        .on("click", function (event, d) {
          const isActive = vis.genderFilter.includes(d.gender);

          if (isActive) {
              // Remove filter (reset to show all)
              vis.genderFilter = [];
          } else {
              // Apply filter (show only selected gender)
              vis.genderFilter = [d.gender];
          }

          console.log(`Selected Genders: ${vis.genderFilter}`);

          // Update all views
          filterData();

          // Update bar style
          vis.chart.selectAll(".bar")
              .attr("fill", d => vis.genderFilter.includes(d.gender) ? "#555" : "#888");
      });

      // Update axes
      vis.xAxisGroup.call(vis.xAxis);
      vis.yAxisGroup.call(vis.yAxis);
  }
}
