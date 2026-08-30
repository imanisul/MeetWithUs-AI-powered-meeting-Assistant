import fs from "fs";
import pdfParse from "../utils/pdf-parse.cjs";
import Document from "../models/Document.model.js";
import { splitIntoChunks } from "./chunk.service.js";
import { createEmbedding } from "./embedding.service.js";
import { storeChunks, searchChunks } from "./vector.service.js";
import { model } from "../config/gemini.js";

export const queryVectorStore = async (query, user, history = []) => {
    // 1. Fetch allowed documents for the user
    let allowedDocs = [];
    if (user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN') {
        allowedDocs = await Document.find({}).select('_id');
    } else {
        allowedDocs = await Document.find({
            $or: [
                { uploadedBy: user.id },
                { "accessList.email": user.email }
            ]
        }).select('_id');
    }
    
    if (allowedDocs.length === 0) {
        return { answer: "I couldn't find any relevant meeting information for your query. You may not have access to any documents.", sources: [] };
    }
    
    const allowedDocIds = allowedDocs.map(d => d._id.toString());

    // 2. Search only in allowed documents
    const queryEmbedding = await createEmbedding(query);
    const results = await searchChunks(queryEmbedding, allowedDocIds, 3);
    
    const documents = results.documents[0] || [];
    
    if (documents.length === 0) {
        return { answer: "I couldn't find any relevant meeting information for your query.", sources: [] };
    }
    
    const context = documents.join('\n\n');
    
    // Format conversation history for the prompt
    let historyText = "";
    if (history && history.length > 0) {
        historyText = "Conversation History:\n" + history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') + "\n\n";
    }

    const prompt = `You are a helpful AI meeting assistant. Answer the user's query based ONLY on the following context retrieved from meeting transcripts.\n\nContext:\n${context}\n\n${historyText}Query: ${query}`;
    
    const response = await model.generateContent(prompt);
    
    return {
        answer: response.response.text(),
        sources: documents,
    };
};
export const processDocument = async (file, uploadedBy) => {
    console.log(`[RAG Pipeline] Starting document processing: ${file.originalname}`);
    console.log(`[RAG Pipeline] File received: yes | MIME: ${file.mimetype} | Size: ${file.size} bytes`);

    const buffer = fs.readFileSync(file.path);
    const pdf = await pdfParse(buffer);

    const extractedText = pdf.text;
    if (!extractedText || extractedText.trim().length < 10) {
        throw new Error(`PDF text extraction returned insufficient text (${extractedText?.length || 0} chars). The PDF may be scanned/image-only and require OCR.`);
    }
    console.log(`[RAG Pipeline] PDF extracted characters: ${extractedText.length}`);

    const document = await Document.create({
        fileName: file.originalname,
        filePath: file.path,
        extractedText,
        size: file.size,
        uploadedBy,
    });
    console.log(`[RAG Pipeline] Document saved to MongoDB: ${document._id}`);

    // RAG Pipeline: chunk, embed, and store
    const chunks = await splitIntoChunks(extractedText);
    console.log(`[RAG Pipeline] Chunks created: ${chunks.length}`);
    
    const embeddings = [];
    for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk.pageContent);
        embeddings.push(embedding);
    }
    console.log(`[RAG Pipeline] Embeddings generated: ${embeddings.length} | Dimension: ${embeddings[0]?.length || 'N/A'}`);

    await storeChunks(chunks, embeddings, document._id.toString());
    console.log(`[RAG Pipeline] Vectors stored in ChromaDB: ${chunks.length}`);
    console.log(`[RAG Pipeline] Document processing complete: ${document._id}`);

    // Cleanup the uploaded temp file
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore cleanup errors */ }

    return document;
};