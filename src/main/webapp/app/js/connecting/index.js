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

app.factory('TopicModel', ['$http', function($http){
    var TopicModel = {
        _rootTopic : {Topic : ""}
    }

    TopicModel.setTopic = function () {
       $http.get("/race/topic").then(function(x) { TopicModel._rootTopic.Topic = x.data});
    }

    TopicModel.getTopic = function () {
        return TopicModel._rootTopic;
    }
    return TopicModel;
}]);

app.controller('ConnectingController', ['$scope', '$state', '$timeout', '$http', 'Diffusion', 'TrackModel', 'CarsModel', 'TopicModel', function($scope, $state, $timeout, $http, Diffusion, TrackModel, CarsModel, TopicModel) {

    TopicModel.setTopic();
    var rootTopic = TopicModel.getTopic();

    $http.get('json/properties.json').then(function(response) {
         var teamPosition;

        Diffusion.connect(response.data, function() {
            teamPosition = rootTopic["Topic"].split('/').length + 1;
            var getTeams = function(topic, spec, nTeams) {
                for (var i = 0; i < nTeams; ++i) {
                    Diffusion.session().addStream(rootTopic["Topic"] + '/teams/' + i, Diffusion.datatypes.string())
                        .on('value', initTeam);

                    Diffusion.session().addStream( rootTopic["Topic"] + '/teams/' + i + '/cars', Diffusion.datatypes.int64())
                        .on('value', getCars);
                }
            };

            var initTeam = function(topic, spec, value) {
                // topic is of form race/teams/<team number>
                var parts = topic.split('/');
                var team = parseInt(parts[teamPosition], 10);
                CarsModel.addTeam(team, value);
            };

            var getCars = function(topic, spec, nCars) {
                // topic is of form race/teams/<team number>/cars
                var parts = topic.split('/');
                var team = parseInt(parts[teamPosition], 10);
                for(var j = 0; j < nCars; ++j) {
                    Diffusion.session().addStream(rootTopic["Topic"] + '/teams/' + team + '/cars/' + j, Diffusion.datatypes.string())
                        .on('value', initCar);
                }
            };

            var initCar = function(topic, spec, value) {
                // topic is of form race/teams/<team number>/cars/<car number>
                var parts = topic.split('/');
                var team = parseInt(parts[teamPosition], 10);
                var car = parseInt(parts[teamPosition+2], 10);
                CarsModel.addCar(car, value, team);
            };

            Diffusion.session().addStream(rootTopic["Topic"], Diffusion.datatypes.string())
                .on('value', function(topic, spec, value) {
                    TrackModel.init(value);
                    $state.go('race');
                });

            Diffusion.session().addStream(rootTopic["Topic"] + '/teams', Diffusion.datatypes.int64())
                .on('value', getTeams);

            Diffusion.session().select(rootTopic["Topic"]);
            Diffusion.session().select(rootTopic["Topic"] + '/teams');
            Diffusion.session().select('?' + rootTopic["Topic"] + '/teams/.*//');
        });
    })
        .catch(function(status) {
            console.log('Could not load json/properties.json file', status);
        });
}]);
