const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// app.use(cors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
// }));

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
    try {
        let query = supabase.from('trips').select('*').order('scheduled_departure_time', { ascending: true });

        // Apply filters if provided
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

app.get('/api/public/trips/statistics', async (req, res) => {
    try {
        let query = supabase.from('train_delays').select('*');

        // Apply date range filter if provided
        if (req.query.from && req.query.to) {
            query = query.gte('date', req.query.from).lte('date', req.query.to);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/public/train_delays', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('train_delays')
            .select('*');

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

app.use('/api', authenticateApiKey);

app.get('/api/trips', async (req, res) => {
    try {
        let query = supabase.from('trips').select('*').order('scheduled_departure_time', { ascending: true });

        // Apply filters if provided
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

app.get('/api/train_delays', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('train_delays')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/trips/statistics', async (req, res) => {
    try {
        let query = supabase.from('trips').select('*');

        if (req.query.from && req.query.to) {
            query = query.gte('date', req.query.from).lte('date', req.query.to);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Legacy endpoint for backward compatibility
app.get('/api/trains', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('train_delays')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});