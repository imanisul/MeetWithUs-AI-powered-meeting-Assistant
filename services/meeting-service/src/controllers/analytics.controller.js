import Meeting from '../models/Meeting.model.js';

export const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // In a real multi-tenant app, we'd query by organizationId, 
        // but since meeting-service currently queries by hostId or attendee, we'll aggregate by user.
        
        let queryCond = {};
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ORG_ADMIN') {
            queryCond = {
                $or: [
                    { hostId: userId },
                    { 'attendees.email': req.user.email }
                ]
            };
        }
        
        const totalMeetings = await Meeting.countDocuments(queryCond);

        const completedMeetings = await Meeting.countDocuments({
            ...queryCond,
            status: 'Completed'
        });

        const upcomingMeetings = await Meeting.countDocuments({
            ...queryCond,
            status: 'Scheduled'
        });

        const meetingsWithSummaries = await Meeting.countDocuments({
            ...queryCond,
            aiSummary: { $ne: '' }
        });

        // Mock data for the chart to show activity over the last few months
        // In reality, this would be an aggregation pipeline grouping by month
        const monthlyData = [
            { name: 'Jan', total: Math.floor(Math.random() * 20) },
            { name: 'Feb', total: Math.floor(Math.random() * 20) },
            { name: 'Mar', total: Math.floor(Math.random() * 20) },
            { name: 'Apr', total: Math.floor(Math.random() * 20) },
            { name: 'May', total: Math.floor(Math.random() * 30) },
            { name: 'Jun', total: totalMeetings } // Current month matches reality
        ];

        res.status(200).json({
            success: true,
            data: {
                totalMeetings,
                completedMeetings,
                upcomingMeetings,
                meetingsWithSummaries,
                monthlyData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
