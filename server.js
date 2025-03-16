const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const esprima = require("esprima");

const app = express();
app.use(cors());
app.use(express.json());

// Helpers
async function createTempFile(code) {
  const tmpdir = os.tmpdir();
  const tmpPath = path.join(tmpdir, `code-${Date.now()}.js`);
  await fs.writeFile(tmpPath, code);
  return tmpPath;
}

async function cleanupTempFile(tmpPath) {
  await fs.unlink(tmpPath).catch(console.error);
}

function convertToPython(node, indent = 0) {
  const spaces = "    ".repeat(indent);
  
  switch (node.type) {
    case 'Program':
      return node.body.map(stmt => convertToPython(stmt)).join('\n');
    
    case 'VariableDeclaration':
      return node.declarations.map(decl => {
        const id = convertToPython(decl.id);
        if (decl.init && decl.init.type === 'ArrowFunctionExpression') {
          decl.init.id = { name: id };
          return convertToPython(decl.init, indent);
        }
        const init = decl.init ? convertToPython(decl.init) : 'None';
        return `${spaces}${id} = ${init}`;
      }).join('\n');
    
    case 'FunctionDeclaration':
      const params = node.params.map(p => convertToPython(p)).join(', ');
      const body = node.body.body.map(stmt => convertToPython(stmt, indent + 1)).join('\n');
      return `${spaces}def ${node.id.name}(${params}):\n${body}`;
    
    case 'ArrowFunctionExpression':
      const arrowParams = node.params.map(p => convertToPython(p)).join(', ');
      if (node.body.type === 'BlockStatement') {
        const arrowBody = node.body.body.map(stmt => convertToPython(stmt, indent + 1)).join('\n');
        return `${spaces}def ${node.id?.name || 'anonymous'}(${arrowParams}):\n${arrowBody}`;
      } else {
        return `${spaces}lambda ${arrowParams}: ${convertToPython(node.body)}`;
      }
    
    case 'ReturnStatement':
      const returnValue = node.argument ? convertToPython(node.argument) : 'None';
      return `${spaces}return ${returnValue}`;
    
    case 'BinaryExpression':
      const operators = {
        '===': '==',
        '!==': '!=',
        '&&': 'and',
        '||': 'or'
      };
      const op = operators[node.operator] || node.operator;
      return `${convertToPython(node.left)} ${op} ${convertToPython(node.right)}`;
    
    case 'CallExpression':
      const callee = convertToPython(node.callee);
      const args = node.arguments.map(arg => convertToPython(arg)).join(', ');
      return `${callee}(${args})`;
    
    case 'MemberExpression':
      const object = convertToPython(node.object);
      const property = node.computed ? 
        `[${convertToPython(node.property)}]` : 
        node.property.name;
      
      // Handle console.log -> print conversion
      if (object === 'console' && property === 'log') {
        return 'print';
      }
      
      return node.computed ? `${object}${property}` : `${object}.${property}`;
    
    case 'IfStatement':
      const ifTest = convertToPython(node.test);
      const consequent = node.consequent.body ?
        node.consequent.body.map(stmt => convertToPython(stmt, indent + 1)).join('\n') :
        convertToPython(node.consequent, indent + 1);
      let ifResult = `${spaces}if ${ifTest}:\n${consequent}`;
      
      if (node.alternate) {
        const alternate = node.alternate.body ?
          node.alternate.body.map(stmt => convertToPython(stmt, indent + 1)).join('\n') :
          convertToPython(node.alternate, indent + 1);
        ifResult += `\n${spaces}else:\n${alternate}`;
      }
      return ifResult;
    
    case 'ForStatement':
      const init = convertToPython(node.init);
      const forTest = convertToPython(node.test);
      const update = convertToPython(node.update);
      const forBody = node.body.body.map(stmt => convertToPython(stmt, indent + 1)).join('\n');
      // Convert to while loop since Python doesn't have C-style for loops
      return `${spaces}${init}\n${spaces}while ${forTest}:\n${forBody}\n${spaces}    ${update}`;
    
    case 'WhileStatement':
      const whileTest = convertToPython(node.test);
      const whileBody = node.body.body.map(stmt => convertToPython(stmt, indent + 1)).join('\n');
      return `${spaces}while ${whileTest}:\n${whileBody}`;
    
    case 'ObjectExpression':
      const properties = node.properties.map(prop => {
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
        const value = convertToPython(prop.value);
        return `${spaces}    "${key}": ${value}`;
      }).join(',\n');
      return `{\n${properties}\n${spaces}}`;
    
    case 'ArrayExpression':
      const elements = node.elements.map(elem => convertToPython(elem)).join(', ');
      return `[${elements}]`;
    
    case 'Literal':
      if (typeof node.value === 'string') {
        return `"${node.value}"`;
      }
      return String(node.value);
    
    case 'Identifier':
      // Convert common JavaScript built-ins to Python equivalents
      const jsBuiltins = {
        'console.log': 'print',
        'undefined': 'None',
        'null': 'None',
        'true': 'True',
        'false': 'False'
      };
      return jsBuiltins[node.name] || node.name;
    
    case 'ExpressionStatement':
      return `${spaces}${convertToPython(node.expression)}`;

    case 'TemplateLiteral':
      const expressions = node.expressions.map(expr => convertToPython(expr));
      const quasis = node.quasis.map(quasi => quasi.value.raw);
      let templateStr = 'f"';
      for (let i = 0; i < quasis.length; i++) {
        templateStr += quasis[i];
        if (i < expressions.length) {
          templateStr += '{' + expressions[i] + '}';
        }
      }
      templateStr += '"';
      return templateStr;
    
    default:
      return `# Unsupported: ${node.type}`;
  }
}

// Routes
app.post("/analyze", async (req, res) => {
  let tmpPath = null;
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    tmpPath = await createTempFile(code);

    // Execute the FLEX lexer
    exec(`./lexer ${tmpPath}`, (error, stdout) => {
      if (error) {
        cleanupTempFile(tmpPath);
        console.error("Lexer error:", error);
        return res.status(500).json({ error: "Lexer execution failed" });
      }

      // Format the result
      const lexicalLines = stdout
        .split("\n")
        .filter(
          (line) =>
            line.trim() &&
            !line.startsWith("Parsing") &&
            !line.startsWith("Syntax")
        );

      const formatted = lexicalLines.map((line) => {
        const [type, ...valueParts] = line.split(":");
        return {
          type: type.trim(),
          value: valueParts.join(":").trim(),
        };
      });

      // Execute the parser
      exec(
        `./js_parser ${tmpPath}`,
        (parserError, parserStdout, parserStderr) => {
          cleanupTempFile(tmpPath);
          console.log("parserError:", parserError);

          const parserOutput = [parserStdout, parserStderr]
            .filter(Boolean)
            .join("\n");

          const errorCount = parserOutput.match(
            /Parsing completed with (\d+) errors/
          );
          const hasErrors = errorCount && parseInt(errorCount[1]) > 0;

          const errorMessages = parserOutput
            .split("\n")
            .filter(
              (line) =>
                line.includes("Syntax Error") || line.includes("Expected")
            )
            .join("\n");

          const result = {
            lexical: { results: formatted },
            syntactic: {
              valid: !hasErrors,
              errors: hasErrors ? errorMessages : null,
            },
          };

          res.json(result);
        }
      );
    });
  } catch (err) {
    if (tmpPath) {
      cleanupTempFile(tmpPath);
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/convert", (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    // Parse JavaScript code
    const ast = esprima.parseScript(code);
    
    // Convert to Python
    const pythonCode = convertToPython(ast);
    
    res.json({ pythonCode });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static("."));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
