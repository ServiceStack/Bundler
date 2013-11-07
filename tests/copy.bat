REM Copy from NuGet to MVC test project

REM Master 'Bundler.cs' is maintained in Bundler.ServiceStack\Bundler.cs 
COPY Bundler.ServiceStack\Bundler.cs  ..\NuGet\Bundler\content\

DEL /F /S /q Bootstrap.Mvc\bundler\*
@rmdir /S /Q Bootstrap.Mvc\bundler
MD Bootstrap.Mvc\bundler
COPY ..\src\bundler.js ..\NuGet\Bundler\content\bundler\
XCOPY  /S /E ..\NuGet\Bundler\content\bundler Bootstrap.Mvc\bundler\
COPY ..\NuGet\Bundler\content\Bundler.cs Bootstrap.Mvc\

DEL /F /S /q Bundler.Mvc\bundler\*
@rmdir /S /Q Bundler.Mvc\bundler
MD Bundler.Mvc\bundler
COPY ..\src\bundler.js ..\NuGet\Bundler\content\bundler\
XCOPY  /S /E ..\NuGet\Bundler\content\bundler Bundler.Mvc\bundler\
COPY ..\NuGet\Bundler\content\Bundler.cs Bundler.Mvc\

DEL /F /S /q Bundler.ServiceStack\bundler\*
@rmdir /S /Q Bundler.ServiceStack\bundler
MD Bundler.ServiceStack\bundler
COPY ..\src\bundler.js ..\NuGet\Bundler\content\bundler\
XCOPY  /S /E ..\NuGet\Bundler\content\bundler Bundler.ServiceStack\bundler\
REM COPY ..\NuGet\Bundler\content\Bundler.cs Bundler.ServiceStack\
