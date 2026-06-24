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
