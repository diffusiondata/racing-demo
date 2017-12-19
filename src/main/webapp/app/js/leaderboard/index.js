'use strict';

var app = require('angular').module('racing');

app.controller('LeaderboardController', ['$scope', 'CarsModel', function($scope, CarsModel) {
    $scope.getOrderedCars = function() {
        return CarsModel.getCars().sort(function(a, b) {
            return a.pos - b.pos;
        });
    };

    $scope.selectCar = function(car, team) {
        var sel = CarsModel.getSelectedCar();
        if (sel && sel.id === car && sel.teamid === team) {
            CarsModel.unselectCar(car, team);
        }
        else {
            CarsModel.selectCar(car, team);
        }
    };

    $scope.selectedCar = function(car, team) {
        var selected = CarsModel.getSelectedCar();
        if (!selected) {
            return false;
        }
        return selected.id === car && selected.teamid === team;
    };

    $scope.carSelected = function() {
        return !!CarsModel.getSelectedCar();
    };

    $scope.getTeamName = CarsModel.getTeamName;

    $scope.getTeamClass = CarsModel.getTeamClass;
}]);
