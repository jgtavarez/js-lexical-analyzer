// Intermediate Code Generator for JavaScript to Python compiler
const { NODE_TYPES } = require('./parser');

// Three-address code operation types
const OP_TYPES = {
  ASSIGN: 'ASSIGN',
  BINARY_OP: 'BINARY_OP',
  UNARY_OP: 'UNARY_OP',
  LABEL: 'LABEL',
  JUMP: 'JUMP',
  COND_JUMP: 'COND_JUMP',
  PARAM: 'PARAM',
  CALL: 'CALL',
  RETURN: 'RETURN',
  FUNCTION: 'FUNCTION',
  END_FUNCTION: 'END_FUNCTION'
};

class IntermediateCodeGenerator {
  constructor() {
    this.code = [];
    this.tempCounter = 0;
    this.labelCounter = 0;
    this.currentFunction = null;
  }

  // Generate a new temporary variable
  newTemp() {
    return `t${this.tempCounter++}`;
  }

  // Generate a new label
  newLabel() {
    return `L${this.labelCounter++}`;
  }

  // Add instruction to intermediate code
  emit(op, arg1 = null, arg2 = null, result = null) {
    this.code.push({
      op,
      arg1,
      arg2,
      result
    });
    
    return this.code.length - 1;
  }

  // Generate intermediate code from AST
  generate(ast) {
    this.visitNode(ast);
    return this.code;
  }

  // Visit each node in the AST
  visitNode(node) {
    if (!node) return null;
    
    switch (node.type) {
      case NODE_TYPES.PROGRAM:
        return this.visitProgram(node);
      case NODE_TYPES.VARIABLE_DECLARATION:
        return this.visitVariableDeclaration(node);
      case NODE_TYPES.FUNCTION_DECLARATION:
        return this.visitFunctionDeclaration(node);
      case NODE_TYPES.BLOCK_STATEMENT:
        return this.visitBlockStatement(node);
      case NODE_TYPES.IF_STATEMENT:
        return this.visitIfStatement(node);
      case NODE_TYPES.WHILE_STATEMENT:
        return this.visitWhileStatement(node);
      case NODE_TYPES.FOR_STATEMENT:
        return this.visitForStatement(node);
      case NODE_TYPES.EXPRESSION_STATEMENT:
        return this.visitExpressionStatement(node);
      case NODE_TYPES.ASSIGNMENT_EXPRESSION:
        return this.visitAssignmentExpression(node);
      case NODE_TYPES.BINARY_EXPRESSION:
        return this.visitBinaryExpression(node);
      case NODE_TYPES.IDENTIFIER:
        return this.visitIdentifier(node);
      case NODE_TYPES.LITERAL:
        return this.visitLiteral(node);
      case NODE_TYPES.CALL_EXPRESSION:
        return this.visitCallExpression(node);
      case NODE_TYPES.RETURN_STATEMENT:
        return this.visitReturnStatement(node);
      default:
        console.warn(`Unhandled node type: ${node.type}`);
        return null;
    }
  }

  visitProgram(node) {
    node.body.forEach(statement => this.visitNode(statement));
    return null;
  }

  visitVariableDeclaration(node) {
    const varName = node.id.name;
    
    if (node.init) {
      const initValue = this.visitNode(node.init);
      this.emit(OP_TYPES.ASSIGN, initValue, null, varName);
    }
    
    return varName;
  }

  visitFunctionDeclaration(node) {
    const functionName = node.id.name;
    this.currentFunction = functionName;
    
    this.emit(OP_TYPES.FUNCTION, functionName, node.params.length);
    
    // Add parameters
    node.params.forEach((param, index) => {
      this.emit(OP_TYPES.PARAM, index, null, param.name);
    });
    
    // Visit function body
    this.visitNode(node.body);
    
    this.emit(OP_TYPES.END_FUNCTION, functionName);
    this.currentFunction = null;
    
    return functionName;
  }

  visitBlockStatement(node) {
    node.body.forEach(statement => this.visitNode(statement));
    return null;
  }

  visitIfStatement(node) {
    const condition = this.visitNode(node.test);
    const elseLabel = this.newLabel();
    const endLabel = this.newLabel();
    
    // If condition is false, jump to else label
    this.emit(OP_TYPES.COND_JUMP, condition, false, elseLabel);
    
    // Then branch
    this.visitNode(node.consequent);
    this.emit(OP_TYPES.JUMP, null, null, endLabel);
    
    // Else branch
    this.emit(OP_TYPES.LABEL, null, null, elseLabel);
    if (node.alternate) {
      this.visitNode(node.alternate);
    }
    
    this.emit(OP_TYPES.LABEL, null, null, endLabel);
    
    return null;
  }

  visitWhileStatement(node) {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();
    
    this.emit(OP_TYPES.LABEL, null, null, startLabel);
    
    const condition = this.visitNode(node.test);
    this.emit(OP_TYPES.COND_JUMP, condition, false, endLabel);
    
    this.visitNode(node.body);
    
    this.emit(OP_TYPES.JUMP, null, null, startLabel);
    this.emit(OP_TYPES.LABEL, null, null, endLabel);
    
    return null;
  }

  visitForStatement(node) {
    const startLabel = this.newLabel();
    const condLabel = this.newLabel();
    const updateLabel = this.newLabel();
    const endLabel = this.newLabel();
    
    // Initialization
    if (node.init) {
      this.visitNode(node.init);
    }
    
    this.emit(OP_TYPES.JUMP, null, null, condLabel);
    
    // Loop body
    this.emit(OP_TYPES.LABEL, null, null, startLabel);
    this.visitNode(node.body);
    
    // Update
    this.emit(OP_TYPES.LABEL, null, null, updateLabel);
    if (node.update) {
      this.visitNode(node.update);
    }
    
    // Condition
    this.emit(OP_TYPES.LABEL, null, null, condLabel);
    if (node.test) {
      const condition = this.visitNode(node.test);
      this.emit(OP_TYPES.COND_JUMP, condition, true, startLabel);
    } else {
      this.emit(OP_TYPES.JUMP, null, null, startLabel);
    }
    
    this.emit(OP_TYPES.LABEL, null, null, endLabel);
    
    return null;
  }

  visitExpressionStatement(node) {
    return this.visitNode(node.expression);
  }

  visitAssignmentExpression(node) {
    const right = this.visitNode(node.right);
    const left = this.getAssignmentTarget(node.left);
    
    this.emit(OP_TYPES.ASSIGN, right, null, left);
    
    return left;
  }

  getAssignmentTarget(node) {
    if (node.type === NODE_TYPES.IDENTIFIER) {
      return node.name;
    } else if (node.type === NODE_TYPES.MEMBER_EXPRESSION) {
      // For array access or object property access
      const object = this.visitNode(node.object);
      const property = this.visitNode(node.property);
      const temp = this.newTemp();
      
      this.emit(OP_TYPES.BINARY_OP, object, property, temp, '[]');
      return temp;
    }
    
    throw new Error(`Unsupported assignment target: ${node.type}`);
  }

  visitBinaryExpression(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);
    const result = this.newTemp();
    
    this.emit(OP_TYPES.BINARY_OP, left, right, result, node.operator);
    
    return result;
  }

  visitIdentifier(node) {
    return node.name;
  }

  visitLiteral(node) {
    const temp = this.newTemp();
    this.emit(OP_TYPES.ASSIGN, JSON.stringify(node.value), null, temp);
    return temp;
  }

  visitCallExpression(node) {
    const args = [];
    
    // Process arguments
    node.arguments.forEach(arg => {
      const argValue = this.visitNode(arg);
      args.push(argValue);
      this.emit(OP_TYPES.PARAM, argValue);
    });
    
    const callee = this.visitNode(node.callee);
    const result = this.newTemp();
    
    this.emit(OP_TYPES.CALL, callee, args.length, result);
    
    return result;
  }

  visitReturnStatement(node) {
    if (node.argument) {
      const returnValue = this.visitNode(node.argument);
      this.emit(OP_TYPES.RETURN, returnValue);
    } else {
      this.emit(OP_TYPES.RETURN);
    }
    
    return null;
  }
}

function generateIntermediateCode(ast) {
  const generator = new IntermediateCodeGenerator();
  return generator.generate(ast);
}

module.exports = {
  generateIntermediateCode,
  OP_TYPES
}; 