// Syntax Analyzer for JavaScript to Python compiler
const { TOKEN_TYPES } = require('./lexer');

// AST node types
const NODE_TYPES = {
  PROGRAM: 'Program',
  VARIABLE_DECLARATION: 'VariableDeclaration',
  FUNCTION_DECLARATION: 'FunctionDeclaration',
  EXPRESSION_STATEMENT: 'ExpressionStatement',
  ASSIGNMENT_EXPRESSION: 'AssignmentExpression',
  BINARY_EXPRESSION: 'BinaryExpression',
  CALL_EXPRESSION: 'CallExpression',
  MEMBER_EXPRESSION: 'MemberExpression',
  IDENTIFIER: 'Identifier',
  LITERAL: 'Literal',
  IF_STATEMENT: 'IfStatement',
  WHILE_STATEMENT: 'WhileStatement',
  FOR_STATEMENT: 'ForStatement',
  RETURN_STATEMENT: 'ReturnStatement',
  BLOCK_STATEMENT: 'BlockStatement'
};

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
  }

  parse() {
    try {
      const program = {
        type: NODE_TYPES.PROGRAM,
        body: []
      };

      while (!this.isAtEnd()) {
        try {
          program.body.push(this.statement());
        } catch (error) {
          this.errors.push(error.message);
          this.synchronize(); // Skip to the next statement
        }
      }

      if (this.errors.length > 0) {
        console.error('Parsing errors:', this.errors);
      }

      return program;
    } catch (error) {
      console.error('Parsing error:', error);
      return {
        type: NODE_TYPES.PROGRAM,
        body: [],
        errors: [error.message]
      };
    }
  }

  // Skip tokens until we find a statement boundary
  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TOKEN_TYPES.PUNCTUATION && this.previous().value === ';') return;

      switch (this.peek().type) {
        case TOKEN_TYPES.KEYWORD:
          if (['function', 'var', 'let', 'const', 'if', 'while', 'for', 'return'].includes(this.peek().value)) {
            return;
          }
          break;
      }

      this.advance();
    }
  }

  statement() {
    if (this.match(TOKEN_TYPES.KEYWORD, 'var') || 
        this.match(TOKEN_TYPES.KEYWORD, 'let') || 
        this.match(TOKEN_TYPES.KEYWORD, 'const')) {
      return this.variableDeclaration();
    }

    if (this.match(TOKEN_TYPES.KEYWORD, 'function')) {
      return this.functionDeclaration();
    }

    if (this.match(TOKEN_TYPES.KEYWORD, 'if')) {
      return this.ifStatement();
    }

    if (this.match(TOKEN_TYPES.KEYWORD, 'while')) {
      return this.whileStatement();
    }

    if (this.match(TOKEN_TYPES.KEYWORD, 'for')) {
      return this.forStatement();
    }

    if (this.match(TOKEN_TYPES.KEYWORD, 'return')) {
      return this.returnStatement();
    }

    return this.expressionStatement();
  }

  variableDeclaration() {
    const kind = this.previous().value; // var, let, or const
    
    if (this.check(TOKEN_TYPES.IDENTIFIER)) {
      const id = this.advance();
      let init = null;

      if (this.match(TOKEN_TYPES.OPERATOR, '=')) {
        init = this.expression();
      }

      this.consume(TOKEN_TYPES.PUNCTUATION, ';', "Expected ';' after variable declaration.");

      return {
        type: NODE_TYPES.VARIABLE_DECLARATION,
        kind,
        id: {
          type: NODE_TYPES.IDENTIFIER,
          name: id.value
        },
        init
      };
    } else {
      throw new Error(`Expected identifier after ${kind}`);
    }
  }

  functionDeclaration() {
    if (!this.check(TOKEN_TYPES.IDENTIFIER)) {
      throw new Error("Expected function name");
    }
    
    const name = this.advance();
    
    this.consume(TOKEN_TYPES.PUNCTUATION, '(', "Expected '(' after function name.");
    
    const params = [];
    
    if (!this.check(TOKEN_TYPES.PUNCTUATION, ')')) {
      do {
        if (this.check(TOKEN_TYPES.IDENTIFIER)) {
          const param = this.advance();
          params.push({
            type: NODE_TYPES.IDENTIFIER,
            name: param.value
          });
        } else {
          throw new Error("Expected parameter name");
        }
      } while (this.match(TOKEN_TYPES.PUNCTUATION, ','));
    }
    
    this.consume(TOKEN_TYPES.PUNCTUATION, ')', "Expected ')' after function parameters.");
    this.consume(TOKEN_TYPES.PUNCTUATION, '{', "Expected '{' before function body.");
    
    const body = this.blockStatement();
    
    return {
      type: NODE_TYPES.FUNCTION_DECLARATION,
      id: {
        type: NODE_TYPES.IDENTIFIER,
        name: name.value
      },
      params,
      body
    };
  }

  blockStatement() {
    const statements = [];
    
    while (!this.check(TOKEN_TYPES.PUNCTUATION, '}') && !this.isAtEnd()) {
      try {
        statements.push(this.statement());
      } catch (error) {
        this.errors.push(error.message);
        this.synchronize(); // Skip to the next statement
      }
    }
    
    this.consume(TOKEN_TYPES.PUNCTUATION, '}', "Expected '}' after block.");
    
    return {
      type: NODE_TYPES.BLOCK_STATEMENT,
      body: statements
    };
  }

  ifStatement() {
    this.consume(TOKEN_TYPES.PUNCTUATION, '(', "Expected '(' after 'if'.");
    const test = this.expression();
    this.consume(TOKEN_TYPES.PUNCTUATION, ')', "Expected ')' after if condition.");
    
    const consequent = this.statement();
    let alternate = null;
    
    if (this.match(TOKEN_TYPES.KEYWORD, 'else')) {
      alternate = this.statement();
    }
    
    return {
      type: NODE_TYPES.IF_STATEMENT,
      test,
      consequent,
      alternate
    };
  }

  whileStatement() {
    this.consume(TOKEN_TYPES.PUNCTUATION, '(', "Expected '(' after 'while'.");
    const test = this.expression();
    this.consume(TOKEN_TYPES.PUNCTUATION, ')', "Expected ')' after while condition.");
    
    const body = this.statement();
    
    return {
      type: NODE_TYPES.WHILE_STATEMENT,
      test,
      body
    };
  }

  forStatement() {
    this.consume(TOKEN_TYPES.PUNCTUATION, '(', "Expected '(' after 'for'.");
    
    let init = null;
    if (!this.check(TOKEN_TYPES.PUNCTUATION, ';')) {
      if (this.match(TOKEN_TYPES.KEYWORD, 'var') || 
          this.match(TOKEN_TYPES.KEYWORD, 'let') || 
          this.match(TOKEN_TYPES.KEYWORD, 'const')) {
        init = this.variableDeclaration();
      } else {
        init = this.expressionStatement();
      }
    } else {
      this.consume(TOKEN_TYPES.PUNCTUATION, ';', "Expected ';'.");
    }
    
    let test = null;
    if (!this.check(TOKEN_TYPES.PUNCTUATION, ';')) {
      test = this.expression();
    }
    this.consume(TOKEN_TYPES.PUNCTUATION, ';', "Expected ';' after for loop condition.");
    
    let update = null;
    if (!this.check(TOKEN_TYPES.PUNCTUATION, ')')) {
      update = this.expression();
    }
    this.consume(TOKEN_TYPES.PUNCTUATION, ')', "Expected ')' after for clauses.");
    
    const body = this.statement();
    
    return {
      type: NODE_TYPES.FOR_STATEMENT,
      init,
      test,
      update,
      body
    };
  }

  returnStatement() {
    let argument = null;
    if (!this.check(TOKEN_TYPES.PUNCTUATION, ';')) {
      argument = this.expression();
    }
    
    this.consume(TOKEN_TYPES.PUNCTUATION, ';', "Expected ';' after return value.");
    
    return {
      type: NODE_TYPES.RETURN_STATEMENT,
      argument
    };
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TOKEN_TYPES.PUNCTUATION, ';', "Expected ';' after expression.");
    
    return {
      type: NODE_TYPES.EXPRESSION_STATEMENT,
      expression: expr
    };
  }

  expression() {
    return this.assignment();
  }

  assignment() {
    const expr = this.equality();
    
    if (this.match(TOKEN_TYPES.OPERATOR, '=')) {
      const value = this.assignment();
      
      if (expr.type === NODE_TYPES.IDENTIFIER) {
        return {
          type: NODE_TYPES.ASSIGNMENT_EXPRESSION,
          operator: '=',
          left: expr,
          right: value
        };
      } else if (expr.type === NODE_TYPES.MEMBER_EXPRESSION) {
        return {
          type: NODE_TYPES.ASSIGNMENT_EXPRESSION,
          operator: '=',
          left: expr,
          right: value
        };
      }
      
      throw new Error("Invalid assignment target.");
    }
    
    return expr;
  }

  equality() {
    let expr = this.comparison();
    
    while (this.match(TOKEN_TYPES.OPERATOR, '==') || this.match(TOKEN_TYPES.OPERATOR, '!=')) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = {
        type: NODE_TYPES.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  comparison() {
    let expr = this.addition();
    
    while (
      this.match(TOKEN_TYPES.OPERATOR, '>') || 
      this.match(TOKEN_TYPES.OPERATOR, '>=') ||
      this.match(TOKEN_TYPES.OPERATOR, '<') || 
      this.match(TOKEN_TYPES.OPERATOR, '<=')
    ) {
      const operator = this.previous().value;
      const right = this.addition();
      expr = {
        type: NODE_TYPES.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  addition() {
    let expr = this.multiplication();
    
    while (this.match(TOKEN_TYPES.OPERATOR, '+') || this.match(TOKEN_TYPES.OPERATOR, '-')) {
      const operator = this.previous().value;
      const right = this.multiplication();
      expr = {
        type: NODE_TYPES.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  multiplication() {
    let expr = this.primary();
    
    while (this.match(TOKEN_TYPES.OPERATOR, '*') || 
           this.match(TOKEN_TYPES.OPERATOR, '/') || 
           this.match(TOKEN_TYPES.OPERATOR, '%')) {
      const operator = this.previous().value;
      const right = this.primary();
      expr = {
        type: NODE_TYPES.BINARY_EXPRESSION,
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  primary() {
    if (this.match(TOKEN_TYPES.KEYWORD, 'true')) return { type: NODE_TYPES.LITERAL, value: true };
    if (this.match(TOKEN_TYPES.KEYWORD, 'false')) return { type: NODE_TYPES.LITERAL, value: false };
    if (this.match(TOKEN_TYPES.KEYWORD, 'null')) return { type: NODE_TYPES.LITERAL, value: null };
    
    if (this.match(TOKEN_TYPES.NUMBER)) {
      return {
        type: NODE_TYPES.LITERAL,
        value: Number(this.previous().value)
      };
    }
    
    if (this.match(TOKEN_TYPES.STRING)) {
      const value = this.previous().value;
      return {
        type: NODE_TYPES.LITERAL,
        value: value.slice(1, value.length - 1) // Remove quotes
      };
    }
    
    if (this.match(TOKEN_TYPES.IDENTIFIER)) {
      const identifier = {
        type: NODE_TYPES.IDENTIFIER,
        name: this.previous().value
      };
      
      if (this.match(TOKEN_TYPES.PUNCTUATION, '(')) {
        return this.finishCall(identifier);
      }
      
      return identifier;
    }
    
    if (this.match(TOKEN_TYPES.PUNCTUATION, '(')) {
      const expr = this.expression();
      this.consume(TOKEN_TYPES.PUNCTUATION, ')', "Expected ')' after expression.");
      return expr;
    }
    
    throw new Error(`Unexpected token: ${JSON.stringify(this.peek())}`);
  }

  finishCall(callee) {
    const args = [];
    
    if (!this.check(TOKEN_TYPES.PUNCTUATION, ')')) {
      do {
        args.push(this.expression());
      } while (this.match(TOKEN_TYPES.PUNCTUATION, ','));
    }
    
    this.consume(TOKEN_TYPES.PUNCTUATION, ')', "Expected ')' after arguments.");
    
    return {
      type: NODE_TYPES.CALL_EXPRESSION,
      callee,
      arguments: args
    };
  }

  match(...types) {
    for (let i = 0; i < types.length; i += 2) {
      const tokenType = types[i];
      const value = types[i + 1];
      
      if (this.check(tokenType, value)) {
        this.advance();
        return true;
      }
    }
    
    return false;
  }

  check(type, value) {
    if (this.isAtEnd()) return false;
    if (!this.peek() || this.peek().type !== type) return false;
    if (value !== undefined && (!this.peek().value || this.peek().value !== value)) return false;
    return true;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  consume(type, value, errorMessage) {
    if (this.check(type, value)) {
      return this.advance();
    }
    
    const peek = this.peek();
    const peekInfo = peek ? `${peek.type}:${peek.value}` : 'end of input';
    throw new Error(`${errorMessage} Found ${peekInfo}`);
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }

  peek() {
    if (this.current >= this.tokens.length) return null;
    return this.tokens[this.current];
  }

  previous() {
    if (this.current <= 0) return null;
    return this.tokens[this.current - 1];
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}

module.exports = {
  parse,
  NODE_TYPES
}; 