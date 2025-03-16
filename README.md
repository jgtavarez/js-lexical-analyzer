# JavaScript to Python Converter

This project implements a JavaScript to Python code converter with a modern web interface. It uses Node.js for the backend server and vanilla JavaScript for the frontend.

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
npm start
```

2. Open `http://localhost:3000` in your web browser

## Project Structure

- `server.js` - Node.js backend server with JavaScript to Python conversion logic
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

The converter will output the following Python code:

```python
def sum(a, b):
    # This is a comment
    result = a + b
    return result
```

Another example:

Input JavaScript code:

```javascript
const name = 'Gabriel';
console.log(`Hello ${name}!`);
```

Output Python code:

```python
name = "Gabriel"
print(f"Hello {name}!")
```

## Features

The converter supports:
- Variable declarations
- Function declarations (including arrow functions)
- Basic control structures (if/else, loops)
- Common JavaScript built-ins (console.log -> print)
- Objects and arrays
- Basic operators and expressions