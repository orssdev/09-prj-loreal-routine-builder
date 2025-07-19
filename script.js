/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Array to track selected products */
let selectedProducts = [];

/* localStorage key for saving selected products */
const STORAGE_KEY = "loreal_selected_products";

/* Function to save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProducts));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/* Function to load selected products from localStorage */
function loadSelectedProductsFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      selectedProducts = JSON.parse(saved);
      /* Update the display after loading */
      updateSelectedProductsDisplay();
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    /* Reset to empty array if there's an error */
    selectedProducts = [];
  }
}

/* Function to clear all selected products */
function clearAllSelectedProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardsVisualState();
}

/* Array to track conversation history for context */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty and skincare advisor. Answer questions about skincare, haircare, makeup, fragrance, and beauty routines. Be knowledgeable, friendly, and helpful. When users ask follow-up questions about their routine, refer to the previous conversation context to provide relevant and personalized advice. Keep responses conversational and informative.",
  },
];

/* Function to manage conversation history length */
function manageConversationHistory() {
  /* Keep the system message and last 20 messages to prevent API limits */
  if (conversationHistory.length > 21) {
    const systemMessage = conversationHistory[0];
    const recentMessages = conversationHistory.slice(-20);
    conversationHistory = [systemMessage, ...recentMessages];
  }
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <div class="product-header">
          <h3>${product.name}</h3>
          <button class="info-toggle-btn" data-product-id="${product.id}" title="View product details">
            <i class="fa-solid fa-info-circle"></i>
          </button>
        </div>
        <p>${product.brand}</p>
        <div class="product-description" data-product-id="${product.id}">
          <p>${product.description}</p>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  /* Add click event listeners to product cards (for selection) */
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      /* Don't trigger selection if clicking on info button */
      if (e.target.closest(".info-toggle-btn")) {
        return;
      }

      const productId = parseInt(card.dataset.productId);
      const product = products.find((p) => p.id === productId);
      toggleProductSelection(product, card);
    });
  });

  /* Add click event listeners to info toggle buttons */
  const infoButtons = document.querySelectorAll(".info-toggle-btn");
  infoButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); /* Prevent card selection when clicking info button */
      const productId = parseInt(button.dataset.productId);
      toggleProductDescription(productId);
    });
  });

  /* Update visual state of cards based on selected products */
  updateProductCardsVisualState();
}

/* Toggle product description visibility */
function toggleProductDescription(productId) {
  const descriptionElement = document.querySelector(
    `.product-description[data-product-id="${productId}"]`
  );
  const toggleButton = document.querySelector(
    `.info-toggle-btn[data-product-id="${productId}"]`
  );

  if (descriptionElement && toggleButton) {
    const isExpanded = descriptionElement.classList.contains("expanded");

    if (isExpanded) {
      /* Collapse the description */
      descriptionElement.classList.remove("expanded");
      toggleButton.setAttribute("title", "View product details");
      toggleButton.querySelector("i").className = "fa-solid fa-info-circle";
    } else {
      /* Expand the description */
      descriptionElement.classList.add("expanded");
      toggleButton.setAttribute("title", "Hide product details");
      toggleButton.querySelector("i").className = "fa-solid fa-times-circle";
    }
  }
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Toggle product selection when clicked */
function toggleProductSelection(product, cardElement) {
  /* Check if product is already selected */
  const existingIndex = selectedProducts.findIndex((p) => p.id === product.id);

  if (existingIndex > -1) {
    /* Product is already selected, remove it */
    selectedProducts.splice(existingIndex, 1);
    cardElement.classList.remove("selected");
  } else {
    /* Product is not selected, add it */
    selectedProducts.push(product);
    cardElement.classList.add("selected");
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update the selected products display */
  updateSelectedProductsDisplay();
}

/* Update the visual state of product cards based on selection */
function updateProductCardsVisualState() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some((p) => p.id === productId);

    if (isSelected) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Update the selected products list display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p style="color: #666; font-style: italic;">No products selected yet. Click on product cards to add them!</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = `
    <div class="selected-products-header">
      <span class="selected-count">${
        selectedProducts.length
      } product(s) selected</span>
      <button class="clear-all-btn" title="Clear all selected products">
        <i class="fa-solid fa-trash"></i> Clear All
      </button>
    </div>
    <div class="selected-products-list">
      ${selectedProducts
        .map(
          (product) => `
        <div class="selected-product-item">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-details">
            <div class="product-name">${product.name}</div>
            <div class="product-brand">${product.brand}</div>
          </div>
          <button class="remove-btn" data-product-id="${product.id}" title="Remove product">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  /* Add click handlers to remove buttons */
  const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent any parent click handlers
      const productId = parseInt(button.dataset.productId);
      removeProductFromSelection(productId);
    });
  });

  /* Add click handler to clear all button */
  const clearAllBtn = selectedProductsList.querySelector(".clear-all-btn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all selected products?")) {
        clearAllSelectedProducts();
      }
    });
  }
}

/* Remove a product from the selection */
function removeProductFromSelection(productId) {
  /* Remove from selected products array */
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update the selected products display */
  updateSelectedProductsDisplay();

  /* Update visual state of product cards */
  updateProductCardsVisualState();
}

/* Load selected products from localStorage on page load */
loadSelectedProductsFromStorage();

/* Initialize the selected products display on page load */
updateSelectedProductsDisplay();

/* Display welcome message in chat */
const welcomeMessage =
  "Welcome to L'Oréal Smart Routine & Product Advisor! 👋<br><br>Select products from the categories above, then click 'Generate Routine' for a personalized routine, or ask me any beauty questions!";

/* Add welcome message to conversation history */
conversationHistory.push({
  role: "assistant",
  content: welcomeMessage.replace(/<br>/g, "\n"), // Convert HTML breaks to newlines for API
});

displayChatMessage(welcomeMessage, "assistant");

/* Chat form submission handler for general questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  /* Add user message to conversation history */
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  /* Display user message */
  displayChatMessage(userMessage, "user");

  /* Clear input */
  userInput.value = "";

  /* Show loading message */
  displayChatMessage("Thinking...", "assistant");

  try {
    /* Get AI response with full conversation context */
    const response = await getAIResponseWithHistory();

    /* Remove loading message */
    const messages = chatWindow.querySelectorAll(".chat-message");
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.textContent.includes("Thinking...")) {
      lastMessage.remove();
    }

    /* Add assistant response to conversation history */
    conversationHistory.push({
      role: "assistant",
      content: response,
    });

    /* Display AI response */
    displayChatMessage(response, "assistant");
  } catch (error) {
    console.error("Error getting AI response:", error);

    /* Remove loading message */
    const messages = chatWindow.querySelectorAll(".chat-message");
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.textContent.includes("Thinking...")) {
      lastMessage.remove();
    }

    displayChatMessage(
      "Sorry, I encountered an error. Please try again.",
      "assistant"
    );
  }
});

/* Function to get AI response using conversation history */
async function getAIResponseWithHistory() {
  /* Manage conversation history length before making API call */
  manageConversationHistory();

  const response = await fetch("https://makeup-worker.orss3214.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: conversationHistory,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
  ) {
    return data.choices[0].message.content.trim();
  } else {
    throw new Error("Unexpected API response format");
  }
}

/* Function to get AI response for general questions (legacy - kept for compatibility) */
async function getAIResponse(userMessage) {
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful L'Oréal beauty and skincare advisor. Answer questions about skincare, haircare, makeup, and beauty routines. Be knowledgeable, friendly, and helpful. Keep responses concise but informative.",
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await fetch("https://makeup-worker.orss3214.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
  ) {
    return data.choices[0].message.content.trim();
  } else {
    throw new Error("Unexpected API response format");
  }
}

/* Generate Routine button handler */
const generateRoutineBtn = document.getElementById("generateRoutine");
generateRoutineBtn.addEventListener("click", async () => {
  /* Check if any products are selected */
  if (selectedProducts.length === 0) {
    displayChatMessage(
      "Please select at least one product before generating a routine.",
      "assistant"
    );
    return;
  }

  /* Show loading message */
  displayChatMessage("Generating your personalized routine...", "assistant");
  generateRoutineBtn.disabled = true;
  generateRoutineBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

  try {
    /* Prepare the product data for context */
    const productData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    /* Add the routine generation request to conversation history */
    conversationHistory.push({
      role: "user",
      content: `Please create a personalized beauty/skincare routine using these selected products: ${JSON.stringify(
        productData,
        null,
        2
      )}. Please provide the recommended order of application, when to use each product, how often to use each product, and any helpful tips.`,
    });

    /* Generate the routine using OpenAI */
    const routine = await generatePersonalizedRoutine(selectedProducts);

    /* Add the routine to conversation history */
    conversationHistory.push({
      role: "assistant",
      content: routine,
    });

    displayChatMessage(routine, "assistant");
  } catch (error) {
    console.error("Error generating routine:", error);
    displayChatMessage(
      "Sorry, I encountered an error while generating your routine. Please try again.",
      "assistant"
    );
  } finally {
    /* Reset button state */
    generateRoutineBtn.disabled = false;
    generateRoutineBtn.innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Routine';
  }
});

/* Function to call OpenAI API and generate personalized routine */
async function generatePersonalizedRoutine(products) {
  /* Prepare the product data for the API */
  const productData = products.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  /* Create the prompt for OpenAI */
  const messages = [
    {
      role: "system",
      content:
        "You are a knowledgeable beauty and skincare expert. Create personalized routines based on the products provided. Focus on proper order of application, frequency of use, and helpful tips. Keep your response conversational and helpful.",
    },
    {
      role: "user",
      content: `Please create a personalized beauty/skincare routine using these selected products: ${JSON.stringify(
        productData,
        null,
        2
      )}. 

      Please provide:
      1. The recommended order of application
      2. When to use each product (morning, evening, or both)
      3. How often to use each product
      4. Any helpful tips or warnings
      
      Make it easy to follow and personalized.`,
    },
  ];

  /* Make the API request via Cloudflare Worker */
  const response = await fetch("https://makeup-worker.orss3214.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  /* Check if the response is successful */
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  /* Parse the response */
  const data = await response.json();

  /* Extract and return the generated routine */
  if (
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
  ) {
    return data.choices[0].message.content.trim();
  } else {
    throw new Error("Unexpected API response format");
  }
}

/* Function to display messages in the chat window */
function displayChatMessage(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}`;

  if (sender === "assistant") {
    messageDiv.innerHTML = `
      <div class="message-content">
        <strong>L'Oréal Advisor:</strong><br>
        ${message.replace(/\n/g, "<br>")}
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-content">
        <strong>You:</strong><br>
        ${message}
      </div>
    `;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
