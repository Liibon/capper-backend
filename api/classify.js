export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Only POST requests allowed');
  }

  const { text } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert AI-generated-content detector for social media. Your job is to detect if a LinkedIn post was likely written with help from an LLM like ChatGPT or Claude. You respond only with a number from 0 to 100, representing your confidence that the post is AI-written."
          },
          {
            role: "user",
            content: `Post: "${text}"\n\nThink carefully. If the writing is overly polished, cliche, buzzword-heavy, or structured like an advertisement, it's likely AI-generated.\n\nWhat is your confidence that this is AI-written? Respond only with the number.`
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    const confidence = parseInt(reply.replace(/[^0-9]/g, ''), 10);
    res.status(200).json({ confidence: isNaN(confidence) ? -1 : confidence });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ confidence: -1, error: "Internal Server Error" });
  }
}
