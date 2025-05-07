document.addEventListener('DOMContentLoaded', () => {
    const dealsContainer = document.getElementById('deals-container');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    // const noDealsMessageElement = document.querySelector('.no-deals'); // We'll create this dynamically

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // --- Populate current year in footer ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Sample Data (Update this as needed) ---
    const sampleDeals = [
        {
            id: 1,
            itemName: "Artisan Sourdough Loaf (Slightly Imperfect)",
            businessName: "The Daily Rise Bakery",
            originalPrice: 65.00,
            discountedPrice: 30.00,
            bestBefore: "2023-10-28", // Use YYYY-MM-DD
            location: "Melville, JHB",
            description: "Still incredibly fresh and delicious! Perfect for toast, sandwiches, or with soup. Just a bit misshapen.",
            imageUrl: "images/placeholder-food.png", // Replace with actual or better placeholders
            category: "bakery",
            contact: "011-123-4567"
        },
        {
            id: 2,
            itemName: "Organic Avocado Box (3 Ripe)",
            businessName: "Green Earth Organics",
            originalPrice: 70.00,
            discountedPrice: 40.00,
            bestBefore: "2023-10-27",
            location: "Braamfontein, JHB",
            description: "Creamy and ready to eat! Ideal for guacamole, salads, or on toast. Slight blemishes on skin.",
            imageUrl: "images/placeholder-food.png",
            category: "fruitveg",
            contact: "011-987-6543"
        },
        {
            id: 3,
            itemName: "Free-Range Chicken Portions (Mixed)",
            businessName: "Honest Harvest Meats",
            originalPrice: 120.00,
            discountedPrice: 75.00,
            bestBefore: "2023-10-27",
            location: "Sandton City Farmers Market",
            description: "Excellent quality chicken, perfect for a quick roast or braai. Selling fast!",
            imageUrl: "images/placeholder-food.png",
            category: "meat",
            contact: "info@hharvest.co.za"
        },
        {
            id: 4,
            itemName: "Gourmet Yoghurt Selection (4-Pack)",
            businessName: "The Creamery Co.",
            originalPrice: 80.00,
            discountedPrice: 45.00,
            bestBefore: "2023-10-29",
            location: "Parkhurst, JHB",
            description: "Assorted artisanal yoghurt flavours. A real treat for breakfast or dessert.",
            imageUrl: "images/placeholder-food.png",
            category: "dairy",
            contact: "Whatsapp: 0821112222"
        },
        {
            id: 5,
            itemName: "Pasta Night Kit (Sauce & Fresh Pasta)",
            businessName: "Nonna's Pantry",
            originalPrice: 95.00,
            discountedPrice: 50.00,
            bestBefore: "2023-10-28",
            location: "Norwood, JHB",
            description: "Authentic Italian tomato sauce and fresh egg pasta. Dinner sorted!",
            imageUrl: "images/placeholder-food.png",
            category: "prepared", // Or pantry if it's dry pasta
            contact: "nonnaspantry@email.com"
        }
    ];

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Using 'long' month
        return new Date(dateString).toLocaleDateString('en-ZA', options); // en-ZA for South African date format
    }

    // --- Skeleton Loader Functions ---
    function createSkeletonCard() {
        const skeletonCard = document.createElement('div');
        skeletonCard.classList.add('skeleton-card');
        skeletonCard.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-line" style="width: 70%;"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium" style="margin-top: 15px;"></div>
                <div class="skeleton-line" style="width: 50%;"></div>
                <div class="skeleton-line button"></div>
            </div>
        `;
        return skeletonCard;
    }

    function showSkeletonLoaders(count = 6) {
        dealsContainer.innerHTML = ''; // Clear previous content
        for (let i = 0; i < count; i++) {
            dealsContainer.appendChild(createSkeletonCard());
        }
    }
    
    function showNoDealsMessage() {
        dealsContainer.innerHTML = `
            <div class="no-deals-message">
                <i class="fas fa-store-slash"></i>
                <p>No fresh finds match your search right now.</p>
                <p>Try broadening your search or check back soon!</p>
            </div>
        `;
    }


    function renderDeals(dealsToRender) {
        dealsContainer.innerHTML = ''; // Clear existing deals or skeletons

        if (dealsToRender.length === 0) {
            showNoDealsMessage();
            return;
        }

        dealsToRender.forEach(deal => {
            const dealCard = document.createElement('div');
            dealCard.classList.add('deal-card');
            // Note: Using template literals for innerHTML is okay for prototypes.
            // For more complex interactions or security, consider building DOM elements individually.
            dealCard.innerHTML = `
                <div class="deal-card-image-container">
                    <img src="${deal.imageUrl || 'images/placeholder-food.png'}" alt="${deal.itemName}">
                </div>
                <div class="deal-card-content">
                    <h3>${deal.itemName}</h3>
                    <p class="business-name">
                        <i class="fas fa-store-alt"></i> ${deal.businessName} - ${deal.location}
                    </p>
                    <div class="price-container">
                        <span class="price">R${deal.discountedPrice.toFixed(2)}</span>
                        ${deal.originalPrice ? `<span class="original-price">R${deal.originalPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <p class="best-before">
                        <i class="far fa-calendar-alt"></i> Best Before: ${formatDate(deal.bestBefore)}
                    </p>
                    <p class="description">${deal.description}</p>
                    <button class="contact-btn" onclick="alert('Contact Details: ${deal.contact.replace(/'/g, "\\'")}')">
                        <i class="fas fa-phone-alt"></i> Get Deal
                    </button>
                </div>
            `;
            dealsContainer.appendChild(dealCard);
        });
    }

    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        // Simulate network delay and show skeletons
        showSkeletonLoaders(sampleDeals.length > 0 ? Math.min(sampleDeals.length, 6) : 3); 

        // In a real app, API call would happen here.
        // We'll simulate it with a timeout.
        setTimeout(() => {
            const filteredDeals = sampleDeals.filter(deal => {
                const matchesSearch = (
                    deal.itemName.toLowerCase().includes(searchTerm) ||
                    deal.businessName.toLowerCase().includes(searchTerm) ||
                    deal.description.toLowerCase().includes(searchTerm)
                );
                const matchesCategory = selectedCategory === 'all' || deal.category === selectedCategory;
                
                // Add filtering for expired deals (optional - better done backend)
                // const today = new Date().toISOString().split('T')[0];
                // const isNotExpired = deal.bestBefore >= today;
                // return matchesSearch && matchesCategory && isNotExpired;

                return matchesSearch && matchesCategory;
            });
            renderDeals(filteredDeals);
        }, 700); // Simulate 0.7 second loading time
    }

    // Event Listeners
    searchInput.addEventListener('input', filterAndRender);
    categoryFilter.addEventListener('change', filterAndRender);

    // Initial render
    filterAndRender(); // Call filterAndRender to show skeletons initially
});