@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\LiveScript\bin\livescript" %*
) ELSE (
  node  "%~dp0\..\LiveScript\bin\livescript" %*
)