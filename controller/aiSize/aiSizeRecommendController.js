// controller/aiSize/aiSizeRecommendController.js

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT response JSON parse helper
const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const cleaned = String(text)
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }
};

const aiSizeRecommendController = async (req, res) => {
  try {
    const {
      productName,
      category,
      productType,
      sizeChart,
      customerInfo,
      fitPreference,
    } = req.body;

    // API key check
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "OPENAI_API_KEY is missing in .env",
        error: true,
        success: false,
      });
    }

    // Size chart validation
    if (!sizeChart || !Array.isArray(sizeChart) || sizeChart.length === 0) {
      return res.status(400).json({
        message: "sizeChart is required and must be an array",
        error: true,
        success: false,
      });
    }

    // Customer height/weight validation
    if (!customerInfo?.heightFeet || !customerInfo?.weight) {
      return res.status(400).json({
        message: "customerInfo heightFeet and weight are required",
        error: true,
        success: false,
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.2",

      instructions: `
You are an AI clothing size recommendation assistant for an e-commerce website.

This prompt is only for clothing items.

Return only valid JSON.
Do not use markdown.
Do not add extra text.

Language rules:
- All response values must be written in Bangla.
- Size labels like S, M, L, XL, XXL, 40, 42 etc can stay in English.

Measurement rules:
- Product size chart measurements are in inches and are garment measurements.
- Customer height is provided as feet and inches.
- totalHeightInch is also provided.
- Customer weight is provided in kg.
- Customer waist may be provided in inches, but it is optional.
- Customer chest and shoulder measurements are not provided.
- Recommend size using height, weight, optional waist, category, productType, fitPreference, and product size chart.
- For tops like shirt, t-shirt, polo shirt, hoodie, jacket, panjabi, women three pices two pices etc use chest and length from size chart.
- For pants/trousers/shorts: if waist is provided, use waist strongly.
- For slim fit preference, recommend closer suitable size.
- For regular fit preference, recommend balanced size.
- For loose fit preference, recommend one size larger only when the base size is already suitable.
- Use category to understand target group such as Men, Women, Kids, Baby.
- Never recommend a size that does not exist in the size chart.
- Do not mention stock because stock information is not provided.

Important size safety rules:
- Do not force a recommendation if the available sizes are clearly not suitable for the customer.
- If the customer appears to be a baby/kid based on height and weight, but the product category or size chart is for adult clothing, do not recommend adult sizes.
- If height/weight strongly do not match the product size chart, set recommendedSize to empty string.
- If no suitable size exists, alternativeSize should also be empty string.
- If no suitable size exists, explain the reason inside customerMessage.
- Do not create a separate reason field.
- In customerMessage, clearly mention the main mismatch, such as chest too large, length too long, or product is adult size but customer measurement looks like baby/kid.
- Mention the measurement difference when possible.
- Never say a bigger adult size may fit a very small child/customer just because it exists in the chart.
- Never recommend M, L, XL, XXL for baby/kid measurements unless the product category is Kids/Baby and the size chart is clearly for kids.
- Keep the answer short, friendly, and customer-facing.

If no suitable size exists, return this exact style:
{
  "recommendedSize": "",
  "alternativeSize": "",
  "fitNote": "এই product এর available size আপনার মাপের সাথে ভালোভাবে মিলছে না।",
  "customerMessage": "দুঃখিত, এই product এ আপনার জন্য perfect size পাওয়া যাচ্ছে না। আপনার মাপ অনুযায়ী এই product এর chest/length অনেক বড় বা ছোট হতে পারে, তাই fit ভালো হবে না। অনুগ্রহ করে অন্য product দেখুন।"
}

Return this JSON format:
{
  "recommendedSize": "",
  "alternativeSize": "",
  "fitNote": "",
  "customerMessage": ""
}
`,

      input: JSON.stringify({
        product: {
          productName: productName || "Unknown",
          category: category || "Unknown",
          productType: productType || "Unknown",
        },

        sizeChart,

        customerInfo: {
          heightFeet: Number(customerInfo.heightFeet),
          heightInch: Number(customerInfo.heightInch || 0),
          totalHeightInch: Number(customerInfo.totalHeightInch || 0),
          weight: Number(customerInfo.weight),
          waist: customerInfo.waist ? Number(customerInfo.waist) : null,
        },

        fitPreference: fitPreference || "regular",

        outputFormat: {
          recommendedSize: "",
          alternativeSize: "",
          fitNote: "",
          customerMessage: "",
        },
      }),
    });

    const text = response.output_text;
    const aiResult = safeJsonParse(text);

    return res.json({
      message: "AI size recommendation generated successfully",
      data: aiResult,
      error: false,
      success: true,
    });
  } catch (err) {
    console.log("AI size recommend error:", err);

    // OpenAI quota / billing fallback
    if (
      err?.code === "insufficient_quota" ||
      err?.type === "insufficient_quota"
    ) {
      return res.status(200).json({
        message: "OpenAI quota problem. Fallback response returned.",
        data: {
          recommendedSize: "",
          alternativeSize: "",
          fitNote:
            "AI size helper এখন available নেই। অনুগ্রহ করে size chart দেখে size নির্বাচন করুন।",
          customerMessage:
            "দুঃখিত, এখন AI size suggestion দেওয়া যাচ্ছে না। Size chart দেখে আপনার জন্য সবচেয়ে ভালো size নির্বাচন করুন।",
        },
        error: false,
        success: true,
        fallback: true,
      });
    }

    // Rate limit fallback
    if (err?.status === 429) {
      return res.status(200).json({
        message: "OpenAI rate limit. Fallback response returned.",
        data: {
          recommendedSize: "",
          alternativeSize: "",
          fitNote: "অনেক request হওয়ায় AI size helper সাময়িকভাবে unavailable।",
          customerMessage:
            "দুঃখিত, এখন AI size suggestion দেওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
        },
        error: false,
        success: true,
        fallback: true,
      });
    }

    return res.status(500).json({
      message: err.message || "AI size recommendation failed",
      error: true,
      success: false,
    });
  }
};

module.exports = aiSizeRecommendController;
