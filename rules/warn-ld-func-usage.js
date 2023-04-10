module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'test if any particular string matches the given string in any file',
      category: 'Best Practices',
      recommended: true
    }
  },

  create: function(context) {
    // const searchString = context.options[0].searchString;

    return {
      Program(node) {
        const regex = /window.ldclient.variation\([^,]*,[^)]*\)/;
        const sourceCode = context.getSourceCode().text;
        let match;
        while ((match = regex.exec(sourceCode)) !== null) {
          const line = sourceCode.substring(0, match.index).split('\n').length;
          const column = match.index - sourceCode.lastIndexOf('\n', match.index) - 1;
          context.report({
            node,
            loc: { line, column },
            message: `The string was found at line ${line}, column ${column}.`
          });
        }
      }
    };
  }
};
