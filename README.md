# TypeScript Semantic Analyzer

This project implements a semantic analyzer for Typescript with a modern web interface. It uses Node.js for the backend server and vanilla JavaScript for the frontend.

## Prerequisites

- Node.js
- npm

## Installation

1. Install Node.js dependencies:

```bash
npm install
```

## Running the Application

1. Start the Node.js server:

```bash
npm run dev
```

2. Open `http://localhost:3000` in your web browser

## Usage Example

```typescript
// Type checking example
let x: number = 5;
x = "hello";

// Function parameter checking
function greet(name: string, age: number) {
  console.log(`Hello ${name}, you are ${age} years old`);
}
greet("John");
```

The lexical analyzer will output:

```
Line 3, Column 1
Type 'string' is not assignable to type 'number'.

Line 9, Column 1
Expected 2 arguments, but got 1.

Line 2, Column 5
Variable 'x' is declared but never used

Line 3, Column 1
Type '"hello"' is not assignable to type 'number'

Line 7, Column 5
Expected 2 arguments, but got 1

Line 9, Column 1
Expected 2 arguments, but got 1
```