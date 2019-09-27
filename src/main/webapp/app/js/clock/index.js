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


const app = require('angular').module('racing');

app.factory('ClockModel', () => {
    const ClockModel = {
        paused: false,
        live: true,
        playback: false,
        replayTick: 50,
    };

    ClockModel.togglePause = () => {
        ClockModel.paused = !ClockModel.paused;
    };

    ClockModel.setPaused = (paused) => {
        ClockModel.paused = paused;
    };

    ClockModel.setLive = (live) => {
        ClockModel.live = live;
    };

    ClockModel.setPlayback = (playback) => {
        ClockModel.playback = playback;
    };

    ClockModel.isPlayback = () => ClockModel.playback;

    ClockModel.isPaused = () => ClockModel.paused;

    ClockModel.isLive = () => ClockModel.live;

    ClockModel.setStartTime = (time) => {
        ClockModel.start = time;
    };

    ClockModel.setViewTime = (time) => {
        ClockModel.view = time;
    };

    ClockModel.setLiveTime = (time) => {
        ClockModel.latest = time;
    };

    ClockModel.getStartTime = () => ClockModel.start;

    ClockModel.getViewTime = () => ClockModel.view;

    ClockModel.getLiveTime = () => ClockModel.latest;

    return ClockModel;
});

app.controller('ClockController', ['$scope', '$http', '$interval', 'ClockModel', 'Diffusion', 'CarsModel', 'TopicModel',
    function controller($scope, $http, $interval, ClockModel, Diffusion, CarsModel, TopicModel) {
        const rootTopic = TopicModel.getTopic().Topic;

        $scope.isPaused = ClockModel.isPaused;

        $scope.backToLive = () => {
            ClockModel.setLive(true);
            ClockModel.setPaused(false);
            ClockModel.setPlayback(false);
        };

        $scope.startPlayback = () => {
            ClockModel.setPlayback(true);
            ClockModel.setPaused(false);
        };

        $scope.togglePause = () => {
            ClockModel.togglePause();
            ClockModel.setPlayback(!ClockModel.isPaused());
            ClockModel.setLive(false);
        };

        $scope.slider = {
            value: 1,
            options: {
                floor: 0,
                ceil: 1,
                onStart() {
                    ClockModel.setLive(false);
                    ClockModel.setPaused(true);
                },
                step: 50,
                translate(value) {
                    const date = new Date(value);
                    return date.toLocaleTimeString();
                },
            },
        };

        const getHistoricalData = () => {
            Diffusion.session().timeseries.rangeQuery()
                .from(new Date(ClockModel.getViewTime()))
                .next(1)
                .as(Diffusion.datatypes.json())
                .selectFrom(`${rootTopic}/updates`)
                .then((result) => {
                    const val = result.events[0].value.get();
                    val.forEach((car) => {
                        CarsModel.updateCarPosition(car);
                    });
                }, (err) => {
                    console.log(err);
                });
        };

        const setStart = () => {
            Diffusion.session().timeseries.rangeQuery()
                .fromStart()
                .next(1)
                .as(Diffusion.datatypes.json())
                .selectFrom(`${rootTopic}/updates`)
                .then((result) => {
                    ClockModel.setStartTime(result.events[0].timestamp);
                }, (err) => {
                    console.log(err);
                });

            if (ClockModel.isPlayback() && !ClockModel.isPaused() && !ClockModel.isLive()) {
                $scope.slider.value += ClockModel.replayTick;
            }
        };

        $scope.$watch(() => `${ClockModel.getStartTime()} ${ClockModel.getLiveTime()}`, () => {
            $scope.slider.options.floor = ClockModel.getStartTime();
            $scope.slider.options.ceil = ClockModel.getLiveTime();

            if (!ClockModel.isLive() && $scope.slider.value < ClockModel.getStartTime()) {
                $scope.slider.value = ClockModel.getStartTime();
            } else if (ClockModel.isLive() && !ClockModel.isPaused()) {
                $scope.slider.value = ClockModel.getLiveTime();
            }
        });

        $scope.$watch(() => $scope.slider.value, () => {
            if (!ClockModel.getViewTime() || Math.abs(ClockModel.getViewTime() - $scope.slider.value) > 20) {
                ClockModel.setViewTime($scope.slider.value);
            }

            if (!ClockModel.isLive()) {
                getHistoricalData();
            }
        });

        if (Diffusion.session()) {
            $interval(setStart, ClockModel.replayTick);
            setStart();
        }
    }]);
