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
        Diffusion.session().stream('race/updates').asType(Diffusion.datatypes.json())
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
        Diffusion.session().subscribe('race/updates');
    }
}]);