import { test, expect } from '@playwright/test';

test.describe('Scout E2E', () => {
  test('submits a GitHub repo URL and shows the analysis results', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoUrl: 'https://github.com/example/repo',
          summary: {
            total: 1,
            codeFindings: 1,
            dependencyFindings: 0,
            securityFindings: 1
          },
          semgrep: {
            status: 'success',
            message: '1 issue found',
            count: 1
          },
          findings: [
            {
              severity: 'HIGH',
              category: 'XSS',
              file: 'src/index.ts',
              description: 'Unsanitized input is rendered.',
              risk: 'Script injection may occur.',
              fix: 'Escape user input.',
              education: 'Do not render raw user content.',
              aiExplanation: {
                severity: 'HIGH',
                summary: 'The issue is a cross-site scripting risk.',
                risk: 'Unescaped user input can execute arbitrary JavaScript.',
                suggestedFix: 'Escape or sanitize output before rendering.',
                codeSample: '<div>{escape(userInput)}</div>',
                beginnerExplanation: 'If you display user content without cleaning it, attackers can run scripts in the browser.'
              }
            }
          ],
          dependencyFindings: []
        })
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Scout/i })).toBeVisible();
    await page.fill('input[type="text"]', 'https://github.com/example/repo');
    await page.click('button:has-text("Analyze")');

    await expect(page.getByText(/Analyzed repository:/i)).toBeVisible();
    await expect(page.getByText('src/index.ts')).toBeVisible();
    await expect(page.getByText(/Semgrep findings: 1/i)).toBeVisible();
    await expect(page.getByText(/The issue is a cross-site scripting risk./i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Code findings \(1\)/i })).toBeVisible();
  });

  test('shows dependency findings in a separate tab', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoUrl: 'https://github.com/example/repo',
          summary: {
            total: 1,
            codeFindings: 0,
            dependencyFindings: 1,
            securityFindings: 0
          },
          semgrep: {
            status: 'success',
            message: '',
            count: 0
          },
          findings: [],
          dependencyFindings: [
            {
              severity: 'HIGH',
              category: 'DEPENDENCY_VULNERABILITY',
              file: 'package.json',
              description: 'lodash: Prototype Pollution',
              risk: 'Prototype pollution risk.',
              fix: 'Update lodash to 4.17.21 or later.',
              education: 'npm audit found a vulnerability.',
              dependency: {
                packageName: 'lodash',
                cveIds: ['CVE-2021-23337'],
                vulnerableVersions: '<4.17.21',
                patchedVersion: '4.17.21',
                exploitAvailable: true,
                priorityScore: 374
              }
            }
          ]
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="text"]', 'https://github.com/example/repo');
    await page.click('button:has-text("Analyze")');

    await expect(page.getByRole('button', { name: /Dependencies \(1\)/i })).toBeVisible();
    await page.getByRole('button', { name: /Dependencies \(1\)/i }).click();
    await expect(page.getByText('lodash', { exact: true })).toBeVisible();
    await expect(page.getByText(/CVE-2021-23337/)).toBeVisible();
  });

  test('sends a chat message about a code finding', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoUrl: 'https://github.com/example/repo',
          summary: {
            total: 1,
            codeFindings: 1,
            dependencyFindings: 0,
            securityFindings: 1
          },
          semgrep: { status: 'success', message: '', count: 0 },
          findings: [
            {
              severity: 'HIGH',
              category: 'XSS',
              file: 'src/App.tsx',
              description: 'Uses dangerouslySetInnerHTML.',
              risk: 'Script injection may occur.',
              fix: 'Sanitize HTML before rendering.',
              education: 'XSS basics.'
            }
          ],
          dependencyFindings: []
        })
      });
    });

    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Sanitize user HTML with DOMPurify before rendering.',
          provider: 'local'
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="text"]', 'https://github.com/example/repo');
    await page.click('button:has-text("Analyze")');
    await page.click('button:has-text("Details")');
    await page.fill('input[placeholder="Ask a question about this finding"]', 'How do I fix this?');
    await page.click('button:has-text("Send")');

    await expect(page.getByText(/Sanitize user HTML with DOMPurify/i)).toBeVisible();
  });

  test('clears the form and results with the Clear button', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoUrl: 'https://github.com/example/repo',
          summary: {
            total: 1,
            codeFindings: 1,
            dependencyFindings: 0,
            securityFindings: 1
          },
          semgrep: { status: 'success', message: '', count: 0 },
          findings: [
            {
              severity: 'HIGH',
              category: 'XSS',
              file: 'src/index.ts',
              description: 'Unsanitized input is rendered.',
              risk: 'Script injection may occur.',
              fix: 'Escape user input.',
              education: 'Do not render raw user content.'
            }
          ],
          dependencyFindings: []
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="text"]', 'https://github.com/example/repo');
    await page.click('button:has-text("Analyze")');
    await expect(page.getByText(/Analyzed repository:/i)).toBeVisible();
    await page.click('button:has-text("Clear")');

    await expect(page.getByText(/No findings yet/i)).toBeVisible();
    await expect(page.getByText(/Analyzed repository:/i)).not.toBeVisible();
  });

  test('generates a technical report preview after scan', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoUrl: 'https://github.com/example/repo',
          summary: {
            total: 1,
            codeFindings: 1,
            dependencyFindings: 0,
            securityFindings: 1
          },
          semgrep: { status: 'success', message: '', count: 1 },
          findings: [
            {
              severity: 'HIGH',
              category: 'XSS',
              file: 'src/index.ts',
              description: 'Unsanitized input is rendered.',
              risk: 'Script injection may occur.',
              fix: 'Escape user input.',
              education: 'Do not render raw user content.'
            }
          ],
          dependencyFindings: []
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="text"]', 'https://github.com/example/repo');
    await page.click('button:has-text("Analyze")');
    await page.getByRole('button', { name: /Generate report/i }).click();
    await page.getByRole('button', { name: /^Generate report$/i }).last().click();

    await expect(page.getByRole('heading', { name: /Report preview & share/i })).toBeVisible();
    await expect(page.getByText(/example\/repo/i)).toBeVisible();
    await expect(page.frameLocator('iframe').locator('body')).toContainText('Technical Security Report');
  });

  test('generates an executive report using the narrative API', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoUrl: 'https://github.com/example/repo',
          summary: {
            total: 1,
            codeFindings: 1,
            dependencyFindings: 0,
            securityFindings: 1
          },
          semgrep: { status: 'success', message: '', count: 0 },
          findings: [
            {
              severity: 'HIGH',
              category: 'XSS',
              file: 'src/index.ts',
              description: 'Unsanitized input is rendered.',
              risk: 'Script injection may occur.',
              fix: 'Escape user input.',
              education: 'Do not render raw user content.'
            }
          ],
          dependencyFindings: []
        })
      });
    });

    await page.route('**/api/reports/executive', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          provider: 'local',
          narrative: {
            overview: 'The project has one urgent security issue that should be fixed soon.',
            priorities: ['Fix the XSS issue in src/index.ts before the next release.'],
            nextSteps: ['Assign a developer to patch the issue and rerun the scan.']
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[type="text"]', 'https://github.com/example/repo');
    await page.click('button:has-text("Analyze")');
    await page.getByRole('button', { name: /Generate report/i }).click();
    await page.getByText(/Executive summary/i).click();
    await page.getByRole('button', { name: /^Generate report$/i }).last().click();

    await expect(page.getByRole('heading', { name: /Report preview & share/i })).toBeVisible();
    await expect(page.frameLocator('iframe').locator('body')).toContainText(
      'The project has one urgent security issue'
    );
  });

  test('shows an error when analysis fails', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Repository download failed' })
      });
    });

    await page.goto('/');
    await page.fill('input[type="text"]', 'https://github.com/example/broken-repo');
    await page.click('button:has-text("Analyze")');

    await expect(page.getByText(/Repository download failed/i)).toBeVisible();
    await expect(page.getByText(/Semgrep Failed/i)).toBeVisible();
  });
});
