from werkzeug.security import generate_password_hash

password = 'shoebmomin7949'
hashed = generate_password_hash(password)
print(f"UPDATE users SET password_hash = '{hashed}' WHERE username = 'shoebmomin';")