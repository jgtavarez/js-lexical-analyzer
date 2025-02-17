# JavaScript Lexical and Syntactic Analyzer

This project implements a lexical and syntactic analyzer for JavaScript code using FLEX (Fast Lexical Analyzer Generator) and BISON (Berkeley Software Distribution) with a modern web interface. It uses Node.js for the backend server and vanilla JavaScript for the frontend.

## Prerequisites

- Node.js
- npm
- FLEX (Fast Lexical Analyzer)
- GCC compiler
- BISON (Berkeley Software Distribution)

## Installation

1. Install Node.js dependencies:

```bash
npm install
```

2. Build the lexical and syntactic analyzers:

```bash
make clean && make
```

## Running the Application

1. Start the Node.js server:

```bash
npm start
```

2. Open `http://localhost:3000` in your web browser

## Project Structure

- `lexer.l` - FLEX lexical analyzer definition file
- `parser.c` - C source for syntactic analyzer
- `parser.h` - Header file with token and parser definitions
- `Makefile` - Build configuration
- `server.js` - Node.js backend server
- `index.html` - Frontend web interface

## Usage Example

Input JavaScript code:

```javascript
function sum(a, b) {
  let result = a + b;
  return result;
}
```

The lexical analyzer will output:
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

The syntactic analyzer will output:

```
Parsing completed with 0 errors
```

## Demo

![Demo](.github/demo.gif)
