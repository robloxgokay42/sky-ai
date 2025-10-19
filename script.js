// **GÜVENLİK UYARISI: GERÇEK BİR API ANAHTARINI ASLA BURAYA KOYMAYIN!**
// Bu sadece bir sunumdur. Gerçek projelerde sunucu tarafı kullanılmalıdır.
const API_KEY = "AIzaSyCzTJkIkQagLLGWzlCRhzFv-1oC9C_GDHw"; 
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const promptInput = document.getElementById('user-prompt');
const sendButton = document.getElementById('send-button');
const responseOutput = document.getElementById('response-output');
const searchModeSelect = document.getElementById('search-mode');

// Gemini Modelini İçe Aktar (Google'ın SDK'sı yerine basit fetch kullanıyoruz)
// Gerçek projede: "import { GoogleGenerativeAI } from '@google/genai';" kullanın
// Bu sadece basit bir örnek olduğu için fetch kullanılıyor.

// --- Yardımcı Fonksiyonlar ---

/**
 * Gemini'dan gelen Markdown metnini temel HTML'e dönüştürür
 * Kalın, italik ve altı çizili (sadece __altıçizili__ için) destekler.
 * @param {string} markdownText - Gemini'dan gelen metin.
 * @returns {string} - HTML olarak biçimlendirilmiş metin.
 */
function markdownToHtml(markdownText) {
    let html = markdownText;

    // 1. Yeni Satırları <br> ile değiştir (Daha basit görünüm için)
    html = html.replace(/\n/g, '<br>');

    // 2. Başlıkları kaldır (Bu basit arayüzde kafa karıştırmamak için)
    html = html.replace(/#+ (.*?)<br>/g, '<strong>$1</strong><br>');
    html = html.replace(/#+ (.*)/g, '<strong>$1</strong>');

    // 3. Kalın (*, ** veya __)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<u>$1</u>'); // Altı çizili

    // 4. İtalik (_ veya *)
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // 5. Kod bloklarını kaldır (Basit arayüzde zor olduğu için)
    html = html.replace(/```.*?```/gs, (match) => `<span style="font-family:monospace; background:#eee; padding:2px 4px; border-radius:3px;">${match.substring(3, match.length - 3).trim()}</span>`);


    // 6. Listeleri dönüştür
    html = html.replace(/<br>\* (.*?)/g, '<ul><li>$1</li></ul>');
    html = html.replace(/<br>- (.*?)/g, '<ul><li>$1</li></ul>');
    
    // Basitleştirilmiş: birden fazla ul/li varsa bunları birleştirmeye çalışmaz.
    // Gerçek bir Markdown kütüphanesi (marked.js) bu işi daha iyi yapar.

    return html;
}


// --- Ana İşlevler ---

/**
 * Kullanıcı girdisini alır ve Gemini API'ye gönderir.
 */
async function generateResponse() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // Arayüzü Güncelleme
    sendButton.disabled = true;
    sendButton.textContent = "Düşünüyor...";
    
    // Eski hoşgeldin mesajını kaldır
    const welcome = responseOutput.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    // Kullanıcının mesajını ekle
    responseOutput.innerHTML += `<div class="user-message"><p><strong>Siz:</strong> ${prompt}</p></div>`;
    
    // AI Cevabının geleceği yeri hazırlar
    responseOutput.innerHTML += `<div id="ai-response-temp"><p>SkyAI: <span class="blinking-cursor">...</span></p></div>`;
    responseOutput.scrollTop = responseOutput.scrollHeight; // Kaydır

    promptInput.value = ''; // Girişi temizle

    // Model Ayarları
    const mode = searchModeSelect.value;
    let modelName = "gemini-2.5-flash"; // Varsayılan: Hızlı Cevap

    // Mod seçimine göre modeli ayarla
    let tools = [];
    if (mode === 'search') {
        // Web'de Arama/Derin Araştırma için Google Search Tool'u etkinleştirir.
        tools = [{ googleSearch: {} }];
    } else if (mode === 'long') {
        // Daha uzun düşünme ve daha iyi kalite için daha güçlü model
        modelName = "gemini-2.5-pro"; 
    }

    const apiUrl = `${API_BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const requestBody = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: 0.7, // Yaratıcı çözümler için
            tools: tools
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cevabı al
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, bir cevap oluşturulamadı.";
        
        // Markdown'ı HTML'e dönüştür ve ekrana bas
        const htmlResponse = markdownToHtml(aiText);
        
        // Geçici cevabı temizle ve nihai cevabı ekle
        const tempElement = document.getElementById('ai-response-temp');
        if (tempElement) {
             tempElement.innerHTML = `<p><strong>SkyAI:</strong> ${htmlResponse}</p>`;
             tempElement.removeAttribute('id'); // ID'yi kaldır
        }


    } catch (error) {
        console.error("Gemini API Çağrısında Hata:", error);
        const tempElement = document.getElementById('ai-response-temp');
        if (tempElement) {
            tempElement.innerHTML = `<p style="color:red;"><strong>SkyAI:</strong> Bağlantı Hatası veya API Hatası. Konsolu kontrol edin.</p>`;
            tempElement.removeAttribute('id');
        }

    } finally {
        // Arayüzü tekrar etkinleştir
        sendButton.disabled = false;
        sendButton.textContent = "Gönder";
        responseOutput.scrollTop = responseOutput.scrollHeight; // En alta kaydır
    }
}

// --- Olay Dinleyicileri ---

sendButton.addEventListener('click', generateResponse);

// Enter tuşuyla gönderme
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Yeni satır eklemeyi engelle
        generateResponse();
    }
});

// Cursor Stilini CSS ile değil, daha basit bir şekilde JS ile tanımlayalım (Sadece örnek)
const style = document.createElement('style');
style.innerHTML = `
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-start 0s infinite; }
`;
document.head.appendChild(style);
