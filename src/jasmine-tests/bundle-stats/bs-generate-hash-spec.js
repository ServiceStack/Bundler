var exec = require('child_process').exec,
      fs = require('fs'),
      bundleStats = require('../../bundle-stats.js');

describe("BundleStatsCollector - Generates Hashes: ", function() {

    var hasher,
        validateHash,
        bundle1 = 'bundle1',
        file1 = 'This is the first file that is going to be hashed.',
        bundle2 = 'bundle2',
        file2 = 'A different bundle that should be hashed differently.',
        bundle3 = 'bundle3',
        file3 = 'A final bundle.';

  beforeEach(function () {

      hasher = new bundleStats.BundleStatsCollector(null);
      validateHash = function (bundle, file, expectedHash) {
          hasher.AddFileHash(bundle, file);
          expect(hasher.HashCollection[bundle]).toBe(expectedHash);
      }
  });

  it("Hashes the file and stores it on the hash collection.", function() { 
      validateHash(bundle1, file1, '2d7023e1788c2814285956796f5fe645');
  });

  it("Multiple files hash without error.", function () {
      validateHash(bundle1, file1, '2d7023e1788c2814285956796f5fe645');
      validateHash(bundle2, file2, 'bdaa3f9dd4a68bc26154b684cde93a93');
      validateHash(bundle3, file3, '829596abcb4295b7e40fa89ecf93ffd7');
  });
});