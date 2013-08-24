// Guids.cs
// MUST match guids.h
using System;

namespace ServiceStack.BundlerRunOnSave
{
    static class GuidList
    {
        public const string guidBundlerRunOnSavePkgString = "be8d8502-0f7a-4142-868c-d78ef3a3ae4b";
        public const string guidBundlerRunOnSaveCmdSetString = "8ddf72e2-0b5f-40de-abe7-437ec7b9d6ff";
        public const string guidBundlerRunOnSaveOutputWindowPane = "2FE38A14-7714-4382-83BF-7831F4B4EE97";

        public static readonly Guid guidBundlerRunOnSaveCmdSet = new Guid(guidBundlerRunOnSaveCmdSetString);
    };
}