from playwright.sync_api import sync_playwright

def verify_cart_and_login_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Go to home page
            print("Navigating to home page...")
            page.goto("http://localhost:3000")

            # Use get_by_role for more robust selection
            print("Waiting for header...")
            # Header has "ProShop" link
            page.wait_for_selector("text=ProShop", state="visible", timeout=10000)

            # Check if Login link is present
            print("Checking login link...")
            login_link = page.get_by_role("link", name="Sign In")
            if login_link.is_visible():
                print("Login link visible")

            # Go to Login page
            print("Clicking login...")
            login_link.click()
            page.wait_for_url("**/login")
            page.screenshot(path="verification/login_screen.png")
            print("Login screen screenshot taken")

            # Navigate to Cart
            print("Navigating to cart...")
            page.goto("http://localhost:3000/cart")
            # CartScreen has "Saved Deals"
            page.wait_for_selector("h1:has-text('Saved Deals')", timeout=10000)
            page.screenshot(path="verification/cart_screen.png")
            print("Cart screen screenshot taken")

            # Navigate to Deal Locations (even if empty)
            print("Navigating to deal locations...")
            page.goto("http://localhost:3000/deal-locations")
            page.screenshot(path="verification/deal_locations_screen.png")
            print("Deal Locations screen screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_cart_and_login_flow()
