import React from "react";
import Plotly from "plotly.js";

var _ = require("lodash");
var classNames = require("classnames");

var randomId = function() {
  return "MY" + (Math.random() * 1e32).toString(12);
};

var randomColorGenerator = function() {
  return "#" + (Math.random().toString(16) + "0000000").slice(2, 8);
};

//****************************************
//
//    Common graph containers
//
//****************************************
class PlotlyGraphBox extends React.Component {
  constructor(props) {
    super(props);

    //binding
    this._makeViz = this._makeViz.bind(this);
    this._updateGraphData = this._updateGraphData.bind(this);
    this._mapChartType = this._mapChartType.bind(this);
  }

  _makeViz() {
    // Reformat query data to datatable consumable forms.
    var data = this._updateGraphData(this.props.unifiedData);
    var type = this._mapChartType(this.props.graphType);
    var id = this.props.containerId;

    // Cleanse data, Plotly builds some details, such as
    // chart type, in each data point.
    var dataWithType = data.series.map(function(d) {
      d.type = type;
      switch (type) {
        case "scatter":
          d.mode = "lines+markers";
          break;
      }
      return d;
    });

    // Chart options
    var options = {
      displaylogo: false,
      displayModBar: true,
      xaxis: {
        title: "Year",
        showexponent: "All",
        tickangle: 45,
        autotick: true,
      },
      yaxis: {
        title: "Value",
      },
    };
    if (type == "bar" && dataWithType.length > 1) {
      options.barmode = "group";
    }

    // Render chart
    this.containerId = id;
    this.chart = Plotly.newPlot(id, dataWithType, options);
  }

  _mapChartType(askingType) {
    // Map container box GraphType state values to proper chart types
    switch (askingType) {
      case "line":
        return "scatter";
      default:
        return askingType;
    }
  }

  _updateGraphData(data) {
    // data: is a 2D array, [[1970, val 1, val 2,..], [1971, val3, val 4],...]
    // First transpose this matrix so the now it becomes
    // [[1970, 1971, ...], [val1, val3, ....]]
    var transposed = _.zip.apply(_, data.datatable);
    var formattedData = data.categories.map(function(country, index) {
      return {
        name: country,
        y: transposed[index + 1],
        x: transposed[0],
      };
    });

    return {
      categories: data.categories,
      series: formattedData,
    };
  }

  componentDidMount() {
    // Initialize graph
    this._makeViz();

    // Set up data updater
    var that = this;
    this.debounceUpdate = _.debounce(function(data) {
      that._makeViz();
    }, 1000);

    // Set up graph type updater
    this.debounceGraphTypeUpdate = _.debounce(function(type) {
      that._makeViz();
    }, 500);
  }

  componentWillUnmount() {
    if (this.chart != "undefined" && this.chart != null) {
      Plotly.purge(this.containerId);
    }
  }

  render() {
    // If data changed
    var currentValue = this.props.data != null && this.props.data.length;
    if (currentValue != null && this.preValue !== currentValue) {
      this.preValue = currentValue;

      // Update graph data
      if (this.chart && this.debounceUpdate) {
        this.debounceUpdate(this.props.data);
      }
    }

    // If type changed
    var currentType = this.props.graphType && this.props.graphType.valueOf();
    if (currentType != null && this.preType !== currentType) {
      this.preType = currentType;

      // Update graph data
      if (this.chart && this.debounceGraphTypeUpdate) {
        this.debounceGraphTypeUpdate(this.props.graphType);
      }
    }

    // Render
    return (
      <div>
        <figure>
          <figcaption>{this.props.title}</figcaption>
          <div id={this.props.containerId} style={{minHeight: "500px"}} />
        </figure>
      </div>
    );
  }
}

export default PlotlyGraphBox;
