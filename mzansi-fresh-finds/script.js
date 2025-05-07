document.addEventListener('DOMContentLoaded', () => {
    const dealsContainer = document.getElementById('deals-container');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const noDealsMessage = document.querySelector('.no-deals');

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js') // Path relative to origin
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // --- Sample Data (Replace with API call in a real app) ---
    const sampleDeals = [
        {
            id: 1,
            itemName: "Day-Old Sourdough Loaf",
            businessName: "The Artisan Bakery",
            originalPrice: 60.00,
            discountedPrice: 30.00,
            bestBefore: "2023-10-28", // Use YYYY-MM-DD for easier sorting/filtering
            location: " Melville, JHB", // For prototype display only
            description: "Still delicious! Perfect for toast or bruschetta.",
            imageUrl: "images/placeholder-food.png", // Use a generic placeholder
            category: "bakery",
            contact: "011-123-4567"
        },
        {
            id: 2,
            itemName: "Ripe Bananas (Bunch)",
            businessName: "Green Grocer Corner",
            originalPrice: 25.00,
            discountedPrice: 10.00,
            bestBefore: "2023-10-27",
            location: "Braamfontein, JHB",
            description: "Ideal for smoothies or banana bread. Get them before they're too soft!",
            imageUrl: "images/placeholder-food.png",
            category: "fruitveg",
            contact: "011-987-6543"
        },
        {
            id: 3,
            itemName: "Chicken Drumsticks (500g)",
            businessName: "Jozi Meats",
            originalPrice: 55.00,
            discountedPrice: 35.00,
            bestBefore: "2023-10-27",
            location: "Sandton, JHB",
            description: "Fresh chicken, best before tomorrow. Great for a quick dinner.",
            imageUrl: "images/placeholder-food.png",
            category: "meat",
            contact: "info@jozimeats.co.za"
        },
        {
            id: 4,
            itemName: "Yoghurt Tubs (Assorted)",
            businessName: "Dairy Delight",
            originalPrice: 15.00,
            discountedPrice: 7.00,
            bestBefore: "2023-10-29",
            location: "Parkhurst, JHB",
            description: "Various flavours, stock up for breakfast!",
            imageUrl: "images/placeholder-food.png",
            category: "dairy",
            contact: "Whatsapp: 0821112222"
        }
        // Add more sample deals here
    ];

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function renderDeals(dealsToRender) {
        dealsContainer.innerHTML = ''; // Clear existing deals

        if (dealsToRender.length === 0) {
            noDealsMessage.style.display = 'block';
            dealsContainer.appendChild(noDealsMessage);
            return;
        }
        noDealsMessage.style.display = 'none';


        dealsToRender.forEach(deal => {
            const dealCard = document.createElement('div');
            dealCard.classList.add('deal-card');
            dealCard.innerHTML = `
                <img src="${deal.imageUrl}" alt="${deal.itemName}">
                <h3>${deal.itemName}</h3>
                <p class="business-name">${deal.businessName} - ${deal.location}</p>
                <p class="price">R${deal.discountedPrice.toFixed(2)} 
                    ${deal.originalPrice ? `<span class="original-price">R${deal.originalPrice.toFixed(2)}</span>` : ''}
                </p>
                <p class="best-before">Best Before: ${formatDate(deal.bestBefore)}</p>
                <p class="description">${deal.description}</p>
                <button class="contact-btn" onclick="alert('Contact: ${deal.contact.replace(/'/g, "\\'")}')">Contact Seller</button>
            `;
            dealsContainer.appendChild(dealCard);
        });
    }

    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        const filteredDeals = sampleDeals.filter(deal => {
            const matchesSearch = deal.itemName.toLowerCase().includes(searchTerm) ||
                                  deal.businessName.toLowerCase().includes(searchTerm) ||
                                  deal.description.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || deal.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
        renderDeals(filteredDeals);
    }

    // Event Listeners
    searchInput.addEventListener('input', filterAndRender);
    categoryFilter.addEventListener('change', filterAndRender);

    // Initial render
    renderDeals(sampleDeals);
});