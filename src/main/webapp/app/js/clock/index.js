'use strict';

var app = require('angular').module('racing');

app.factory('ClockModel', function() {
    var ClockModel = {
        paused : false,
        live : true,
        playback : false,
        replayTick : 50
    };

    ClockModel.togglePause = function() {
        ClockModel.paused = !ClockModel.paused;
    };

    ClockModel.setPaused = function(paused) {
        ClockModel.paused = paused;
    };

    ClockModel.setLive = function(live) {
        ClockModel.live = live;
    };

    ClockModel.setPlayback = function(playback) {
        ClockModel.playback = playback;
    };

    ClockModel.isPlayback = function() {
        return ClockModel.playback;
    };

    ClockModel.isPaused = function() {
        return ClockModel.paused;
    };

    ClockModel.isLive = function() {
        return ClockModel.live;
    };

    ClockModel.setStartTime = function(time) {
        ClockModel.start = time;
    };

    ClockModel.setViewTime = function(time) {
        ClockModel.view = time;
    };

    ClockModel.setLiveTime = function(time) {
        ClockModel.latest = time;
    };

    ClockModel.getStartTime = function() {
        return ClockModel.start;
    };

    ClockModel.getViewTime = function() {
        return ClockModel.view;
    };

    ClockModel.getLiveTime = function() {
        return ClockModel.latest;
    };

    return ClockModel;
});

app.controller('ClockController', ['$scope', '$interval', 'ClockModel', 'Diffusion', 'CarsModel', function($scope, $interval, ClockModel, Diffusion, CarsModel) {
    $scope.isPaused = ClockModel.isPaused;

    $scope.backToLive = function() {
        ClockModel.setLive(true);
        ClockModel.setPaused(false);
        ClockModel.setPlayback(false);
    };

    $scope.startPlayback = function() {
        ClockModel.setPlayback(true);
        ClockModel.setPaused(false);
    };

    $scope.togglePause = function() {
        ClockModel.togglePause();
        ClockModel.setPlayback(!ClockModel.isPaused());
        ClockModel.setLive(false);
    };

    $scope.slider = {
        value : 1,
        options :{
            floor : 0,
            ceil : 1,
            onStart : function() {
                ClockModel.setLive(false);
                ClockModel.setPaused(true);
            },
            step : 50,
            translate : function(value) {
                var date = new Date(value);
                return date.toLocaleTimeString();
            }
        }
    };

    var getHistoricalData = function() {
        Diffusion.session().timeseries.rangeQuery()
            .from(new Date(ClockModel.getViewTime()))
            .next(1)
            .as(Diffusion.datatypes.json())
            .selectFrom('race/updates').then(function(result) {
                var val = result.events[0].value.get();
                val.forEach(function(car) {
                    CarsModel.updateCarPosition(car);
                });
            }, function(err) {
                console.log(err);
            });
    };

    var setStart = function() {
        Diffusion.session().timeseries.rangeQuery()
            .fromStart()
            .next(1)
            .as(Diffusion.datatypes.json())
            .selectFrom('race/updates').then(function(result) {
                ClockModel.setStartTime(result.events[0].timestamp);
            }, function(err) {
                console.log(err);
            });

        if (ClockModel.isPlayback() && !ClockModel.isPaused() && !ClockModel.isLive()) {
            $scope.slider.value += ClockModel.replayTick;
        }
    };

    $scope.$watch(function() {
        return ClockModel.getStartTime() + ' ' + ClockModel.getLiveTime();
    }, function() {
        $scope.slider.options.floor = ClockModel.getStartTime();
        $scope.slider.options.ceil = ClockModel.getLiveTime();

        if (!ClockModel.isLive() && $scope.slider.value < ClockModel.getStartTime()) {
            $scope.slider.value = ClockModel.getStartTime();
        } else if (ClockModel.isLive() && !ClockModel.isPaused()) {
            $scope.slider.value = ClockModel.getLiveTime();
        }
    });

    $scope.$watch(function() {
        return $scope.slider.value;
    }, function() {
        ClockModel.setViewTime($scope.slider.value);

        if (!ClockModel.isLive()) {
            getHistoricalData();
        }
    });

    if (Diffusion.session()) {
        $interval(setStart, ClockModel.replayTick);
        setStart();
    }
}]);