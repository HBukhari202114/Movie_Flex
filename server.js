const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_FILE = path.join(DATA_DIR, 'movies.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'images', 'uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const AUTH_TOKEN = 'flix-admin-token-secure-123'; // Simple token for local validation

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Copy default database to persistent storage if it doesn't exist yet
if (DATA_DIR !== __dirname && !fs.existsSync(DB_FILE)) {
    const srcDb = path.join(__dirname, 'movies.json');
    if (fs.existsSync(srcDb)) {
        try {
            fs.copyFileSync(srcDb, DB_FILE);
            console.log('Successfully seeded default movies database to persistent storage.');
        } catch (err) {
            console.error('Failed to seed movies database:', err);
        }
    }
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files and static images
app.use(express.static(__dirname));
// Explicitly serve uploads folder (handles persistent volumes outside project root)
app.use('/images/uploads', express.static(UPLOAD_DIR));

// Multer Storage Configuration for Movie Cover Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Safe filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'movie-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, gif, webp) are allowed!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper functions to read/write JSON database
const readDatabase = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return [];
    }
};

const writeDatabase = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to database:', error);
        return false;
    }
};

// Auth middleware for write operations
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.split(' ')[1] === AUTH_TOKEN) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized access. Invalid or missing token.' });
    }
};

// --- API Endpoints ---

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: AUTH_TOKEN });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password.' });
    }
});

// Validate Token Endpoint
app.get('/api/auth/validate', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.split(' ')[1] === AUTH_TOKEN) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// GET all movies
app.get('/api/movies', (req, res) => {
    const movies = readDatabase();
    res.json(movies);
});

// POST create movie
app.post('/api/movies', authenticate, upload.single('imageFile'), (req, res) => {
    try {
        const movies = readDatabase();
        
        // Build movie object
        const newMovie = {
            id: Date.now().toString(),
            title: req.body.title || 'Untitled',
            type: req.body.type || 'movie', // movie, series, cartoon
            category: req.body.category || 'latest', // hero, top, latest, special
            rating: req.body.rating || '9.5',
            duration: req.body.duration || '120 mins',
            quality: req.body.quality || 'HD',
            age: req.body.age || '16+',
            description: req.body.description || '',
            downloadLink: req.body.downloadLink || '#'
        };

        // Handle cover image
        if (req.file) {
            // Save relative URL path for standard image rendering
            newMovie.image = `/images/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl) {
            newMovie.image = req.body.imageUrl;
        } else {
            newMovie.image = './images/movies/captain-marvel.png'; // fallback default cover
        }

        movies.push(newMovie);
        writeDatabase(movies);

        res.status(201).json({ success: true, data: newMovie });
    } catch (err) {
        console.error('Error creating movie:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update movie
app.put('/api/movies/:id', authenticate, upload.single('imageFile'), (req, res) => {
    try {
        const movies = readDatabase();
        const index = movies.findIndex(m => m.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        const currentMovie = movies[index];

        // Prepare updated fields
        const updatedMovie = {
            ...currentMovie,
            title: req.body.title || currentMovie.title,
            type: req.body.type || currentMovie.type,
            category: req.body.category || currentMovie.category,
            rating: req.body.rating || currentMovie.rating,
            duration: req.body.duration || currentMovie.duration,
            quality: req.body.quality || currentMovie.quality,
            age: req.body.age || currentMovie.age,
            description: req.body.description !== undefined ? req.body.description : currentMovie.description,
            downloadLink: req.body.downloadLink !== undefined ? req.body.downloadLink : currentMovie.downloadLink
        };

        // Handle cover image replacement
        if (req.file) {
            // Delete old uploaded image if it was a local upload
            if (currentMovie.image && currentMovie.image.startsWith('/images/uploads/')) {
                const oldImagePath = path.join(__dirname, currentMovie.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updatedMovie.image = `/images/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl) {
            updatedMovie.image = req.body.imageUrl;
        }

        movies[index] = updatedMovie;
        writeDatabase(movies);

        res.json({ success: true, data: updatedMovie });
    } catch (err) {
        console.error('Error updating movie:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE movie
app.delete('/api/movies/:id', authenticate, (req, res) => {
    try {
        const movies = readDatabase();
        const index = movies.findIndex(m => m.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        const movieToDelete = movies[index];

        // Delete associated image file if it exists in uploads folder
        if (movieToDelete.image && movieToDelete.image.startsWith('/images/uploads/')) {
            const imagePath = path.join(__dirname, movieToDelete.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        movies.splice(index, 1);
        writeDatabase(movies);

        res.json({ success: true, message: 'Movie and its files deleted successfully.' });
    } catch (err) {
        console.error('Error deleting movie:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Redirect route for testing download links (optional, we redirect directly via frontend)
// Default routing: redirect index.html to homepage
// Fallback to index.html for any other requests (handles simple HTML navigation)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
