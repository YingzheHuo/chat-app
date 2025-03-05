import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const user = await User.findOne({ email
        });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
                token: generateToken(newUser._id, res),
            });
        } else {
            return res.status(400).json({ message: "User creation failed" });
        }

    } catch (error) {
        console.error("Error in signup controller", error.message);
        return res.status(500).json({ message: "User creation failed" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password
    );
    try {
        const user = await User.findOne({ email });


        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        generateToken(user._id, res);
        return res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePicture: user.profilePicture,
            token: generateToken(user._id, res),
        });

    } catch (error) {
        console.error("Error in login controller", error.message);
        return res.status(500).json({ message: "Login failed" });
    }

} 

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout controller", error.message);
        return res.status(500).json({ message: "Logout failed" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;
        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByAndUpdate(userId, {profilePicture: uploadResponse.secure_url}, {new: true});

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updateProfile controller", error.message);
        return res.status(500).json({ message: "Profile update failed" });
        
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message)
        return res.status(500).json({ message: "Internal Server Error"})
    }
}