var exec = require('child_process').exec,
      fs = require('fs'),
      bundleStats = require('../../bundle-stats.js');

describe("BundleStatsCollector - ", function() {

    var validateBundle,
        bundle1 = 'bundle1',
        string1 = 'A localized string',
        bundle2 = 'bundle2',
        string2 = 'A different string.',
        bundle3 = 'bundle3',
        string3 = 'A third string.',
        stats;

  beforeEach(function () {

      stats = new bundleStats.BundleStatsCollector(null);
      stats.LocalizedStrings = {};
      validateBundle = function(bundleName, localizedStrings)
      {
          expect(stats.LocalizedStrings[bundleName].length).toBe(localizedStrings.length);

          for(var i=0; i<localizedStrings.length; i++) {
              expect(stats.LocalizedStrings[bundleName][i]).toBe(localizedStrings[i]);
          }
      };
  });

 describe("ParseMustacheForStats: ", function() {

  var getLocalizedString = function(ls) {
          return '{{# i18n }}' + ls+ '{{/ i18n }}';
      },
      getMultiLineLocalizedString = function(ls) {
          return getLocalizedString('\n' + ls + '\n');
      },
      ls1 = getLocalizedString(string1),
      ls2 = getLocalizedString(string2),
      ls3 = getLocalizedString(string3);

  it("Adds files to the collection.", function() {

      stats.ParseMustacheForStats(bundle1, ls1);

      validateBundle(bundle1, [ string1 ]);

      stats.ParseMustacheForStats(bundle1, ls2);

      validateBundle(bundle1, [ string1, string2 ]);

      stats.ParseMustacheForStats(bundle1, ls3);

      validateBundle(bundle1, [ string1, string2, string3 ]);
  });

    it("Text with multiple localized strings adds them all.", function() {

        stats.ParseMustacheForStats(bundle1, ls1 + ls2 + ls3);
        validateBundle(bundle1, [ string1, string2, string3 ]);
    });

    it("Adds localized strings defined across multiple lines.", function() {

        stats.ParseMustacheForStats(bundle1, getMultiLineLocalizedString(string1));
        validateBundle(bundle1, [ string1 ]);
    });

    it("Adds localized strings defined with no spaces in i18n.", function() {

        stats.ParseMustacheForStats(bundle1, '{{#i18n}}' + string1 + '{{/i18n}}');
        validateBundle(bundle1, [ string1 ]);
    });

    it("Doesn't break if there are no localized strings.", function() {

        stats.ParseMustacheForStats(bundle1, '<div>This has no localized strings.</div>');
        expect(stats.LocalizedStrings[bundle1]).toBe(undefined);
    });


    it("Clearing a bundle removes all LocalizedStrings.", function() {

        stats.ParseMustacheForStats(bundle1, ls1);
        stats.ParseMustacheForStats(bundle1, ls2);

        validateBundle(bundle1, [ string1, string2 ]);

        stats.ClearStatsForBundle(bundle1);

        validateBundle(bundle1, [ ]);
    });


    it("Duplicate LocalizedStrings are not added.", function() {

        stats.ParseMustacheForStats(bundle1, ls1);

        validateBundle(bundle1, [ string1 ]);

        stats.ParseMustacheForStats(bundle1, ls1);

        validateBundle(bundle1, [ string1 ]);

        stats.ParseMustacheForStats(bundle1, ls1);

        validateBundle(bundle1, [ string1 ]);
    });


    it("LocalizedStrings added are isolated to their collection.", function() {

        stats.ParseMustacheForStats(bundle1, ls1);
        stats.ParseMustacheForStats(bundle2, ls2);
        stats.ParseMustacheForStats(bundle3, ls3);

        validateBundle(bundle1, [ string1 ]);
        validateBundle(bundle2, [ string2 ]);
        validateBundle(bundle3, [ string3 ]);
    });

 });

    describe("ParseJsForStats: ", function() {

        var getLocalizedString = function(ls) {
                return "i18n.t('" + ls+ "');";
            },
            ls1 = getLocalizedString(string1),
            ls2 = getLocalizedString(string2),
            ls3 = getLocalizedString(string3);

        it("Adds localized strings to the collection.", function() {

            stats.ParseJsForStats(bundle1, ls1);

            validateBundle(bundle1, [ string1 ]);

            stats.ParseJsForStats(bundle1, ls2);

            validateBundle(bundle1, [ string1, string2 ]);

            stats.ParseJsForStats(bundle1, ls3);

            validateBundle(bundle1, [ string1, string2, string3 ]);
        });

        it("Text with multiple localized strings adds them all.", function() {

            stats.ParseJsForStats(bundle1, ls1 + "\n" + ls2 + "\n" + ls3);
            validateBundle(bundle1, [ string1, string2, string3 ]);
        });

        it("Adds localized strings defined @localize syntax.", function() {

            stats.ParseJsForStats(bundle1, '// @localize ' + string1);
            validateBundle(bundle1, [ string1 ]);
        });

        it("Doesn't break if there are no localized strings.", function() {

            stats.ParseJsForStats(bundle1, 'var x = "There are no localized strings here";"');
            expect(stats.LocalizedStrings[bundle1]).toBe(undefined);
        });


        it("Clearing a bundle removes all LocalizedStrings.", function() {

            stats.ParseJsForStats(bundle1, ls1);
            stats.ParseJsForStats(bundle1, ls2);

            validateBundle(bundle1, [ string1, string2 ]);

            stats.ClearStatsForBundle(bundle1);

            validateBundle(bundle1, [ ]);
        });


        it("Duplicate LocalizedStrings are not added.", function() {

            stats.ParseJsForStats(bundle1, ls1);

            validateBundle(bundle1, [ string1 ]);

            stats.ParseJsForStats(bundle1, ls1);

            validateBundle(bundle1, [ string1 ]);

            stats.ParseJsForStats(bundle1, ls1);

            validateBundle(bundle1, [ string1 ]);
        });


        it("LocalizedStrings added are isolated to their collection.", function() {

            stats.ParseJsForStats(bundle1, ls1);
            stats.ParseJsForStats(bundle2, ls2);
            stats.ParseJsForStats(bundle3, ls3);

            validateBundle(bundle1, [ string1 ]);
            validateBundle(bundle2, [ string2 ]);
            validateBundle(bundle3, [ string3 ]);
        });

    });

});