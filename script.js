// ==================== CONFIG ====================
const GEMINI_API_KEY = "";  // get from Google AI Studio
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
// ==================== THEME ====================
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);

  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  if (currentTheme === 'light') {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

// ==================== STATE ====================
let generatedNames = [];
let selectedName = '';
let generatedLogos = [];
let selectedLogo = '';

// ==================== HELPERS ====================
function showLoading(buttonId, show = true) {
  const button = document.querySelector(`button[onclick="${buttonId}()"]`);
  const btnText = button.querySelector('.btn-text');
  const loading = button.querySelector('.loading');
  
  if (show) {
    btnText.classList.add('hidden');
    loading.classList.remove('hidden');
    button.disabled = true;
  } else {
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
    button.disabled = false;
  }
}

function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.classList.remove('hidden');
  section.classList.add('fade-in');
}

// ==================== GEMINI HELPERS ====================
async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ==================== NAME GENERATION ====================
async function generateNames() {
    const industry = document.getElementById('industry').value;
    const description = document.getElementById('description').value;

    if (!industry.trim()) {
        alert('Please enter an industry or niche');
        return;
    }

    showLoading('generateNames', true);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=api_key`, // use ur actual api key
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Generate 5 unique startup names for  ${industry} startup. just genrate startup names no tagling no description "}`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();
        console.log("Gemini Response:", data);

        // Extract raw text from Gemini
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Split into lines (Gemini usually returns "1. Name - description")
const mockNames = rawText.split("\n").map(line => {
    // Remove numbering like "1." or "Name:"
    const cleanLine = line.replace(/^\d+\.\s*/, "").replace("**Name:**", "").trim();
    if (!cleanLine) return null;

    // Keep only the first part before "Description"
    const onlyName = cleanLine.split("* **Description:**")[0].trim();

    return {
        name: onlyName
    };
}).filter(item => item && item.name);

        generatedNames = mockNames;
        displayNames(mockNames);
        showSection('nameResults');

    } catch (error) {
        console.error('Error generating names:', error);
        alert('Failed to generate names. Please try again.');
    } finally {
        showLoading('generateNames', false);
    }
}
function displayNames(names) {
    const grid = document.getElementById('nameGrid');
    grid.innerHTML = '';

    names.forEach((item, index) => {
        const option = document.createElement('label');
        option.className = 'result-option';
        option.innerHTML = `
            <input type="radio" name="startupName" value="${item.name}" class="hidden-radio">
            <div class="option-card">
                <div class="card-title">${item.name}</div>
            </div>
        `;
        option.querySelector('input').onchange = () => {
            selectedName = item.name;
        };
        grid.appendChild(option);
    });
}

function selectName(name, index) {
  selectedName = name;
  document.querySelectorAll('#nameGrid .result-card').forEach(c => c.style.borderColor = 'var(--border)');
  document.querySelectorAll('#nameGrid .result-card')[index].style.borderColor = 'var(--accent)';
}

// ==================== LOGO GENERATION ====================
async function generateLogos() {
  if (!selectedName) {
    alert("Please select a startup name first");
    return;
  }

  showLoading("generateLogos", true);

  try {
    const prompt = `Minimalist logo with startup name branding titled as "${selectedName}", clean, modern, vector style, white background`;

    const response = await fetch("https://api.a4f.co/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer api_key`, // Get Api key from https://a4f.co/
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "provider-3/FLUX.1-dev",
        prompt: prompt,
        n: 1,
        response_format: "url",
        size: "1024x1024"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data[0].url) {
      throw new Error("No image URL returned by API");
    }

    const imageUrl = data.data[0].url;

    generatedLogos = [{ id: 1, url: imageUrl }];
    displayLogos(generatedLogos);
    showSection("logoResults");

  } catch (err) {
    console.error("Logo gen error:", err);
    alert("Logo generation failed: " + err.message);
  } finally {
    showLoading("generateLogos", false);
  }
}


function displayLogos(logos) {
  const grid = document.getElementById('logoGrid');
  grid.innerHTML = '';
  logos.forEach((logo, index) => {
    const item = document.createElement('div');
    item.className = 'logo-item';
    item.innerHTML = `
      <div class="logo-placeholder">
        <img src="${logo.url}" alt="Logo ${logo.id}" style="max-width: 130px; max-height: 100px;">
      </div>
      <div>Logo ${logo.id}</div>
    `;
    item.onclick = () => selectLogo(logo.url, index);
    grid.appendChild(item);
  });
}

function selectLogo(logoUrl, index) {
  selectedLogo = logoUrl;
  document.querySelectorAll('#logoGrid .logo-item').forEach(i => i.style.borderColor = 'var(--border)');
  document.querySelectorAll('#logoGrid .logo-item')[index].style.borderColor = 'var(--accent)';
}

// ==================== WEBSITE GENERATION ====================
async function generateWebsite() {
    if (!selectedName) {
        alert('Please select a startup name first');
        return;
    }

    showLoading('generateWebsite', true);

    try {
        const apiKey = GEMINI_API_KEY // 🔑 replace with your actual key
        const industry = document.getElementById('industry').value;
        const description = document.getElementById('description').value;

        const prompt = `Generate a minimal HTML + inline CSS for a startup landing page. 
        Startup name: ${selectedName}.
        Industry: ${industry}.
        Description: ${description}.
        Keep it clean with , navbar (home , about us , contact us ), hero section, tagline, and 3 feature highlights.
        Inlcude some basic css in html in style tag only , only return HTML.`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();
        let websiteHTML = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const blob = new Blob([websiteHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        document.getElementById('websitePreview').src = url;
        showSection('websiteResults');

    } catch (error) {
        console.error('Error generating website:', error);
        alert('Failed to generate website. Please try again.');
    } finally {
        showLoading('generateWebsite', false);
    }
}

function downloadWebsite() {
  const iframe = document.getElementById("websitePreview");

  if (!iframe || !iframe.contentDocument) {
    alert("Website preview not ready to download.");
    return;
  }

  // grab the generated site’s HTML
  const htmlContent = iframe.contentDocument.documentElement.outerHTML;

  // create a blob
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // create a temporary <a> to download
  const a = document.createElement("a");
  a.href = url;
  a.download = `${selectedName || "startup-website"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // cleanup
  URL.revokeObjectURL(url);
}
