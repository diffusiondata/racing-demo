'use strict';

var app = require('angular').module('racing');

app.controller('ConnectingController', ['$scope', '$state', '$timeout', 'Diffusion', 'TrackModel', 'CarsModel', function($scope, $state, $timeout, Diffusion, TrackModel, CarsModel) {
    Diffusion.connect('localhost:8080', function() {

        var getTeams = function(topic, spec, nTeams) {
            for (var i = 0; i < nTeams; ++i) {
                Diffusion.session().stream('race/teams/' + i).asType(Diffusion.datatypes.string())
                    .on('value', initTeam);

                Diffusion.session().stream('race/teams/' + i + '/cars').asType(Diffusion.datatypes.int64())
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
                Diffusion.session().stream('race/teams/' + team + '/cars/' + j).asType(Diffusion.datatypes.string())
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

        Diffusion.session().stream('race').asType(Diffusion.datatypes.string())
            .on('value', function(topic, spec, value) {
                TrackModel.init(value);
                $state.go('race');
            });

        Diffusion.session().stream('race/teams').asType(Diffusion.datatypes.int64())
            .on('value', getTeams);

        Diffusion.session().subscribe('race');
        Diffusion.session().subscribe('race/teams');
        Diffusion.session().subscribe('?race/teams/.*//');
    });
}]);