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

package com.pushtechnology.diffusion.demos;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Objects;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;

public class RaceTrack {
    private static Part loadPart(int index, JsonParser parser, double location) throws IOException {
        if (parser.nextToken() != JsonToken.FIELD_NAME) {
            throw new IOException( "Field name expected.");
        }
        if (!Objects.equals(parser.getCurrentName(), "length")) {
            throw new IOException("length field expected.");
        }

        parser.nextToken();
        double length = parser.getDoubleValue();

        if (parser.nextToken() != JsonToken.FIELD_NAME) {
            throw new IOException("Field name expected.");
        }
        if (!Objects.equals(parser.getCurrentName(), "type")) {
            throw new IOException("type field expected.");
        }

        parser.nextToken();
        String val = parser.getText();
        Part.TYPE type;
        if (Objects.equals(val, "s")) {
            type = Part.TYPE.STRAIGHT;
        } else if (Objects.equals(val, "c")) {
            type = Part.TYPE.CURVED;
        } else {
            throw new IOException("Invalid part type detected.");
        }
        if (parser.nextToken() != JsonToken.END_OBJECT) {
            throw new IOException("Expected object to end.");
        }

        return new Part(index, type, length, location);
    }

    private final String trackFile;
    private final ArrayList<Part> parts = new ArrayList<>();
    private final double length;

    RaceTrack(String filename) throws IOException {
        ClassLoader classLoader = getClass().getClassLoader();

        double len = 0.0;
        try (JsonParser parser = new JsonFactory().createParser(classLoader.getResource(filename))) {
            while (parser.nextToken() != JsonToken.END_OBJECT) {
                if (Objects.equals(parser.getCurrentName(), "parts")) {
                    // We found parts so load them
                    if (parser.nextToken() != JsonToken.START_ARRAY) {
                        throw new IOException("Array expected.");
                    }
                    int index = 0;
                    while (parser.nextToken() == JsonToken.START_OBJECT) {
                        Part part = loadPart(index, parser, len);
                        len += part.length;
                        parts.add(part);
                        index += 1;
                    }
                    break;
                }
            }
        }

        length = len;
        trackFile = filename;
    }

    String getFileName() {
        return trackFile;
    }

    double getLength() {
        return length;
    }

    Part getPart(Car car) {
        final double location = car.getLocation() * length;

        // Find segment this car is in
        for (Part part : parts) {
            if (location >= part.location
                    && location <= part.location + part.length) {
                return part;
            }
        }

        return null;
    }

    Part getNextPart(int id) {
        if (id == parts.size() - 1 ) {
            return parts.get(0);
        }
        return parts.get(id + 1);
    }

    static class Part {
        private enum TYPE {
            STRAIGHT,
            CURVED,
        }

        private final int id;
        private final double location;
        private final double length;
        private final TYPE type;

        Part(int id, TYPE type, double length, double location) {
            this.id = id;
            this.type = type;
            this.length = length;
            this.location = location;
        }

        int getId() { return id; }

        double getLocation() { return location; }

        double getLength() { return length; }

        boolean isCurved() { return type == TYPE.CURVED; }
    }
}
