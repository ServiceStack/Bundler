@echo off
pushd "%~dp0"

:: process Content and Scripts by default
if "%*" == "" (
    node bundler.js ../Content ../Scripts
) else (
    node bundler.js %*
)

popd