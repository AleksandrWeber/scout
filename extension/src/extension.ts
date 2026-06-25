import * as vscode from 'vscode';

type ScoutReport = {
  source?: string;
  projectName?: string;
  projectPath?: string;
  summary?: {
    total: number;
    codeFindings: number;
    dependencyFindings: number;
    secretFindings?: number;
  };
};

const formatSummary = (report: ScoutReport): string => {
  const summary = report.summary;
  if (!summary) {
    return 'Scout scan completed.';
  }

  return [
    `Project: ${report.projectName || report.projectPath || 'workspace'}`,
    `Total findings: ${summary.total}`,
    `Code: ${summary.codeFindings}`,
    `Dependencies: ${summary.dependencyFindings}`,
    `Secrets: ${summary.secretFindings ?? 0}`
  ].join('\n');
};

export const activate = (context: vscode.ExtensionContext) => {
  const scanWorkspace = vscode.commands.registerCommand('scout.scanWorkspace', async () => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      void vscode.window.showErrorMessage('Scout: open a workspace folder before scanning.');
      return;
    }

    const config = vscode.workspace.getConfiguration('scout');
    const backendUrl = config.get<string>('backendUrl', 'http://localhost:4000').replace(/\/$/, '');
    const uiUrl = config.get<string>('uiUrl', 'http://localhost:5173');
    const openUiAfterScan = config.get<boolean>('openUiAfterScan', true);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Scout is scanning the workspace…',
        cancellable: false
      },
      async () => {
        const response = await fetch(`${backendUrl}/api/analyze/local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath: folder.uri.fsPath })
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || `Scout scan failed (${response.status})`);
        }

        const report = (await response.json()) as ScoutReport;
        const output = vscode.window.createOutputChannel('Scout');
        output.clear();
        output.appendLine('Scout workspace scan complete');
        output.appendLine(formatSummary(report));
        output.show(true);

        void vscode.window.showInformationMessage(
          `Scout found ${report.summary?.total ?? 0} finding(s) in ${report.projectName || 'workspace'}.`
        );

        if (openUiAfterScan) {
          void vscode.env.openExternal(vscode.Uri.parse(uiUrl));
        }
      }
    ).catch((error: Error) => {
      void vscode.window.showErrorMessage(`Scout: ${error.message}`);
    });
  });

  context.subscriptions.push(scanWorkspace);
};

export const deactivate = () => undefined;
