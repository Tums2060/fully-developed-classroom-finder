const bcrypt = require('bcryptjs');
const db = require('./db');

async function resetAdmin() {
    const username = 'admin';
    const newPassword = 'admin123';
    
    console.log(`Resetting admin password for username: "${username}" to "${newPassword}"...`);
    
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        // Check if admin exists
        const [rows] = await db.query('SELECT * FROM administrators WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            // Create if missing
            await db.query(
                'INSERT INTO administrators (username, password_hash, is_super_admin) VALUES (?, ?, ?)',
                [username, passwordHash, 1]
            );
            console.log('Admin account did not exist. Created a new Super Admin account successfully!');
        } else {
            // Update password
            await db.query(
                'UPDATE administrators SET password_hash = ? WHERE username = ?',
                [passwordHash, username]
            );
            console.log('Admin password updated successfully!');
        }
        
        console.log('--------------------------------------------------');
        console.log(`Username: ${username}`);
        console.log(`Password: ${newPassword}`);
        console.log('--------------------------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Error resetting admin password:', err);
        process.exit(1);
    }
}

resetAdmin();
