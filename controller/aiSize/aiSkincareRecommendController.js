// const OpenAI = require("openai");

// const safeJsonParse = (text) => {
//   try {
//     return JSON.parse(text);
//   } catch (error) {
//     const cleaned = String(text)
//       .replace(/```json/g, "")
//       .replace(/```/g, "")
//       .trim();

//     return JSON.parse(cleaned);
//   }
// };

// const MAX_WEBSITE_PRODUCTS = 15;

// const cleanCustomerInfo = (customerInfo = {}) => ({
//   skinType: customerInfo.skinType,
//   skinConcerns: customerInfo.skinConcerns,
//   skinGoals: customerInfo.skinGoals,
//   hasSensitiveSkin: customerInfo.hasSensitiveSkin,
//   irritationHistory: customerInfo.irritationHistory,
//   allergyIngredients: customerInfo.allergyIngredients,
//   currentRoutine: customerInfo.currentRoutine,
//   questionGoal: customerInfo.questionGoal,
//   ageRange: customerInfo.ageRange,
//   budget: customerInfo.budget,
//   isPregnantOrBreastfeeding: customerInfo.isPregnantOrBreastfeeding,
// });

// const cleanCurrentProduct = (currentProduct = {}) => ({
//   productId: currentProduct.productId,
//   productName: currentProduct.productName,
//   category: currentProduct.category,
//   subCategory: currentProduct.subCategory,
//   productType: currentProduct.productType,
//   description: currentProduct.description,
//   ingredients: currentProduct.ingredients,
//   suitableSkinTypes: currentProduct.suitableSkinTypes,
//   targetConcerns: currentProduct.targetConcerns,
//   avoidFor: currentProduct.avoidFor,
//   usageTime: currentProduct.usageTime,
//   price: currentProduct.price,
// });

// const aiSkincareRecommendController = async (req, res) => {
//   try {
//     const { currentProduct, customerInfo, websiteProducts } = req.body;

//     if (!process.env.OPENAI_API_KEY) {
//       return res.status(500).json({
//         success: false,
//         message: "OPENAI_API_KEY is missing in .env",
//       });
//     }

//     if (!currentProduct || typeof currentProduct !== "object") {
//       return res.status(400).json({
//         success: false,
//         message: "currentProduct is required and must be an object",
//       });
//     }

//     if (!customerInfo || typeof customerInfo !== "object") {
//       return res.status(400).json({
//         success: false,
//         message: "customerInfo is required and must be an object",
//       });
//     }

//     if (!Array.isArray(websiteProducts)) {
//       return res.status(400).json({
//         success: false,
//         message: "websiteProducts is required and must be an array",
//       });
//     }

//     const limitedWebsiteProducts = websiteProducts.slice(0, MAX_WEBSITE_PRODUCTS);
//     const cleanedCurrentProduct = cleanCurrentProduct(currentProduct);
//     const cleanedCustomerInfo = cleanCustomerInfo(customerInfo);

//     const systemPrompt = `
// You are an AI skincare recommendation assistant for an e-commerce app.

// Your job is to analyze:
// 1. The customer's skin information
// 2. The current product the customer is viewing
// 3. The available skincare products from the website

// Then you must give safe, practical, and easy-to-understand skincare guidance in Bangla.

// Important rules:
// - You are not a doctor or dermatologist.
// - Do not diagnose skin disease.
// - Do not claim that any product will cure acne, melasma, dark spots, or any medical condition.
// - Do not use words like "guaranteed", "permanent", "cure", "100% remove", or "treatment".
// - Use safer wording like "care", "support", "may help", "can be suitable", "general guidance".
// - If the user has severe acne, burning, allergy, infection, swelling, strong redness, pregnancy/breastfeeding, or a medical skin condition, recommend consulting a dermatologist.
// - Always consider sensitive skin and allergy/irritation history.
// - If the product has ingredients that may irritate sensitive skin, give a warning.
// - Only recommend products from the provided websiteProducts list.
// - Do not invent product names.
// - If no suitable product is found from websiteProducts, say that no suitable matching product was found.
// - Keep the response customer-friendly, short, and clear.
// - Response language must be Bangla.
// - Return only valid JSON.
// - Do not include markdown.
// `;

//     const userPrompt = `
// Analyze the following skincare recommendation request.

// Current Product:
// ${JSON.stringify(cleanedCurrentProduct, null, 2)}

// Customer Information:
// ${JSON.stringify(cleanedCustomerInfo, null, 2)}

// Available Website Products:
// ${JSON.stringify(limitedWebsiteProducts, null, 2)}

// Task:
// 1. Decide whether the current product is suitable for this customer.
// 2. Explain why it is suitable, okay, or not recommended.
// 3. Explain how to use this product safely.
// 4. Suggest what type of products can be used with it.
// 5. Recommend matching products only from Available Website Products.
// 6. Mention what to avoid based on the user's skin type, goals, sensitivity, and irritation history.
// 7. Give a short safety warning.

// Return the response in this exact JSON format:

// {
//   "suitability": {
//     "status": "good | okay | not_recommended | unknown",
//     "title": "short Bangla title",
//     "reason": "short Bangla explanation"
//   },
//   "skinSummary": "short Bangla summary of the customer skin profile",
//   "howToUse": {
//     "time": "morning | night | both | unknown",
//     "frequency": "Bangla usage frequency suggestion",
//     "steps": [
//       "step 1",
//       "step 2",
//       "step 3"
//     ]
//   },
//   "recommendedWith": [
//     {
//       "productId": "product id from websiteProducts",
//       "productName": "product name from websiteProducts",
//       "productType": "cleanser | toner | serum | moisturizer | sunscreen | mask | other",
//       "reason": "why this product matches"
//     }
//   ],
//   "avoidWith": [
//     {
//       "item": "ingredient/product type/routine",
//       "reason": "Bangla reason"
//     }
//   ],
//   "customerMessage": "friendly Bangla message for the customer",
//   "warning": "short Bangla safety warning"
// }
// `;

//     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//     const response = await openai.responses.create({
//       model: "gpt-5.2",
//       instructions: systemPrompt,
//       input: userPrompt,
//     });

//     const aiResult = safeJsonParse(response.output_text);

//     return res.status(200).json({
//       success: true,
//       message: "AI skincare suggestion generated successfully",
//       data: aiResult,
//     });
//   } catch (err) {
//     console.log("AI skincare recommend error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "AI skincare suggestion failed",
//     });
//   }
// };

// module.exports = aiSkincareRecommendController;

const OpenAI = require("openai");

const MAX_WEBSITE_PRODUCTS = 40;

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const cleaned = String(text || "")
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }
};

const normalizeType = (value = "") => {
  const text = String(value).toLowerCase().replace(/\s+/g, "");

  if (text.includes("facewash") || text.includes("face wash")) return "faceWash";
  if (text.includes("cleanser")) return "cleanser";
  if (text.includes("toner")) return "toner";
  if (text.includes("serum")) return "serum";
  if (text.includes("moisturizer") || text.includes("cream")) return "moisturizer";
  if (text.includes("sunscreen") || text.includes("sunblock")) return "sunscreen";
  if (text.includes("mask")) return "mask";

  return "other";
};

const cleanCustomerInfo = (customerInfo = {}) => ({
  skinType: customerInfo.skinType || "",
  skinConcerns: Array.isArray(customerInfo.skinConcerns)
    ? customerInfo.skinConcerns
    : [],
  skinGoals: Array.isArray(customerInfo.skinGoals) ? customerInfo.skinGoals : [],
  hasSensitiveSkin: customerInfo.hasSensitiveSkin || "not_sure",
  irritationHistory: customerInfo.irritationHistory || "not_sure",
  allergyIngredients: Array.isArray(customerInfo.allergyIngredients)
    ? customerInfo.allergyIngredients
    : [],
  currentRoutine: Array.isArray(customerInfo.currentRoutine)
    ? customerInfo.currentRoutine
    : [],
  ageRange: customerInfo.ageRange || "prefer_not_to_say",
  wantedProductTypes: Array.isArray(customerInfo.wantedProductTypes)
    ? customerInfo.wantedProductTypes
    : [],
  expectedResult: customerInfo.expectedResult || "",
  extraNote: customerInfo.extraNote || "",
});

const cleanWebsiteProduct = (item = {}) => ({
  productId: item.productId || item._id || "",
  productName: item.productName || "",
  category: item.category || "",
  subCategory: item.subCategory || "",
  productType: normalizeType(
    item.productType ||
      item?.skinCareInfo?.productType ||
      item.subCategory ||
      item.category ||
      item.productName
  ),
  description: item.description || "",
  ingredients: item.ingredients || item?.skinCareInfo?.ingredients || [],
  suitableSkinTypes:
    item.suitableSkinTypes || item?.skinCareInfo?.suitableSkinTypes || [],
  targetConcerns: item.targetConcerns || item?.skinCareInfo?.targetConcerns || [],
  avoidFor: item.avoidFor || item?.skinCareInfo?.avoidFor || [],
  usageTime: item.usageTime || item?.skinCareInfo?.usageTime || "",
  price: item.selling || item.price || 0,
  stock: item.totalStock || item.stock || 0,
  image: item.image || "",
});

const aiSkincareRecommendController = async (req, res) => {
  try {
    const { customerInfo, websiteProducts = [], skinImageBase64 } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is missing in .env",
      });
    }

    if (!customerInfo || typeof customerInfo !== "object") {
      return res.status(400).json({
        success: false,
        message: "customerInfo is required",
      });
    }

    if (!Array.isArray(websiteProducts)) {
      return res.status(400).json({
        success: false,
        message: "websiteProducts is required and must be an array",
      });
    }

    const cleanedCustomerInfo = cleanCustomerInfo(customerInfo);

    const selectedTypes = cleanedCustomerInfo.wantedProductTypes.map((x) =>
      normalizeType(x)
    );

    const cleanedProducts = websiteProducts
      .map(cleanWebsiteProduct)
      .filter((item) => Number(item.stock || 0) > 0)
      .filter((item) => selectedTypes.length === 0 || selectedTypes.includes(item.productType))
      .slice(0, MAX_WEBSITE_PRODUCTS);

    const systemPrompt = `
You are an AI skincare helper for a Bangladesh e-commerce app.

Your job:
- Analyze customer skin information.
- If image is provided, use it only for general visual observation.
- Analyze only available in-stock website products.
- Recommend best products from the provided product list only.
- For each requested product type, suggest best 2 products if available.
- Also suggest 1 supporting product/routine item that can work well with each recommendation.
- Explain shortly why the product may be suitable.
- Mention useful ingredients from the product data if available.
- Mention short description.
- Response language must be Bangla.
- Return only valid JSON.

Safety rules:
- You are not a doctor or dermatologist.
- Do not diagnose disease.
- Do not say cure, permanent solution, guaranteed result, 100% remove.
- Use safe words: "may help", "support", "care", "suitable hote pare".
- For severe acne, swelling, allergy, infection, strong burning, pregnancy/breastfeeding, recommend dermatologist.
- If user has sensitive skin or irritation history, recommend patch test.
- Do not invent product names.
`;

 const userPrompt = `
Customer Information:
${JSON.stringify(cleanedCustomerInfo, null, 2)}

Available In-stock Website Products:
${JSON.stringify(cleanedProducts, null, 2)}

Task:
Return JSON in this exact format:

{
  "skinSummary": {
    "title": "Bangla short title",
    "summary": "Bangla summary of user's skin type, concerns, goals, sensitivity, age and current routine",
    "imageObservation": "If image is provided, describe visible general skin observations in Bangla. Acknowledge what you can see, such as oily look, dryness, visible spots, acne-like bumps, redness, dullness, uneven tone, pores etc. Do not diagnose disease. If image is not provided, empty string.",
    "acknowledgedConcerns": [
      "short Bangla concern 1",
      "short Bangla concern 2"
    ]
  },

  "productCheck": {
    "checkedMessage": "Bangla message that you checked only in-stock website products from the selected product types",
    "matchedProductTypes": [
      "cleanser",
      "toner",
      "serum",
      "moisturizer",
      "sunscreen",
      "mask",
      "faceWash"
    ],
    "totalCheckedProducts": 0
  },

  "recommendedProducts": [
    {
      "productType": "cleanser | toner | serum | moisturizer | sunscreen | mask | faceWash",
      "message": "Bangla message. Example: আপনার face condition অনুযায়ী এই ২টি sunscreen থেকে যেকোনো ১টি নিতে পারেন। If only 1 suitable product found, say this one is suitable.",
      "products": [
        {
          "productId": "product id from websiteProducts",
          "productName": "product name from websiteProducts",
          "price": "price if available",
          "whyGood": "Short Bangla reason why this product is suitable for this user's skin/face condition",
          "description": "Short Bangla product description based on product data",
          "ingredients": [
            "important ingredient 1",
            "important ingredient 2"
          ],
          "carefulNote": "Short Bangla note if sensitive skin, irritation history, acne, dryness etc."
        }
      ]
    }
  ],

  "extraSuggestion": [
    {
      "forProductType": "selected product type like sunscreen",
      "title": "Bangla short title",
      "beforeUse": {
        "productType": "faceWash | cleanser | toner | moisturizer | serum | mask | sunscreen | empty",
        "productId": "product id from websiteProducts or empty",
        "productName": "product name from websiteProducts or empty",
        "reason": "Bangla reason why using this before the main product can give better result"
      },
      "afterUse": {
        "productType": "faceWash | cleanser | toner | moisturizer | serum | mask | sunscreen | empty",
        "productId": "product id from websiteProducts or empty",
        "productName": "product name from websiteProducts or empty",
        "reason": "Bangla reason why using this after/with the main product can give better result"
      }
    }
  ],

  "avoidList": [
    {
      "item": "ingredient/product habit/routine to avoid",
      "reason": "Bangla reason based on user's skin type, concerns, sensitivity and image observation"
    }
  ],

  "customerMessage": "Friendly Bangla final message",
  "warning": "Short Bangla safety warning"
}

Important recommendation rules:
1. Recommend products only from Available In-stock Website Products.
2. For each selected product type, recommend maximum 2 best products.
3. If only 1 suitable product exists, recommend only 1 product.
4. Do not include 'useWith' inside recommended product.
5. Extra product guidance must go inside extraSuggestion only.
6. For sunscreen, usually suggest faceWash/cleanser before use and moisturizer before sunscreen if skin is dry/sensitive.
7. For serum, suggest cleanser/faceWash before use and moisturizer after use if available.
8. For faceWash/cleanser, suggest moisturizer after use if skin is dry/sensitive.
9. Avoid suggestions must be personalized based on user's skin type, concern, sensitivity, irritation history and image observation.
10. Do not invent any product name, ingredient, price or product id.
`;

    const inputContent = [{ type: "input_text", text: userPrompt }];

    if (skinImageBase64) {
      inputContent.push({
        type: "input_image",
        image_url: skinImageBase64,
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions: systemPrompt,
      input: [
        {
          role: "user",
          content: inputContent,
        },
      ],
    });

    const aiResult = safeJsonParse(response.output_text);

    return res.status(200).json({
      success: true,
      message: "AI skincare profile suggestion generated successfully",
      data: aiResult,
    });
  } catch (err) {
    console.log("AI skincare recommend error:", err);

    return res.status(500).json({
      success: false,
      message: "AI skincare suggestion failed",
    });
  }
};

module.exports = aiSkincareRecommendController;