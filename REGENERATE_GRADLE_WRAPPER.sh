#!/bin/bash
# This script regenerates the Gradle wrapper
# Run from the project root: bash REGENERATE_GRADLE_WRAPPER.sh

cd android

# Download Gradle 8.14.3
curl -L https://services.gradle.org/distributions/gradle-8.14.3-bin.zip -o gradle-8.14.3-bin.zip

# Extract it
unzip -q gradle-8.14.3-bin.zip

# Run gradle wrapper to generate the wrapper jar
gradle-8.14.3/bin/gradle wrapper --gradle-version 8.14.3

# Clean up
rm -rf gradle-8.14.3 gradle-8.14.3-bin.zip

echo "Gradle wrapper regenerated successfully!"
