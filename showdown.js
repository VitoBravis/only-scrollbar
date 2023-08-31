const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const converter = new showdown.Converter({tables: true});
const text = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
const markdownContent = converter.makeHtml(text);
const htmlTemplate = fs.readFileSync(path.join(__dirname, 'build', 'template.tplhtml'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'demo-src', 'index.html'), eval('`' + htmlTemplate + '`'));