import * as meetingService from '../services/meeting.service.js';

export const createMeeting = async (req, res) => {
    try {
        const meeting = await meetingService.createMeeting(
            req.body,
            req.user.id
        );

        res.status(201).json({
            success : true,
            data : meeting,
        });
    } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create meeting" });
    }
};

export const updateAI = async (req, res) => {
    const meeting = await meetingService.updateAIContent(
        req.params.id,
        req.body
    );

    res.json({
        success : true,
        meeting,
    });
};

export const getMeetings = async (req, res) => {
    try {
        const meetings = await meetingService.getMeetings(req.user);
        res.json({ success: true, data: meetings });
    } catch (error) {
        console.error("Error in getMeetings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMeetingById = async (req, res) => {
    try {
        const meeting = await meetingService.getMeetingById(req.params.id, req.user);
        res.json({ success: true, data: meeting });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateMeeting = async (req, res) => {
    try {
        const meeting = await meetingService.updateMeeting(req.params.id, req.user, req.body);
        res.json({ success: true, data: meeting });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};