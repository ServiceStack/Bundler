var exec = require('child_process').exec,
      fs = require('fs'),
      bundleStats = require('../../bundle-stats.js');

describe("BundleStatsCollector - Load Hashes From Disk: ", function() {

    var getHasher,
      fileSystem,
      objectOnDisk = { bundle1: "hash1", bundle2: "hash2" },
      outputdirectory = 'folder/folder/2',
      expectedHashFile = outputdirectory + '/' + bundleStats.HASH_FILE_NAME,
      expectedDebugFile = outputdirectory + '/' + bundleStats.DEBUG_FILE_NAME,
      expectedAbConfigFile = outputdirectory + '/' + bundleStats.AB_FILE_NAME,
      expectedLocalizationFile = outputdirectory + '/' + bundleStats.LOCALIZATION_FILE_NAME;

  beforeEach(function () {

      fileSystem = {};
      fileSystem.readFileSync = function () {
          return JSON.stringify(objectOnDisk);
      };

      getHasher = function () {
          spyOn(fileSystem, 'readFileSync').andCallThrough();
          return new bundleStats.BundleStatsCollector(fileSystem);
      };
  });

  it("Reads the hash file from the correct location.", function() {
      var hasher = getHasher();
      hasher.LoadStatsFromDisk(outputdirectory);
      expect(fileSystem.readFileSync).toHaveBeenCalledWith(expectedHashFile, 'utf8')
  });

    it("Reads the debug file from the correct location.", function() {
        var hasher = getHasher();
        hasher.LoadStatsFromDisk(outputdirectory);
        expect(fileSystem.readFileSync).toHaveBeenCalledWith(expectedDebugFile, 'utf8')
    });

    it("Reads the localization file from the correct location.", function() {
        var hasher = getHasher();
        hasher.LoadStatsFromDisk(outputdirectory);
        expect(fileSystem.readFileSync).toHaveBeenCalledWith(expectedLocalizationFile, 'utf8')
    });

    it("Reads the ab config file from the correct location.", function() {
        var hasher = getHasher();
        hasher.LoadStatsFromDisk(outputdirectory);
        expect(fileSystem.readFileSync).toHaveBeenCalledWith(expectedAbConfigFile, 'utf8')
    });

  it("Correctly handles trailing slash for input file.", function () {
      var hasher = getHasher();
      hasher.LoadStatsFromDisk(outputdirectory + '/');
      expect(fileSystem.readFileSync).toHaveBeenCalledWith(expectedHashFile, 'utf8')
  });

  it("Parses the input file into json.", function () {
      var hasher = getHasher();
      hasher.LoadStatsFromDisk(outputdirectory);
      
      expect(hasher.HashCollection.bundle1).toBe(objectOnDisk.bundle1);
      expect(hasher.HashCollection.bundle2).toBe(objectOnDisk.bundle2);
  });

  it("On file error, the hash collection is empty", function () {

      fileSystem.readFileSync = function () {
          throw "an exception";
      };

      var hasher = getHasher();
      hasher.LoadStatsFromDisk(outputdirectory);

      expect(hasher.HashCollection.bundle1).toBe(undefined);
      expect(hasher.HashCollection.bundle2).toBe(undefined);
  });

});