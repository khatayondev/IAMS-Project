import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// Log all network requests
page.on('response', async (response) => {
  if (response.url().includes('/applications')) {
    console.log(`${response.request().method()} ${response.url().split('?')[0]} → ${response.status()}`);
  }
});

try {
  console.log('Navigating to applications page...');
  await page.goto('http://localhost:5182/student/applications', { waitUntil: 'networkidle', timeout: 10000 });
  console.log('✓ Page loaded');
  
  // Check if term windows are visible
  const termWindows = await page.locator('[class*="grid"]').count();
  console.log(`✓ Found term windows: ${termWindows > 0 ? 'yes' : 'no'}`);
  
  // Check for React errors in console
  let consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Take a screenshot of the initial state
  await page.screenshot({ path: 'test-initial.png' });
  console.log('✓ Screenshot saved: test-initial.png');
  
  if (consoleErrors.length > 0) {
    console.log('⚠ Console errors found:');
    consoleErrors.forEach(err => console.log('  - ' + err));
  } else {
    console.log('✓ No console errors');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await browser.close();
}
