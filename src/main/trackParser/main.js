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

var path = require('svg-path-properties');
var extract = require('extract-svg-path');

var fs = require('fs');

var parseTrack = function(file) {
    var pathToParse = extract('./tracks/' + file);

    var properties = path.svgPathProperties(pathToParse);

    var parts = properties.getParts();

    var parsedPath = {
        svg_url: 'html/tracks/' + file,
        parts: parts.map(function (part) {
            var type = part.type.indexOf('Bezier') !== -1 ? 'c' : 's';
            return {
                length: part.length,
                type: type
            };
        }),
        rawPath: pathToParse
    };

    var savePath = '../resources/html/tracks/' + file + '.track';

    fs.writeFile(savePath, JSON.stringify(parsedPath), err => {
        if (err) throw err;
        console.log('Saved track as ', savePath);
    });
};

fs.readdir('./tracks/', (err, files) => {
    files.forEach(parseTrack);
});