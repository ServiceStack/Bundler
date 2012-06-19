@echo off
pushd "%~dp0"

:: process Content and Scripts by default
if "%*" == "" (
    node bundler.js #skipmin ../Content-CommandLineOptions
) else (
    node bundler.js %*
)

popd