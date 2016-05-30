"use strict";


class FilterManager {
    // process the condensed database data
    _loadData(data) {
        const properties = ['date', 'location', 'address', 'neighborhood', 'post', 'district', 'crimeCode', 'crimeType', 'weapon'].sort();
        data = data.split('\n');
        data.pop();

        const numEntries = data.length / properties.length;

        if (numEntries % 1 !== 0) {
            throw new Error('invalid data');
        }

        const entries = [];

        for (let i = 0; i < data.length - 1;) {
            const entry = {};

            for (const property of properties) {
                entry[property] = data[i++];

                if (property === 'date') {
                    entry[property] = new Date(Number(entry[property]));
                } else if (property === 'location') {
                    if (entry[property] === 'None') {
                        entry[property] = null;
                        continue;
                    }

                    entry[property] = entry[property].split(' ').map(x => Number(x));
                    entry[property] = {latitude: entry[property][0], longitude: entry[property][1]};
                } else if (property === 'post') {
                    if (entry[property] === 'None') {
                        entry[property] = null;
                    } else {
                        entry[property] = Number(entry[property]);
                    }
                }
            }

            entries.push(entry);
        }

        this.m_crossfilter = crossfilter(entries);
        this.m_dimensions = {};

        for (const property of ['neighborhood', 'district', 'crimeType', 'weapon', 'date']) {
            this.m_dimensions[property] = this.m_crossfilter.dimension(function (property, entry) {
                return entry[property];
            }.bind(this, property));
        }

        this.m_histogramDimension = this.m_crossfilter.dimension(entry => entry.date.getFullYear() * 1e4 + entry.date.getMonth() * 1e2 + entry.date.getDay());

        this.m_ready = true;
        g_histogram.setLoadingStatus(false);

        for (const entry of this.m_callbackQueue) {
            this.getDistinct(entry[0], entry[1]);
        }

        delete this.m_callbackQueue;
    }


    constructor() {
        this.m_ready = false;
        this.m_callbackQueue = [];
        jQuery.get('database.dat', undefined, this._loadData.bind(this), 'text');
    }


    getDistinct(property, callback) {
        if (this.m_ready !== true) {
            // defer until we're ready
            this.m_callbackQueue.push([property, callback]);
        } else {
            callback(this.m_dimensions[property].group().all().map(x => x.key));
        }
    }


    draw(query) {
        this.m_histogramDimension.filterAll();

        for (const property of Object.keys(query)) {
            if (property === 'date') {
                this.m_dimensions[property].filter(function (query, value) {return value.getTime() >= query['$gte'].getTime() && value.getTime() <= query['$lte'].getTime()}.bind(this, query[property]));
            } else {
                this.m_dimensions[property].filter(function (query, value) {return query.indexOf(value) !== -1;}.bind(this, query[property]));
            }
        }

        const entries = this.m_dimensions[Object.keys(this.m_dimensions)[0]].top(1e10);

        // it is unnecessary to use every data point when generating the heatmap (same visual appearance with random sample)
        // speeds up performance in large data selections and will not be noticeable by the user;
        // markers will still be created if the user clicks an entry in the tabular view
        const maxHeatmapPoints = 3000;
        const heatmapPoints = _.sample(entries, maxHeatmapPoints);
        g_map.draw(heatmapPoints);

        g_charts.draw(entries);

        this.m_dimensions.date.filterAll();
        const histogramGroups = this.m_histogramDimension.group().all().map(x => [x.key, x.value]);
        histogramGroups.sort((a, b) => a[0] - b[0]);
        g_histogram.draw(histogramGroups);
    }
}


let g_filter;


document.addEventListener('DOMContentLoaded', function () {
    g_filter = new FilterManager();

});
