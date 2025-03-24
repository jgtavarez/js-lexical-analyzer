// Lexical Analyzer for JavaScript to Python compiler

// Define token types
const TOKEN_TYPES = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  WHITESPACE: 'WHITESPACE',
  COMMENT: 'COMMENT',
  UNKNOWN: 'UNKNOWN'
};

// JavaScript keywords
const KEYWORDS = [
  'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 
  'function', 'return', 'break', 'continue', 'switch', 'case',
  'default', 'true', 'false', 'null', 'undefined'
];

// Function to tokenize JavaScript code without using flex-js
function tokenize(code) {
  const tokens = [];
  let position = 0;
  
  // Helper function to check if character is a letter
  const isLetter = (char) => /[a-zA-Z_]/.test(char);
  
  // Helper function to check if character is a digit
  const isDigit = (char) => /[0-9]/.test(char);
  
  // Helper function to check if character is alphanumeric
  const isAlphaNumeric = (char) => isLetter(char) || isDigit(char);
  
  // Helper function to check if string is a keyword
  const isKeyword = (str) => KEYWORDS.includes(str);
  
  // Skip whitespace and comments
  const skipWhitespaceAndComments = () => {
    while (position < code.length) {
      // Skip whitespace
      if (/\s/.test(code[position])) {
        position++;
        continue;
      }
      
      // Skip single-line comments
      if (code[position] === '/' && code[position + 1] === '/') {
        position += 2;
        while (position < code.length && code[position] !== '\n') {
          position++;
        }
        continue;
      }
      
      // Skip multi-line comments
      if (code[position] === '/' && code[position + 1] === '*') {
        position += 2;
        while (position < code.length && !(code[position] === '*' && code[position + 1] === '/')) {
          position++;
        }
        if (position < code.length) {
          position += 2; // Skip */
        }
        continue;
      }
      
      break;
    }
  };
  
  // Process tokens
  while (position < code.length) {
    skipWhitespaceAndComments();
    
    if (position >= code.length) break;
    
    const char = code[position];
    
    // Identifiers and keywords
    if (isLetter(char)) {
      let start = position;
      while (position < code.length && isAlphaNumeric(code[position])) {
        position++;
      }
      
      const value = code.substring(start, position);
      
      if (isKeyword(value)) {
        tokens.push({ type: TOKEN_TYPES.KEYWORD, value });
      } else {
        tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value });
      }
      continue;
    }
    
    // Numbers
    if (isDigit(char) || (char === '-' && isDigit(code[position + 1]))) {
      let start = position;
      let hasDot = false;
      
      if (char === '-') position++;
      
      while (position < code.length && (isDigit(code[position]) || (code[position] === '.' && !hasDot))) {
        if (code[position] === '.') hasDot = true;
        position++;
      }
      
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: code.substring(start, position) });
      continue;
    }
    
    // Strings
    if (char === '"' || char === "'") {
      const quote = char;
      let start = position;
      position++; // Skip opening quote
      
      while (position < code.length && code[position] !== quote) {
        if (code[position] === '\\') position++; // Skip escape character
        position++;
      }
      
      if (position < code.length) position++; // Skip closing quote
      
      tokens.push({ type: TOKEN_TYPES.STRING, value: code.substring(start, position) });
      continue;
    }
    
    // Operators
    if (/[+\-*\/=<>!&|^%?:.]/.test(char)) {
      // Check for multi-character operators
      if ((char === '=' && code[position + 1] === '=') || 
          (char === '!' && code[position + 1] === '=') ||
          (char === '<' && code[position + 1] === '=') ||
          (char === '>' && code[position + 1] === '=') ||
          (char === '&' && code[position + 1] === '&') ||
          (char === '|' && code[position + 1] === '|')) {
        tokens.push({ type: TOKEN_TYPES.OPERATOR, value: code.substring(position, position + 2) });
        position += 2;
      } else {
        tokens.push({ type: TOKEN_TYPES.OPERATOR, value: char });
        position++;
      }
      continue;
    }
    
    // Punctuation
    if (/[\(\)\{\}\[\],;]/.test(char)) {
      tokens.push({ type: TOKEN_TYPES.PUNCTUATION, value: char });
      position++;
      continue;
    }
    
    // Unknown characters
    tokens.push({ type: TOKEN_TYPES.UNKNOWN, value: char });
    position++;
  }
  
  return tokens;
}

module.exports = {
  tokenize,
  TOKEN_TYPES
}; 