// async function userLogout(req, res) {

//     try {
//         res.clearCookie('token')
//         res.json({
//             message: 'Logged out successfully',
//             error: false,
//             success: true,
//             data: []
//         })

//     } catch (err) {
//         res.json({
//             message: err.message || err,
//             error: true,
//             success: false
//         })

//     }

// }

// module.exports = userLogout

async function userLogout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.cookie("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0),
    });

    return res.json({
      message: "Logged out successfully",
      error: false,
      success: true,
      data: [],
    });
  } catch (err) {
    return res.json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = userLogout;