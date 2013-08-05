@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\LiveScript\bin\slake" %*
) ELSE (
  node  "%~dp0\..\LiveScript\bin\slake" %*
)