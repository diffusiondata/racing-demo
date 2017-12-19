'use strict';

var app = require('angular').module('racing');

var diffusion = require('diffusion');

app.factory('Diffusion', ['$state', function($state) {
    var Diffusion = {
        _session : null
    };

    Diffusion.connect = function(url, done) {
        diffusion.connect(url).then(function(session) {
            Diffusion._session = session;
            done();
        });
    };

    Diffusion.session = function() {
        if (!this._session || !this._session.isConnected()) {
            $state.go('connecting');
            return false;
        }
        return this._session;
    };

    Diffusion.datatypes = diffusion.datatypes;

    return Diffusion;
}]);