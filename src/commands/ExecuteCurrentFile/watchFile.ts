var chokidar = require("chokidar");

/*
 * This class works around dealing with bug:
 * https://github.com/paulmillr/chokidar/issues/434
 *
 * Sample usage:
 *
 * let c = new ChokiExtension()
 * var path = "/tmp/elfling.out.flag";
 * var triggerFn = (p) => {
 *     console.log(`Added: ${p}`);
 *     return true
 * }
 * c.pathAddTrigger(path, triggerFn)
 *
 */
export default class ChokiExtension {
  watcher: any;

  constructor() {
    this.watcher = null;
  }

  pathAddTrigger(path: string, triggerFn: any, boundObj: any) {
    this.watcher = chokidar.watch(path, {
      usePolling: true,
    });
    let newFunc = triggerFn.bind(boundObj);
    let _this = this;
    this.watcher.on("add", function (p: string) {
      setTimeout(function () {
        console.log("Chokidar Clozing");
        _this.watcher.close();
      }, 1000);
      return newFunc(p);
    });
  }
}
