from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Wait for server to be ready
    try:
        page.goto("http://localhost:3000/student", timeout=10000)
    except:
        print("Server not ready yet, retrying...")
        page.wait_for_timeout(5000)
        page.goto("http://localhost:3000/student")

    # 1. Login
    print("Taking screenshot of Login...")
    page.screenshot(path="verification/1_login.png")

    # Enter name and submit
    page.fill('input[type="text"]', "AgentJules")
    page.click('button[type="submit"]')

    # 2. Calibration
    page.wait_for_selector("text=System Status Check")
    print("Taking screenshot of Calibration...")
    page.screenshot(path="verification/2_calibration.png")

    # Click Ready
    page.click("text=Ready to Go")

    # 3. Game Mode
    page.wait_for_selector("text=Weapon Systems Active")
    print("Taking screenshot of Game Mode...")
    page.screenshot(path="verification/3_game_mode.png")

    # Enter correct answer (simulated) - we can't verify logic without backend mocking easily,
    # but we can verify UI interaction
    page.fill('input[type="text"]', "42")
    page.click("text=FIRE WEAPON")

    # Wait a bit for feedback (it might stay 'MISS' if firebase isn't fully mocked/connected,
    # but we just want to see the UI state)
    page.wait_for_timeout(1000)
    print("Taking screenshot of Feedback...")
    page.screenshot(path="verification/4_feedback.png")

    # 4. Stealth Mode Flow
    # Reload to reset state to verify Stealth
    page.reload()
    # Need to login again because state is local component state
    page.fill('input[type="text"]', "AgentJules")
    page.click('button[type="submit"]')

    # Click Overwhelmed
    page.wait_for_selector("text=Overwhelmed")
    page.click("text=Overwhelmed")

    # Verify Stealth Mode
    page.wait_for_selector("text=Manual Override")
    print("Taking screenshot of Stealth Mode...")
    page.screenshot(path="verification/5_stealth_mode.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
