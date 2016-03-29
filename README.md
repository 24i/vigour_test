# test
Test runner for universal modules

## Installation

`npm i [-g] vigour-test [--save-dev]`

Don't use `--save-dev` if installing globally

## Usage

`vtest`

This will take the file passed via the `files` configuration property, browserify it, and run it in the Nightmare headless browser. It will also extract the logs and print them to the output, detecting whether the tests passed, failed, threw, or time out (tests must adhere to the TAP protocol). If and only if the tests pass, the script will exit with `0`.

See the [vigour-config docs](https://github.com/vigour-io/config#readme) for information on how to configure and launch the test runner and where to get more info for all the configuration options.
