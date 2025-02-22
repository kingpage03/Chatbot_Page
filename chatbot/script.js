import { model } from "./mainmodule.js";

const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-cont");
const chatHistoryList = document.querySelector("#chat-history-list");
const newChatButton = document.querySelector("#new-chat-btn");
const clearHistoryButton = document.querySelector("#clear-history-btn");

let chatHistories = JSON.parse(localStorage.getItem("chatHistories")) || {};
let currentSessionId = localStorage.getItem("currentSessionId") || generateSessionId();

// Ensure at least one session exists
if (!Object.keys(chatHistories).length) {
    createDefaultSession();
} else if (!chatHistories[currentSessionId]) {
    currentSessionId = Object.keys(chatHistories)[0];
    saveChatHistory();
}

// Generate a unique session ID
function generateSessionId() {
    return `session-${Date.now()}`;
}

// Save chat history to localStorage
function saveChatHistory() {
    localStorage.setItem("chatHistories", JSON.stringify(chatHistories));
    localStorage.setItem("currentSessionId", currentSessionId);
}

// Create a default chat session
function createDefaultSession() {
    currentSessionId = generateSessionId();
    chatHistories = { [currentSessionId]: [] };
    saveChatHistory();
}

// Clear all chat histories but ensure at least one remains
function clearAllChatHistories() {
    createDefaultSession(); // Reset to a new session
    chatContainer.innerHTML = ""; // Clear chat window
    updateChatHistoryList(); // Update the chat history navigation
}

// Display chat history in the navigation panel
function updateChatHistoryList() {
    chatHistoryList.innerHTML = ""; // Clear previous list

    Object.keys(chatHistories).forEach((sessionId) => {
        const lastMessage = chatHistories[sessionId].slice(-1)[0]?.message || "New Chat";
        const chatTitle = lastMessage.length > 20 ? `${lastMessage.slice(0, 20)}...` : lastMessage;
        const chatItem = document.createElement("div");
        chatItem.classList.add("nav-item");
        chatItem.textContent = chatTitle;

        // Highlight the active session
        if (sessionId === currentSessionId) {
            chatItem.classList.add("active");
        }

        chatItem.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
            chatItem.classList.add("active");
            loadChatHistory(sessionId);
        });

        chatHistoryList.appendChild(chatItem);
    });
}

// Load a specific chat session
function loadChatHistory(sessionId) {
    currentSessionId = sessionId;
    chatContainer.innerHTML = ""; // Clear chat
    chatHistories[sessionId].forEach(({ message, sender }) => {
        chatContainer.appendChild(createMessageElement(message, sender));
    });
    saveChatHistory();
}

// Start a new chat session but always ensure at least one exists
function startNewChat() {
    currentSessionId = generateSessionId();
    chatHistories[currentSessionId] = [];
    chatContainer.innerHTML = ""; // Clear chat window
    saveChatHistory();
    updateChatHistoryList();
}

// Create message element
const createMessageElement = (message, sender) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-content", sender);

    const messageBubble = document.createElement("div");
    messageBubble.classList.add("chat-body-inner", sender === "user" ? "right" : "left");
    messageBubble.innerHTML = `<p>${message}</p>`;

    if (sender === "ai") {
        const aiAvatar = document.createElement("img");
        aiAvatar.src = "imgs/Sassy-pic.jpg"; // AI avatar image path
        aiAvatar.alt = "AI Avatar";
        aiAvatar.classList.add("ai-avatar");
        messageElement.appendChild(aiAvatar);
    }

    messageElement.appendChild(messageBubble);
    return messageElement;
};

// Get AI response
const getChatResponse = async (userText) => {
    // Show "AI is thinking..." message
    const aiMessage = createMessageElement("AI is thinking...", "ai");
    chatContainer.appendChild(aiMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const result = await model.generateContent(userText);
        const response = await result.response.text();

        // Update "AI is thinking..." message with real response
        aiMessage.querySelector(".chat-body-inner").innerHTML = `<p>${response}</p>`;

        chatHistories[currentSessionId].push({ message: response, sender: "ai" });
        saveChatHistory();
    } catch (error) {
        console.error("Error fetching AI response: ", error);
        aiMessage.querySelector(".chat-body-inner").innerHTML = `<p>Please refresh the page and try again.</p>`;
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
};

// Handle user input
const handleAPI = () => {
    const userText = chatInput.value.trim();
    if (!userText) return;

    const userMessage = createMessageElement(userText, "user");
    chatContainer.appendChild(userMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    chatHistories[currentSessionId].push({ message: userText, sender: "user" });
    saveChatHistory();

    getChatResponse(userText);
    chatInput.value = "";
};

// Event listeners
sendButton.addEventListener("click", handleAPI);
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleAPI();
    }
});

newChatButton.addEventListener("click", () => {
    startNewChat();
    chatContainer.innerHTML = ""; // Clear chat window
});

clearHistoryButton.addEventListener("click", clearAllChatHistories);

// Ensure there is at least one session on initial load
updateChatHistoryList();
loadChatHistory(currentSessionId);
