"use strict";


// abstract base class for the charts rendered in this app.
// a member function `_updateEntries(entries)` must be present.
// the draw() function may be overridden.
class Chart {
    constructor(containerId) {
        this.m_table = new google.visualization.DataTable();
        this.m_chart = new google.visualization.ChartWrapper(
                {containerId: containerId, dataTable: this.m_table});
    }


    draw(entries) {
        this.m_table.removeRows(0, this.m_table.getNumberOfRows());
        this._updateEntries(entries);
        this.m_chart.draw();
    }
}


class TableChart extends Chart {
    constructor(containerId, properties, updateCallback) {
        super(containerId);

        this.m_properties = properties;
        this.m_updateCallback = updateCallback;

        this.m_chart.setChartType('Table');
        this.m_chart.setOptions({showRowNumber: true, width: '90%', height: '580px',
            pageSize: 100, pagingSymbols: {prev: 'prev', next: 'next'}});  

        for (const entry of properties) {
            this.m_table.addColumn(entry[0], entry[1]);
        }
    }


    _updateEntries(entries) {
        for (const entry of entries) {
            const row = [];

            for (const property of this.m_properties) {
                row.push(entry[property[2]]);
            }

            this.m_table.addRow(row);
        }

        if (this.m_updateCallback !== undefined) {
            this.m_updateCallback(this.m_table, entries);
        }
    }
}


class OccurrencesChart extends Chart {
    // returns an associative array with entries of the form
    // `propertyName: numOccurrences`
    static _tallyProperties(entries, property) {
        const result = {};

        for (const entry of entries) {
            result[entry[property]] = (result[entry[property]] || 0) + 1;
        }

        return result;
    }


    constructor(containerId, type, property, title) {
        super(containerId);

        this.m_property = property;

        this.m_chart.setChartType(type);
        this.m_table.addColumn('string', this.m_property);
        this.m_table.addColumn('number', 'Occurrences');

        this.m_chart.setOptions({title: title, width: 1200, height: 600, is3D: true, hAxis: {slantedText: true}});
    }


    _updateEntries(entries) {
        const tally = OccurrencesChart._tallyProperties(entries, this.m_property);

        for (const entry of Object.keys(tally).sort()) {
            this.m_table.addRow([entry, tally[entry]]);
        }

    }
}


// similar to OccurrencesChart, but group entries by their `date` property
// using one of several grouping modes
class DateChart extends Chart {
    // get the names of each group under `mode`
    static _getGroupTypes(mode) {
        switch (mode) {
            case 'daily':
                return ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];

            case 'hourly':
                const result = [];

                for (const period of ['AM', 'PM']) {
                    result.push(12 + period);

                    for (let i = 1; i < 12; ++i) {
                        result.push(i + period);
                    }
                }

                return result;

            default:
                throw new Error('unknown mode');
        }
    }


    // get the group for `date` under `mode`
    static _getGroup(date, mode) {
        switch (mode) {
            case 'daily':
                return DateChart._getGroupTypes(mode)[date.getDay()];

            case 'hourly':
                return DateChart._getGroupTypes(mode)[date.getHours()];

            default:
                throw new Error('unknown mode');
        }
    }


    constructor(containerId, property, mode, title) {
        super(containerId);

        this.m_property = property;
        this.m_mode = mode;

        this.m_chart.setOptions({title: title, width: 1200, height: 600, is3D: true}); 
    }


    _updateEntries(entries) {
        const groups = DateChart._getGroupTypes(this.m_mode);
        const propertyValues = [];

        for (let i = 1; i < this.m_table.getNumberOfColumns(); ++i) {
            propertyValues.push(this.m_table.getColumnLabel(i));
        }

        const counts = {};

        for (const group of groups) {
            counts[group] = {};

            for (const propertyValue of propertyValues) {
                counts[group][propertyValue] = 0;
            }
        }

        for (const entry of entries) {
            ++counts[DateChart._getGroup(entry.date, this.m_mode)][entry[this.m_property]];
        }

        for (const group of groups) {
            const row = [group];

            for (const propertyValue of propertyValues) {
                row.push(counts[group][propertyValue]);
            }

            this.m_table.addRow(row);
        }
    }


    draw(entries) {
        g_filter.getDistinct(this.m_property, function (entries, callback, propertyValues) {
            this.m_table.removeColumns(0, this.m_table.getNumberOfColumns());
            this.m_table.addColumn('string', 'Date');

            for (const propertyValue of propertyValues) {
                this.m_table.addColumn('number', propertyValue);
            }

            if (this.m_table.getNumberOfColumns() < 10) {
                // SteppedAreaChart is more appropriate with few columns
                this.m_chart.setChartType('SteppedAreaChart');
                this.m_chart.setOption('hAxis', {showTextEvery: 1, textStyle:{fontSize: 12}});
            } else {
                this.m_chart.setChartType('LineChart');
                this.m_chart.setOption('curveType', 'function');
                this.m_chart.setOption('hAxis', {slantedText: true, showTextEvery: 1, textStyle:{fontSize: 12}}); 
            }

            callback(entries);
        }.bind(this, entries, super.draw.bind(this)));
    }
}


// return the index of the first column with the specified label
function getColumnByLabel(table, label) {
    for (let i = 0; i < table.getNumberOfColumns(); ++i) {
        if (table.getColumnLabel(i) === label) {
            return i;
        }
    }

    throw new Error('column does not exist');
}


// slider histogram chart
class SliderChart extends Chart {
    constructor(containerId, type, property, title) {
        super(containerId);

        this.m_property = property;

        this.m_chart.setChartType(type);
        this.m_table.addColumn('string', this.m_property);
        this.m_table.addColumn('number', 'Occurrences');

        this.m_chart.setOptions({title: title, height: 60, is3D: false, hAxis: {slantedText: true}, legend: {position: 'none'}, vAxis:{textPosition:'none'} });
        this.setLoadingStatus(true);
    }


    _updateEntries(entries) {
        for (const entry of entries) {
            this.m_table.addRow([String(entry[0]), entry[1]]);
        }
    }


    setLoadingStatus(loading) {
        let label = 'Ready.';

        if (loading) {
            label = 'Loading (data will be cached after first visit)...';
        }

        document.getElementById(this.m_chart.getContainerId()).innerHTML = '<center>' + label + '</center>';
    }
}


// handles creating and updating the charts
class ChartManager {
    constructor() {
        this.m_charts = [];

        this.m_charts.push(new OccurrencesChart('crimeTypeChart', 'PieChart', 'crimeType', 'Crime Types'));
        this.m_charts.push(new OccurrencesChart('weaponChart', 'PieChart', 'weapon', 'Weapons'));
        this.m_charts.push(new OccurrencesChart('districtChart', 'ColumnChart', 'district', 'Districts'));
        this.m_charts.push(new OccurrencesChart('neighborhoodChart', 'ColumnChart', 'neighborhood', 'Neighborhoods'));
        this.m_charts.push(new DateChart('crimeTypeDateChart', 'crimeType', 'daily', 'Crime Type vs Date'));
        this.m_charts.push(new DateChart('weaponTypeDateChart', 'weapon', 'hourly', 'Weapon Type vs Time of Day')); 
        this.m_charts.push(ChartManager._createTableChart());
    }


    static _createTableChart() {
        const columns = [
            ['date', 'Date', 'date'],
        ['string', 'Code', 'crimeCode'],
        ['string', 'Type', 'crimeType'],
        ['string', 'Weapon', 'weapon'],
        ['string', 'District', 'district'],
        ['number', 'Post', 'post'],
        ['string', 'Address', 'address'],
        ['string', 'Location', 'location']
            ];

        const tableChart = new TableChart('tableChart', columns,
                function (table, entries) {
                    const dateFormatter = new google.visualization.DateFormat({formatType: 'short'});
                    dateFormatter.format(table, getColumnByLabel(table, 'Date'));

                    const locationColumn = getColumnByLabel(table, 'Location');

                    entries.forEach(function (table, entry, index) {
                        if (entry.location !== null) {
                            table.setValue(index, locationColumn, entry.location.latitude + ' ' + entry.location.longitude);
                        }
                    }.bind(this, table));
                });

        const dataView = new google.visualization.DataView(tableChart.m_table);
        dataView.hideColumns([getColumnByLabel(tableChart.m_table, 'Location')]);
        tableChart.m_chart.setView(dataView.toJSON());

        google.visualization.events.addListener(tableChart.m_chart, 'select', function () {
            const row = this.m_chart.getChart().getSelection()[0].row;
            const column = getColumnByLabel(tableChart.m_table, 'Location');
            const selectedValue = this.m_table.getValue(row, column);
            const location = selectedValue.split(' ');

            if (location[0].length !== 0) {
                const date = this.m_table.getValue(row, getColumnByLabel(this.m_table, 'Date'));
                const crimeType = this.m_table.getValue(row, getColumnByLabel(this.m_table, 'Type'));
                const address = this.m_table.getValue(row, getColumnByLabel(this.m_table, 'Address'));
                g_map.zoomEntry(location, date, crimeType, address);
            }
        }.bind(tableChart));

        return tableChart;
    }


    draw(entries) {
        for (const entry of this.m_charts) {
            entry.draw(entries);
        }
    }
}


let g_charts;
let g_histogram;


google.charts.load('current', {packages: ['corechart', 'table', 'controls']});
google.charts.setOnLoadCallback(function () {
    g_charts = new ChartManager();
    g_histogram = new SliderChart('histogram', 'ColumnChart', 'neighborhood', '');
});
