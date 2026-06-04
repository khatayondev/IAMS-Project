import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture page errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  try {
    await page.goto('http://localhost:5173/student/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('=== PAGE LOADED SUCCESSFULLY ===');
    console.log('Mobile viewport: 375x667');
    
    // Check for React errors
    const reactErrors = consoleLogs.filter(log => 
      log.text.includes('Error') || 
      log.text.includes('error') ||
      log.text.includes('#300')
    );
    
    if (reactErrors.length > 0) {
      console.log('\n⚠️  REACT ERRORS FOUND:');
      reactErrors.forEach(log => console.log(`  [${log.type}] ${log.text}`));
    } else {
      console.log('\n✅ No React errors in console');
    }
    
    if (errors.length > 0) {
      console.log('\n⚠️  PAGE ERRORS:');
      errors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('✅ No page errors');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-mobile.png' });
    console.log('\n✅ Dashboard screenshot saved: dashboard-mobile.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
