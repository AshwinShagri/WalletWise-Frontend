import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming this path is correct
import '../styles/Chatbot.css'; // Make sure this path points to the new CSS

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isChatLogScrolled, setIsChatLogScrolled] = useState(false); // Track if user has scrolled up
  const { token } = useAuth(); // Assuming useAuth provides the token

  const chatLogRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  // Format current time for message timestamps
  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage = {
      id: `bot-${Date.now()}`, // Unique ID for key prop
      text: "Hello! I'm your AI assistant, ready to help. What's on your mind?",
      sender: 'bot',
      time: getFormattedTime()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom logic
  useEffect(() => {
    // Only auto-scroll if the user hasn't scrolled up
    if (!isChatLogScrolled && endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatLogScrolled]); // Depend on messages and the scrolled state

  // Monitor scroll position to show/hide scroll button and track user scrolling
  useEffect(() => {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;

    let scrollTimeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);

      const isNearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 150; // Increased threshold slightly
      const isScrolled = chatLog.scrollTop > 50; // User has scrolled somewhat

      // Show button if scrolled up significantly
      setShowScrollButton(!isNearBottom && isScrolled);

      // Set scrolled state if user scrolls up, reset if they scroll back down
      setIsChatLogScrolled(!isNearBottom);

       // Add a class when scrolling for potential shadow effects on header/footer
      if (chatLog.scrollTop > 10) {
        chatLog.classList.add('scrolled');
      } else {
        chatLog.classList.remove('scrolled');
      }

      // Optimization: Debounce the scroll event handler slightly if needed
      // scrollTimeout = setTimeout(() => {
      //   // Add any debounced actions here
      // }, 50);
    };

    chatLog.addEventListener('scroll', handleScroll);
    // Initial check in case content is already scrollable
    handleScroll();

    return () => {
        chatLog.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
        // Clean up class if component unmounts while scrolled
         if (chatLogRef.current) {
           chatLogRef.current.classList.remove('scrolled');
         }
    }
  }, []); // Empty dependency array to run only once on mount for setup

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Force scroll state update after manually scrolling down
    setIsChatLogScrolled(false);
    setShowScrollButton(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    const userMessage = {
      id: `user-${Date.now()}`, // Unique ID
      text: trimmedInput,
      sender: 'user',
      time: getFormattedTime()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsChatLogScrolled(false); // Assume user wants to see the reply, scroll down

    try {
      // --- API Call ---
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chatbot/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Ensure token is valid
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      // --- Optional: Simulate network delay for testing typing indicator ---
      // await new Promise(resolve => setTimeout(resolve, 1500));
      // -------------------------------------------------------------------

      setIsTyping(false); // Stop typing indicator *before* processing response

      if (!response.ok) {
        let errorMessage = 'Failed to get response from assistant.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage; // Use specific error if available
        } catch (jsonError) {
          // If response is not JSON or empty
          console.error('Error parsing error response:', jsonError);
          errorMessage = `Server returned status ${response.status}. Please try again.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const botMessage = {
        id: `bot-${Date.now()}`, // Unique ID
        text: data.message || "Received an empty response.", // Handle potentially empty message
        sender: 'bot',
        time: getFormattedTime()
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      setIsTyping(false); // Ensure typing stops on error

      const errorBotMessage = {
        id: `error-${Date.now()}`, // Unique ID
        text: `Sorry, I encountered an issue: ${error.message || 'Please try again later.'}`,
        sender: 'bot',
        isError: true, // Add flag for potential styling
        time: getFormattedTime()
      };

      setMessages(prevMessages => [...prevMessages, errorBotMessage]);
    } finally {
        // Ensure focus remains on input or shifts appropriately
        // Consider re-focusing input field after message send if desired
        // inputRef.current?.focus();
    }
  };

  // Ref for the input field to potentially focus it
  const inputRef = useRef(null);

  return (
    <div className="chatbot-container">
      {/* Animated Gradient Background */}
      <div className="chatbot-background"></div>

      {/* Header */}
      <div className="chat-header">
        <div className="chat-avatar">
          {/* Refined SVG Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v.5a.75.75 0 0 1-1.5 0v-.5a1.5 1.5 0 0 0-1.5-1.5h-9a1.5 1.5 0 0 0-1.5 1.5v.5a.75.75 0 0 1-1.5 0v-.5ZM6.75 12a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H6.75Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="header-text">
          <h3>AI Assistant</h3>
          <span className="chat-status">
             Online
             <span className="status-indicator"></span>
           </span>
        </div>
      </div>

      {/* Chat Log */}
      <div className="chat-log" ref={chatLogRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message-container ${msg.sender}-container`}>
            <div className={`message ${msg.sender} ${msg.isError ? 'error' : ''} slide-in-up`}>
               {/* Optional: Add sender avatar next to bot messages */}
               {/* {msg.sender === 'bot' && <div className="message-avatar">B</div>} */}
              <div className="message-content">
                 {msg.text}
              </div>
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="message-container bot-container">
             {/* Optional: Add sender avatar next to typing indicator */}
             {/* <div className="message-avatar">B</div>} */}
            <div className="typing-indicator message bot slide-in-up">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={endOfMessagesRef} style={{ height: '1px' }} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          className={`scroll-to-bottom ${showScrollButton ? 'visible' : ''}`}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
             <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
           </svg>
        </button>
      )}

      {/* Chat Input Form */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
         {/* Optional: Add an attachment button here */}
         {/* <button type="button" className="icon-button attachment-button" aria-label="Attach file"> ... </button> */}
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything..."
            className="chat-input"
            aria-label="Chat message input"
          />
           {/* Emoji Button - Consider using a library like 'emoji-picker-react' for functionality */}
          {/* <button type="button" className="icon-button emoji-button" aria-label="Select emoji">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
            </svg>
           </button> */}
        </div>
        <button
          type="submit"
          className="send-button"
          disabled={!inputText.trim() || isTyping} // Disable while sending/typing or if empty
          aria-label="Send message"
         >
           {/* Send Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
             <path d="M3.105 3.105a.75.75 0 0 1 .814-.156l14.692 4.897a.75.75 0 0 1 0 1.308L3.919 14.053a.75.75 0 0 1-.814-.156l-.618-.618a.75.75 0 0 1 .156-.814L6.95 10 2.697 6.63a.75.75 0 0 1-.156-.814l.618-.618Z" />
           </svg>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
