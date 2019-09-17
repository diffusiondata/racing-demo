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

import static spark.Spark.externalStaticFileLocation;
import static spark.Spark.init;
import static spark.Spark.port;

import java.nio.file.Paths;
import java.util.Arrays;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import com.pushtechnology.diffusion.client.Diffusion;
import com.pushtechnology.diffusion.client.session.Session;

import joptsimple.OptionParser;
import joptsimple.OptionSet;

/**
 * Main class to handle initialisation and stuff.
 * Here we also start the web server to serve our JS bits.
 *
 */
public class Main {
    public static void main(String[] args) throws InterruptedException, ExecutionException, TimeoutException {
        final OptionParser optionParser = new OptionParser();

        optionParser.acceptsAll(Arrays.asList("u", "url"), "URL of Diffusion server")
            .withRequiredArg()
            .ofType(String.class)
            .defaultsTo("ws://localhost:8080");
        optionParser.acceptsAll(Arrays.asList("p", "principal"), "Principal (username)")
            .withRequiredArg()
            .ofType(String.class)
            .defaultsTo("control");
        optionParser.acceptsAll(Arrays.asList("c", "credentials"), "Credentials (password)")
            .withRequiredArg()
            .ofType(String.class)
            .defaultsTo("password");
        // FB18994 - make a root topic configurable at run time as an argument

        optionParser.acceptsAll(Arrays.asList("h", "?", "help"), "show help").forHelp();

        final OptionSet options = optionParser.parse(args);

        // Start web server
        startWebServer();

        final String principal = (String) options.valueOf("principal");
        final String credentials = (String) options.valueOf("credentials");
        final String url = (String) options.valueOf("url");
        // Connect to Diffusion
        final Session session = Diffusion.sessions().principal(principal)
                .credentials(Diffusion.credentials().password(credentials))
                .open(url);
        // Load the race
        final Race race = RaceBuilder
            .create()
            .fromProperties()
            .setDiffusionSession(session)
            .setDiffusionSession(session).build();

        if (race == null) {
            System.out.println("ERROR: Failed to create race!");
            System.exit(42);
            return;
        }

        // Start the race
        race.start();
    }

    private static void startWebServer() {
        port(3142);
        System.out.println(Paths.get("html").toAbsolutePath());
        externalStaticFileLocation("html");
        init();
    }
}
