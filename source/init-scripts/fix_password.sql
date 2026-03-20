USE HRCloud;

-- BCrypt hash of 'admin123' (cost factor 10) - generated via known-good hash
UPDATE users
SET password = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIvi'
WHERE username = 'admin';

SELECT id, username, LEN(password) AS pwd_length, role FROM users;
