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

app.factory('CarsModel', ['Diffusion', 'TrackModel', function(Diffusion, TrackModel) {
    var CarsModel = {
        teams : [],
        cars : [],
        toDraw : [],
        colours : [
            'cc0066', // Reappt pink
            '00aaef', // Diffusion blue
            '00b956', // Green
            'ffc600', // Yellow
            'f64d3c', // Red
            '3a3335', // Jet
            'fdf0d5', // Papaya Whip
            'eb5e55', // Sunset Orange
            '710627', // Burgundy
            '2f1847'  // Russian Violet
        ],
    };

    CarsModel.addCar = function(car, name, team) {
        this.teams[team].cars[car] = { name : name, colour : this.colours[team] };

        this.cars = this.cars.filter(function(c) {
            return !(c.id === car && c.teamid === team);
        });

        this.cars.push({
            name : name,
            colour : '#' + this.colours[team],
            class : 'col-' + this.colours[team],
            team : this.teams[team].name,
            teamid : team,
            id : car,
            loc : { x : 0, y : 0 },
            pos : this.cars.length,
            speed : 120,
            selected : false
        });
    };

    CarsModel.addTeam = function(team, name) {
        this.teams[team] = {
            name : name,
            cars : []
        };
    };

    CarsModel.getCar = function(carid, teamid) {
        return CarsModel.cars.find(function(car) {
            return car.id === carid && car.teamid === teamid;
        });
    };

    CarsModel.getCars = function() {
        return CarsModel.cars;
    };

    CarsModel.updateCarPosition = function(car) {
        var id = car.id;
        var team = car.team;
        var location = car.loc;
        var position = car.pos;
        var laps = car.lap;
        var speed = car.speed;
        var lap = car.t;
        var last_lap = car.pt;
        var lap_delta = car.td;

        var c = CarsModel.getCar(id, team);
        var loc = TrackModel.getPositionAtLength(location);
        c.loc = loc;
        c.pos = position;
        c.laps = laps;
        c.speed = speed;
        c.lap = lap;
        c.last_lap = last_lap;
        c.lap_delta = lap_delta;
    };

    CarsModel.getSelectedCar = function() {
        return CarsModel.cars.find(function(car) {
            return car.selected;
        });
    };

    CarsModel.selectCar = function(i, j) {
        if (CarsModel.getSelectedCar()) {
            CarsModel.getSelectedCar().selected = false;
        }
        CarsModel.getCar(i, j).selected = true;
    };

    CarsModel.unselectCar = function(i, j) {
        CarsModel.getCar(i, j).selected = false;
    };

    return CarsModel;
}]);