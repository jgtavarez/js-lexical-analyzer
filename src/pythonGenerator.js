// Python Code Generator for JavaScript to Python compiler
const { OP_TYPES } = require('./intermediateCodeGenerator');

class PythonGenerator {
  constructor(intermediateCode, symbolTable) {
    this.intermediateCode = intermediateCode;
    this.symbolTable = symbolTable;
    this.pythonCode = [];
    this.indentLevel = 0;
    this.currentScope = 'global';
  }

  indent() {
    return '    '.repeat(this.indentLevel);
  }

  addLine(line) {
    this.pythonCode.push(this.indent() + line);
  }

  // Convert JavaScript operator to Python operator if needed
  convertOperator(op) {
    const operatorMap = {
      '===': '==',
      '!==': '!=',
      '&&': 'and',
      '||': 'or',
      '!': 'not ',
      '?': ':' // For ternary operator
    };
    
    return operatorMap[op] || op;
  }

  // Generate Python code from intermediate code
  generate() {
    // Add Python header
    this.addLine('# Generated Python code');
    this.addLine('');
    
    // Process intermediate code
    for (let i = 0; i < this.intermediateCode.length; i++) {
      const instruction = this.intermediateCode[i];
      this.processInstruction(instruction, i);
    }
    
    return this.pythonCode.join('\n');
  }

  processInstruction(instruction, index) {
    const { op, arg1, arg2, result } = instruction;
    
    switch (op) {
      case OP_TYPES.FUNCTION:
        this.currentScope = arg1;
        this.addLine(`def ${arg1}(${this.getFunctionParams(arg1)}):`);
        this.indentLevel++;
        break;
        
      case OP_TYPES.END_FUNCTION:
        this.indentLevel--;
        this.currentScope = 'global';
        this.addLine(''); // Add empty line after function
        break;
        
      case OP_TYPES.ASSIGN:
        // Check if it's a literal assignment
        if (typeof arg1 === 'string' && (arg1.startsWith('"') || arg1.startsWith("'") || !isNaN(arg1))) {
          // It's a literal value (string or number)
          const value = arg1.startsWith('"') || arg1.startsWith("'") ? arg1 : arg1;
          this.addLine(`${result} = ${value}`);
        } else {
          this.addLine(`${result} = ${arg1}`);
        }
        break;
        
      case OP_TYPES.BINARY_OP:
        const pyOperator = this.convertOperator(instruction.operator || arg2);
        this.addLine(`${result} = ${arg1} ${pyOperator} ${arg2}`);
        break;
        
      case OP_TYPES.UNARY_OP:
        const unaryOp = this.convertOperator(instruction.operator || arg2);
        this.addLine(`${result} = ${unaryOp}${arg1}`);
        break;
        
      case OP_TYPES.LABEL:
        // Labels in Python are implemented with comments for clarity
        this.addLine(`# Label: ${result}`);
        break;
        
      case OP_TYPES.JUMP:
        // Look ahead to find the label's position
        this.addLine(`# Jump to ${result}`);
        break;
        
      case OP_TYPES.COND_JUMP:
        const condition = arg2 ? arg1 : `not ${arg1}`;
        this.addLine(`if ${condition}:`);
        this.indentLevel++;
        this.addLine(`# Jump to ${result}`);
        this.indentLevel--;
        this.addLine('else:');
        this.indentLevel++;
        break;
        
      case OP_TYPES.PARAM:
        // Parameters are handled in the function declaration
        if (typeof arg1 === 'number') {
          // This is a parameter declaration in a function
          // Already handled in FUNCTION
        } else {
          // This is a parameter for a function call
          this.addLine(`# Parameter: ${arg1}`);
        }
        break;
        
      case OP_TYPES.CALL:
        const args = [];
        // Look back to find parameters for this call
        let j = index - 1;
        let paramCount = arg2;
        
        while (paramCount > 0 && j >= 0) {
          if (this.intermediateCode[j].op === OP_TYPES.PARAM) {
            args.unshift(this.intermediateCode[j].arg1);
            paramCount--;
          }
          j--;
        }
        
        const argList = args.join(', ');
        this.addLine(`${result} = ${arg1}(${argList})`);
        break;
        
      case OP_TYPES.RETURN:
        if (arg1 === null || arg1 === undefined) {
          this.addLine('return');
        } else {
          this.addLine(`return ${arg1}`);
        }
        break;
        
      default:
        this.addLine(`# Unhandled operation: ${op}`);
    }
  }

  getFunctionParams(functionName) {
    // Find the function in the symbol table to get its parameters
    for (const scope of this.symbolTable) {
      if (scope.id === functionName) {
        // This is the function's scope, get all parameters
        const params = [];
        for (const symbolName in scope.symbols) {
          const symbol = scope.symbols[symbolName];
          if (symbol.type === 'parameter') {
            params.push(symbolName);
          }
        }
        return params.join(', ');
      }
    }
    return '';
  }
}

function generatePythonCode(intermediateCode, symbolTable) {
  const generator = new PythonGenerator(intermediateCode, symbolTable);
  return generator.generate();
}

module.exports = {
  generatePythonCode
}; 