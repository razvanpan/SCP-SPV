var shell = require("shelljs");
var AdmZip = require("adm-zip");

copyXSUAA();

function copyXSUAA() {
  shell.cp("-R", "xs-app.json", "build");
}
