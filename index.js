const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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";

const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");

let controller = null; // Store the AbortController instance

const generate = async () => {
  if (!promptInput.value) {
    alert("Please enter a prompt.");
    return;
  }

  generateBtn.disabled = true;
  stopBtn.disabled = false;
  resultText.innerText = "Generating...";

  controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptInput.value }],
        max_tokens: 100,
        stream: true,
      }),
      signal,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    resultText.innerText = "";

    let accumulatedData = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
  
      const chunk = decoder.decode(value);
      accumulatedData += chunk;
  
      // Check if accumulated data contains a complete JSON object
      const startIndex = accumulatedData.indexOf('data: ');
      const endIndex = accumulatedData.indexOf('\n', startIndex);
  
      if (startIndex !== -1 && endIndex !== -1) {
        const jsonData = accumulatedData.substring(startIndex + 6, endIndex);
        try {
          const parsedLine = JSON.parse(jsonData);
          const { choices } = parsedLine;
          const { delta } = choices[0];
          const { content } = delta;
  
          if (content) {
            resultText.innerText += content;
          }
  
          accumulatedData = accumulatedData.substring(endIndex + 1);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    }
  } catch (error) {
    if (signal.aborted) {
      resultText.innerText = "Request aborted.";
    } else {
      console.error("Error:", error);
      resultText.innerText = "Error occurred while generating.";
    }
  } finally {
    generateBtn.disabled = false;
    stopBtn.disabled = true;
    controller = null;
  }
};

const stop = () => {
  if (controller) {
    controller.abort();
    controller = null;
  }
};

promptInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    generate();
  }
});
generateBtn.addEventListener("click", generate);
stopBtn.addEventListener("click", stop);
