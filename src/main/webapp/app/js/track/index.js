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

app.directive('track', function() {
    return {
        restrict : 'A',
        scope : {
            drawables : '@drawables'
        },
        link : function(scope, elem, attrs) {
            var done = false;
            var xtrans = 0, ytrans = 0;
            var lineWidth = 40;
            var buffer = 16;

            var setBoundingBox = function(ctx,alphaThreshold){
                if (alphaThreshold===undefined) {
                    alphaThreshold = 15;
                }
                var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
                var w=ctx.canvas.width,h=ctx.canvas.height;
                var data = ctx.getImageData(0,0,w,h).data;
                for (var x=0;x<w;++x){
                    for (var y=0;y<h;++y){
                        var a = data[(w*y+x)*4+3];
                        if (a>alphaThreshold){
                            if (x>maxX) {
                                maxX=x;
                            }
                            if (x<minX) {
                                minX=x;
                            }
                            if (y>maxY) {
                                maxY=y;
                            }
                            if (y<minY) {
                                minY=y;
                            }
                        }
                    }
                }

                var width = maxX - minX;
                var height = maxY - minY;
                if (width > 0 && height > 0) {
                    ctx.canvas.width = width + (2 * (lineWidth + buffer));
                    ctx.canvas.height = height + (2 * (lineWidth + buffer));
                    done = true;

                    xtrans = (lineWidth + buffer) - minX;
                    ytrans = (lineWidth + buffer) - minY;
                }

            };

            var draw = function(drawables) {
                drawables = JSON.parse(drawables);
                var path = drawables.path;
                var ctx = elem[0].getContext('2d');
                ctx.save();

                ctx.clearRect(-50, -50, ctx.canvas.width + 50, ctx.canvas.height + 50);

                var p = new Path2D(path);
                ctx.translate(xtrans, ytrans);
                ctx.stroke(p);

                if (!done) {
                    setBoundingBox(ctx, 15);
                }

                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = lineWidth;
                ctx.stroke(p);

                var line = drawables.startingLine;

                ctx.beginPath();
                ctx.strokeStyle = '#ffffff';
                ctx.moveTo(line.x0, line.y0);
                ctx.lineTo(line.x1, line.y1);
                ctx.stroke();

                var cars = drawables.cars;
                cars.forEach(function(car) {
                    ctx.beginPath();
                    ctx.fillStyle = car.colour;
                    ctx.arc(car.loc.x, car.loc.y, 10, 0, 2*Math.PI);
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
        }
    };
});

app.factory('TrackModel', ['$http', function($http) {
    var svg = require('svg-path-properties');
    var TrackModel = {
        path : 'm 0,0 0,0',
        properties : null
    };

    TrackModel.init = function(trackName) {
        $http.get(trackName).then(function(data) {
            TrackModel.path = data.data.rawPath;
            TrackModel.properties = svg.svgPathProperties(TrackModel.path);
        });
    };

    TrackModel.getPath = function() {
        return TrackModel.path;
    };

    TrackModel.getPositionAtLength = function(length) {
        var relativeLength = length * TrackModel.properties.getTotalLength();
        return TrackModel.properties.getPointAtLength(relativeLength);
    };

    TrackModel.getStartingLine = function() {
        if (TrackModel.properties) {
            var tangent = TrackModel.properties.getTangentAtLength(0);
            var pos = TrackModel.properties.getPointAtLength(0);

            return {
                x0 : pos.x - tangent.x,
                y0 : pos.y - tangent.y,
                x1 : pos.x + tangent.x,
                y1 : pos.y + tangent.y
            };
        } else {
            return { x0 : 0, y0 : 0, x1 : 0, y1 : 0 };
        }
    };

    return TrackModel;
}]);