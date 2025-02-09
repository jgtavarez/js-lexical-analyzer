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
      cleanupTempFile(tmpPath);

      if (error) {
        console.error("Lexer error:", error);
        return res.status(500).json({ error: "Lexer execution failed" });
      }

      // Format the result
      const formatted = stdout
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [type, ...valueParts] = line.split(":");
          return {
            type: type.trim(),
            value: valueParts.join(":").trim(),
          };
        });

      res.json({ results: formatted });
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
