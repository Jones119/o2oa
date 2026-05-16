#!/bin/bash
M2=~/.m2/repository

download() {
  local g=$1 a=$2 v=$3
  local path=$(echo $g | tr '.' '/')
  local dir=$M2/$path/$a/$v
  if [ -f "$dir/$a-$v.pom" ]; then
    return 0
  fi
  mkdir -p $dir
  local base="https://repo1.maven.org/maven2/$path/$a/$v/$a-$v"
  curl -sL "$base.pom" -o "$dir/$a-$v.pom" 2>/dev/null
  curl -sL "$base.jar" -o "$dir/$a-$v.jar" 2>/dev/null
  if [ -f "$dir/$a-$v.pom" ] && [ -s "$dir/$a-$v.pom" ]; then
    echo "OK: $g:$a:$v"
  else
    rm -f "$dir/$a-$v.pom" "$dir/$a-$v.jar"
    echo "MISS: $g:$a:$v"
  fi
}

# Jakarta EE
download jakarta.platform jakarta.jakartaee-api 11.0.0
download jakarta.platform jakartaee-api-parent 11.0.0

# Gson
download com.google.code.gson gson 2.12.1
download com.google.code.gson gson-parent 2.12.1

# OpenJPA
download org.apache.openjpa openjpa 4.0.1
download org.apache.openjpa openjpa-parent 4.0.1

# Commons Lang3
download org.apache.commons commons-lang3 3.20.0
download org.apache.commons commons-parent 69

# Other core dependencies from x_base_core_project/pom.xml
download org.apache.commons commons-io 1.17.1
download org.apache.commons commons-text 1.12.0
download org.apache.commons commons-collections4 4.4
download org.apache.commons commons-pool2 2.12.0
download org.apache.commons commons-dbcp2 2.12.0
download org.apache.commons commons-beanutils 1.8.0
download org.apache.commons commons-vfs2 2.9.0
download org.apache.commons commons-compress 1.26.1
download org.apache.commons commons-email 1.5
download org.apache.commons commons-net 1.11.0
download org.apache.commons commons-math3 3.6.1
download org.apache.commons commons-configuration2 2.10.1
download org.apache.commons commons-csv 1.10.0
download org.apache.commons commons-validator 1.8

# Jetty
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

# Jersey
download org.glassfish.jersey.core jersey-server 3.1.9
download org.glassfish.jersey.core jersey-client 3.1.9
download org.glassfish.jersey.core jersey-common 3.1.9
download org.glassfish.jersey.containers jersey-container-servlet 3.1.9
download org.glassfish.jersey.containers jersey-container-servlet-core 3.1.9
download org.glassfish.jersey.containers jersey-container-jetty-http 3.1.9
download org.glassfish.jersey.media jersey-media-multipart 2.0.2
download org.glassfish.jersey.media jersey-media-json-jackson 3.1.9
download org.glassfish.jersey.inject jersey-hk2 3.1.9

# Swagger
download io.swagger.core.v3 swagger-jaxrs2-jakarta 2.2.30
download io.swagger.core.v3 swagger-core 2.2.30
download io.swagger.core.v3 swagger-models 2.2.30
download io.swagger.core.v3 swagger-annotations 2.0.2

# H2
download com.h2database h2 0.3.2

# JPA
download jakarta.persistence jakarta.persistence-api 3.2.0

# Servlet
download jakarta.servlet jakarta.servlet-api 6.0.0

# Mail
download com.sun.mail jakarta.mail 1.1.1
download jakarta.mail jakarta.mail-api 2.1.0

# JGit
download org.eclipse.jgit org.eclipse.jgit 2.2.30

# Hadoop
download org.apache.hadoop hadoop-hdfs-client 2.10.0

# Lucene
download org.apache.lucene lucene-core 1.1.7
download org.apache.lucene lucene-queryparser 1.1.7
download org.apache.lucene lucene-highlighter 1.1.7
download org.apache.lucene lucene-grouping 1.1.7
download org.apache.lucene lucene-luke 1.1.7

# Quartz
download org.quartz-scheduler quartz 2.1.4

# Zip4j
download net.lingala.zip4j zip4j 10.0

# Playwright
download com.microsoft.playwright playwright 2.11.5

# HanLP
download com.hankcs hanlp 1.1.8

# JSoup
download org.jsoup jsoup 1.3.1

# JSqlParser
download com.github.jsqlparser jsqlparser 1.19.1

# ClassGraph
download io.github.classgraph classgraph 4.8.172

# Cache
download jakarta.cache jakarta.cache-api 1.47.0
download org.jsr107.ri cache-ri-impl 1.1.1

# Neuroph
download com.github.neuroph neuroph-core 1.11.1

# AsciiTable
download de.vandermeer asciitable 0.3.2

# VFS2
download org.apache.commons commons-vfs2-jackrabbit2 2.17.0

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

# JUnit
download org.junit.jupiter junit-jupiter-api 1.2

echo "Done downloading project dependencies"
