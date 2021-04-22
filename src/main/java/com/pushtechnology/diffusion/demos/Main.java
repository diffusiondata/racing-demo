/*
 * Copyright (C) 2017,2020 Push Technology Ltd.

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

import static java.util.Arrays.asList;
import static spark.Spark.externalStaticFileLocation;
import static spark.Spark.init;
import static spark.Spark.port;
import static spark.Spark.get;

import java.nio.file.Paths;

import com.pushtechnology.diffusion.client.Diffusion;
import com.pushtechnology.diffusion.client.session.Session;
import com.pushtechnology.diffusion.client.session.Session.Listener;
import com.pushtechnology.diffusion.client.session.Session.State;
import com.pushtechnology.diffusion.client.internal.session.SessionEstablishmentTransientException;

import joptsimple.OptionParser;
import joptsimple.OptionSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main class to handle initialisation and stuff.
 * Here we also start the web server to serve our JS bits.
 *
 */
public class Main {

    private static final Logger LOG = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) {
        final OptionParser optionParser = new OptionParser();

        optionParser.acceptsAll(asList("u", "url"), "URL of Diffusion server")
                .withRequiredArg()
                .ofType(String.class)
                .defaultsTo("ws://localhost:8080");
        optionParser.acceptsAll(asList("p", "principal"), "Principal (username)")
                .withRequiredArg()
                .ofType(String.class)
                .defaultsTo("control");
        optionParser.acceptsAll(asList("c", "credentials"), "Credentials (password)")
                .withRequiredArg()
                .ofType(String.class)
                .defaultsTo("password");
        optionParser.acceptsAll(asList("r", "root"), "Topic tree root topic name")
                .withRequiredArg()
                .ofType(String.class)
                .defaultsTo("Demos/Race");
        // FB18994 - make a root topic configurable at run time as an argument

        optionParser.acceptsAll(asList("h", "?", "help"), "show help").forHelp();

        final OptionSet options = optionParser.parse(args);

        // Start web server
        startWebServer(options);

        final String principal = (String) options.valueOf("principal");
        final String credentials = (String) options.valueOf("credentials");
        final String url = (String) options.valueOf("url");
        final String topic = (String) options.valueOf("root");
        final int reconnection_time = 30000;
        LOG.info("The value of root= {}", options.valueOf("root"));

        try {
                // Connect to Diffusion
                final Session session = Diffusion.sessions().principal(principal)
                .credentials(Diffusion.credentials().password(credentials))
                .reconnectionTimeout(reconnection_time)
                .open(url);

                session.addListener(new Listener() {
                        @Override
                        public void onSessionStateChanged(Session session, State oldState, State newState) {
                            if (newState == State.CLOSED_FAILED) {
                                LOG.error("Unable to reconnect to Diffusion at " + url);
                                System.exit(1);
                            }
                        }
                    });

                // Load the race
                final Race race = RaceBuilder
                .create()
                .fromProperties(topic)
                .setDiffusionSession(session)
                .setDiffusionSession(session).build();

                // Start the race
                race.start();

        } catch (SessionEstablishmentTransientException e) {
                LOG.error("Failed to create race!");
                LOG.error(e.toString());
                System.exit(42);
        }
    }

    private static void startWebServer(OptionSet options) {
        port(3142);
        LOG.info("The value of 'html'= {}", Paths.get("html").toAbsolutePath().toString());
        externalStaticFileLocation("html");
        get("/race/topic", (req, res) -> options.valueOf("root"));
        init();
    }
}
