SET FROM=..\src
SET DIST=..\NuGet\content\bundler

DEL /F /S /q %DIST%\*
@rmdir /S /Q %DIST%
MD %DIST%\


COPY %FROM%\* %DIST%
MD %DIST%\node_modules\.bin
COPY %FROM%\node_modules\.bin\* %DIST%\node_modules\.bin

MD %DIST%\node_modules\clean-css\bin %DIST%\node_modules\clean-css\lib %DIST%\node_modules\clean-css\node_modules\optimist 
COPY %FROM%\node_modules\clean-css\bin\* %DIST%\node_modules\clean-css\bin 
COPY %FROM%\node_modules\clean-css\lib\* %DIST%\node_modules\clean-css\lib 
COPY %FROM%\node_modules\clean-css\node_modules\optimist\index.js %DIST%\node_modules\clean-css\node_modules\optimist 
COPY %FROM%\node_modules\clean-css\bin\* %DIST%\node_modules\clean-css\bin 
COPY %FROM%\node_modules\clean-css\index.js %DIST%\node_modules\clean-css

MD %DIST%\node_modules\coffee-script\bin %DIST%\node_modules\coffee-script\lib\coffee-script %DIST%\node_modules\coffee-script\node_modules\extras
COPY %FROM%\node_modules\coffee-script\bin\* %DIST%\node_modules\coffee-script\bin 
COPY %FROM%\node_modules\coffee-script\lib\coffee-script\* %DIST%\node_modules\coffee-script\lib\coffee-script
COPY %FROM%\node_modules\coffee-script\package.json %DIST%\node_modules\coffee-script

REM Try using single coffee-script.js
REM MD %DIST%\node_modules\coffee-script
REM COPY %FROM%\node_modules\coffee-script\extras\coffee-script.js %DIST%\node_modules\coffee-script\index.js

MD %DIST%\node_modules\less\bin %DIST%\node_modules\less\lib\less\tree
COPY %FROM%\node_modules\less\bin\* %DIST%\node_modules\less\bin 
COPY %FROM%\node_modules\less\lib\less\* %DIST%\node_modules\less\lib\less
COPY %FROM%\node_modules\less\lib\less\tree\* %DIST%\node_modules\less\lib\less\tree
COPY %FROM%\node_modules\less\package.json %DIST%\node_modules\less

REM Try using single less.js
REM MD %DIST%\node_modules\less
REM COPY %FROM%\node_modules\less\dist\less-1.3.0.js %DIST%\node_modules\less\index.js


MD %DIST%\node_modules\lib
COPY %FROM%\node_modules\lib\* %DIST%\node_modules\lib 

MD %DIST%\node_modules\sass\lib
COPY %FROM%\node_modules\sass\package.json %DIST%\node_modules\sass
COPY %FROM%\node_modules\sass\lib\* %DIST%\node_modules\sass\lib

MD %DIST%\node_modules\step\lib
COPY %FROM%\node_modules\step\package.json %DIST%\node_modules\step
COPY %FROM%\node_modules\step\lib\* %DIST%\node_modules\step\lib

COPY %FROM%\node_modules\uglify-js.js %DIST%\node_modules

MD %DIST%\vs2010-extension
COPY %FROM%\vs\BundlerRunOnSave\bin\Release\* %DIST%\vs2010-extension
