import eventRoutes from './routes/eventRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

app.use('/api/events', eventRoutes); 
app.use('/api/feedback', feedbackRoutes); 