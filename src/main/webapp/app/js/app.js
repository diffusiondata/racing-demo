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

var angular = require('angular');

require('@uirouter/angularjs');
require('angularjs-slider');
require('angularjs-gauge');
require('angular-nvd3');

var app = angular.module('racing', ['ui.router', 'rzModule', 'angularjs-gauge', 'nvd3']);

require('./diffusion');
require('./connecting');
require('./track');
require('./race');
require('./teams');
require('./leaderboard');
require('./clock');
require('./stats');

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/connecting');

    $stateProvider.state('connecting', {
        url : '/connecting', templateUrl : 'views/connecting.html',
        controller : 'ConnectingController'
    });

    $stateProvider.state('race', {
        url : '/race', templateUrl : 'views/race.html',
        controller : 'RaceController'
    });
}]);




