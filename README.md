# JavaScript Lexical Analyzer

This project implements a lexical analyzer for JavaScript code using FLEX (Fast Lexical Analyzer Generator) with a modern web interface. It uses Node.js for the backend server and vanilla JavaScript for the frontend.

## Prerequisites

- Node.js
- npm
- FLEX (Fast Lexical Analyzer)
- GCC compiler

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Compile the FLEX lexer:
```bash
flex lexer.l
gcc lex.yy.c -o lexer
```

## Running the Application

1. Start the Node.js server:
```bash
npm start
```

2. Open `http://localhost:3000` in your web browser

## Project Structure

- `lexer.l` - FLEX lexical analyzer definition file
- `server.js` - Node.js backend server
- `index.html` - Frontend web interface

## Usage Example

Input JavaScript code:
```javascript
const sum = (a, b) => {
    // This is a comment
    let result = a + b;
    return result;
}
```

The analyzer will output:
```
KEYWORD: const
IDENTIFIER: sum
OPERATOR: =
PUNCTUATION: (
IDENTIFIER: a
PUNCTUATION: ,
IDENTIFIER: b
PUNCTUATION: )
OPERATOR: =
OPERATOR: >
PUNCTUATION: {
COMMENT: // This is a comment
KEYWORD: let
IDENTIFIER: result
OPERATOR: =
IDENTIFIER: a
OPERATOR: +
IDENTIFIER: b
PUNCTUATION: ;
KEYWORD: return
IDENTIFIER: result
PUNCTUATION: ;
PUNCTUATION: }
```

## Demo

![Demo](.github/demo.gif)