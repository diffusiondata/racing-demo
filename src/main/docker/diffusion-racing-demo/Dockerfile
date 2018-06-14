FROM openjdk:8u131-jdk-alpine

WORKDIR /opt

EXPOSE 3142

RUN mkdir racing-demo
ADD racing-demo-${project.version}.jar /opt/racing-demo/demo.jar

CMD java -jar /opt/racing-demo/demo.jar