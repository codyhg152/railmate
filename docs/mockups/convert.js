const { chromium } = require('playwright');
const path = require('path');

const mockups = [
  { html: 'home_screen.html', png: 'home_screen.png' },
  { html: 'journey_detail.html', png: 'journey_detail.png' },
  { html: 'station_board.html', png: 'station_board.png' },
  { html: 'search_screen.html', png: 'search_screen.png' },
  { html: 'live_activity.html', png: 'live_activity.png' },
  { html: 'passport_screen.html', png: 'passport_screen.png' }
];

const mockupsDir = '/home/kubbiybot/.openclaw/workspace/research/mockups';

async function convertHtmlToPng(htmlFile, pngFile) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();
  
  const filePath = path.join(mockupsDir, htmlFile);
  await page.goto('file://' + filePath);
  
  // Wait for fonts to load
  await page.waitForTimeout(500);
  
  const outputPath = path.join(mockupsDir, pngFile);
  await page.screenshot({ 
    path: outputPath,
    fullPage: false,
    type: 'png'
  });
  
  await browser.close();
  console.log(`✓ Created ${pngFile}`);
}

async function main() {
  console.log('Converting HTML mockups to PNG...\n');
  
  for (const mockup of mockups) {
    try {
      await convertHtmlToPng(mockup.html, mockup.png);
    } catch (error) {
      console.error(`✗ Failed to convert ${mockup.html}:`, error.message);
    }
  }
  
  console.log('\nAll conversions complete!');
}

main().catch(console.error);
