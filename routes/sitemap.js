// const express = require("express");
// const router = express.Router();
// const productModel = require("../models/productModel");

// // XML safe text
// function escapeXml(value = "") {
//   return String(value)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&apos;");
// }

// // Sitemap date format
// function toSitemapDate(date) {
//   try {
//     return new Date(date || Date.now()).toISOString();
//   } catch {
//     return new Date().toISOString();
//   }
// }

// router.get("/sitemap.xml", async (req, res) => {
//   try {
//     const FRONTEND_URL = "https://pyzara.com";

//     // Only fields needed for sitemap
//     const products = await productModel
//       .find({}, "_id productName slug category updatedAt createdAt")
//       .sort({ createdAt: -1 })
//       .lean();

//     const staticPages = [
//       {
//         loc: `${FRONTEND_URL}/`,
//         lastmod: new Date(),
//         changefreq: "daily",
//         priority: "1.0",
//       },
//       {
//         loc: `${FRONTEND_URL}/home`,
//         lastmod: new Date(),
//         changefreq: "daily",
//         priority: "0.9",
//       },
//       {
//         loc: `${FRONTEND_URL}/category`,
//         lastmod: new Date(),
//         changefreq: "daily",
//         priority: "0.8",
//       },
//       {
//         loc: `${FRONTEND_URL}/search`,
//         lastmod: new Date(),
//         changefreq: "weekly",
//         priority: "0.5",
//       },
//     ];

//     // IMPORTANT:
//     // নিচের /product/${product._id} আপনার frontend product details route অনুযায়ী মিলাতে হবে।
//     // যদি আপনার route /product-details/:id হয়, তাহলে এখানে /product-details/${product._id} দিন।
//     const productPages = products.map((product) => {
//       const productUrl = `${FRONTEND_URL}/product/${product._id}`;

//       return {
//         loc: productUrl,
//         lastmod: product.updatedAt || product.createdAt || new Date(),
//         changefreq: "weekly",
//         priority: "0.8",
//       };
//     });

//     const allPages = [...staticPages, ...productPages];

//     const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
// ${allPages
//   .map(
//     (page) => `  <url>
//     <loc>${escapeXml(page.loc)}</loc>
//     <lastmod>${toSitemapDate(page.lastmod)}</lastmod>
//     <changefreq>${page.changefreq}</changefreq>
//     <priority>${page.priority}</priority>
//   </url>`
//   )
//   .join("\n")}
// </urlset>`;

//     res.header("Content-Type", "application/xml");
//     res.header("Cache-Control", "public, max-age=3600");
//     res.status(200).send(sitemap);
//   } catch (error) {
//     console.error("Sitemap generate error:", error);

//     res.status(500).type("text/plain").send("Sitemap generate failed");
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const productModel = require("../models/productModel");

const FRONTEND_URL = "https://pyzara.com";

// XML safe text
function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Sitemap date format
function toSitemapDate(date) {
  const d = new Date(date || Date.now());
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// URL safe slug/category
function safeUrlPart(value = "") {
  return encodeURIComponent(String(value).trim());
}

// Product URL generator
function getProductUrl(product) {
  // slug thakle slug use korbe, na thakle _id use korbe
  const productKey = product?.slug || product?._id;
  return `${FRONTEND_URL}/product/${safeUrlPart(productKey)}`;
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await productModel
      .find({ isPublished: true }, "_id productName slug category updatedAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const staticPages = [
      {
        loc: `${FRONTEND_URL}/`,
        lastmod: new Date(),
        changefreq: "daily",
        priority: "1.0",
      },
      {
        loc: `${FRONTEND_URL}/home`,
        lastmod: new Date(),
        changefreq: "daily",
        priority: "0.9",
      },
      {
        loc: `${FRONTEND_URL}/category`,
        lastmod: new Date(),
        changefreq: "daily",
        priority: "0.8",
      },
    ];

    // Unique category list from products
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
          .map((category) => String(category).trim())
      ),
    ];

    // IMPORTANT:
    // Ei route frontend er sathe match korte hobe.
    // Jodi tomar frontend route hoy /category-wish/:categoryName,
    // tahole eta thik ache.
    // Jodi route hoy /category/:categoryName, tahole niche category-wish change koro.
    const categoryPages = uniqueCategories.map((category) => ({
      loc: `${FRONTEND_URL}/category-wish/${safeUrlPart(category)}`,
      lastmod: new Date(),
      changefreq: "daily",
      priority: "0.7",
    }));

    const productPages = products
      .filter((product) => product?._id)
      .map((product) => ({
        loc: getProductUrl(product),
        lastmod: product.updatedAt || product.createdAt || new Date(),
        changefreq: "daily",
        priority: "0.8",
      }));

    const allPages = [...staticPages, ...categoryPages, ...productPages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${toSitemapDate(page.lastmod)}</lastmod>
    <changefreq>${escapeXml(page.changefreq)}</changefreq>
    <priority>${escapeXml(page.priority)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=3600");
    res.status(200).send(sitemap);
  } catch (error) {
    console.error("Sitemap generate error:", error);
    res.status(500).type("text/plain").send("Sitemap generate failed");
  }
});

module.exports = router;