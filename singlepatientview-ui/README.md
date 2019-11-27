## Documentation

# Deploying a react app into the sap/approuter

To deploy a react app in the app router some things needs to be adjusted in the building process so that it works:

1. Use the default application structure that is used for UI5 apps and delete all UI5 related configs from the ui folder and replace it with the react ones. After add the next adjustments.
2. Adapt the manifest.json in `./public/`. The manifest needs to contain the following json model:
   ```javaScript
    "sap.app": {
        // the app id
        "id": "com.cerner.scp.augero.spv.singlepatientview",
        "applicationVersion": {
        "version": "1.0.0"
        }
    }
   ```
3. create a `.env` file in the root. The env file needs to set the PUBLIC environment variable to match the id set above:
   ```properties
    PUBLIC_URL=/comcernerscpaugerospvsinglepatientview
   ```
   _All dots and minuses needs to be removed from the ID._
4. Implement the npm build task to include the two tasks for scrips:
   ```javaScript
    "build": "rimraf dist && react-scripts build && node ./scripts/copy-xs-app  && node ./scripts/rename-build-dir"
   ```
