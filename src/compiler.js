// Main compiler file that orchestrates the compilation process
const { tokenize } = require('./lexer');
const { parse } = require('./parser');
const { generateSymbolTable } = require('./symbolTable');
const { generateIntermediateCode } = require('./intermediateCodeGenerator');
const { generatePythonCode } = require('./pythonGenerator');

class Compiler {
  constructor() {
    this.tokens = [];
    this.ast = null;
    this.symbolTable = null;
    this.intermediateCode = null;
    this.pythonCode = '';
  }

  compile(jsCode) {
    try {
      // Step 1: Lexical Analysis
      this.tokens = tokenize(jsCode);
      
      // Step 2: Syntax Analysis (Parsing)
      this.ast = parse(this.tokens);
      
      // Step 3: Generate Symbol Table
      this.symbolTable = generateSymbolTable(this.ast);
      
      // Step 4: Generate Intermediate Code
      this.intermediateCode = generateIntermediateCode(this.ast);
      
      // Step 5: Generate Python Code
      this.pythonCode = generatePythonCode(this.intermediateCode, this.symbolTable);
      
      // Return compilation results
      return {
        success: true,
        tokens: this.tokens,
        ast: this.ast,
        symbolTable: this.symbolTable,
        intermediateCode: this.intermediateCode,
        pythonCode: this.pythonCode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || String(error),
        step: this.determineErrorStep(),
        tokens: this.tokens,
        ast: this.ast,
        symbolTable: this.symbolTable,
        intermediateCode: this.intermediateCode
      };
    }
  }

  determineErrorStep() {
    if (!this.tokens || this.tokens.length === 0) {
      return 'Lexical Analysis';
    } else if (!this.ast) {
      return 'Syntax Analysis';
    } else if (!this.symbolTable) {
      return 'Symbol Table Generation';
    } else if (!this.intermediateCode) {
      return 'Intermediate Code Generation';
    } else {
      return 'Python Code Generation';
    }
  }

  // Get pretty printed results for display
  getPrettyResults() {
    return {
      tokens: JSON.stringify(this.tokens, null, 2),
      ast: JSON.stringify(this.ast, null, 2),
      symbolTable: JSON.stringify(this.symbolTable, null, 2),
      intermediateCode: JSON.stringify(this.intermediateCode, null, 2),
      pythonCode: this.pythonCode
    };
  }
}

module.exports = Compiler; 