const db = require('./src/db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_USERID = process.env.SEED_ADMIN_USERID || 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function seed() {
    if (!ADMIN_PASSWORD) {
        console.error('SEED_ADMIN_PASSWORD is not set. Aborting seed.');
        process.exitCode = 1;
        return;
    }

    await db.init();

    const pw = await bcrypt.hash(ADMIN_PASSWORD, 10);

    try {
        await db.run(
            'INSERT OR IGNORE INTO users (userid, name, password_hash, is_admin) VALUES (?, ?, ?, ?)',
            [ADMIN_USERID, 'Admin User', pw, 1]
        );
        console.log('Seeded admin user:', ADMIN_USERID);
    } catch (err) {
        console.error('Failed to seed admin user', err);
    } finally {
        db.close();
    }
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
