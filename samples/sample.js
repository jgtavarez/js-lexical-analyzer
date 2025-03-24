// Sample JavaScript file to test the compiler

// Function to calculate factorial
function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Function to check if a number is prime
function isPrime(num) {
    if (num <= 1) {
        return false;
    }
    if (num <= 3) {
        return true;
    }
    if (num % 2 === 0 || num % 3 === 0) {
        return false;
    }
    
    let i = 5;
    while (i * i <= num) {
        if (num % i === 0 || num % (i + 2) === 0) {
            return false;
        }
        i += 6;
    }
    
    return true;
}

// Function to generate Fibonacci sequence
function fibonacci(n) {
    let fib = [];
    let a = 0;
    let b = 1;
    
    for (let i = 0; i < n; i++) {
        fib.push(a);
        let temp = a + b;
        a = b;
        b = temp;
    }
    
    return fib;
}

// Calculate factorial of 5
var factResult = factorial(5);
console.log("Factorial of 5: " + factResult);

// Check if 17 is prime
var primeResult = isPrime(17);
console.log("Is 17 prime? " + primeResult);

// Generate first 10 Fibonacci numbers
var fibResult = fibonacci(10);
console.log("First 10 Fibonacci numbers: " + fibResult.join(", ")); 