'use strict';

var app = require('angular').module('racing');

app.factory('StatsModel', function() {
    var StatsModel = {
        options : {
                    "chart": {
                      "type": "lineChart",
                      "height": 280,
                      "margin": {
                        "top": 20,
                        "right": 20,
                        "bottom": 40,
                        "left": 55
                      },
                      "useInteractiveGuideline": true,
                      "dispatch": {},
                      "xAxis": {
                        "axisLabel": "Lap"
                      },
                      "yAxis": {
                        "axisLabel": "Lap Time",
                        "axisLabelDistance": -10
                      }
                    },
                    "legend" : {enable:false},
                    "title": {
                      "enable": false
                    },
                    "subtitle": {
                      "enable": false
                    },
                    "caption": {
                      "enable": false
                    }
                  },
        data : [
            {
                values : [],
                key : 'Lap Times',
                color : '#f15500',
                area : false
            }
        ]
    };

    StatsModel.init = function(data) {
        StatsModel.clear();
        data.forEach(function(time, lap) {
            StatsModel.data[0].values.push({ x : lap + 1, y : time.toFixed(3) });
        });
    };

    StatsModel.getLaps = function() {
        return StatsModel.data;
    };

    StatsModel.clear = function() {
        StatsModel.data[0].values = [];
    };

    StatsModel.dummy = function() {
        var promise = function(success, failure) {
            success([
                34.123,
                33.109,
                34.893,
                31.513,
                31.301,
                29.985,
                29.994,
                28.964,
                29.543,
                29.859
            ]);
        };

        return { then : promise };
    };

    return StatsModel;
});

app.controller('StatsController', ['$scope', 'CarsModel', 'StatsModel', 'Diffusion',
    function($scope, CarsModel, StatsModel, Diffusion) {

    $scope.stats = false;

    $scope.data = StatsModel.getLaps();

    $scope.carSelected = function() {
        return !!CarsModel.getSelectedCar();
    };

    $scope.getCar = function() {
        return CarsModel.getSelectedCar();
    };

    $scope.options = StatsModel.options;

    $scope.toggleStats = function() {
        $scope.stats = !$scope.stats;
        updateStats();
    };

    var updateStats = function() {
        if ($scope.stats) {
            var car = CarsModel.getSelectedCar();
            var request = { id : ''+car.id, teamid : ''+car.teamid };
            Diffusion.session().messages.sendRequest('race', request).then(function(data) {
                StatsModel.init(data.get());
                $scope.data = StatsModel.getLaps();
            }, function(err) {
                console.log(err);
            });
        }
    };

    $scope.$watch(function() {
        if (CarsModel.getSelectedCar()) {
            return CarsModel.getSelectedCar().laps;
        }
        return 0;
    }, updateStats);

    $scope.$watch(function() {
        if (CarsModel.getSelectedCar()) {
            return CarsModel.getSelectedCar().id + ' ' + CarsModel.getSelectedCar().teamid;
        }
        return '0';
    }, updateStats);
}]);