SET FROM=..\src
SET DIST=..\NuGet\Bundler\content\bundler

DEL /F /S /q %DIST%\*
@rmdir /S /Q %DIST%
MD %DIST%

COPY %FROM%\* %DIST%
MD %DIST%\node_modules\.bin
COPY %FROM%\node_modules\.bin\* %DIST%\node_modules\.bin

MD %DIST%\node_modules\coffee-script\bin 
MD %DIST%\node_modules\coffee-script\lib\coffee-script 
MD %DIST%\node_modules\coffee-script\node_modules\extras
COPY %FROM%\node_modules\coffee-script\bin\* %DIST%\node_modules\coffee-script\bin
COPY %FROM%\node_modules\coffee-script\lib\coffee-script\* %DIST%\node_modules\coffee-script\lib\coffee-script
COPY %FROM%\node_modules\coffee-script\package.json %DIST%\node_modules\coffee-script

MD %DIST%\node_modules\LiveScript 
MD %DIST%\node_modules\LiveScript\bin 
MD %DIST%\node_modules\LiveScript\lib
COPY %FROM%\node_modules\LiveScript\bin\* %DIST%\node_modules\LiveScript\bin
COPY %FROM%\node_modules\LiveScript\lib\* %DIST%\node_modules\LiveScript\lib
COPY %FROM%\node_modules\LiveScript\package.json %DIST%\node_modules\LiveScript

REM MD %DIST%\node_modules\typescript %DIST%\node_modules\typescript\bin
REM XCOPY %FROM%\node_modules\typescript %DIST%\node_modules\typescript /s /e
REM COPY %FROM%\node_modules\typescript\bin\* %DIST%\node_modules\typescript\bin

MD %DIST%\node_modules\clean-css\bin 
MD %DIST%\node_modules\clean-css\lib 
MD %DIST%\node_modules\clean-css\node_modules\optimist
COPY %FROM%\node_modules\clean-css\bin\* %DIST%\node_modules\clean-css\bin
XCOPY %FROM%\node_modules\clean-css\lib %DIST%\node_modules\clean-css\lib /s /e
COPY %FROM%\node_modules\clean-css\node_modules\optimist\index.js %DIST%\node_modules\clean-css\node_modules\optimist
COPY %FROM%\node_modules\clean-css\bin\* %DIST%\node_modules\clean-css\bin
COPY %FROM%\node_modules\clean-css\index.js %DIST%\node_modules\clean-css

MD %DIST%\node_modules\less\bin 
MD %DIST%\node_modules\less\lib\less\tree
COPY %FROM%\node_modules\less\bin\* %DIST%\node_modules\less\bin
COPY %FROM%\node_modules\less\lib\less\* %DIST%\node_modules\less\lib\less
COPY %FROM%\node_modules\less\lib\less\tree\* %DIST%\node_modules\less\lib\less\tree
COPY %FROM%\node_modules\less\package.json %DIST%\node_modules\less

MD %DIST%\node_modules\stylus
XCOPY %FROM%\node_modules\stylus %DIST%\node_modules\stylus /s /e

MD %DIST%\node_modules\nib
XCOPY %FROM%\node_modules\nib %DIST%\node_modules\nib /s /e

MD %DIST%\node_modules\lib
COPY %FROM%\node_modules\lib\* %DIST%\node_modules\lib

MD %DIST%\node_modules\debug
XCOPY %FROM%\node_modules\debug %DIST%\node_modules\debug /s /e

MD %DIST%\node_modules\node-sass 
MD %DIST%\node_modules\node-sass\bin 
MD %DIST%\node_modules\node-sass\bin\darwin-x64-v8-3.14 
MD %DIST%\node_modules\node-sass\bin\win32-ia32-v8-3.14 
MD %DIST%\node_modules\node-sass\bin\win32-x64-v8-3.14
MD %DIST%\node_modules\node-sass\node_modules 
MD %DIST%\node_modules\node-sass\node_modules\node-sass-middleware 
MD %DIST%\node_modules\node-sass\node_modules\object-assign 
COPY %FROM%\node_modules\node-sass\*.js %DIST%\node_modules\node-sass
COPY %FROM%\node_modules\node-sass\*.json %DIST%\node_modules\node-sass
COPY %FROM%\node_modules\node-sass\*.md %DIST%\node_modules\node-sass
COPY %FROM%\node_modules\node-sass\bin\* %DIST%\node_modules\node-sass\bin
COPY %FROM%\node_modules\node-sass\bin\darwin-x64-v8-3.14\* %DIST%\node_modules\node-sass\bin\darwin-x64-v8-3.14
COPY %FROM%\node_modules\node-sass\bin\win32-ia32-v8-3.14\* %DIST%\node_modules\node-sass\bin\win32-ia32-v8-3.14
COPY %FROM%\node_modules\node-sass\bin\win32-x64-v8-3.14\* %DIST%\node_modules\node-sass\bin\win32-x64-v8-3.14
XCOPY %FROM%\node_modules\node-sass\node_modules\node-sass-middleware %DIST%\node_modules\node-sass\node_modules\node-sass-middleware /s /e
XCOPY %FROM%\node_modules\node-sass\node_modules\object-assign %DIST%\node_modules\node-sass\node_modules\object-assign /s /e


MD %DIST%\node_modules\step\lib
COPY %FROM%\node_modules\step\package.json %DIST%\node_modules\step
COPY %FROM%\node_modules\step\lib\* %DIST%\node_modules\step\lib

COPY %FROM%\node_modules\uglify-js.js %DIST%\node_modules

MD %DIST%\vs2010-extension
REM Re-enable when we re-build vs extension
REM COPY %FROM%\vs\BundlerRunOnSave\bin\Release\* %DIST%\vs2010-extension
