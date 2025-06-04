export function initMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    const body = document.body; // To toggle class for potential overflow styling

    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', () => {
            // Toggle active class on the main navigation menu itself
            mainNav.classList.toggle('mobile-nav-active');

            // Toggle a class on the body to handle potential overflow or background styles
            body.classList.toggle('mobile-nav-open');

            // Toggle ARIA attribute for accessibility
            const isExpanded = mainNav.classList.contains('mobile-nav-active');
            mobileNavToggle.setAttribute('aria-expanded', isExpanded);

            // Toggle icon
            const icon = mobileNavToggle.querySelector('i');
            if (isExpanded) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    } else {
        if (!mobileNavToggle) console.log('Mobile navigation toggle button not found.');
        if (!mainNav) console.log('Main navigation element not found.');
    }
}
