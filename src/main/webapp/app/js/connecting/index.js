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

app.controller('ConnectingController', ['$scope', '$state', '$timeout', '$http', 'Diffusion', 'TrackModel', 'CarsModel', function($scope, $state, $timeout, $http, Diffusion, TrackModel, CarsModel) {
    $http.get('json/properties.json').then(function(response) {
        console.log(response);
        Diffusion.connect(response.data, function() {
            var getTeams = function(topic, spec, nTeams) {
                for (var i = 0; i < nTeams; ++i) {
                    Diffusion.session().addStream('race/teams/' + i, Diffusion.datatypes.string())
                        .on('value', initTeam);

                    Diffusion.session().addStream('race/teams/' + i + '/cars', Diffusion.datatypes.int64())
                        .on('value', getCars);
                }
            };

            var initTeam = function(topic, spec, value) {
                // topic is of form race/teams/<team number>
                var parts = topic.split('/');
                var team = parseInt(parts[2], 10);
                CarsModel.addTeam(team, value);
            };

            var getCars = function(topic, spec, nCars) {
                // topic is of form race/teams/<team number>/cars
                var parts = topic.split('/');
                var team = parseInt(parts[2], 10);

                for(var j = 0; j < nCars; ++j) {
                    Diffusion.session().addStream('race/teams/' + team + '/cars/' + j, Diffusion.datatypes.string())
                        .on('value', initCar);
                }
            };

            var initCar = function(topic, spec, value) {
                // topic is of form race/teams/<team number>/cars/<car number>
                var parts = topic.split('/');
                var team = parseInt(parts[2], 10);
                var car = parseInt(parts[4], 10);
                CarsModel.addCar(car, value, team);
            };

            Diffusion.session().addStream('race', Diffusion.datatypes.string())
                .on('value', function(topic, spec, value) {
                    TrackModel.init(value);
                    $state.go('race');
                });

            Diffusion.session().addStream('race/teams', Diffusion.datatypes.int64())
                .on('value', getTeams);

            Diffusion.session().select('race');
            Diffusion.session().select('race/teams');
            Diffusion.session().select('?race/teams/.*//');
        });
    })
    .catch(function(status) {
        console.log('Could not load json/properties.json file', status);
    });
}]);
