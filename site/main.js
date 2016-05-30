'use strict';


function main() {
    const misc = require('./misc');
    const database = require('./database');

    const express = require('express');
    const compression = require('compression');

    const app = express();
    app.use(compression());
    app.use(express.static(__dirname + '/static'));
    app.listen(8080);

    const crimeDB = new database.CrimeDB(__dirname + '/static/database.dat');
    crimeDB.updateStart();
}


if (require.main === module) {
    main();
} else {
    module.exports.init = main;
}
