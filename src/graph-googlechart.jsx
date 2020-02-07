import React from "react";

var _ = require("lodash");
var classNames = require("classnames");
//import WayPoint from 'react-waypoint';

var randomId = function() {
  return "MY" + (Math.random() * 1e32).toString(12);
};

//****************************************
//
//    Common graph containers
//
//****************************************
class GoogleGraphBox extends React.Component {
  constructor(props) {
    super(props);

    //binding
    this._makeViz = this._makeViz.bind(this);
    this._updateGraphData = this._updateGraphData.bind(this);
    this._mapChartType = this._mapChartType.bind(this);
  }

  _makeViz() {
    // Reformat query data to datatable consumable forms.
    var data = this._updateGraphData(this.props.data);

    // Chart options
    var options = {
      title: this.props.title,
      subtitle: this.props.footer,
      legend: "bottom",
      width: "100%",
      height: 500,
      backgroundColor: "transparent", // Must have!
      chartArea: {
        width: "100%",
        height: "80%",
      },
      animation: {
        startup: true,
        duration: 1000,
        easing: "out",
      },
      explorer: {
        axis: "horizontal",
      },
      hAxis: {
        title: "Year",
        slantedTextAngle: 45,
        slantedText: true,
        textStyle: {
          fontSize: 8,
        },
      },
      pointSize: 1,
      legend: {
        alignment: "end",
      },
    };

    // Render chart
    this.chart = new google.visualization.ChartWrapper({
      chartType: this._mapChartType(),
      dataTable: this._updateGraphData(this.props.data),
      options: options,
      containerId: this.props.containerId,
    });
    this.chart.draw();
  }

  _mapChartType() {
    // Map container box GraphType state values to Google chart types
    switch (this.props.graphType) {
      case "bar":
        return "ColumnChart";
      case "line":
        return "LineChart";
    }
  }

  _updateGraphData(data) {
    // Return a new Google Datatable
    var d = d3
      .nest()
      .key(function(d) {
        return d.year;
      })
      .key(function(d) {
        return d.category;
      })
      .entries(data);

    // Get all categories. This is necessary so we can handle
    // missing values. Otherwise, there will be row
    // that has less values than the number of columns.
    var categories = _.keys(
      _.countBy(data, function(item) {
        return item.category;
      }),
    );

    // Convert format from a flat two-dimension array
    // to a table with columns: year, category 1, category 2, ...
    var datatable = new Array();
    _.forEach(d, function(byYear) {
      var year = byYear.key;
      var values = [];

      var byCategory = _.groupBy(byYear.values, function(item) {
        return item.key;
      });

      _.forEach(categories, function(cat) {
        if (byCategory.hasOwnProperty(cat)) {
          _.forEach(byCategory[cat], function(item) {
            _.forEach(item.values, function(val) {
              values.push(val.value);
            });
          });
        } else {
          values.push(null);
        }
      });
      datatable.push(_.flatten([year, values]));
    });

    // Convert formatted data to google DataTable
    categories.unshift("Year");
    var formattedData = {
      categories: categories,
      datatable: datatable,
    };

    // Create a new data table
    var myDataTable = new google.visualization.DataTable();

    // Data table headers
    _.forEach(formattedData.categories, function(cat) {
      if (cat == "Year") {
        myDataTable.addColumn("string", cat);
      } else {
        myDataTable.addColumn("number", cat);
      }
    });

    // Data table data
    myDataTable.addRows(formattedData.datatable);

    return myDataTable;
  }

  componentDidMount() {
    // Initialize graph
    google.charts.load("current", {
      packages: ["corechart"],
    });
    google.charts.setOnLoadCallback(this._makeViz);

    // Set up data updater
    var that = this;
    this.debounceUpdate = _.debounce(function(data) {
      var datatable = that._updateGraphData(data);
      that.chart.setDataTable(datatable);
      that.chart.draw();
    }, 1000);

    // Set up graph type updater
    this.debounceGraphTypeUpdate = _.debounce(function(type) {
      that.chart.setChartType(that._mapChartType(type));
      that.chart.draw();
    }, 500);
  }

  componentWillUnmount() {
    this.chart = null;
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
        <figure id={this.props.containerId} style={{minHeight: "500px"}}>
          <figcaption>{this.props.title}</figcaption>
        </figure>
      </div>
    );
  }
}

export default GoogleGraphBox;
