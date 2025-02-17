const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

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

app.use(express.static("."));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
