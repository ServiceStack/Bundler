@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\node-sass\bin\node-sass" %*
) ELSE (
  node  "%~dp0\..\node-sass\bin\node-sass" %*
)