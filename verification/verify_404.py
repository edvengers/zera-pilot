from playwright.sync_api import sync_playwright

def verify_404(page):
    # Navigate to a non-existent page
    response = page.goto("http://localhost:3000/random-non-existent-path")

    # Wait for the main heading to be visible
    page.wait_for_selector("h2")

    # Take a screenshot
    page.screenshot(path="verification/404_page.png")

    # Verify content
    heading = page.locator("h2").text_content()
    print(f"Heading: {heading}")

    if "404 - Not Found" in heading:
        print("Success: Custom 404 page is rendered.")
    else:
        print(f"Failure: Expected '404 - Not Found', got '{heading}'")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_404(page)
        finally:
            browser.close()
