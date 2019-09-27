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

app.factory('StatsModel', () => {
    const StatsModel = {
        options: {
            chart: {
                type: 'lineChart',
                height: 280,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 55,
                },
                useInteractiveGuideline: true,
                dispatch: {},
                xAxis: {
                    axisLabel: 'Lap',
                },
                yAxis: {
                    axisLabel: 'Lap Time',
                    axisLabelDistance: -10,
                },
            },
            legend: { enable: false },
            title: {
                enable: false,
            },
            subtitle: {
                enable: false,
            },
            caption: {
                enable: false,
            },
        },
        data: [
            {
                values: [],
                key: 'Lap Times',
                color: '#f15500',
                area: false,
            },
        ],
    };

    StatsModel.init = (data) => {
        StatsModel.clear();
        data.forEach((time, lap) => {
            StatsModel.data[0].values.push({ x: lap + 1, y: time.toFixed(3) });
        });
    };

    StatsModel.getLaps = () => StatsModel.data;

    StatsModel.clear = () => {
        StatsModel.data[0].values = [];
    };

    StatsModel.dummy = () => {
        const promise = function (success) {
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
                29.859,
            ]);
        };

        return { then: promise };
    };

    return StatsModel;
});

app.controller('StatsController', ['$scope', '$http', 'CarsModel', 'StatsModel', 'Diffusion', 'TopicModel',
    function controller($scope, $http, CarsModel, StatsModel, Diffusion, TopicModel) {
        const rootTopic = TopicModel.getTopic().Topic;
        $scope.stats = false;

        $scope.data = StatsModel.getLaps();

        $scope.carSelected = () => !!CarsModel.getSelectedCar();

        $scope.getCar = () => CarsModel.getSelectedCar();

        $scope.options = StatsModel.options;

        const updateStats = () => {
            if ($scope.stats) {
                const car = CarsModel.getSelectedCar();
                const request = { id: `${car.id}`, teamid: `${car.teamid}` };
                Diffusion.session().messages.sendRequest(rootTopic, request).then((data) => {
                    StatsModel.init(data.get());
                    $scope.data = StatsModel.getLaps();
                }, (err) => {
                    console.log(err);
                });
            }
        };
        $scope.toggleStats = () => {
            $scope.stats = !$scope.stats;
            updateStats();
        };


        $scope.$watch(() => {
            if (CarsModel.getSelectedCar()) {
                return CarsModel.getSelectedCar().laps;
            }
            return 0;
        }, updateStats);

        $scope.$watch(() => {
            if (CarsModel.getSelectedCar()) {
                return `${CarsModel.getSelectedCar().id} ${CarsModel.getSelectedCar().teamid}`;
            }
            return '0';
        }, updateStats);
    }]);
