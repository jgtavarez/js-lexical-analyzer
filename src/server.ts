import express from 'express';
import cors from 'cors';
import { createProgram, ScriptTarget, ModuleKind, TypeChecker, Node, SyntaxKind, Program } from 'typescript';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

const app = express();
app.use(cors());
app.use(express.json());

interface SemanticIssue {
  line: number;
  character: number;
  message: string;
  code?: string;
  severity: 'error' | 'warning';
}

interface SemanticAnalysisResult {
  issues: SemanticIssue[];
}

async function createTempFile(code: string): Promise<string> {
  const tmpdir = os.tmpdir();
  const tmpPath = path.join(tmpdir, `code-${Date.now()}.ts`);
  await fs.writeFile(tmpPath, code);
  return tmpPath;
}

async function cleanupTempFile(tmpPath: string): Promise<void> {
  try {
    await fs.unlink(tmpPath);
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}

function performSemanticAnalysis(sourceFile: string): SemanticAnalysisResult {
  const issues: SemanticIssue[] = [];

  // Create a TypeScript program
  const program = createProgram([sourceFile], {
    target: ScriptTarget.ES2020,
    module: ModuleKind.CommonJS,
    strict: true,
  });

  const checker = program.getTypeChecker();

  // Get the source file
  const source = program.getSourceFile(sourceFile);
  if (!source) {
    return { issues: [{ 
      line: 1, 
      character: 1, 
      message: 'Could not analyze source file',
      severity: 'error'
    }] };
  }

  // Track variable usage
  const variableUsage = new Map<string, number>();

  // Get all diagnostics
  const diagnostics = [
    ...program.getSemanticDiagnostics(source),
    ...program.getSyntacticDiagnostics(source),
  ];

  // Convert diagnostics to issues
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      
      issues.push({
        line: line + 1,
        character: character + 1,
        message,
        severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
        code: diagnostic.code.toString()
      });
    }
  });

  // Additional semantic checks
  function visit(node: ts.Node) {
    // Track variable usage
    if (ts.isIdentifier(node)) {
      const count = variableUsage.get(node.text) || 0;
      variableUsage.set(node.text, count + 1);
    }

    // Check for type compatibility in assignments
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const leftType = checker.getTypeAtLocation(node.left);
      const rightType = checker.getTypeAtLocation(node.right);
      
      if (!checker.isTypeAssignableTo(rightType, leftType)) {
        const pos = node.getStart();
        if (pos !== undefined) {
          const { line, character } = source!.getLineAndCharacterOfPosition(pos);
          issues.push({
            line: line + 1,
            character: character + 1,
            message: `Type '${checker.typeToString(rightType)}' is not assignable to type '${checker.typeToString(leftType)}'`,
            severity: 'error',
            code: node.getText()
          });
        }
      }
    }

    // Check for unused variables
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const usageCount = variableUsage.get(node.name.text) || 0;
        if (usageCount <= 1) { // Only declaration, no usage
          const pos = node.name.getStart();
          if (pos !== undefined) {
            const { line, character } = source!.getLineAndCharacterOfPosition(pos);
            issues.push({
              line: line + 1,
              character: character + 1,
              message: `Variable '${node.name.text}' is declared but never used`,
              severity: 'warning',
              code: node.name.text
            });
          }
        }
      }
    }

    // Check function calls
    if (ts.isCallExpression(node)) {
      const signature = checker.getResolvedSignature(node);
      if (signature) {
        const params = signature.parameters;
        if (node.arguments.length < params.length) {
          const pos = node.getStart();
          if (pos !== undefined) {
            const { line, character } = source!.getLineAndCharacterOfPosition(pos);
            issues.push({
              line: line + 1,
              character: character + 1,
              message: `Expected ${params.length} arguments, but got ${node.arguments.length}`,
              severity: 'error',
              code: node.getText()
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return { issues };
}

app.post("/analyze", async (req: express.Request, res: express.Response) => {
  let tmpPath: string | null = null;
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    tmpPath = await createTempFile(code);
    const result = performSemanticAnalysis(tmpPath);
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  } finally {
    if (tmpPath) {
      await cleanupTempFile(tmpPath);
    }
  }
});

app.use(express.static("."));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 