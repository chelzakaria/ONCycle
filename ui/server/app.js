
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [];

if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173');
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());



const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }

    next();
};

app.get('/api/public/trips', async (req, res) => {
    const { initial_departure_station, final_arrival_station, train_type, date } = req.query;

    if (!initial_departure_station || !final_arrival_station || !train_type || !date) {
        return res.status(400).json({ error: 'Missing required query parameters: initial_departure_station, final_arrival_station, train_type, date' });
    }

    try {
        let query = supabase
            .from('trips')
            .select('*')
            .order('scheduled_departure_time', { ascending: true })
            .eq('initial_departure_station', initial_departure_station)
            .eq('final_arrival_station', final_arrival_station)
            .eq('train_type', train_type)
            .eq('date', date);

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/public/trips/statistics', async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'Missing required query parameters: from, to' });
    }
    try {
        let query = supabase
            .from('train_delays')
            .select('date, train_type, start_station, end_station, arrival_delay')
            .gte('date', from)
            .lte('date', to);

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/public/traffic', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('traffic')
            .select('*')
            .order('train_id', { ascending: true })
            .order('sequence', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/public/predict', async (req, res) => {
    try {
        const tripData = { predictions: req.body };

        const prediction = await fetch(process.env.PREDICTION_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ML_SERVICE_API_KEY
            },
            body: JSON.stringify(tripData)
        });

        const result = await prediction.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/public/latest_date', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('date')
            .order('date', { ascending: false })
            .limit(1);
        if (error) throw error;
        if (data.length === 0) {
            return res.status(404).json({ error: 'No trips found' });
        }
        res.json({ latest_date: data[0].date });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use('/api', authenticateApiKey);

app.get('/api/trips', async (req, res) => {
    try {
        let query = supabase.from('trips').select('*').order('scheduled_departure_time', { ascending: true });

        if (req.query.initial_departure_station) {
            query = query.eq('initial_departure_station', req.query.initial_departure_station);
        }
        if (req.query.final_arrival_station) {
            query = query.eq('final_arrival_station', req.query.final_arrival_station);
        }
        if (req.query.train_type) {
            query = query.eq('train_type', req.query.train_type);
        }
        if (req.query.date) {
            query = query.eq('date', req.query.date);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;