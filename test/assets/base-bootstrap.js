/* globals commands, chai */
/* exported testCreateDefaultOptions */

#import "<ROOT_DIR>/node_modules/chai/chai.js"
#import "<ROOT_DIR>/uiauto/vendors/mechanic.js"
#import "<ROOT_DIR>/uiauto/lib/mechanic-ext/basics-ext.js"
#import "<ROOT_DIR>/uiauto/lib/status.js"
#import "<ROOT_DIR>/uiauto/lib/commands.js"
"<POST_IMPORTS>"

chai.should();

var env = {};
env.commandProxyClientPath = "<commandProxyClientPath>";
env.nodePath = "<nodePath>";
env.instrumentsSock = "<instrumentsSock>";
commands.startProcessing();
