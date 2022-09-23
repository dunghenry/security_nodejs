const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || 4000;
const os = require('os');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterMemory } = require('rate-limiter-flexible');
process.env.UV_THREADPOOL_SIZE = os.cpus.length;
const urls = ['http://localhost:4000', 'http://localhost:3000'];
const corsOptions = {
    origin: (origin, callback) => {
        if (urls.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    optionsSuccessStatus: 200,
};
const opts = {
    points: 6,
    duration: 1,
};
const rateLimiter = new RateLimiterMemory(opts);
const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cors(corsOptions));
app.use(helmet());
app.disable('x-powered-by'); // Reduce Fingerprinting
app.get('/', (req, res) => {
    rateLimiter
        .consume(req.connection.remoteAddress)
        .then((data) => {
            console.log(data);
            return res.status(200).json({
                status: 'success',
                message: 'Hello',
            });
        })
        .catch(() => {
            console.log(`Rejecting request due to rate limiting.`);
            res.status(429).json({
                status: 'failure',
                message: 'Too Many Requests',
            });
        });
});
app.listen(port, () =>
    console.log(`Server listening on http://localhost:${port}`),
);
