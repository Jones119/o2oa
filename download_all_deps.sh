#!/bin/bash
# Download all dependencies for o2server project
# Uses Maven's dependency:resolve to list deps, then downloads missing ones

M2=~/.m2/repository
BASE_URL="https://maven.aliyun.com/repository/central"

download() {
  local g=$1 a=$2 v=$3 packaging=${4:-jar}
  local path=$(echo $g | tr '.' '/')
  local dir=$M2/$path/$a/$v
  mkdir -p "$dir"
  local base="$BASE_URL/$path/$a/$v/$a-$v"
  
  if [ "$packaging" = "pom" ]; then
    if [ ! -f "$dir/$a-$v.pom" ]; then
      curl -sL "$base.pom" -o "$dir/$a-$v.pom" 2>/dev/null
      if [ ! -s "$dir/$a-$v.pom" ]; then
        rm -f "$dir/$a-$v.pom"
        return 1
      fi
    fi
  else
    if [ ! -f "$dir/$a-$v.pom" ]; then
      curl -sL "$base.pom" -o "$dir/$a-$v.pom" 2>/dev/null
      if [ ! -s "$dir/$a-$v.pom" ]; then
        rm -f "$dir/$a-$v.pom"
      fi
    fi
    if [ ! -f "$dir/$a-$v.jar" ]; then
      curl -sL "$base.jar" -o "$dir/$a-$v.jar" 2>/dev/null
      if [ ! -s "$dir/$a-$v.jar" ]; then
        rm -f "$dir/$a-$v.jar"
        return 1
      fi
    fi
  fi
  return 0
}

# Read the root POM and extract all dependency versions
cd /workspace/o2server

# Get properties from root POM
GRAALVM_VERSION=$(xmllint --xpath "//*[local-name()='graalvm.version']/text()" pom.xml 2>/dev/null || echo "24.0.2")
LUCENE_VERSION=$(xmllint --xpath "//*[local-name()='lucene.version']/text()" pom.xml 2>/dev/null || echo "9.11.1")

echo "GraalVM version: $GRAALVM_VERSION"
echo "Lucene version: $LUCENE_VERSION"

# Core dependencies - read from POM
# Jakarta EE
download jakarta.platform jakarta.jakartaee-api 11.0.0
download jakarta.platform jakarta.jakartaee-web-api 11.0.0
download jakarta.platform jakarta.jakartaee-core-api 11.0.0
download jakarta.platform jakartaee-api-parent 11.0.0

# Jakarta individual APIs
download jakarta.servlet jakarta.servlet-api 6.0.0
download jakarta.persistence jakarta.persistence-api 3.2.0
download jakarta.jms jakarta.jms-api 3.1.0
download jakarta.mail jakarta.mail-api 2.1.3
download jakarta.annotation jakarta.annotation-api 2.1.1
download jakarta.validation jakarta.validation-api 3.0.2
download jakarta.ws.rs jakarta.ws.rs-api 3.1.0
download jakarta.xml.bind jakarta.xml.bind-api 4.0.2
download jakarta.activation jakarta.activation-api 2.1.0
download jakarta.transaction jakarta.transaction-api 2.0.1
download jakarta.inject jakarta.inject-api 2.0.1
download jakarta.el jakarta.el-api 5.0.1
download jakarta.interceptor jakarta.interceptor-api 2.2.0

# Eclipse Angus (Mail implementation)
download org.eclipse.angus angus-mail 2.0.3
download org.eclipse.angus jakarta.mail 2.0.3

# Gson
download com.google.code.gson gson 2.12.1

# OpenJPA
download org.apache.openjpa openjpa 4.0.1

# Commons
download org.apache.commons commons-lang3 3.20.0
download org.apache.commons commons-io 1.17.1
download org.apache.commons commons-text 1.12.0
download org.apache.commons commons-collections4 4.4
download org.apache.commons commons-pool2 2.12.0
download org.apache.commons commons-dbcp2 2.12.0
download org.apache.commons commons-beanutils 1.8.0
download org.apache.commons commons-compress 1.26.1
download org.apache.commons commons-email 1.5
download org.apache.commons commons-net 1.11.0
download org.apache.commons commons-math3 3.6.1
download org.apache.commons commons-configuration2 2.10.1
download org.apache.commons commons-csv 1.10.0
download org.apache.commons commons-validator 1.8
download org.apache.commons commons-codec 1.17.1
download org.apache.commons commons-exec 1.3
download org.apache.commons commons-cli 1.2
download org.apache.commons commons-fileupload 1.5
download org.apache.commons commons-dbutils 1.8.1

# Jetty 12
download org.eclipse.jetty jetty-server 12.0.14
download org.eclipse.jetty jetty-servlet 12.0.14
download org.eclipse.jetty jetty-webapp 12.0.14
download org.eclipse.jetty jetty-plus 12.0.14
download org.eclipse.jetty jetty-jndi 12.0.14
download org.eclipse.jetty jetty-deploy 12.0.14
download org.eclipse.jetty jetty-util 12.0.14
download org.eclipse.jetty jetty-http 12.0.14
download org.eclipse.jetty jetty-io 12.0.14
download org.eclipse.jetty jetty-security 12.0.14
download org.eclipse.jetty jetty-session 12.0.14
download org.eclipse.jetty jetty-xml 12.0.14
download org.eclipse.jetty jetty-jmx 12.0.14
download org.eclipse.jetty jetty-rewrite 12.0.14
download org.eclipse.jetty jetty-alpn-server 12.0.14
download org.eclipse.jetty jetty-alpn-java-server 12.0.14
download org.eclipse.jetty.http2 http2-server 12.0.14
download org.eclipse.jetty.http2 http2-common 12.0.14
download org.eclipse.jetty.http2 http2-hpack 12.0.14
download org.eclipse.jetty.toolchain jetty-jakarta-servlet-api 6.0.0

# Jersey
download org.glassfish.jersey.core jersey-server 3.1.9
download org.glassfish.jersey.core jersey-client 3.1.9
download org.glassfish.jersey.core jersey-common 3.1.9
download org.glassfish.jersey.containers jersey-container-servlet 3.1.9
download org.glassfish.jersey.containers jersey-container-servlet-core 3.1.9
download org.glassfish.jersey.containers jersey-container-jetty-http 3.1.9
download org.glassfish.jersey.media jersey-media-multipart 3.1.9
download org.glassfish.jersey.media jersey-media-json-jackson 3.1.9
download org.glassfish.jersey.inject jersey-hk2 3.1.9
download org.glassfish.jersey.bundles jersey-project-core 3.1.9

# HK2
download org.glassfish.hk2 hk2-locator 3.0.6
download org.glassfish.hk2 hk2-api 3.0.6
download org.glassfish.hk2 hk2-utils 3.0.6
download org.glassfish.hk2 osgi-resource-locator 1.0.3
download org.glassfish.hk2 external jakarta.inject 2.6.1

# Swagger
download io.swagger.core.v3 swagger-jaxrs2-jakarta 2.2.30
download io.swagger.core.v3 swagger-core 2.2.30
download io.swagger.core.v3 swagger-models 2.2.30
download io.swagger.core.v3 swagger-annotations 2.0.2
download io.swagger.core.v3 swagger-integration 2.2.30

# H2
download com.h2database h2 2.3.232

# JGit
download org.eclipse.jgit org.eclipse.jgit 7.1.0.202411261347-r

# Hadoop
download org.apache.hadoop hadoop-hdfs-client 3.4.1

# Lucene
download org.apache.lucene lucene-core 9.11.1
download org.apache.lucene lucene-queryparser 9.11.1
download org.apache.lucene lucene-highlighter 9.11.1
download org.apache.lucene lucene-grouping 9.11.1
download org.apache.lucene lucene-analysis-common 9.11.1
download org.apache.lucene lucene-backward-codecs 9.11.1

# Quartz
download org.quartz-scheduler quartz 2.5.0-rc1

# Zip4j
download net.lingala.zip4j zip4j 2.11.5

# Playwright
download com.microsoft.playwright playwright 1.49.0

# HanLP
download com.hankcs hanlp portable-1.8.4

# JSoup
download org.jsoup jsoup 1.18.1

# JSqlParser
download com.github.jsqlparser jsqlparser 5.0

# ClassGraph
download io.github.classgraph classgraph 4.8.172

# Cache
download jakarta.cache jakarta.cache-api 1.1.1
download org.jsr107.ri cache-ri-impl 1.1.1

# Neuroph
download com.github.neuroph neuroph-core 2.96

# AsciiTable
download de.vandermeer asciitable 0.3.2

# BouncyCastle
download org.bouncycastle bcprov-jdk18on 1.78.1
download org.bouncycastle bcpkix-jdk18on 1.78.1

# SLF4J
download org.slf4j slf4j-api 2.0.13
download org.slf4j slf4j-simple 2.0.13

# Jackson
download com.fasterxml.jackson.core jackson-core 2.17.0
download com.fasterxml.jackson.core jackson-databind 2.17.0
download com.fasterxml.jackson.core jackson-annotations 2.17.0
download com.fasterxml.jackson.datatype jackson-datatype-jsr310 2.17.0
download com.fasterxml.jackson.module jackson-module-jakarta-xmlbind-annotations 2.17.0

# JUnit
download org.junit.jupiter junit-jupiter-api 5.10.2
download org.junit.jupiter junit-jupiter-engine 5.10.2

# GraalVM
download org.graalvm.js js 24.0.2
download org.graalvm.js js-scriptengine 24.0.2
download org.graalvm.sdk graal-sdk 24.0.2
download org.graalvm.truffle truffle-api 24.0.2
download org.graalvm.polyglot polyglot 24.0.2

# VFS2
download org.apache.commons commons-vfs2 2.9.0

# Apache POI
download org.apache.poi poi 5.3.0
download org.apache.poi poi-ooxml 5.3.0
download org.apache.poi poi-scratchpad 5.3.0

# ImageIO
download com.github.jai-imageio jai-imageio-core 1.4.0
download com.twelvemonkeys.imageio imageio-core 3.10.1
download com.twelvemonkeys.imageio imageio-jpeg 3.10.1
download com.twelvemonkeys.imageio imageio-tiff 3.10.1

# Tika
download org.apache.tika tika-core 2.9.2
download org.apache.tika tika-parsers-standard-package 2.9.2

# PDF
download org.apache.pdfbox pdfbox 3.0.3

# Guava
download com.google.guava guava 33.3.1-jre
download com.google.guava failureaccess 1.0.2

# FindBugs
download com.google.code.findbugs jsr305 3.0.2

# ASM
download org.ow2.asm asm 9.7
download org.ow2.asm asm-commons 9.7

# Xerces
download xerces xercesImpl 2.12.2

# JAXB runtime
download org.glassfish.jaxb jaxb-runtime 4.0.5
download org.glassfish.jaxb jaxb-core 4.0.5
download org.glassfish.jaxb txw2 4.0.5
download com.sun.istack istack-commons-runtime 4.1.2

# MIME pulling
download org.jvnet.mimepull mimepull 1.10.0

# JNA
download net.java.dev.jna jna 5.14.0
download net.java.dev.jna jna-platform 5.14.0

echo "Done downloading all project dependencies"
