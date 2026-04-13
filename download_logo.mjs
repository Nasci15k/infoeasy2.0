import fs from 'fs';
import https from 'https';

const url = 'https://storage.googleapis.com/gpt-engineer-file-uploads/I4foIcdJgXS474Cgddr3FzKkTMi2/uploads/1764297380841-image.png-removebg-preview.png';
const paths = ['public/logo.png', 'public/favicon.ico'];

paths.forEach(path => {
  const file = fs.createWriteStream(path);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded to ${path}`);
    });
  }).on('error', (err) => {
    fs.unlink(path);
    console.error(`Error downloading to ${path}: ${err.message}`);
  });
});
