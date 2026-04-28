/*const jwt = require("jsonwebtoken");

async function authToken(req, res, next) {
  try {
    const rawCookie = req.cookies?.token || req.headers.cookie; 

    const token = rawCookie?.split("token=")[1]?.split(";")[0];
    // if (rawCookie) {
    //   token = req.cookies?.token 
    //   console.log("req.cookies:", req.cookies?.token );
    // } else {
    //   token = rawCookie?.split("token=")[1]?.split(";")[0];
    //   console.log("req.headers.cookie:", req.headers.cookie);
    // }
    console.log("rawCookie...99>", rawCookie);
        console.log("token...909>", token);
    
    

    if (!rawCookie) {
      return res.status(401).json({
        message: "User not logged in",
        error: true,
        success: false,
      });
    }

    jwt.verify(rawCookie, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", err);
        return res.status(401).json({
          message: "Invalid or expired token",
          error: true,
          success: false,
        });
      }

      req.userId = decoded._id;
      next();
    });
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({
      message: "Authentication failed",
      error: true,
      success: false,
    });
  }
}*/

// module.exports = authToken;

// ??????????????????????????????????????????
// middleware/authToken.js  ✅

// const jwt = require('jsonwebtoken');

// async function authToken(req, res, next) {
//   try {
//     // Prefer cookie 'token', else Authorization: Bearer
//     let token = req.cookies?.token;
//     console.log("🦌◆🦌◆token",token , req.headers.cookie);
    

//     if (!token) {
//       const auth = req.headers.authorization || '';
//       if (auth.startsWith('Bearer ')) {
//         token = auth.slice(7);
//       } else if (req.headers.cookie) {
//         // last resort: parse from raw cookie header
//         token = req.headers.cookie.split('token=')[1]?.split(';')[0];
//       }
//     }

//     if (!token) {
//       return res.status(401).json({ message: 'User not logged in', error: true, success: false });
//     }

//     const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
//     req.userId = decoded._id;
//     return next();
//   } catch (err) {
//     console.error('JWT Verification Error:', err);
//     return res.status(401).json({ message: 'Invalid or expired token', error: true, success: false });
//   }
// }

// module.exports = authToken;


const jwt = require("jsonwebtoken");

async function authToken(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const auth = req.headers.authorization || "";
      if (auth.startsWith("Bearer ")) {
        token = auth.slice(7);
      }
    }

    if (!token && req.headers.cookie) {
      token = req.headers.cookie
        .split(";")
        .map(v => v.trim())
        .find(v => v.startsWith("token="))
        ?.split("=")[1];
    }

    console.log("🦌◆🦌◆token", token, req.headers.cookie);

    if (!token) {
      return res.status(401).json({
        message: "User not logged in",
        error: true,
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
    req.userId = decoded._id;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(401).json({
      message: "Invalid or expired token",
      error: true,
      success: false,
    });
  }
}

module.exports = authToken;