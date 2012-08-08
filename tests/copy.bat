REM Copy from NuGet to MVC test project

DEL /F /S /q Bootstrap.Mvc\bundler\*
@rmdir /S /Q Bootstrap.Mvc\bundler
MD Bootstrap.Mvc\bundler
XCOPY  /S /E ..\NuGet\content\bundler Bootstrap.Mvc\bundler
COPY ..\NuGet\content\Mvc.Bundler.cs Bootstrap.Mvc\