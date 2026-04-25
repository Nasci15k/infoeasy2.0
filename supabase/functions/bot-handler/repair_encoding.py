import os

path = r"c:\Users\diniz\Documents\GitHub\infoeasy2.0\supabase\functions\bot-handler\index.ts"

# Common corrupted patterns in UTF-8 represented as bytes
replacements = {
    b'\xe2\x80\x94': b'-',
    b'\xe2\x94\x80': b'\xe2\x94\x80', # keep line
    b'\xc3\xa3': b'\xc3\xa3', # ã
    b'\xc3\xa7': b'\xc3\xa7', # ç
    b'\xf0\x9f\x91\xa4': b'\xf0\x9f\x91\xa4', # 👤
}

# Actually, the problem is that the tool read UTF-8 and interpreted it as something else,
# then wrote it back as UTF-8.
# Let's try to fix the most common ones by literal string replacement if possible.

with open(path, 'rb') as f:
    content = f.read()

# Emojis
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x98\xc2\xa4', '👤'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc2\xa0', '📍'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x91\xc2\xa5', '👪'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc2\x9e', '📞'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x99\xc2\xbc', '💼'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x99\xc2\xb0', '💰'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xc5\xa1\xe2\x80\x97', '🚗'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xc2\xa0\xc2\xa5', '🏥'.encode('utf-8'))
content = content.replace(b'\xc3\xa2\xc5\xa1\xe2\x80\x93\xc3\xaf\xc2\xb8\xc2\x8f', '⚖️'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xc2\xaa\xc2\xaa', '🚪'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x93\xc2\xbc', '🖼️'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xc2\x8b', '📋'.encode('utf-8'))
content = content.replace(b'\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\x8d', '🔍'.encode('utf-8'))

# Symbols
content = content.replace(b'\xc3\xa2\xe2\x80\x9d\xc2\xba', '▸'.encode('utf-8'))
content = content.replace(b'\xc3\xa2\xe2\x82\xac\xc2\xa2', '•'.encode('utf-8'))

# Text
content = content.replace(b'n\xc3\x83\xc2\xa3o', 'não'.encode('utf-8'))
content = content.replace(b'M\xc3\x83\xc2\xb3dulo', 'Módulo'.encode('utf-8'))
content = content.replace(b'Usu\xc3\x83\xc2\xa1rio', 'Usuário'.encode('utf-8'))

with open(path, 'wb') as f:
    f.write(content)

print("Repair completed.")
