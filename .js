(function() {
  let isOpen = false;
  let messages = [
    { sender: "bot", text: "Hi! How can I assist you today?" }
  ];
  let inputValue = "";

  const extractUrlFromText = (text) => {
    const urlPatterns = [
      /(?:For more detailed information, visit:\*\*?\s*)(https?:\/\/[^\s\]]+)/i,
      /(?:visit:\s*)(https?:\/\/[^\s\]]+)/i,
      /(https?:\/\/[^\s\]]+)/i
    ];
    
    for (const pattern of urlPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[match.length - 1];
      }
    }
    return null;
  };

  const cleanResponseText = (text) => {
    const cleanedText = text
      .replace(/For more information On source, visit:\s*https?:\/\/[^\s\n]*/gi, '')
      .replace(/For more information refer:\s*https?:\/\/[^\s\n]*/gi, '')
      .replace(/For more information, visit:\s*https?:\/\/[^\s\n]*/gi, '')
      .replace(/For more information visit:\s*https?:\/\/[^\s\n]*/gi, '')
      .replace(/Youtube Link:\s*https?:\/\/[^\s\n]*/gi, '')
      .replace(/\*\*About your question:\*\*[^\n]*\n?\n?/gi, '')
      .replace(/\*\*Answer:\*\*\s*/gi, '')
      .replace(/\n\n\n+/g, '\n\n')
      .trim();
    
    const paragraphs = cleanedText.split(/\n\n|\n\d+\./);
    const firstParagraph = paragraphs[0].trim();
    
    const sentences = firstParagraph.split('.');
    const completeSentences = [];
    
    for (let i = 0; i < sentences.length - 1; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 0) {
        completeSentences.push(sentence);
      }
    }
    
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence.length > 0 && firstParagraph.endsWith('.')) {
      completeSentences.push(lastSentence);
    }
    
    let finalText = completeSentences.join('. ');
    if (finalText.length > 0 && !finalText.endsWith('.')) {
      finalText += '.';
    }
    
    return finalText;
    
  };

  const createStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from {
          transform: scale(0.9) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }
      .chatbot-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        background: #0070f3;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 28px;
        cursor: pointer;
      }
      .chatbot-window {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 340px;
        max-height: 420px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1001;
      }
      .chatbot-header {
        background: #0070f3;
        color: #fff;
        padding: 12px 16px;
        font-weight: 600;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .chatbot-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
      }
      .chatbot-messages {
        flex: 1;
        padding: 12px 16px;
        overflow-y: auto;
        background: #f7f8fa;
      }
      .chatbot-message {
        margin-bottom: 10px;
      }
      .chatbot-message.user {
        text-align: right;
      }
      .chatbot-message-bubble {
        display: inline-block;
        border-radius: 8px;
        padding: 8px 12px;
        max-width: 80%;
        font-size: 15px;
      }
      .chatbot-message.user .chatbot-message-bubble {
        background: #0070f3;
        color: #fff;
      }
      .chatbot-message.bot .chatbot-message-bubble {
        background: #eaeaea;
        color: #222;
      }
      .chatbot-source {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #ccc;
      }
      .chatbot-youtube {
        background: #f0f0f0;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #ddd;
      }
      .chatbot-video-container {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 56.25%;
        overflow: hidden;
        border-radius: 8px;
        background-color: #000;
      }
      .chatbot-video-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
      .chatbot-form {
        display: flex;
        border-top: 1px solid #eee;
        background: #fff;
        padding: 8px 12px;
      }
      .chatbot-input {
        flex: 1;
        color: black;
        border: none;
        outline: none;
        font-size: 15px;
        padding: 8px;
        border-radius: 6px;
        background: #f2f2f2;
      }
      .chatbot-send {
        margin-left: 8px;
        background: #0070f3;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 0 18px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  };

  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.chatbot-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const renderMessages = () => {
    const messagesContainer = document.querySelector('.chatbot-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';
    
    messages.forEach((msg) => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot-message ${msg.sender}`;
      
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'chatbot-message-bubble';
      
      const textDiv = document.createElement('div');
      textDiv.style.whiteSpace = 'pre-wrap';
      textDiv.textContent = msg.text;
      bubbleDiv.appendChild(textDiv);
      
      if (msg.sender === 'bot' && msg.isYouTubeMessage && msg.youtubeUrl) {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'chatbot-source';
        
        const youtubeDiv = document.createElement('div');
        youtubeDiv.className = 'chatbot-youtube';
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'chatbot-video-container';
        
        const iframe = document.createElement('iframe');
        iframe.src = msg.youtubeUrl.replace("watch?v=", "embed/");
        iframe.title = "Related Video";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        
        videoContainer.appendChild(iframe);
        youtubeDiv.appendChild(videoContainer);
        
        const link = document.createElement('a');
        link.href = msg.youtubeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.cssText = 'color: #ff0000; text-decoration: none; font-size: 12px; font-weight: 500; display: block; margin-top: 6px; text-align: center;';
        link.textContent = '▶️ Watch on YouTube';
        youtubeDiv.appendChild(link);
        
        sourceDiv.appendChild(youtubeDiv);
        bubbleDiv.appendChild(sourceDiv);
      }
      
      if (msg.sender === 'bot' && msg.sourceUrl && !msg.isYouTubeMessage) {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'chatbot-source';
        
        const label = document.createElement('div');
        label.style.cssText = 'font-size: 13px; color: #666; margin-bottom: 4px;';
        label.textContent = 'For more information refer:';
        sourceDiv.appendChild(label);
        
        const link = document.createElement('a');
        link.href = msg.sourceUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.cssText = 'color: #0070f3; text-decoration: underline; font-size: 13px; font-weight: 500; display: block;';
        link.textContent = msg.sourceUrl;
        link.onmouseenter = () => {
          link.style.textDecoration = 'none';
          link.style.color = '#005cc5';
        };
        link.onmouseleave = () => {
          link.style.textDecoration = 'underline';
          link.style.color = '#0070f3';
        };
        sourceDiv.appendChild(link);
        
        bubbleDiv.appendChild(sourceDiv);
      }
      
      messageDiv.appendChild(bubbleDiv);
      messagesContainer.appendChild(messageDiv);
    });
    
    setTimeout(scrollToBottom, 100);
  };

  const sendMessage = async (userInput) => {
    if (!userInput.trim()) return;
    
    const userMsg = { sender: "user", text: userInput };
    messages.push(userMsg);
    renderMessages();
    
    messages.push({ sender: "bot", text: "🤔 Thinking..." });
    renderMessages();
    
    try {
  // const API_URL = "http://localhost:8000";
      
  const API_URL = "http://10.244.3.93:8000";
  // const API_URL = "http://10.244.26.105:8000";
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          conversation_id: "default"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const responseText = data.response || data.answer || "Sorry, I couldn't process that.";
      const extractedUrl = extractUrlFromText(responseText);
      const cleanedText = cleanResponseText(responseText);

      const youtubeUrl = data.youtube_urls && data.youtube_urls.length > 0 ? data.youtube_urls[0] : null;
      
      messages.pop();
      messages.push({
        sender: "bot",
        text: cleanedText,
        sourceUrl: extractedUrl || (data.source_urls && data.source_urls.length > 0 ? data.source_urls[0] : null),
        questionTopic: data.question_topic || null,
        youtubeUrl: youtubeUrl,
      });
      renderMessages();

      if (youtubeUrl && youtubeUrl.trim() !== '') {
        setTimeout(() => {
          messages.push({
            sender: "bot",
            text: "📺 I found a related video that might help:",
            youtubeUrl: youtubeUrl,
            isYouTubeMessage: true,
          });
          renderMessages();
        }, 500);
      }
    } catch (error) {
      console.error("Error calling API:", error);
      messages.pop();
      messages.push({
        sender: "bot",
        text: "Sorry, I'm having trouble connecting to my brain 🧠. Please try again later!",
      });
      renderMessages();
    }
  };

  const createChatbot = () => {
    const button = document.createElement('button');
    button.className = 'chatbot-button';
    button.setAttribute('aria-label', 'Open chatbot');
    button.textContent = '🤖';
    button.onclick = () => {
      isOpen = !isOpen;
      toggleChatWindow();
    };
    
    document.body.appendChild(button);
  };

  const createChatWindow = () => {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatbot-window';
    chatWindow.style.display = 'none';
    
    const header = document.createElement('div');
    header.className = 'chatbot-header';
    header.innerHTML = `
      Cyber Bot
      <button class="chatbot-close" aria-label="Close chatbot">×</button>
    `;
    
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'chatbot-messages';
    
    const form = document.createElement('form');
    form.className = 'chatbot-form';
    form.innerHTML = `
      <input type="text" class="chatbot-input" placeholder="Type your message..." />
      <button type="submit" class="chatbot-send">Send</button>
    `;
    
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(form);
    
    document.body.appendChild(chatWindow);
    
    header.querySelector('.chatbot-close').onclick = () => {
      isOpen = false;
      toggleChatWindow();
    };
    
    form.onsubmit = (e) => {
      e.preventDefault();
      const input = form.querySelector('.chatbot-input');
      const value = input.value;
      input.value = '';
      sendMessage(value);
    };
    
    const input = form.querySelector('.chatbot-input');
    input.focus();
  };

  const toggleChatWindow = () => {
    const chatWindow = document.querySelector('.chatbot-window');
    if (chatWindow) {
      chatWindow.style.display = isOpen ? 'flex' : 'none';
      if (isOpen) {
        renderMessages();
        const input = chatWindow.querySelector('.chatbot-input');
        if (input) input.focus();
      }
    }
  };

  const init = () => {
    createStyles();
    createChatbot();
    createChatWindow();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
