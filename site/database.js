'use strict';


const misc = require('./misc');


function titleCase(str) {
    return str.split(' ').map(entry => entry.charAt(0).toUpperCase() + entry.substring(1).toLowerCase()).join(' ');
}


// fetch all paged data
function sodaFetchPages(soda, limit, offset, callback, finishedCallback) {
    console.log('fetching page...');

    soda.get({'$limit': limit, '$offset': offset}, function (error, ignore, data) {
        misc.throwOnError(error);

        if (data.length !== 0) {
            callback(data);
            console.log('fetched page ' + Math.floor(1 + offset / limit));
            sodaFetchPages(soda, limit, offset + limit, callback, finishedCallback);
        } else {
            finishedCallback();
            console.log('updated database from source');
        }
    });
}


class CrimeDB {
    constructor(path) {
        this.m_path = path;
        this.m_entries = [];
    }


    // process a JSON entry from SODA
    _addSodaEntry(sodaEntry) {
        const makeValue = x => titleCase(String(x || 'None'));

        const entry = {
            date: null,
            location: 'None',
            address: makeValue(sodaEntry.location),
            neighborhood: makeValue(sodaEntry.neighborhood),
            post: makeValue(sodaEntry.post),
            district: makeValue(sodaEntry.district),
            crimeCode: makeValue(sodaEntry.crimecode),
            crimeType: makeValue(sodaEntry.description),
            weapon: makeValue(sodaEntry.weapon)
        };

        if (entry.post.indexOf('.') !== -1) {
            // the source Socrata database contains some mistakes in the data records,
            // one of which is the occasional fractional post ID.
            // no way to infer what the intended value was, so make these null.
            entry.post = makeValue(null);
        }

        do {
            const dateString = sodaEntry.crimedate.split('T')[0].split('-');

            if (dateString.length !== 3) {
                misc.throwOnError('invalid crimedate');
            }

            let timeString = [];

            if (sodaEntry.crimetime.indexOf(':') !== -1) {
                timeString = sodaEntry.crimetime.split(':');
            } else if (sodaEntry.crimetime.length === 4) {
                // among the occasional mistakes in the source data are
                // inconsistently-formatted time fields. here we try to handle
                // the forms currently found in the source database
                timeString = [];
                timeString.push(sodaEntry.crimetime.substring(0, 2));
                timeString.push(sodaEntry.crimetime.substring(2, 4));
                timeString.push('00');
            } else {
                misc.throwOnError('invalid crimetime');
            }

            // UTC milliseconds; will be displayed by the client in the user's timezone
            entry.date = new Date();
            entry.date.setUTCFullYear(dateString[0]);
            entry.date.setUTCMonth(dateString[1], dateString[2]);
            entry.date.setUTCHours(timeString[0], timeString[1], timeString[2]);
            entry.date = makeValue(entry.date.getTime());
        } while (false);

        if (sodaEntry.location_1 !== undefined) {
            entry.location = makeValue(sodaEntry.location_1.latitude + ' ' + sodaEntry.location_1.longitude);
        }

        this.m_entries.push(entry);
    }


    // update the downloadable database file
    _updateFile() {
        const fs = require('fs');

        let result = '';

        for (const entry of this.m_entries) {
            for (const property of Object.keys(entry).sort()) {
                if ((entry[property] + '').indexOf('\n') !== -1) {
                    misc.throwOnError(true);
                }

                result += entry[property] + '\n';
            }
        }

        fs.writeFileSync(this.m_path, result);
        this.m_entries = [];
    }


    // start the automatic updater.
    // the app is fully usable during an update, and will continue serving
    // the previous data until the update is complete.
    updateStart() {
        const nodeSocrata = require('node-socrata');

        const soda = new nodeSocrata({
            'hostDomain': 'https://data.baltimorecity.gov',
              'resource': 'wsfq-mvij.json',
              'XappToken': '1H4t917kJRrkNDyhSyLHYMfnW'
        });

        // maximum for the SODA API
        const limit = 50000;

        function addSodaEntries(sodaEntries) {
            for (const entry of sodaEntries) {
                for (let i = 0; i < entry.total_incidents; ++i) {
                    this._addSodaEntry(entry);
                }
            }
        }

        sodaFetchPages(soda, limit, 0, addSodaEntries.bind(this), this._updateFile.bind(this));

        // update again 24 hours from now
        setTimeout(this.updateStart.bind(this), 24 * 60 * 60 * 1000);
    }
}


module.exports = {
    CrimeDB: CrimeDB
};
