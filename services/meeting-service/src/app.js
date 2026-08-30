import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

import meetingRoutes from './routes/meeting.routes.js';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

app.use('/api/v1/meetings', meetingRoutes);
app.use('/meetings', meetingRoutes);

app.get('/', (req, res) => {
    res.json({
        success : true,
        service : 'meeting-service',
        message : 'Meeting service is running'
    });
});

export default app;
