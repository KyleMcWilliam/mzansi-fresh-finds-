from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to the login page
    # Note: React app typically runs on port 3000
    page.goto("http://localhost:3000/login")

    # Wait for the login form to be visible
    page.wait_for_selector("form")

    # Check for "Sign In" button (original)
    expect(page.get_by_role("button", name="Sign In", exact=True)).to_be_visible()

    # Check for "Sign In with Google" button (newly added)
    expect(page.get_by_role("button", name="Sign In with Google")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="verification/login_screen.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
