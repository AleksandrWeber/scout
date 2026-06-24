import fs from 'fs/promises';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { VulnerabilityFinding } from './security-analyzer';

export type AstAnalysisResult = {
  findings: VulnerabilityFinding[];
  filesScanned: number;
  parseErrors: number;
};

const USER_INPUT_PATTERNS = [
  /^req\.(body|query|params)(\.|$)/,
  /^request\.(body|query|params)(\.|$)/,
  /^event\.target\.value$/,
  /^location\.search$/,
  /^window\.location\.(search|href)$/,
  /^document\.URL$/
];

const expressionToPath = (node: t.Node): string[] => {
  if (t.isIdentifier(node)) {
    return [node.name];
  }

  if (t.isMemberExpression(node)) {
    const objectPath = expressionToPath(node.object);
    if (t.isIdentifier(node.property)) {
      return [...objectPath, node.property.name];
    }
    if (t.isStringLiteral(node.property)) {
      return [...objectPath, node.property.value];
    }
    return [...objectPath, '?'];
  }

  if (t.isThisExpression(node)) {
    return ['this'];
  }

  return [];
};

const pathToString = (segments: string[]) => segments.join('.');

const isUserInputSource = (node: t.Node): boolean => {
  if (!t.isExpression(node) && !t.isPrivateName(node)) {
    return false;
  }

  const expression = t.isPrivateName(node) ? null : node;
  if (!expression) {
    return false;
  }

  const pathString = pathToString(expressionToPath(expression));
  return USER_INPUT_PATTERNS.some((pattern) => pattern.test(pathString));
};

class TaintTracker {
  private readonly tainted = new Set<string>();
  private readonly sources = new Map<string, string>();

  markBinding(name: string, value: t.Node) {
    const sourceLabel = this.resolveSourceLabel(value);
    if (!sourceLabel) {
      return;
    }

    this.tainted.add(name);
    this.sources.set(name, sourceLabel);
  }

  resolveSourceLabel(node: t.Node): string | null {
    if (isUserInputSource(node)) {
      return pathToString(expressionToPath(node));
    }

    if (t.isIdentifier(node)) {
      return this.sources.get(node.name) ?? null;
    }

    if (t.isMemberExpression(node)) {
      const base = expressionToPath(node.object);
      if (base.length === 1) {
        return this.sources.get(base[0]) ?? null;
      }
    }

    if (t.isTemplateLiteral(node)) {
      for (const expression of node.expressions) {
        const source = this.resolveSourceLabel(expression);
        if (source) {
          return source;
        }
      }
    }

    if (t.isBinaryExpression(node)) {
      return this.resolveSourceLabel(node.left) || this.resolveSourceLabel(node.right);
    }

    return null;
  }

  isTaintedNode(node: t.Node): boolean {
    return this.resolveSourceLabel(node) !== null;
  }
}

const isEvalCallee = (callee: t.Expression | t.V8IntrinsicIdentifier) =>
  t.isIdentifier(callee) && callee.name === 'eval';

const isNewFunctionCallee = (callee: t.Expression | t.V8IntrinsicIdentifier) =>
  t.isIdentifier(callee) && callee.name === 'Function';

const isDocumentWriteCallee = (callee: t.Expression | t.V8IntrinsicIdentifier) => {
  if (!t.isMemberExpression(callee)) {
    return false;
  }

  const chain = pathToString(expressionToPath(callee));
  return chain === 'document.write';
};

const isInnerHtmlAssignment = (node: t.AssignmentExpression) => {
  if (!t.isMemberExpression(node.left)) {
    return false;
  }

  const property = node.left.property;
  return (t.isIdentifier(property) && property.name === 'innerHTML') ||
    (t.isStringLiteral(property) && property.value === 'innerHTML');
};

const createDataFlowFinding = (
  relativePath: string,
  line: number,
  sink: string,
  sourceHint: string
): VulnerabilityFinding => ({
  severity: 'HIGH',
  category: 'AST_DATA_FLOW',
  file: relativePath,
  line,
  description: `User-controlled data (${sourceHint}) may reach ${sink}.`,
  risk: 'Untrusted input flowing into a dangerous sink can enable XSS or code injection.',
  fix: 'Validate and sanitize user input before passing it to DOM APIs or dynamic code execution.',
  education:
    'AST data-flow analysis tracks values from common user-input sources (req.body, req.query, etc.) to risky sinks.'
});

const analyzeFileContent = (content: string, relativePath: string): VulnerabilityFinding[] => {
  let ast: t.File;

  try {
    ast = parse(content, {
      sourceType: 'unambiguous',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true
    });
  } catch {
    return [];
  }

  const findings: VulnerabilityFinding[] = [];
  const trackerStack: TaintTracker[] = [new TaintTracker()];

  const currentTracker = () => trackerStack[trackerStack.length - 1];

  const pushFunctionScope = () => {
    trackerStack.push(new TaintTracker());
  };

  const popFunctionScope = () => {
    if (trackerStack.length > 1) {
      trackerStack.pop();
    }
  };

  const reportSink = (line: number, sink: string, argument: t.Node) => {
    const sourceHint = currentTracker().resolveSourceLabel(argument);
    if (!sourceHint) {
      return;
    }

    findings.push(createDataFlowFinding(relativePath, line, sink, sourceHint));
  };

  traverse(ast, {
    Function: {
      enter: pushFunctionScope,
      exit: popFunctionScope
    },
    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id) || !path.node.init) {
        return;
      }

      currentTracker().markBinding(path.node.id.name, path.node.init);
    },
    AssignmentExpression(path) {
      if (t.isIdentifier(path.node.left)) {
        currentTracker().markBinding(path.node.left.name, path.node.right);
      }

      if (isInnerHtmlAssignment(path.node)) {
        reportSink(path.node.loc?.start.line ?? 0, 'innerHTML assignment', path.node.right);
      }
    },
    CallExpression(path) {
      const { callee } = path.node;
      const argument = path.node.arguments[0];
      if (!argument || t.isSpreadElement(argument)) {
        return;
      }

      const line = path.node.loc?.start.line ?? 0;

      if (isEvalCallee(callee)) {
        reportSink(line, 'eval()', argument);
      } else if (isNewFunctionCallee(callee)) {
        reportSink(line, 'new Function()', argument);
      } else if (isDocumentWriteCallee(callee)) {
        reportSink(line, 'document.write()', argument);
      }
    },
    JSXAttribute(path) {
      if (!t.isJSXIdentifier(path.node.name) || path.node.name.name !== 'dangerouslySetInnerHTML') {
        return;
      }

      const value = path.node.value;
      if (!value || !t.isJSXExpressionContainer(value)) {
        return;
      }

      const expression = value.expression;
      if (!t.isObjectExpression(expression)) {
        return;
      }

      const htmlProperty = expression.properties.find(
        (property) =>
          t.isObjectProperty(property) &&
          ((t.isIdentifier(property.key) && property.key.name === '__html') ||
            (t.isStringLiteral(property.key) && property.key.value === '__html'))
      );

      if (!t.isObjectProperty(htmlProperty) || !t.isExpression(htmlProperty.value)) {
        return;
      }

      reportSink(path.node.loc?.start.line ?? 0, 'dangerouslySetInnerHTML', htmlProperty.value);
    }
  });

  return findings;
};

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (fullPath.match(/\.(js|jsx|ts|tsx)$/i)) {
      files.push(fullPath);
    }
  }

  return files;
};

export const analyzeAstDataFlow = async (repoPath: string): Promise<AstAnalysisResult> => {
  const files = await collectSourceFiles(repoPath);
  const findings: VulnerabilityFinding[] = [];
  let parseErrors = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(repoPath, file);

    try {
      parse(content, {
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx'],
        errorRecovery: false
      });
    } catch {
      parseErrors += 1;
      continue;
    }

    findings.push(...analyzeFileContent(content, relativePath));
  }

  return {
    findings,
    filesScanned: files.length - parseErrors,
    parseErrors
  };
};
