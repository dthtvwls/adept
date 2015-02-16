$(function () {
  'use strict';

  /*
   * Show a spinner while data loads
   */
  $('body').spin();
  $.getJSON('/raw.json', function (data) {
    $('body').spin(false);

    /*
     * Use first row of JSON data to determine column name and type
     */
    var parameters = Object.keys(data[0]).map(function (key) {
      var obj = typeof data[0][key] == 'number' ? {
        type: 'number',
        operators: ['=', '≠', '<', '>', '≤', '≥']
      } : {
        operators: ['=', '≠']
      };

      obj.key = key;
      obj.category = 'parameters';
      obj.placeholder = '';

      return obj;
    });


    /*
     * Set up grid and data view
     */
    var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
    var dataView = new Slick.Data.DataView({
      groupItemMetadataProvider: groupItemMetadataProvider,
      inlineFilters: true
    });

    var grid = new Slick.Grid('#myGrid', dataView, parameters.map(function (i) {
      return {
        id: i.key,
        name: i.key,
        field: i.key,
        sortable: true,
        groupTotalsFormatter: function (totals, columnDef) {
          var val = totals.avg && totals.avg[columnDef.field];
          return val != null ? Math.round(val) : '';
        }
      };
    }), {
      enableColumnReorder: true,
      forceFitColumns: true,
      multiColumnSort: true,
      syncColumnCellResize: true
    });

    grid.registerPlugin(groupItemMetadataProvider);
    grid.setSelectionModel(new Slick.CellSelectionModel());


    /*
     * Update the grid when the data view changes
     */
    dataView.onRowCountChanged.subscribe(function (e, args) {
      grid.updateRowCount();
      grid.render();
    });
    dataView.onRowsChanged.subscribe(function (e, args) {
      grid.invalidateRows(args.rows);
      grid.render();
    });

    /*
     * Set the data view to the data
     * This is not a binding and must be repeated when data is updated
     * e.g. after a sort or filter
     */
    dataView.setItems(data);

    /*
     * Sort data by multiple keys
     */
    grid.onSort.subscribe(function (e, args) {
      var cols = args.sortCols;
      dataView.sort(function (dataRow1, dataRow2) {
        for (var i = 0, l = cols.length; i < l; i++) {

          var value1 = dataRow1[cols[i].sortCol.field],
              value2 = dataRow2[cols[i].sortCol.field],
              result = (value1 == value2 ? 0 : value1 > value2 ? 1 : -1) * (cols[i].sortAsc ? 1 : -1);

          if (result != 0) return result;
        }
        return 0;
      });
    });

    /*
     * Show the custom context menu on right click
     */
    grid.onContextMenu.subscribe(function (e) {
      e.preventDefault();
      $('#contextMenu').data('row', grid.getCellFromEvent(e).row).css('top', e.pageY).css('left', e.pageX).show();
      $('body').one('click', function () { $('#contextMenu').hide(); });
    });

    // create the dynamic chart element
    var $chart = $('<div id="chart"></div>');

    /*
     * Creates the scatter plot from the selected cells
     * Fired by the custom context menu
     */
    window.createChart = function () {
      var range = grid.getSelectionModel().getSelectedRanges()[0];
      var cols = grid.getColumns();
      var x = cols[range.fromCell].field;
      var y = cols[range.toCell].field;
      var chartData = [];
      var item;

      for (var i = range.fromRow; i <= range.toRow; i++) {
        item = grid.getDataItem(i);
        chartData.push({
          name: item['id'],
          data: [{ x: item[x], y: item[y] }]
        });
      }

      $.colorbox({ width: '100%', height: '100%', inline: true, href: $chart });

      $chart.highcharts({
        title: { text: null },
        yAxis: { title: null },
        legend: { enabled: false },
        credits: { enabled: false },
        chart: {
          type: 'scatter',
          zoomType: 'xy'
        },
        plotOptions: {
          scatter: {
            tooltip: {
              pointFormat: x + ': {point.x}<br>' + y + ': {point.y}'
            }
          }
        },
        series: chartData
      });
    };

    new VisualSearch({
      el: $('#VS-container'),
      placeholder: 'Filter by...',
      strict: true,
      parameters: parameters,
      prevConditions: '[]',
      search: function (conditions) {
        // this event gets fired a lot and filtering 1M+ rows is not cheap,
        // so make sure this is actually a fresh query
        if (this.prevConditions != conditions) {
          this.prevConditions = conditions;
          conditions = JSON.parse(conditions);

          dataView.setItems(data.filter(function (el) {
            for (var i = 0; i < conditions.length; i++) {
              switch (conditions[i].operator) {
                case '=':
                  if (el[conditions[i].key] != conditions[i].value) return false;
                  break;
                case '≠':
                  if (el[conditions[i].key] == conditions[i].value) return false;
                  break;
                case '<':
                  if (el[conditions[i].key] >= conditions[i].value) return false;
                  break;
                case '>':
                  if (el[conditions[i].key] <= conditions[i].value) return false;
                  break;
                case '≤':
                  if (el[conditions[i].key] > conditions[i].value) return false;
                  break;
                case '≥':
                  if (el[conditions[i].key] < conditions[i].value) return false;
                  break;
              }
            }
            return true;
          }));
        }
      }
    });

    /*
     * Applies grouping to the data view from our select group
     */
    $('#select-group').append(parameters.filter(function (item) {
      return item.type != 'number';
    }).map(function (item) {
      return $('<option value="'+item.key+'">'+item.key+'</option>');
    })).selectize().change(function () {
      dataView.setGrouping(($(this).val() || []).map(function (i) {
        return {
          getter: i,
          aggregateCollapsed: true,
          collapsed: true,
          lazyTotalsCalculation: true,
          formatter: function (g) {
            return g.value + ' (' + g.count + ')';
          },
          aggregators: parameters.filter(function (item) {
            return item.type == 'number';
          }).map(function (item) {
            return new Slick.Data.Aggregators.Avg(item.key);
          })
        };
      }));
    });

    /*
     * Dynamically adjust grid height
     */
    var resize = function () {
      $('#myGrid').css('height', $(window).height() - $('.selectize-control.custom-select').height());
    };
    resize();
    $(window).resize(resize);

  });
});
