const { addonBuilder } = require('stremio-addon-sdk');
const express = require('express');
const manifest = require('./src/manifest');
const scraper = require('./src/scraper');

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async (args) => {
    console.log("Catalog request:", args.id);
    const search = args.extra && args.extra.search ? args.extra.search : null;
    const metas = await scraper.getCatalog(args.type, args.id, search);
    return { metas };
});

builder.defineMetaHandler(async (args) => {
    console.log("Meta request:", args.id);
    const meta = await scraper.getMeta(args.id);
    return { meta };
});

builder.defineStreamHandler(async (args) => {
    console.log("Stream request:", args.id);
    const streams = await scraper.getStreams(args.id);
    return { streams };
});

const addonInterface = builder.getInterface();
const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/', (req, res) => {
    res.redirect('/manifest.json');
});

app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

// Stremio SDK internal server
const { serveHTTP } = require('stremio-addon-sdk');
serveHTTP(addonInterface, { port: process.env.PORT || 7000 });

console.log("Addon running on port", process.env.PORT || 7000);
