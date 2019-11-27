var shell = require("shelljs");

rename();

function rename() {
  shell.mkdir("dist");
  shell.cd("build");
  shell.mv("*", "../dist");
  shell.cd("..");
  shell.rm("-rf", "build");
}
