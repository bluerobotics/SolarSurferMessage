[![Build Status](https://travis-ci.org/bluerobotics/SolarSurferMessage.svg?branch=master)](https://travis-ci.org/bluerobotics/SolarSurferMessage)

# SolarSurferMessage

Message definition and supporting libraries for the [SolarSurfer](http://bluerobotics.com/) project.

## Overview

The project defines the command and telemetry definitions for the SolarSurfer project. JavaScript and C libraries are included to ease encoding and decoding messages.

## Setup

Get the code:

```bash
git clone https://github.com/bluerobotics/SolarSurferMessage.git
cd SolarSurferMessage
npm install
```

Run the tests:

```bash
npm test
```

## Message Formats

Message formats are stored in the [src/formats.json](src/formats.json) file. Formats are defined by an unsigned integer and contain `name`, `payload` fields, and `multipacket` fields. The payload field contains the definition for an array of variables that makes up the comm format. Each variable definition is an object and must have a `name` and `type` defined. Variables of type `enum` and `bitmap` also must have a `map` defined. Maps for `enums` can have up to 256 values and maps for `bitmaps` can have up to 8 values.

To reduce duplicate variable definitions across formats, variable definitions can be defined in the upper level `shared` object. These definitions can be reference by defining subsequent variable definitions to the shared object key (a string) instead of an object.

Once message formats are defined, preview the results the info script. This will parse the formats file and verify that all message formats are valid.

```bash
npm run-script info
```

### Data Types

The following data types are supported:

Data Type | Number of Bits | Range
--- | --- | ---
uint8_t | 8 | 0 .. 255
int8_t | 8 | -128 .. 127
uint16_t | 16 | 0 .. 65,535
int16_t | 16 | -32,768 .. 32,767
uint32_t | 32 | 0 .. 4,294,967,295
int32_t | 32 | -2,147,483,648 .. 2,147,483,647
float | 32 | -3.4E38 .. 3.4E38
double | 64 | -1.7E308 .. 1.7E308
enum | 8 | the entire value is used in a lookup map
bitmap | 8 | each bit is an isolated value
char | 8 | 7 bit ascii value
hex | 8 | 00 .. ff

To be compatible with the ARM architecture, all data types are represented in little endian format.

## JavaScript API

The JavaScript and C libraries have identical APIs.

* `Message.encode(msg_object)` - returns a hex string of the supplied message
* `Message.decode(hex_string)` - returns the message represented by the supplied hex_string

A typical application looks like this:

```javascript
var msg = {
    format: 1,
    version: 1
}
var hex = SolarSurferComm.encode(msg);
```

## Cross-Compiling C Library

This package can cross-compile the `formats.json` file into an AVR-compatible message library. This makes it easy to publish a message to the RockBlock modem on an Arduino-like platform.

```bash
npm run-script makeclib
```

The C files are now available in `output/`.

## Change History

This project uses [semantic versioning](http://semver.org/).

### v0.1.0 - tbd

* Message format v1
* Initial release

## TODO

* Decoding
  * images
* Encoding
  * integers
  * conversion factors
  * images
  * map types
