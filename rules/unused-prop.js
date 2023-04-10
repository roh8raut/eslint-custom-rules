const parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');
let fileNameWithOutExtension = '';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Description of the rule'
    },
    fixable: 'code',
    schema: [] // no options
  },
  create(context) {
    // Find the AST

    let propTypesKeyValuPair = {};
    return {
      ImportDeclaration(node) {
        node.specifiers.forEach(eachImport => {
          const importedPath = node.source.value;
          const a = importedPath.split('/');
          fileNameWithOutExtension = a[a.length - 1];

          const filePath = context.getFilename();
          // console.log('importedFilePath>>>>>>', importedPath);

          let importedFilePath = path.resolve(path.dirname(filePath), importedPath + '.js');

          if (!fs.existsSync(importedFilePath)) {
            importedFilePath = path.resolve(path.dirname(filePath), importedPath + '.jsx');
            if (!fs.existsSync(importedFilePath)) {
              importedFilePath = path.resolve(path.dirname(filePath), importedPath + '/index.jsx');
            }

            if (!fs.existsSync(importedFilePath)) {
              return;
            }
          }
          let tasksListContent = null;
          try {
            tasksListContent = fs.readFileSync(importedFilePath, 'utf8');
          } catch (error) {
            console.log('this doesnot exists');
            return;
          }

          const tasksListAST = parser.parse(tasksListContent, {
            sourceType: 'module',
            plugins: ['jsx']
          });
          let tasksListPropTypes = null;

          const obj = tasksListAST.program.body.find(obj => {
            return obj.type === 'ExpressionStatement';
          });

          if (importedFilePath.includes('Apply')) {
            console.log('eachImport>>>', eachImport.local.name);
          }

          if (!obj || !obj.expression.right || !obj.expression.right.properties) return;

          const propsOfThatComponent = obj.expression.right.properties.map(
            property => property.key.name
          );

          propTypesKeyValuPair[eachImport.local.name] = propsOfThatComponent;

          // console.log('propTypesKeyValuPair>>>>>>>', propTypesKeyValuPair);
        });
      },
      JSXOpeningElement: node => {
        const componentName = node.name.name;
        // if (componentName === 'Dummy') {
        const propsPassedToComponent = node.attributes.map(attr => {
          return { name: attr.name.name, locObj: attr.loc };
        });

        // console.log('propPassedToThecomp>>>', propsPassedToComponent);
        const allowedPropsArray = propTypesKeyValuPair[componentName];
        console.log('componentName>>>>>>>>', componentName);

        if (!fileNameWithOutExtension || !allowedPropsArray) {
          return;
        }

        if (allowedPropsArray.length) {
          propsPassedToComponent.forEach(prop => {
            if (!allowedPropsArray.includes(prop.name)) {
              context.report({
                loc: prop.locObj,
                message: `${prop.name} is not a valid prop for this component. Check the PropTypes defined for ${componentName} component`
              });
            }
          });
        }
        // }
      }
    };
  }
};
