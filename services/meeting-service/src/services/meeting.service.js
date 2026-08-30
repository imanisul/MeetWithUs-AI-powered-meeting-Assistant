import crypto from 'crypto';

import Meeting from '../models/Meeting.model.js';
import { publishMeetingCreated, publishMeetingAIUpdated } from '../events/publisher.js';

import {generateMeetingCode} from '../utils/generateMeetingCode.js';
import { cacheMeeting } from './cache.service.js';
import { generateAgenda } from '../client/ai.client.js';

export const createMeeting = async (meetingData, hostId) => {
    const meetingCode = generateMeetingCode();


    let meetingLink = meetingData.meetingLink || `https://meetwithus.com/meeting/${meetingCode}`;
    if (meetingData.useGoogleMeet) {
        // Generate a mock Google Meet style link
        const code = meetingCode.toLowerCase();
        meetingLink = `https://meet.google.com/${code.substring(0,3)}-${code.substring(3,7)}-${code.substring(7,10)}`;
    }

     const agenda = await generateAgenda(
        meetingData.title,
        meetingData.description,
     );

    const mappedAttendees = meetingData.attendees && Array.isArray(meetingData.attendees) 
        ? meetingData.attendees.map(email => ({ email: email })) 
        : [];

    const meeting = await Meeting.create({
        ...meetingData,
        attendees: mappedAttendees,
        hostId,
        meetingCode,
        meetingLink,
        agenda,
    });

   

   

    await publishMeetingCreated(meeting);

     await cacheMeeting(meeting);

    return meeting;
}


export const updateAIContent  = async (meetingId, aiContent) => {
    const updatedMeeting = await Meeting.findByIdAndUpdate(
        meetingId, 
        {
            aiAgenda: aiContent.agenda,
            aiDiscussionPoints: aiContent.discussionPoints,
            aiActionItems: aiContent.actionItems,
            aiSummary: aiContent.summary,
            notes: aiContent.notes,
        }, 
        {
            new: true,
        }
    );

    await cacheMeeting(updatedMeeting);
    await publishMeetingAIUpdated(updatedMeeting);
    return updatedMeeting;
};

export const getMeetings = async (user) => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN') {
        return await Meeting.find().sort({ createdAt: -1 });
    }
    
    return await Meeting.find({
        $or: [{ hostId: user.id }, { 'attendees.email': user.email }]
    }).sort({ createdAt: -1 });
};

export const getMeetingById = async (id, user) => {
    const meeting = await Meeting.findById(id);
    if (!meeting) throw new Error("Meeting not found");
    
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ORG_ADMIN') {
        const isHost = meeting.hostId.toString() === user.id;
        const isAttendee = meeting.attendees.some(att => att.email === user.email);
        
        if (!isHost && !isAttendee) {
            throw new Error("You do not have permission to view this meeting");
        }
    }
    return meeting;
};

export const updateMeeting = async (id, user, updateData) => {
    const meeting = await getMeetingById(id, user);
    
    // Allow updating notes, summary, actionItems, and status
    if (updateData.notes !== undefined) meeting.notes = updateData.notes;
    if (updateData.summary !== undefined) meeting.aiSummary = updateData.summary;
    if (updateData.actionItems !== undefined) meeting.aiActionItems = updateData.actionItems;
    if (updateData.status !== undefined) meeting.status = updateData.status;

    await meeting.save();
    return meeting;
};
