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

app.factory('TopicModel', ['$http', ($http) => {
    const TopicModel = {
        rootTopic: { Topic: '' },
    };

    TopicModel.setTopic = () => {
        $http.get('/race/topic').then((x) => { TopicModel.rootTopic.Topic = x.data; });
    };

    TopicModel.getTopic = () => TopicModel.rootTopic;

    return TopicModel;
}]);

app.controller('ConnectingController',
    ['$scope', '$state', '$timeout', '$http', 'Diffusion', 'TrackModel', 'CarsModel', 'TopicModel',
        function controller($scope, $state, $timeout, $http, Diffusion, TrackModel, CarsModel, TopicModel) {
            TopicModel.setTopic();


            $http.get('json/properties.json').then((response) => {
                Diffusion.connect(response.data, () => {
                    const rootTopic = TopicModel.getTopic().Topic;
                    const teamPosition = rootTopic.split('/').length + 1;

                    const initCar = (topic, spec, value) => {
                        // topic is of form race/teams/<team number>/cars/<car number>
                        const parts = topic.split('/');
                        const team = parseInt(parts[teamPosition], 10);
                        const car = parseInt(parts[teamPosition + 2], 10);
                        CarsModel.addCar(car, value, team);
                    };

                    const initTeam = (topic, spec, value) => {
                        // topic is of form race/teams/<team number>
                        const parts = topic.split('/');
                        const team = parseInt(parts[teamPosition], 10);
                        CarsModel.addTeam(team, value);
                    };

                    const getCars = (topic, spec, nCars) => {
                        // topic is of form race/teams/<team number>/cars
                        const parts = topic.split('/');
                        const team = parseInt(parts[teamPosition], 10);
                        for (let j = 0; j < nCars; ++j) {
                            Diffusion.session()
                                .addStream(`${rootTopic}/teams/${team}/cars/${j}`, Diffusion.datatypes.string())
                                .on('value', initCar);
                        }
                    };
                    const getTeams = (topic, spec, nTeams) => {
                        for (let i = 0; i < nTeams; ++i) {
                            Diffusion.session().addStream(`${rootTopic}/teams/${i}`, Diffusion.datatypes.string())
                                .on('value', initTeam);

                            Diffusion.session().addStream(`${rootTopic}/teams/${i}/cars`, Diffusion.datatypes.int64())
                                .on('value', getCars);
                        }
                    };


                    Diffusion.session().addStream(rootTopic, Diffusion.datatypes.string())
                        .on('value', (topic, spec, value) => {
                            TrackModel.init(value);
                            $state.go('race');
                        });

                    Diffusion.session().addStream(`${rootTopic}/teams`, Diffusion.datatypes.int64())
                        .on('value', getTeams);

                    Diffusion.session().select(rootTopic);
                    Diffusion.session().select(`${rootTopic}/teams`);
                    Diffusion.session().select(`?${rootTopic}/teams/.*//`);
                });
            })
                .catch((status) => {
                    console.log('Could not load json/properties.json file', status);
                });
        }]);
