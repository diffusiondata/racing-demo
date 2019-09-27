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

app.factory('CarsModel', ['Diffusion', 'TrackModel', (Diffusion, TrackModel) => {
    const CarsModel = {
        teams: [],
        cars: [],
        toDraw: [],
        colours: [
            'cc0066', // Reappt pink
            '00aaef', // Diffusion blue
            '00b956', // Green
            'ffc600', // Yellow
            'f64d3c', // Red
            '3a3335', // Jet
            'fdf0d5', // Papaya Whip
            'eb5e55', // Sunset Orange
            '710627', // Burgundy
            '2f1847', // Russian Violet
        ],
    };

    CarsModel.addCar = (car, name, team) => {
        CarsModel.teams[team].cars[car] = { name, colour: CarsModel.colours[team] };

        CarsModel.cars = CarsModel.cars.filter((c) => !(c.id === car && c.teamid === team));

        CarsModel.cars.push({
            name,
            colour: `#${CarsModel.colours[team]}`,
            class: `col-${CarsModel.colours[team]}`,
            team: CarsModel.teams[team].name,
            teamid: team,
            id: car,
            loc: { x: 0, y: 0 },
            pos: CarsModel.cars.length,
            speed: 120,
            selected: false,
        });
    };

    CarsModel.addTeam = (team, name) => {
        CarsModel.teams[team] = {
            name,
            cars: [],
        };
    };

    CarsModel.getCar = (carid, teamid) => CarsModel.cars.find((car) => car.id === carid && car.teamid === teamid);

    CarsModel.getCars = () => CarsModel.cars;

    CarsModel.updateCarPosition = (car) => {
        const { id } = car;
        const { team } = car;
        const location = car.loc;
        const position = car.pos;
        const laps = car.lap;
        const { speed } = car;
        const lap = car.t;
        const lastLap = car.pt;
        const lapDelta = car.td;

        const c = CarsModel.getCar(id, team);
        c.loc = TrackModel.getPositionAtLength(location);
        c.pos = position;
        c.laps = laps;
        c.speed = speed;
        c.lap = lap;
        c.lastLap = lastLap;
        c.lapDelta = lapDelta;
    };

    CarsModel.getSelectedCar = () => CarsModel.cars.find((car) => car.selected);

    CarsModel.selectCar = (i, j) => {
        if (CarsModel.getSelectedCar()) {
            CarsModel.getSelectedCar().selected = false;
        }
        CarsModel.getCar(i, j).selected = true;
    };

    CarsModel.unselectCar = (i, j) => {
        CarsModel.getCar(i, j).selected = false;
    };

    return CarsModel;
}]);
