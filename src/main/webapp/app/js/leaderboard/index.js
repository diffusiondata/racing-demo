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
