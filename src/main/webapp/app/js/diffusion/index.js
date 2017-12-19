/*
 * Copyright (C) 2017 Push Technology Ltd.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

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