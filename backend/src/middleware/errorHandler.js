function errorHandler(err, req, res, next) {
    console.error(err);

    // Zod validation error
    if (err && err.errors && Array.isArray(err.errors)) {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors,
        });
    }

    // SQLite constraint errors
    if (err && err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({
            error: 'Database constraint error',
            details: err.message,
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        details: err.message || 'Unknown error',
    });
}

module.exports = errorHandler;
