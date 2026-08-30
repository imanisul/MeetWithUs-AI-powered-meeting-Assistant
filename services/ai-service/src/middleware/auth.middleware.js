import jwt from 'jsonwebtoken';
import {env } from '../config/env.js';

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    if(!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Invalid authorization header format' });
    }

    const token = authHeader.replace(/^Bearer\s+/, "").trim();

    try{
        const decoded = jwt.verify(token, env.JWT_SECRET || process.env.JWT_SECRET);
        req.user = decoded;

        next();
    }
    catch(error){
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export default verifyJWT;