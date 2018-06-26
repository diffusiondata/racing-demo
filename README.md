Racing Demo
===

Building
---

Run

    mvn clean install

from the root of this repository.


Running
---

Download and install Diffusion 6.0. Start a Diffusion server locally,
using the default configuration which will accept connections on port
8080.

Execute the jar in the target directory

    cd target && java -jar racing-demo-1.0-SNAPSHOT.jar


This will run a Java process that starts a local web server on port
3142, connects to the Diffusion server, and generates race data.

Use a web browser to connect to http://localhost:3142/ to see the race
track.


More details
---

Read the blog [here](https://www.pushtechnology.com/blog/play-back-historical-data-with-time-series-topics)
