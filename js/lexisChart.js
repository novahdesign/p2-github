class LexisChart {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 380,
      margin: { top: 15, right: 10, bottom: 20, left: 23 },
      tooltipPadding: 15,
    };

    this.data = _data;
    this.selectedPoints = new Set(); // Track selected arrows
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

    // Create SVG element
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.chartArea = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Apply clipping mask
    vis.chart = vis.chartArea.append("g").attr("clip-path", "url(#chart-mask)");

    // Initialize scales
    vis.xScale = d3.scaleLinear().domain([1950, 2021]).range([0, vis.width]);
    vis.yScale = d3.scaleLinear().domain([25, 95]).range([vis.height, 0]);

    // Create axes
    vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d3.format("d"));
    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .tickValues(d3.range(40, 100, 10))
      .tickFormat(d3.format("d"));

    // Append axes
    vis.xAxisGroup = vis.chartArea
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${vis.height})`);

    vis.yAxisGroup = vis.chartArea.append("g").attr("class", "y-axis");

    // Remove axis lines
    vis.xAxisGroup.selectAll(".domain, .tick line").remove();
    vis.yAxisGroup.selectAll(".domain, .tick line").remove();

    // Axis labels
    vis.chartArea
      .append("text")
      .attr("x", -vis.config.margin.left + 5)
      .attr("y", 2)
      .attr("class", "axis-label")
      .attr("font-size", 15)
      .attr("font-weight", "bold")
      .text("Age");

    vis.chartArea
      .append("text")
      .attr("x", vis.width)
      .attr("y", vis.height + 35)
      .attr("text-anchor", "end")
      .attr("class", "axis-label")
      .text("Year");

    // Initialize tooltips
    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    vis.chart
      .append("defs")
      .append("clipPath")
      .attr("id", "chart-mask")
      .append("rect")
      .attr("width", vis.width + 2) // Clipping width
      .attr("height", vis.height); // Clipping height

    // Apply the mask to the group containing arrows
    vis.chartArea = vis.chart.append("g").attr("clip-path", "url(#chart-mask)");
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
    vis.filteredData = vis.data.filter((d) => +d.duration > 0);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Update axes
    vis.xAxisGroup.call(vis.xAxis).selectAll(".domain").remove();
    vis.yAxisGroup.call(vis.yAxis).selectAll(".domain").remove();

    // Bind data to arrows
    vis.chartArea
      .selectAll(".arrow")
      .data(vis.filteredData, (d) => d.leader)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "arrow")
            .attr("x1", (d) => vis.xScale(d.start_year))
            .attr("x2", (d) => vis.xScale(d.end_year))
            .attr("y1", (d) => vis.yScale(d.start_age))
            .attr("y2", (d) => vis.yScale(d.end_age))
            .attr("stroke", (d) => vis.getArrowColor(d))
            .attr("stroke-width", (d) => vis.getArrowWidth(d))
            .attr("marker-end", (d) => vis.getArrowMarker(d))
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
              d3.select(this)
                .attr("stroke", "#888")
                .attr("stroke-width", 4)
                .attr("marker-end", "url(#arrow-head-hovered)");

              d3
                .select("#tooltip")
                .style("display", "block")
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY + 10 + "px").html(`
                            <div><strong>${d.leader}</strong></div>
                            <div><i>${
                              d.country
                            }, ${d.start_year} - ${d.end_year}</i></div>
                            <div> • Age at Inaguration: ${d.start_age}</div>
                            <div> • Duration: ${d.duration} years</div>
                                                <div> • GDP per capita: ${
                                                  d.pcgdp
                                                    ? "$" + Math.round(d.pcgdp)
                                                    : "N/A"
                                                }</div>

                        `);
            })
            .on("mouseout", function () {
              d3.select(this)
                .attr("stroke", (d) => vis.getArrowColor(d))
                .attr("stroke-width", (d) => vis.getArrowWidth(d))
                .attr("marker-end", (d) => vis.getArrowMarker(d));

              d3.select("#tooltip").style("display", "none");
            })
            .on("click", function (event, d) {
              vis.toggleSelection(d.leader);
              vis.renderVis(); // Re-render to update styles
            }),
        (update) =>
          update
            .attr("stroke", (d) => vis.getArrowColor(d))
            .attr("stroke-width", (d) => vis.getArrowWidth(d))
            .attr("marker-end", (d) => vis.getArrowMarker(d))
      );

    // Bind data to text labels (politician names)
    vis.chartArea
      .selectAll(".arrow-label")
      .data(vis.filteredData, (d) => d.leader)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "arrow-label")
            .attr("x", (d) => vis.xScale(d.start_year))
            .attr("y", (d) => vis.yScale(d.start_age) - 5)
            .attr("text-anchor", "start")
            .attr("font-size", "10px")
            .attr("fill", (d) => vis.getLabelColor(d))
            .attr("opacity", (d) => (vis.shouldShowLabel(d) ? 1 : 0))
            .text((d) => d.leader)
            .attr(
              "transform",
              (d) =>
                `rotate(-20, ${vis.xScale(d.start_year)}, ${vis.yScale(
                  d.start_age
                )})`
            ),
        (update) =>
          update
            .attr("x", (d) => vis.xScale(d.start_year))
            .attr("y", (d) => vis.yScale(d.start_age) - 5)
            .attr("opacity", (d) => (vis.shouldShowLabel(d) ? 1 : 0))
            .attr(
              "transform",
              (d) =>
                `rotate(-20, ${vis.xScale(d.start_year)}, ${vis.yScale(
                  d.start_age
                )})`
            )
      );
  }

  getArrowColor(d) {
    return this.selectedPoints.has(d.leader)
      ? "#e89f03"
      : d.label === 1
      ? "#aeaeca"
      : "#ddd";
  }

  getArrowWidth(d) {
    return this.selectedPoints.has(d.leader) ? 4 : d.label === 1 ? 3 : 2;
  }

  shouldShowLabel(d) {
    return d.label === 1 || this.selectedPoints.has(d.leader);
  }

  getLabelColor(d) {
    // black label for all selected TEXT
    return "#444";
  }

  getArrowMarker(d) {
    if (this.selectedPoints.has(d.leader))
      return "url(#arrow-head-highlighted-selected)";
    if (d.label === 1) return "url(#arrow-head-highlighted)";
    return "url(#arrow-head)";
  }

  toggleSelection(leader) {
    if (this.selectedPoints.has(leader)) {
      this.selectedPoints.delete(leader);
      scatterPlot.updateVis();
    } else {
      this.selectedPoints.add(leader);
      scatterPlot.updateVis();
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
    vis.chart
      .append("defs")
      .append("marker")
      .attr("id", "arrow-head")
      .attr("markerUnits", "strokeWidth")
      .attr("refX", "2")
      .attr("refY", "2")
      .attr("markerWidth", "10")
      .attr("markerHeight", "10")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L2,2 L 0,4")
      .attr("stroke", "#ddd")
      .attr("fill", "none");

    // Hovered arrow head
    // id: arrow-head-hovered
    vis.chart
      .append("defs")
      .append("marker")
      .attr("id", "arrow-head-hovered")
      .attr("markerUnits", "strokeWidth")
      .attr("refX", "2")
      .attr("refY", "2")
      .attr("markerWidth", "10")
      .attr("markerHeight", "10")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L2,2 L 0,4")
      .attr("stroke", "#888")
      .attr("fill", "none");

    // Highlight arrow head
    // id: arrow-head-highlighted
    vis.chart
      .append("defs")
      .append("marker")
      .attr("id", "arrow-head-highlighted")
      .attr("markerUnits", "strokeWidth")
      .attr("refX", "2")
      .attr("refY", "2")
      .attr("markerWidth", "10")
      .attr("markerHeight", "10")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L2,2 L 0,4")
      .attr("stroke", "#aeaeca")
      .attr("fill", "none");

    // Highlighted-selected arrow head
    // id: arrow-head-highlighted-selected
    vis.chart
      .append("defs")
      .append("marker")
      .attr("id", "arrow-head-highlighted-selected")
      .attr("markerUnits", "strokeWidth")
      .attr("refX", "2")
      .attr("refY", "2")
      .attr("markerWidth", "10")
      .attr("markerHeight", "10")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L2,2 L 0,4")
      .attr("stroke", "#e89f03")
      .attr("fill", "none");
  }
}
