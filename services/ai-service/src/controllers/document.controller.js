import { processDocument, queryVectorStore } from "../services/document.service.js";
import Document from "../models/Document.model.js";

export const uploadDocument = async (req,res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const result = await processDocument(req.file, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: result,
        });

    } catch (error) {
        console.error("AI SEARCH ERROR:", error); 
        res.status(500).json({
            success: false,
            message : error.message || "An unexpected error occurred during the AI search.",
        });
    }
};

export const searchDocuments = async (req, res) => {
    try {
        const { q, history } = req.body;
        if (!q) {
            return res.status(400).json({ success: false, message: "Search query 'q' is required" });
        }
        
        const result = await queryVectorStore(q, req.user, history || []);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("AI SEARCH ERROR:", error); 
        let errorMessage = "An error occurred while generating the AI response.";
        
        if (error.message && error.message.includes("API key not valid")) {
             errorMessage = "Google Gemini API key is invalid or missing. Please check the backend .env configuration.";
        } else if (error.status === 429 || (error.message && error.message.includes("429 Too Many Requests"))) {
             errorMessage = "Gemini API rate limit exceeded. Please wait a moment and try again, or check your API quota.";
        } else if (error.message) {
             errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
        });
    }
};

export const getDocuments = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ORG_ADMIN') {
            query = {
                $or: [
                    { uploadedBy: req.user.id },
                    { "accessList.email": req.user.email }
                ]
            };
        }
        
        const documents = await Document.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: documents,
        });
    } catch (error) {
        console.error("DOCUMENT FETCH ERROR:", error); 
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch documents",
        });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const isGlobalAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN';
        const query = { _id: req.params.id };
        if (!isGlobalAdmin) {
            query.uploadedBy = req.user.id;
        }
        const document = await Document.findOneAndDelete(query);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        console.error("DOCUMENT DELETE ERROR:", error); 
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete document",
        });
    }
};

export const addAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ success: false, message: "Document not found" });
        
        const isOwner = document.uploadedBy === req.user.id;
        const isGlobalAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN';
        const userAccess = document.accessList.find(a => a.email === req.user.email);
        const isAdminOrCoAdmin = userAccess && (userAccess.role === 'ADMIN' || userAccess.role === 'CO_ADMIN');
        
        if (!isOwner && !isGlobalAdmin && !isAdminOrCoAdmin) {
            return res.status(403).json({ success: false, message: "Not authorized to manage access" });
        }
        
        const existing = document.accessList.find(a => a.email === email);
        if (existing) {
            existing.role = role || 'USER';
        } else {
            document.accessList.push({ email, role: role || 'USER' });
        }
        
        await document.save();
        
        res.status(200).json({ success: true, message: "Access granted successfully", data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeAccess = async (req, res) => {
    try {
        const { id, email } = req.params;
        
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ success: false, message: "Document not found" });
        
        const isOwner = document.uploadedBy === req.user.id;
        const isGlobalAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN';
        const userAccess = document.accessList.find(a => a.email === req.user.email);
        const isAdminOrCoAdmin = userAccess && (userAccess.role === 'ADMIN' || userAccess.role === 'CO_ADMIN');
        
        if (!isOwner && !isGlobalAdmin && !isAdminOrCoAdmin) {
            return res.status(403).json({ success: false, message: "Not authorized to manage access" });
        }
        
        document.accessList = document.accessList.filter(a => a.email !== email);
        await document.save();
        
        res.status(200).json({ success: true, message: "Access removed successfully", data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};