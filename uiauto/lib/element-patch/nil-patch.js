(function () {
  UIAElementNil.prototype.type = function () {
    return "UIAElementNil";
  };

  UIAElementNil.prototype.isNil = function () { return true; };

  UIAElement.prototype.isNil = function () { return false; };
})();
