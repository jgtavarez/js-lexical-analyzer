// Client-side JavaScript for the JS2PY compiler interface
document.addEventListener('DOMContentLoaded', () => {
    const jsCodeTextarea = document.getElementById('js-code');
    const compileBtn = document.getElementById('compile-btn');
    const tokensOutput = document.getElementById('tokens-output');
    const astOutput = document.getElementById('ast-output');
    const symbolTableOutput = document.getElementById('symbol-table-output');
    const intermediateCodeOutput = document.getElementById('intermediate-code-output');
    const pythonCodeOutput = document.getElementById('python-code-output');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');

    // Sample JavaScript code to show when the page loads
    const sampleCode = `// Sample JavaScript code
function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

var result = factorial(5);
console.log("Factorial of 5 is: " + result);`;

    jsCodeTextarea.value = sampleCode;

    // Handle compile button click
    compileBtn.addEventListener('click', async () => {
        const jsCode = jsCodeTextarea.value.trim();
        
        if (!jsCode) {
            showError('Please enter some JavaScript code.');
            return;
        }
        
        try {
            // Show loading state
            compileBtn.disabled = true;
            compileBtn.textContent = 'Compiling...';
            
            // Clear previous results
            clearOutputs();
            
            // Send code to server for compilation
            const response = await fetch('/api/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: jsCode })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Display compilation results
                displayResults(result);
                hideError();
            } else {
                // Display error
                showError(`Error during ${result.step}: ${result.error}`);
                
                // Display partial results if available
                displayResults(result);
            }
        } catch (error) {
            showError(`Failed to compile: ${error.message}`);
        } finally {
            // Reset button state
            compileBtn.disabled = false;
            compileBtn.textContent = 'Compile';
        }
    });

    // Display compilation results
    function displayResults(result) {
        if (result.tokens) {
            tokensOutput.textContent = formatOutput(result.tokens);
        }
        
        if (result.ast) {
            astOutput.textContent = formatOutput(result.ast);
        }
        
        if (result.symbolTable) {
            symbolTableOutput.textContent = formatOutput(result.symbolTable);
        }
        
        if (result.intermediateCode) {
            intermediateCodeOutput.textContent = formatOutput(result.intermediateCode);
        }
        
        if (result.pythonCode) {
            pythonCodeOutput.textContent = result.pythonCode;
        }
    }

    // Format output as pretty-printed JSON
    function formatOutput(data) {
        if (typeof data === 'string') {
            try {
                // Try to parse as JSON
                const parsed = JSON.parse(data);
                return JSON.stringify(parsed, null, 2);
            } catch (e) {
                // Return as is if not valid JSON
                return data;
            }
        }
        return JSON.stringify(data, null, 2);
    }

    // Clear all output elements
    function clearOutputs() {
        tokensOutput.textContent = '';
        astOutput.textContent = '';
        symbolTableOutput.textContent = '';
        intermediateCodeOutput.textContent = '';
        pythonCodeOutput.textContent = '';
    }

    // Show error message
    function showError(message) {
        errorSection.classList.remove('hidden');
        errorMessage.textContent = message;
    }

    // Hide error message
    function hideError() {
        errorSection.classList.add('hidden');
        errorMessage.textContent = '';
    }
}); 