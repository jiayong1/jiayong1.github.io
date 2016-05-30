'use strict';


module.exports = {
    // generic error-handling callback
    throwOnError: function (error) {
        if (error) {
            throw new Error('error: ' + error);
        }
    }
};
