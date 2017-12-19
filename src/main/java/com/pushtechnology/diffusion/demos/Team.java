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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Team {
    private final ArrayList<Car> cars;
    private final String name;
    private final int id;

    public Team(int id, String name, ArrayList<Car> cars) {
        this.id = id;
        this.name = name;
        this.cars = cars;
    }

    public List<Car> getCars() {
        return Collections.unmodifiableList(cars);
    }

    public int getCarCount() {
        return cars.size();
    }

    public String getName() {
        return name;
    }

    public int getID() {
        return id;
    }
}
