var exec = require('child_process').exec,
      fs = require('fs'),
      bundleStats = require('../../bundle-stats.js');

describe("BundleStatsCollector - Adds files to the debug collection: ", function() {

    var hasher,
        validateBundle,
        bundle1 = 'bundle1',
        file1 = 'This is the first file that is going to be hashed.',
        bundle2 = 'bundle2',
        file2 = 'A different bundle that should be hashed differently.',
        bundle3 = 'bundle3',
        file3 = 'A final bundle.',
        stats;

  beforeEach(function () {

      stats = new bundleStats.BundleStatsCollector(null);
      stats.DebugCollection = {};
      validateBundle = function(bundleName, files)
      {
          expect(stats.DebugCollection[bundleName].length).toBe(files.length);

          for(var i=0; i<files.length; i++) {
              expect(stats.DebugCollection[bundleName][i]).toBe(files[i]);
          }
      };
  });

  it("Adds files to the collection.", function() {

      stats.AddDebugFile(bundle1, file1);

      validateBundle(bundle1, [ file1 ]);

      stats.AddDebugFile(bundle1, file2);

      validateBundle(bundle1, [ file1, file2 ]);

      stats.AddDebugFile(bundle1, file3);

      validateBundle(bundle1, [ file1, file2, file3 ]);
  });

    it("Clearing a bundle removes all debug files.", function() {

        stats.AddDebugFile(bundle1, file1);
        stats.AddDebugFile(bundle1, file2);

        validateBundle(bundle1, [ file1, file2 ]);

        stats.ClearStatsForBundle(bundle1);

        validateBundle(bundle1, [ ]);
    });


    it("Duplicate files are not added.", function() {

        stats.AddDebugFile(bundle1, file1);

        validateBundle(bundle1, [ file1 ]);

        stats.AddDebugFile(bundle1, file1);

        validateBundle(bundle1, [ file1 ]);

        stats.AddDebugFile(bundle1, file1);

        validateBundle(bundle1, [ file1 ]);
    });


    it("Files added are isolated to their collection.", function() {

        stats.AddDebugFile(bundle1, file1);
        stats.AddDebugFile(bundle2, file2);
        stats.AddDebugFile(bundle3, file3);

        validateBundle(bundle1, [ file1 ]);
        validateBundle(bundle2, [ file2 ]);
        validateBundle(bundle3, [ file3 ]);
    });

});