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
const svg = require('svg-path-properties');

app.directive('track', () => ({
    restrict: 'A',
    scope: {
        drawables: '@drawables',
    },
    link(scope, elem, attrs) {
        let done = false;
        let xtrans = 0; let
            ytrans = 0;
        const lineWidth = 40;
        const buffer = 16;

        const setBoundingBox = function (ctx, alphaThreshold) {
            let threshold = 0;
            if (alphaThreshold === undefined) {
                threshold = 15;
            }
            let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
            const w = ctx.canvas.width; const h = ctx.canvas.height;
            const { data } = ctx.getImageData(0, 0, w, h);
            for (let x = 0; x < w; ++x) {
                for (let y = 0; y < h; ++y) {
                    const a = data[(w * y + x) * 4 + 3];
                    if (a > threshold) {
                        if (x > maxX) {
                            maxX = x;
                        }
                        if (x < minX) {
                            minX = x;
                        }
                        if (y > maxY) {
                            maxY = y;
                        }
                        if (y < minY) {
                            minY = y;
                        }
                    }
                }
            }

            const width = maxX - minX;
            const height = maxY - minY;
            if (width > 0 && height > 0) {
                ctx.canvas.width = width + (2 * (lineWidth + buffer));
                ctx.canvas.height = height + (2 * (lineWidth + buffer));
                done = true;

                xtrans = (lineWidth + buffer) - minX;
                ytrans = (lineWidth + buffer) - minY;
            }
        };

        const draw = function (drawables) {
            const drawable = JSON.parse(drawables);
            const { path } = drawable;
            const ctx = elem[0].getContext('2d');
            ctx.save();

            ctx.clearRect(-50, -50, ctx.canvas.width + 50, ctx.canvas.height + 50);

            const p = new Path2D(path);
            ctx.translate(xtrans, ytrans);
            ctx.stroke(p);

            if (!done) {
                setBoundingBox(ctx, 15);
            }

            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = lineWidth;
            ctx.stroke(p);

            const line = drawable.startingLine;

            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.moveTo(line.x0, line.y0);
            ctx.lineTo(line.x1, line.y1);
            ctx.stroke();

            const { cars } = drawable;
            cars.forEach((car) => {
                ctx.beginPath();
                ctx.fillStyle = car.colour;
                ctx.arc(car.loc.x, car.loc.y, 10, 0, 2 * Math.PI);
                ctx.fill();
                if (car.selected) {
                    ctx.strokeStyle = '#f1f1f1';
                    ctx.lineWidth = 4;
                } else {
                    ctx.strokeStyle = '#444444';
                    ctx.lineWidth = 2;
                }
                ctx.stroke();
            });
            ctx.restore();
        };

        attrs.$observe('drawables', draw);
    },
}));

app.factory('TrackModel', ['$http', ($http) => {
    const TrackModel = {
        path: 'm 0,0 0,0',
        properties: null,
    };

    TrackModel.init = (trackName) => {
        $http.get(trackName).then((data) => {
            TrackModel.path = data.data.rawPath;
            TrackModel.properties = svg.svgPathProperties(TrackModel.path);
        });
    };

    TrackModel.getPath = () => TrackModel.path;

    TrackModel.getPositionAtLength = (length) => {
        const relativeLength = length * TrackModel.properties.getTotalLength();
        return TrackModel.properties.getPointAtLength(relativeLength);
    };

    TrackModel.getStartingLine = () => {
        if (TrackModel.properties) {
            const tangent = TrackModel.properties.getTangentAtLength(0);
            const pos = TrackModel.properties.getPointAtLength(0);

            return {
                x0: pos.x - tangent.x,
                y0: pos.y - tangent.y,
                x1: pos.x + tangent.x,
                y1: pos.y + tangent.y,
            };
        }
        return {
            x0: 0, y0: 0, x1: 0, y1: 0,
        };
    };

    return TrackModel;
}]);
