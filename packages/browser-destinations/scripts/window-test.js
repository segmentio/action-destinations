import { chromium } from 'playwright';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://example.com');

  // Get the initial state of the Window object
  const initialState = await page.evaluate(() => window);

  // Perform some actions that might change the Window object
  // For example: Clicking a button, navigating, etc.

  // Get the updated state of the Window object after actions
  const updatedState = await page.evaluate(() => window);

  // Compare the initial and updated states
  const hasWindowChanged = JSON.stringify(initialState) !== JSON.stringify(updatedState);

  if (hasWindowChanged) {
    console.log('Window object has changed.');
    process.exit(1); // Exit with a non-zero status code to indicate failure
  } else {
    console.log('Window object has not changed.');
  }

  await browser.close();
})();