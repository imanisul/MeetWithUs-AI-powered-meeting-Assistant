import Organization from '../models/Organization.model.js';
import User from '../models/user.model.js';
import Notification from '../models/Notification.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { publishOrganizationInvite } from '../events/publisher.js';

export const getOrganization = asyncHandler(async (req, res) => {
    let org;
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN') {
        org = await Organization.findOne(req.user.organizationId ? { _id: req.user.organizationId } : {}).populate('members.userId', 'fullName email role');
    } else {
        org = await Organization.findById(req.user.organizationId).populate('members.userId', 'fullName email role');
    }
    
    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    res.status(200).json(new ApiResponse(200, 'Organization fetched successfully', org));
});

export const inviteMember = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    let org;
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN') {
        org = await Organization.findOne(req.user.organizationId ? { _id: req.user.organizationId } : {});
    } else {
        org = await Organization.findById(req.user.organizationId);
    }
    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }

    let user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'User not found. They must register first.');
    }

    if (user.organizationId && user.organizationId.toString() === org._id.toString()) {
        throw new ApiError(400, 'User is already a member of this organization');
    }

    // Assign user to this org
    user.organizationId = org._id;
    user.role = role || 'MEMBER';
    await user.save();

    // Add to org members array
    org.members.push({ userId: user._id, role: user.role });
    await org.save();

    // Publish event for email service
    await publishOrganizationInvite({
        email: user.email,
        orgName: org.name,
        role: user.role
    });

    // Create Notification
    await Notification.create({
        userId: user._id,
        title: "Workspace Invitation",
        description: `You have been invited to join ${org.name} as a ${role}.`,
        type: 'ORG_INVITE',
        relatedEntityId: org._id.toString()
    });

    res.status(200).json(new ApiResponse(200, 'Member invited successfully', { user, org }));
});

export const updateMemberRole = asyncHandler(async (req, res) => {
    const { memberId, role } = req.body; // memberId is the User ID

    if (!memberId || !role) {
        throw new ApiError(400, 'Member ID and role are required');
    }

    let org;
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORG_ADMIN') {
        org = await Organization.findOne(req.user.organizationId ? { _id: req.user.organizationId } : {});
    } else {
        org = await Organization.findById(req.user.organizationId);
    }
    
    if (!org) {
        throw new ApiError(404, 'Organization not found');
    }
    
    // Find member in org array
    const memberIndex = org.members.findIndex(m => m.userId.toString() === memberId);
    if (memberIndex === -1) {
        throw new ApiError(404, 'Member not found in organization');
    }

    // Update org array
    org.members[memberIndex].role = role;
    await org.save();

    // Update user document
    await User.findByIdAndUpdate(memberId, { role });

    res.status(200).json(new ApiResponse(200, 'Member role updated successfully', {}));
});
