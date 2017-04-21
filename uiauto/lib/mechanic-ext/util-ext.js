/* globals $, STATUS */

(function () {
  $.extend($, {
    cache: []
  , identifier: 0
  , _defaultContext: function (ctx) {
      if (typeof ctx === 'string') {
        var el = this.cache[ctx];
        if (el.isNil()) {
          throw new STATUS.StaleElementReference("Context element was nil");
        }
        return el;
      } else if (typeof ctx !== 'undefined') {
        return ctx;
      } else {
        return $.mainApp();
      }
    }

  , convertSelector: function (selector) {
      // some legacy: be backwards compatible, mechanic.js
      switch (selector) {
        case 'tableView':
        case 'textField':
          selector = selector.toLowerCase();
          break;
        case 'staticText':
          selector = 'text';
          break;
        case 'tableCell':
          selector = 'cell';
          break;
        case 'secureTextField':
          selector = 'secure';
          break;
      }
      return selector;
    }

  , waitForPageLoad: function (secs) {
      var seconds = 30;
      if (secs) {
        seconds = parseInt(secs, 10);
      }

      $.target().pushTimeout(0);
      this.delay(100);

      var indicators = this.getWindowIndicators($.mainWindow());
      var done = false;
      var counter = 0;

      while ((!done) && (counter < seconds)) {
        var invisible = 0;

        for (var i = 0; i < indicators.length; i++) {
          $.debug("[" + counter + "] waiting on " + indicators[i].type() + ": " +
              " visible: " + indicators[i].isVisible() +
              " parent: " + indicators[i].parent().type());

          if (indicators[i].isVisible() === 0 ||
              indicators[i].parent().isVisible() === 0 ||
              indicators[i].isVisible() === null) {
            invisible++;
          }
        }

        if (invisible === indicators.length) {
          done = true;
        }

        counter++;
        this.delay(1000);
      }

      $.target().popTimeout();
      if (!done) {
        // indicators never went away...
        $.debug("WARNING: Waited for indicators to become non-visible but they never did, moving on");
        throw new STATUS.UnknownError("Timed out waiting on activity indicator.");
      }
    }

  , smartWrap: function (obj) {
      if (obj === null || typeof obj === 'undefined' ) {
        return $([]);
      } else if (obj.isMechanic === true) {
        return obj;
      } else if (obj === UIAElementNil || obj instanceof UIAElementNil) {
        return $([]);
      } else if (obj instanceof UIAElementArray) {
        return $(obj.toArray());
      } else if (obj instanceof UIAElement) {
        return $(obj);
      } else if (Array.isArray(obj)) {
        var allUIA = true;
        $.each(obj, function (idx, el) {
          allUIA = allUIA && el instanceof UIAElement;
          return allUIA;
        });
        if (allUIA) return $(obj);
        return obj;
      } else {
        throw new Error('smartWrap failed,');
      }
    }
  });

  $.extend($.fn, {
    isMechanic: true,
    dedup: function () {
      var results = [];
      this.each(function (idx, el) {
        if (!el.isDuplicate()){
          results.push(el);
        }
      });
      return $.smartWrap(results);
    }

  });

})();
