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

app.directive('raceMap', () => ({
    restrict: 'E',
    templateUrl: 'views/track.html',
}));

app.directive('leaderboard', () => ({
    restrict: 'E',
    templateUrl: 'views/leaderboard.html',
    controller: 'LeaderboardController',
}));

app.directive('scrubber', () => ({
    restrict: 'E',
    templateUrl: 'views/scrubber.html',
    controller: 'ClockController',
}));

app.directive('statisticsPanel', () => ({
    restrict: 'E',
    templateUrl: 'views/stats.html',
    controller: 'StatsController',
}));

app.controller('RaceController',
    ['$scope', '$http', '$interval', 'TrackModel', 'Diffusion', 'CarsModel', 'ClockModel', 'TopicModel',
        function controller($scope, $http, $interval, TrackModel, Diffusion, CarsModel, ClockModel, TopicModel) {
            $scope.getTrack = () => TrackModel.getPath();

            const rootTopic = TopicModel.getTopic().Topic;
            $scope.getDrawables = function drawable() {
                return {
                    path: TrackModel.getPath(),
                    cars: CarsModel.getCars(),
                    startingLine: TrackModel.getStartingLine(),
                };
            };

            if (Diffusion.session()) {
                Diffusion.session().addStream(`${rootTopic}/updates`, Diffusion.datatypes.json())
                    .on('value', (topic, spec, value) => {
                        $scope.$apply(() => {
                            const val = value.value.get();
                            const time = value.timestamp;

                            if (!ClockModel.isPaused() && ClockModel.isLive() && TrackModel.properties) {
                                val.forEach((car) => {
                                    CarsModel.updateCarPosition(car);
                                });
                            }
                            ClockModel.setLiveTime(time);
                        });
                    });
                Diffusion.session().select(`${rootTopic}/updates`);
            }
        }]);
