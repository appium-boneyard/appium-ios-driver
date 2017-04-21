/* globals $ */

(function () {

  UIAElement.prototype.getTreeForXML = function () {
    var target = $.target();
    target.pushTimeout(0);
    var getTree = function (element, elementIndex, parentPath) {
      var curPath = parentPath + "/" + elementIndex;
      var rect = element.rect();
      var subtree = {
        "@": {
          name: element.name()
        , label: element.label()
        , value: element.value()
        , dom: typeof element.dom === "function" ? element.dom() : null
        , enabled: element.isEnabled() ? true : false
        , valid: element.isValid() ? true : false
        , visible: element.isVisible() === 1 ? true : false
        , hint: element.hint()
        , path: curPath
        , x: rect.origin.x
        , y: rect.origin.y
        , width: rect.size.width
        , height: rect.size.height
        }
      , ">": []
      };
      var children = element.elements();
      var numChildren = children.length;
      for (var i = 0; i < numChildren; i++) {
        var child = children[i];
        subtree[">"].push(getTree(child, i, curPath));
      }
      var elType = element.type();
      var obj = {};
      obj[elType] = subtree;
      return obj;
    };
    var tree = getTree(this, 0, "");
    target.popTimeout();
    return tree;
  };

  UIAElement.prototype.getTree = function () {
    var target = $.target();
    target.pushTimeout(0);
    var getTree = function (element) {
      var subtree = {
        name: element.name()
      , type: element.type()
      , label: element.label()
      , value: element.value()
      , rect: element.rect()
      , dom: typeof element.dom === "function" ? element.dom() : null
      , enabled: element.isEnabled() ? true : false
      , valid: element.isValid() ? true : false
      , visible: element.isVisible() === 1 ? true : false
      , children: []
      , hint: element.hint()
      };
      var children = element.elements();
      var numChildren = children.length;
      for (var i = 0; i < numChildren; i++) {
        var child = children[i];
        subtree.children.push(getTree(child));
      }
      return subtree;
    };
    var tree = getTree(this);
    target.popTimeout();
    return tree;
  };

  UIAElement.prototype.getPageSource = function () {
    return JSON.stringify(this.getTree());
  };

})();
