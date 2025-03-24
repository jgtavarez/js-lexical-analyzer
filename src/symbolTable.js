// Symbol Table Generator for JavaScript to Python compiler
const { NODE_TYPES } = require('./parser');

// Symbol types
const SYMBOL_TYPES = {
  VARIABLE: 'variable',
  FUNCTION: 'function',
  PARAMETER: 'parameter',
};

class SymbolTable {
  constructor() {
    // Initialize with global scope
    this.scopes = [{ id: 'global', symbols: {}, parent: null }];
    this.currentScope = this.scopes[0];
    this.scopeCounter = 1;
  }

  // Create a new scope
  enterScope(name = null) {
    const scopeId = name || `scope_${this.scopeCounter++}`;
    const newScope = {
      id: scopeId,
      symbols: {},
      parent: this.currentScope.id
    };
    
    this.scopes.push(newScope);
    this.currentScope = newScope;
    
    return scopeId;
  }

  // Exit current scope and return to parent
  exitScope() {
    if (this.currentScope.parent === null) {
      return; // Don't exit global scope
    }
    
    const parentScopeId = this.currentScope.parent;
    this.currentScope = this.scopes.find(scope => scope.id === parentScopeId);
  }

  // Add a symbol to the current scope
  addSymbol(name, type, info = {}) {
    if (this.currentScope.symbols[name]) {
      // Update the symbol if it already exists
      this.currentScope.symbols[name] = {
        ...this.currentScope.symbols[name],
        ...info,
        type
      };
    } else {
      this.currentScope.symbols[name] = {
        name,
        type,
        scope: this.currentScope.id,
        ...info
      };
    }
    
    return this.currentScope.symbols[name];
  }

  // Find a symbol in the current scope or parent scopes
  findSymbol(name) {
    let currentScope = this.currentScope;
    
    while (currentScope) {
      if (currentScope.symbols[name]) {
        return currentScope.symbols[name];
      }
      
      if (currentScope.parent === null) {
        break;
      }
      
      currentScope = this.scopes.find(scope => scope.id === currentScope.parent);
    }
    
    return null;
  }

  // Get all scopes and symbols
  getAllSymbols() {
    return this.scopes;
  }

  // Generate symbol table from AST
  generateSymbolTable(ast) {
    this.visitNode(ast);
    return this.getAllSymbols();
  }

  // Visit each node in the AST
  visitNode(node) {
    if (!node) return;
    
    switch (node.type) {
      case NODE_TYPES.PROGRAM:
        this.visitProgram(node);
        break;
      case NODE_TYPES.VARIABLE_DECLARATION:
        this.visitVariableDeclaration(node);
        break;
      case NODE_TYPES.FUNCTION_DECLARATION:
        this.visitFunctionDeclaration(node);
        break;
      case NODE_TYPES.BLOCK_STATEMENT:
        this.visitBlockStatement(node);
        break;
      case NODE_TYPES.IF_STATEMENT:
        this.visitIfStatement(node);
        break;
      case NODE_TYPES.WHILE_STATEMENT:
        this.visitWhileStatement(node);
        break;
      case NODE_TYPES.FOR_STATEMENT:
        this.visitForStatement(node);
        break;
      case NODE_TYPES.EXPRESSION_STATEMENT:
        this.visitExpressionStatement(node);
        break;
      case NODE_TYPES.ASSIGNMENT_EXPRESSION:
        this.visitAssignmentExpression(node);
        break;
      case NODE_TYPES.BINARY_EXPRESSION:
        this.visitBinaryExpression(node);
        break;
      case NODE_TYPES.CALL_EXPRESSION:
        this.visitCallExpression(node);
        break;
      case NODE_TYPES.RETURN_STATEMENT:
        this.visitReturnStatement(node);
        break;
      // Add more node types as needed
    }
  }

  visitProgram(node) {
    node.body.forEach(statement => this.visitNode(statement));
  }

  visitVariableDeclaration(node) {
    const variableName = node.id.name;
    const variableKind = node.kind; // var, let, or const
    
    this.addSymbol(variableName, SYMBOL_TYPES.VARIABLE, { 
      kind: variableKind,
      initialized: node.init !== null
    });
    
    if (node.init) {
      this.visitNode(node.init);
    }
  }

  visitFunctionDeclaration(node) {
    const functionName = node.id.name;
    const params = node.params.map(param => param.name);
    
    this.addSymbol(functionName, SYMBOL_TYPES.FUNCTION, { 
      params,
      paramCount: params.length
    });
    
    // Enter a new scope for the function body
    this.enterScope(functionName);
    
    // Add parameters to the function scope
    params.forEach(param => {
      this.addSymbol(param, SYMBOL_TYPES.PARAMETER);
    });
    
    // Visit function body
    this.visitNode(node.body);
    
    // Exit function scope
    this.exitScope();
  }

  visitBlockStatement(node) {
    // Enter a new scope for the block
    this.enterScope();
    
    // Visit all statements in the block
    node.body.forEach(statement => this.visitNode(statement));
    
    // Exit block scope
    this.exitScope();
  }

  visitIfStatement(node) {
    this.visitNode(node.test);
    this.visitNode(node.consequent);
    
    if (node.alternate) {
      this.visitNode(node.alternate);
    }
  }

  visitWhileStatement(node) {
    this.visitNode(node.test);
    this.visitNode(node.body);
  }

  visitForStatement(node) {
    // Enter a new scope for the for loop
    this.enterScope('for_loop');
    
    if (node.init) this.visitNode(node.init);
    if (node.test) this.visitNode(node.test);
    if (node.update) this.visitNode(node.update);
    
    this.visitNode(node.body);
    
    // Exit for loop scope
    this.exitScope();
  }

  visitExpressionStatement(node) {
    this.visitNode(node.expression);
  }

  visitAssignmentExpression(node) {
    // Check if left side is an identifier and not already in symbol table
    if (node.left.type === NODE_TYPES.IDENTIFIER) {
      const name = node.left.name;
      if (!this.findSymbol(name)) {
        // Implicitly declared variable (without var/let/const)
        this.addSymbol(name, SYMBOL_TYPES.VARIABLE, { 
          kind: 'implicit',
          initialized: true
        });
      }
    }
    
    this.visitNode(node.left);
    this.visitNode(node.right);
  }

  visitBinaryExpression(node) {
    this.visitNode(node.left);
    this.visitNode(node.right);
  }

  visitCallExpression(node) {
    this.visitNode(node.callee);
    node.arguments.forEach(arg => this.visitNode(arg));
  }

  visitReturnStatement(node) {
    if (node.argument) {
      this.visitNode(node.argument);
    }
  }
}

function generateSymbolTable(ast) {
  const symbolTable = new SymbolTable();
  return symbolTable.generateSymbolTable(ast);
}

module.exports = {
  generateSymbolTable,
  SYMBOL_TYPES
}; 