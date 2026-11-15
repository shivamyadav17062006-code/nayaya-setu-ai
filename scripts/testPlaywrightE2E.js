import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runE2ETests() {
  console.log("================================================================================");
  console.log("🎭  NYAYASAATHI PHASE 16: PLAYWRIGHT E2E UI/UX VERIFICATION TEST SUITE");
  console.log("================================================================================");
  console.log(`Testing target: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Landing Page & Global Navigation Hierarchy
    // -------------------------------------------------------------------------
    console.log("[Test 1] Landing Page & Hierarchical Navigation");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_landing_page.png") });

    const title = await page.title();
    assert(title.length > 0, "Page title loaded");

    const brandText = await page.textContent("header");
    assert(brandText.includes("NyayaSaathi"), "Navbar displays brand 'NyayaSaathi'");
    assert(brandText.includes("India"), "Navbar displays 'India' status pill");
    assert(brandText.includes("Rights & Statutes"), "Grouped 'Rights & Statutes' menu present");
    assert(brandText.includes("Action & Legal Aid"), "Grouped 'Action & Legal Aid' menu present");
    assert(brandText.includes("AI Assistant"), "Direct link to 'AI Assistant' present");
    assert(brandText.includes("My Dashboard"), "Direct link to 'My Dashboard' present");

    // Skip to main content link check
    const skipLink = await page.$('a[href="#main-content"]');
    assert(skipLink !== null, "Skip-to-main-content anchor link exists for keyboard navigation");

    // -------------------------------------------------------------------------
    // TEST 2: Citizen Dashboard Screen (/dashboard)
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Citizen Dashboard Screen (/dashboard)");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_citizen_dashboard.png") });

    const dashboardContent = await page.textContent("main");
    assert(dashboardContent.includes("Namaste"), "Dashboard displays citizen greeting");
    assert(dashboardContent.includes("Ongoing Complaint Workflows"), "Workflow tracker section rendered");
    assert(dashboardContent.includes("Legal Aid Eligibility Records"), "Legal aid assessments section rendered");
    assert(dashboardContent.includes("Recent Consultations"), "Recent consultations section rendered");
    assert(dashboardContent.includes("15100"), "NALSA emergency 15100 helpline card present");

    // -------------------------------------------------------------------------
    // TEST 3: Citizen Profile & Jurisdiction Preferences (/profile)
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Citizen Profile & Jurisdiction Preferences (/profile)");
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_citizen_profile.png") });

    const profileContent = await page.textContent("main");
    assert(profileContent.includes("Citizen Account") || profileContent.includes("Full Name"), "Profile heading rendered");
    assert(profileContent.includes("State / UT"), "State jurisdiction selector rendered");
    assert(profileContent.includes("Preferred Legal Reading Language"), "Language preference selector rendered");
    assert(profileContent.includes("Clear Local Device History"), "Privacy data minimization button rendered");

    // -------------------------------------------------------------------------
    // TEST 4: Statutory Document Assistant (/documents)
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Statutory Document Assistant (/documents)");
    await page.goto(`${BASE_URL}/documents`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_document_assistant.png") });

    const docContent = await page.textContent("main");
    assert(docContent.includes("Verified Legal Notice"), "Document generator title rendered");
    assert(docContent.includes("Unpaid Salary Legal Demand Notice"), "Wage notice template pill present");
    assert(docContent.includes("Right to Information (RTI) Application"), "RTI template pill present");
    assert(docContent.includes("Consumer Dispute Notice"), "Consumer notice template pill present");
    assert(docContent.includes("Live Document Preview"), "Live document preview pane rendered");

    // Fill worker name input and verify live preview update
    const nameInput = await page.$('input[placeholder="e.g. Ramesh Kumar"]');
    if (nameInput) {
      await nameInput.fill("Ramesh Verma");
      const previewText = await page.textContent(".whitespace-pre-wrap");
      assert(previewText.includes("Ramesh Verma"), "Live document preview dynamically rendered input data");
    }

    // -------------------------------------------------------------------------
    // TEST 5: AI Legal Assistant Chat Journey (/chat)
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] AI Legal Assistant Chat Journey (/chat)");
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_chat_assistant.png") });

    const chatContent = await page.textContent("main");
    assert(chatContent.includes("NyayaSaathi AI Legal Assistant"), "AI assistant header rendered");
    assert(chatContent.includes("New Conversation") || chatContent.includes("New Chat"), "New conversation action present");

    const chatInput = await page.$('textarea, input[type="text"]');
    assert(chatInput !== null, "Chat prompt input area exists");

    // Send a sample legal query
    await chatInput.fill("What is the penalty for delayed salary payment under Payment of Wages Act?");
    const sendBtn = await page.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
      // Wait for response bubble to appear
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_chat_response.png") });

      const updatedChat = await page.textContent("main");
      assert(
        updatedChat.includes("Citizen Question") || updatedChat.includes("delayed salary"),
        "User question bubble successfully rendered"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Guided Rights Discovery Wizard (/rights/discover)
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Guided Rights Discovery Wizard (/rights/discover)");
    await page.goto(`${BASE_URL}/rights/discover`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_rights_discovery.png") });

    const discoveryContent = await page.textContent("main");
    assert(discoveryContent.includes("Rights Discovery") || discoveryContent.includes("situation"), "Rights discovery wizard rendered");

    // -------------------------------------------------------------------------
    // TEST 7: Know Your Rights Library & Section Bookmarking (/rights)
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] Know Your Rights Library (/rights)");
    await page.goto(`${BASE_URL}/rights`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_rights_library.png") });

    const rightsContent = await page.textContent("main");
    assert(rightsContent.includes("Know Your Rights") || rightsContent.includes("Categories"), "Rights catalog loaded");

    // Visit a category page
    await page.goto(`${BASE_URL}/rights/labour`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09_rights_category_labour.png") });

    const labourContent = await page.textContent("main");
    assert(
      labourContent.includes("Payment of Wages Act") || labourContent.includes("Labour") || labourContent.includes("Section"),
      "Category provisions loaded"
    );

    const bookmarkBtn = await page.$('button[title*="Bookmark"]');
    assert(bookmarkBtn !== null, "Bookmark button exists on statutory section card");

    // -------------------------------------------------------------------------
    // TEST 8: Legal Action Navigator (/navigator)
    // -------------------------------------------------------------------------
    console.log("\n[Test 8] Legal Action Navigator (/navigator)");
    await page.goto(`${BASE_URL}/navigator`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10_navigator_workflows.png") });

    const navContent = await page.textContent("main");
    assert(navContent.includes("Recovery of Unpaid Salary") || navContent.includes("Navigator") || navContent.includes("Grievance"), "Workflows loaded");

    // -------------------------------------------------------------------------
    // TEST 9: Free Legal Aid Finder & NALSA Eligibility (/aid-finder & /eligibility)
    // -------------------------------------------------------------------------
    console.log("\n[Test 9] Legal Aid Finder & Eligibility");
    await page.goto(`${BASE_URL}/aid-finder`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11_aid_finder.png") });

    const aidContent = await page.textContent("main");
    assert(aidContent.includes("Legal Aid") || aidContent.includes("DLSA") || aidContent.includes("NALSA"), "Aid finder directory loaded");

    await page.goto(`${BASE_URL}/eligibility`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12_eligibility_engine.png") });

    const eligContent = await page.textContent("main");
    assert(eligContent.includes("Section 12") || eligContent.includes("Eligibility"), "Eligibility engine loaded");

    // -------------------------------------------------------------------------
    // TEST 10: Admin Access Guard (/admin/kms)
    // -------------------------------------------------------------------------
    console.log("\n[Test 10] Admin Access Guard Verification (/admin/kms)");
    await page.goto(`${BASE_URL}/admin/kms`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13_admin_access_guard.png") });

    const adminContent = await page.textContent("main");
    assert(
      adminContent.includes("Access Restricted") || adminContent.includes("Authorized Personnel Only"),
      "Ordinary citizen is blocked from administrative KMS interface"
    );

    // -------------------------------------------------------------------------
    // TEST 11: Mobile Viewport Layout Verification (375x667)
    // -------------------------------------------------------------------------
    console.log("\n[Test 11] Mobile Viewport Layout Verification (375x667)");
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "14_mobile_home.png") });

    const mobileMenuBtn = await mobilePage.$('button[aria-label="Toggle navigation menu"]');
    assert(mobileMenuBtn !== null, "Mobile navigation hamburger button exists");

    await mobileMenuBtn.click();
    await mobilePage.waitForTimeout(300);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "15_mobile_drawer_open.png") });

    const drawerContent = await mobilePage.textContent("header");
    assert(drawerContent.includes("Rights & Statutes"), "Mobile drawer displays Rights & Statutes section");
    assert(drawerContent.includes("Action & Legal Aid"), "Mobile drawer displays Action & Legal Aid section");
    assert(drawerContent.includes("15100"), "Mobile drawer displays NALSA helpline dialer");

    // Test mobile chat layout
    await mobilePage.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "16_mobile_chat.png") });

    const mobileChatText = await mobilePage.textContent("main");
    assert(mobileChatText.includes("Inquiries"), "Mobile chat displays conversation inquiries trigger button");

    await mobileContext.close();
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🎉 ALL PLAYWRIGHT E2E TESTS COMPLETED: ${passed} PASSED, 0 FAILED`);
  } else {
    console.error(`⚠️ PLAYWRIGHT TESTS FINISHED WITH FAILURES: ${passed} PASSED, ${failed} FAILED`);
  }
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests();
