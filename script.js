/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Array to track selected products */
let selectedProducts = [];

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

  selectedProductsList.innerHTML = selectedProducts
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
    .join("");

  /* Add click handlers to remove buttons */
  const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent any parent click handlers
      const productId = parseInt(button.dataset.productId);
      removeProductFromSelection(productId);
    });
  });
}

/* Remove a product from the selection */
function removeProductFromSelection(productId) {
  /* Remove from selected products array */
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  /* Update the selected products display */
  updateSelectedProductsDisplay();

  /* Update visual state of product cards */
  updateProductCardsVisualState();
}

/* Initialize the selected products display on page load */
updateSelectedProductsDisplay();

/* Display welcome message in chat */
displayChatMessage(
  "Welcome to L'Oréal Smart Routine & Product Advisor! 👋<br><br>Select products from the categories above, then click 'Generate Routine' for a personalized routine, or ask me any beauty questions!",
  "assistant"
);

/* Chat form submission handler for general questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  /* Display user message */
  displayChatMessage(userMessage, "user");

  /* Clear input */
  userInput.value = "";

  /* Show loading message */
  displayChatMessage("Thinking...", "assistant");

  try {
    /* Get AI response */
    const response = await getAIResponse(userMessage);

    /* Remove loading message */
    const messages = chatWindow.querySelectorAll(".chat-message");
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.textContent.includes("Thinking...")) {
      lastMessage.remove();
    }

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

/* Function to get AI response for general questions */
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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
    /* Generate the routine using OpenAI */
    const routine = await generatePersonalizedRoutine(selectedProducts);
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

  /* Make the API request to OpenAI */
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
