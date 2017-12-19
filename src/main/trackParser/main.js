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