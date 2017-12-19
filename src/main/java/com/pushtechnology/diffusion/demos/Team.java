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
