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

app.directive('raceMap', function() {
    return {
        restrict : 'E',
        templateUrl : 'views/track.html'
    };
});

app.directive('leaderboard', function() {
    return {
        restrict : 'E',
        templateUrl : 'views/leaderboard.html',
        controller : 'LeaderboardController'
    };
});

app.directive('scrubber', function() {
    return {
        restrict : 'E',
        templateUrl : 'views/scrubber.html',
        controller : 'ClockController'
    };
});

app.directive('statisticsPanel', function() {
    return {
        restrict : 'E',
        templateUrl : 'views/stats.html',
        controller : 'StatsController'
    };
});

app.controller('RaceController', ['$scope', '$interval', 'TrackModel', 'Diffusion', 'CarsModel', 'ClockModel', function($scope, $interval, TrackModel, Diffusion, CarsModel, ClockModel) {
    $scope.getTrack = function() {
        return TrackModel.getPath();
    };

    $scope.getDrawables = function() {
        return {
            path : TrackModel.getPath(),
            cars : CarsModel.getCars(),
            startingLine : TrackModel.getStartingLine()
        };
    };

    if (Diffusion.session()) {
        Diffusion.session().addStream('race/updates', Diffusion.datatypes.json())
            .on('value', function(topic, spec, value) {
                $scope.$apply(function() {
                    var val = value.value.get();
                    var time = value.timestamp;

                    if (!ClockModel.isPaused() && ClockModel.isLive() && TrackModel.properties) {
                        val.forEach(function(car) {
                            CarsModel.updateCarPosition(car);
                        });
                    }
                    ClockModel.setLiveTime(time);

                });
            });
        Diffusion.session().select('race/updates');
    }
}]);
