import { GoogleGenerativeAI } from '@google/generative-ai';
import {env} from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const model = genAI.getGenerativeModel({
    model : 'gemini-3.6-flash',
});

