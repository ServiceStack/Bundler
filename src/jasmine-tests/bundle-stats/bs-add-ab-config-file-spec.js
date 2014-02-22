var exec = require('child_process').exec,
      fs = require('fs'),
      bundleStats = require('../../bundle-stats.js');

describe("BundleStatsCollector - ", function() {

    var validateBundle,
        bundle1 = 'bundle1',
        string1 = 'An ab config',
        bundle2 = 'bundle2',
        string2 = 'A different ab config.',
        bundle3 = 'bundle3',
        string3 = 'A third ab config.',
        stats;

  beforeEach(function () {

      stats = new bundleStats.BundleStatsCollector(null);
      stats.LocalizedStrings = {};
      validateBundle = function(bundleName, abconfigs)
      {
          expect(stats.AbConfigs[bundleName].length).toBe(abconfigs.length);

          for(var i=0; i<abconfigs.length; i++) {
              expect(stats.AbConfigs[bundleName][i]).toBe(abconfigs[i]);
          }
      };
  });

 describe("ParseJsForStats: ", function() {

  var getAbConfig = function(ab) {
          return "AB.isOn('" + ab + "')";
      },
      ab1 = getAbConfig(string1),
      ab2 = getAbConfig(string2),
      ab3 = getAbConfig(string3);

  it("Adds ab configs to the collection.", function() {

      stats.ParseJsForStats(bundle1, ab1);

      validateBundle(bundle1, [ string1 ]);

      stats.ParseJsForStats(bundle1, ab2);

      validateBundle(bundle1, [ string1, string2 ]);

      stats.ParseJsForStats(bundle1, ab3);

      validateBundle(bundle1, [ string1, string2, string3 ]);
  });

    it("Text with multiple ab configs adds them all.", function() {

        stats.ParseJsForStats(bundle1, ab1 + ab2 + ab3);
        validateBundle(bundle1, [ string1, string2, string3 ]);
    });

    it("Doesn't break if there are no ab configs.", function() {

        stats.ParseJsForStats(bundle1, 'var x = "This has no ab configs"; \n x = x + "l";');
        expect(stats.AbConfigs[bundle1]).toBe(undefined);
    });


    it("Clearing a bundle removes all ab configs.", function() {

        stats.ParseJsForStats(bundle1, ab1);
        stats.ParseJsForStats(bundle1, ab2);

        validateBundle(bundle1, [ string1, string2 ]);

        stats.ClearStatsForBundle(bundle1);

        validateBundle(bundle1, [ ]);
    });


    it("Duplicate ab configs are not added.", function() {

        stats.ParseJsForStats(bundle1, ab1);

        validateBundle(bundle1, [ string1 ]);

        stats.ParseJsForStats(bundle1, ab1);

        validateBundle(bundle1, [ string1 ]);

        stats.ParseJsForStats(bundle1, ab1);

        validateBundle(bundle1, [ string1 ]);
    });


    it("ab configs added are isolated to their collection.", function() {

        stats.ParseJsForStats(bundle1, ab1);
        stats.ParseJsForStats(bundle2, ab2);
        stats.ParseJsForStats(bundle3, ab3);

        validateBundle(bundle1, [ string1 ]);
        validateBundle(bundle2, [ string2 ]);
        validateBundle(bundle3, [ string3 ]);
    });

 });

});