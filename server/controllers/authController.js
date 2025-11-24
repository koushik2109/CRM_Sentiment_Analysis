// import bcrypt from "bcryptjs";
// import userModel from "../models/userModel.js";
// import jwt from "jsonwebtoken";
// import transporter from "../config/nodemailer.js";

// // REGISTER USER
// export const register = async (req, res) => {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//         return res.json({ success: false, message: "Missing Details" });
//     }

//     try {
//         const existingUser = await userModel.findOne({ email });
//         if (existingUser) {
//             return res.json({ success: false, message: "User already exist" });
//         }

//         const hashPassword = await bcrypt.hash(password, 10);
//         const user = new userModel({ name, email, password: hashPassword });
//         await user.save();

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//             expiresIn: "7d",
//         });

//         res.cookie("token", token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//         });

//         await transporter.sendMail({
//             from: process.env.SENDER_EMAIL,
//             to: email,
//             subject: "Welcome to AI CRM Feedback",
//             text: `Welcome to AI CRM Feedback! Your account has been created with email: ${email}`,
//         });

//         return res.json({ success: true });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// // LOGIN USER
// export const login = async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.json({
//             success: false,
//             message: "Email and Password are required",
//         });
//     }

//     try {
//         const user = await userModel.findOne({ email });
//         if (!user) {
//             return res.json({ success: false, message: "Invalid Email" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.json({ success: false, message: "Invalid Password" });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//             expiresIn: "7d",
//         });

//         res.cookie("token", token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//         });

//         return res.json({ success: true });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// // LOGOUT USER
// export const logout = async (req, res) => {
//     try {
//         res.cookie("token", "", {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//             expires: new Date(0),
//         });

//         return res.json({ success: true, message: "Logged Out" });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// // SEND VERIFY OTP
// export const sendVerifyOtp = async (req, res) => {
//     try {
//         const { userId } = req.body;

//         if (!userId) {
//             return res.json({ success: false, message: "User ID required" });
//         }

//         const user = await userModel.findById(userId);
//         if (user.isAccountVerified) {
//             return res.json({ success: false, message: "Account already Verified" });
//         }

//         const otp = Math.floor(100000 + Math.random() * 900000);

//         user.verifyOtp = otp;
//         user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 min
//         await user.save();

//         await transporter.sendMail({
//             from: process.env.SENDER_EMAIL,
//             to: user.email,
//             subject: "Verify Your Email - AI CRM",
//             text: `Your OTP for email verification is: ${otp}`,
//         });

//         return res.json({ success: true, message: "OTP sent" });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// export const verifyEmail = async (req,res)=>{
//     const {userId,otp} = req.body;
//     if(!userId||!otp){
//         return res.json({success:false,message:"Missing Details"});
//     }
//     try{
//         const user = await userModel.findById(userId);
//         if(!user){
//             return res.json({success:false,message:'User not found'});
//         }
//         if(user.verifyOtp===''||user.verifyOtp!==otp){
//             return res.json({success:false,message:"Invalid Otp"});
//         }
//         if(user.verifyOtpExpireAt<Date.now()){
//             return res.json({success:false,message:'OTP Expired'});
//         }
//         user.isAccountVerified = true;
//         user.verifyOtp = "";
//         user.verifyOtpExpireAt = 0;
//         await user.save();
//         return res.json({success:true,message:'Email Verified Successfully'});
//     }catch(error){
//         return res.json({ success: false, message: error.message });
//     }
// }

// export const isAuthenticated = async(req,res)=>{
//     try {
//         return res.json({success:true});
//     } catch (error) {
//         res.json({success:false,message:error.message});
//     }
// }

// export const sendResetOtp = async(req,res)=>{
//     const {email} = req.body;
//     if(!email){
//         return res.json({success: false,message:'Email is required'})
//     }
//     try {
//         const user = await userModel.findOne({email});
//         if(!user){
//             return res.json({success:false,message:'User not Found'});
//         }
//         const otp = Math.floor(100000 + Math.random() * 900000);

//         user.resetOtp = otp;
//         user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 min
        
//         await user.save();

//         await transporter.sendMail({
//             from: process.env.SENDER_EMAIL,
//             to: user.email,
//             subject: "Verify Your Email - AI CRM",
//             text: `Your OTP for reset Password is: ${otp}`,
//         });
//         return res.json({success:true,message:'OTP sent to our mail!'});

//     } catch (error) {
//         return res.json({success:false,message:error.message});
//     }
// }

// export const resetPassword = async(req,res)=>{
//     const {email,otp,newPassword} = req.body;
//     if(!email||!otp||!newPassword){
//         return res.json({success:false,message:'Email ,OTP,Password are required to reset Password!'});
//     }
//     try {
//         const user = await userModel.findOne({email});
//         if(!user){
//             return res.json({success:false,message:"User not Found"});
//         }
//         if(user.resetOtp===""||user.resetOtp!==otp){
//             return res.json({success:false,message:"Invalid OTP"});
//         }
//         if(user.resetOtpExpireAt<Date.now()){
//             return res.json({success:false,message:"OTP expired"})
//         }
//         const hashedPassword = await bcrypt.hash(newPassword,10);
//         user.password = hashedPassword;
//         user.resetOtp = "";
//         user.resetOtpExpireAt=0;
//         await user.save();
//         res.json({success:true});
//     } catch (error) {
//         res.json({success:false,message:error.message});
//     }
// }

import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

/* -------------------------------------------
   REGISTER USER
-------------------------------------------- */
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.json({ success: false, message: "Missing Details" });

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.json({ success: false, message: "User already exists" });

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      name,
      email,
      password: hashPassword,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send welcome email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to AI CRM Feedback",
      text: `Welcome ${name}! Your account has been created successfully.`,
    });

    return res.json({ success: true, userId: user._id });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   LOGIN USER
-------------------------------------------- */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({
      success: false,
      message: "Email and Password are required",
    });

  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Invalid Email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid Password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   LOGOUT
-------------------------------------------- */
export const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires: new Date(0),
    });

    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   SEND VERIFY OTP
-------------------------------------------- */
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.json({ success: false, message: "User ID required" });

    const user = await userModel.findById(userId);
    if (!user)
      return res.json({ success: false, message: "User not found" });

    if (user.isAccountVerified)
      return res.json({ success: false, message: "Already Verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify Email - AI CRM",
      text: `Your OTP is: ${otp}`,
    });

    return res.json({ success: true, message: "OTP Sent" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   VERIFY EMAIL
-------------------------------------------- */
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp)
    return res.json({ success: false, message: "Missing Details" });

  try {
    const user = await userModel.findById(userId);
    if (!user)
      return res.json({ success: false, message: "User not found" });

    if (String(user.verifyOtp) !== String(otp))
      return res.json({ success: false, message: "Invalid OTP" });

    if (user.verifyOtpExpireAt < Date.now())
      return res.json({ success: false, message: "OTP Expired" });

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "Email Verified" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   IS AUTH
-------------------------------------------- */
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   SEND RESET OTP
-------------------------------------------- */
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.json({ success: false, message: "Email is required" });

  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Reset Password OTP",
      text: `Your OTP is: ${otp}`,
    });

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------------------------
   RESET PASSWORD
-------------------------------------------- */
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    return res.json({
      success: false,
      message: "Email, OTP, and Password are required",
    });

  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    if (String(user.resetOtp) !== String(otp))
      return res.json({ success: false, message: "Invalid OTP" });

    if (user.resetOtpExpireAt < Date.now())
      return res.json({ success: false, message: "OTP expired" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
