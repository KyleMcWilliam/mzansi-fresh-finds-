// tests/utils.test.js
import { formatDate, getPlaceholderImage } from '../js/utils.js';
// Note: Test helpers (assertEquals, assert, summarizeTests) are globally available
// if test-helpers.js is included before this script in test-runner.html.

console.log("--- Running utils.test.js ---");

// Tests for formatDate
assertEquals(formatDate('2024-08-05'), 'August 5, 2024', 'formatDate: Valid YYYY-MM-DD');
assertEquals(formatDate('2023-01-15T10:00:00'), 'January 15, 2023', 'formatDate: Valid YYYY-MM-DDTHH:MM:SS');
assertEquals(formatDate(null), 'N/A', 'formatDate: Null input');
assertEquals(formatDate(undefined), 'N/A', 'formatDate: Undefined input');
assertEquals(formatDate(''), 'N/A', 'formatDate: Empty string input');
assertEquals(formatDate('invalid-date'), 'invalid-date', 'formatDate: Invalid date string');
// Test with a date that might cause issues if not parsed as UTC midnight for YYYY-MM-DD
// For example, if system timezone is ahead of UTC, it might roll back a day.
// Our formatDate in utils.js adds 'T00:00:00' to YYYY-MM-DD strings to mitigate this.
const testDate = new Date(2024, 7, 5); // August 5, 2024 (month is 0-indexed)
const expectedFormattedDate = testDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
assertEquals(formatDate('2024-08-05'), expectedFormattedDate, 'formatDate: Specific YYYY-MM-DD (en-ZA locale check)');


// Tests for getPlaceholderImage
assertEquals(getPlaceholderImage('bakery'), 'images/placeholders/bakery.svg', 'getPlaceholderImage: Bakery category');
assertEquals(getPlaceholderImage('fruitveg'), 'images/placeholders/fruitveg.svg', 'getPlaceholderImage: Fruit & Veg category');
assertEquals(getPlaceholderImage('dairy'), 'images/placeholders/dairy.svg', 'getPlaceholderImage: Dairy category');
assertEquals(getPlaceholderImage('meat'), 'images/placeholders/meat.svg', 'getPlaceholderImage: Meat category');
assertEquals(getPlaceholderImage('prepared'), 'images/placeholders/prepared.svg', 'getPlaceholderImage: Prepared Meals category');
assertEquals(getPlaceholderImage('pantry'), 'images/placeholders/pantry.svg', 'getPlaceholderImage: Pantry category');
assertEquals(getPlaceholderImage('unknown'), 'images/placeholders/default.svg', 'getPlaceholderImage: Unknown category');
assertEquals(getPlaceholderImage(null), 'images/placeholders/default.svg', 'getPlaceholderImage: Null category');
assertEquals(getPlaceholderImage(undefined), 'images/placeholders/default.svg', 'getPlaceholderImage: Undefined category');
assertEquals(getPlaceholderImage('FRUITVEG'), 'images/placeholders/fruitveg.svg', 'getPlaceholderImage: Uppercase category'); // Test case-insensitivity

console.log("--- Finished utils.test.js ---");

// If this is the last test file, call summarizeTests()
// For now, test-runner.html will call it.
