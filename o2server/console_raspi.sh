sudo $(cd "$(dirname "$0")"; pwd)/jvm/raspi_java25/bin/java -javaagent:$(cd "$(dirname "$0")"; pwd)/console.jar=shadow -cp $(cd "$(dirname "$0")"; pwd)/console.jar com.x.server.console.Shadow
