const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://animesonline.io';

async function getCatalog(type, id, search = null) {
    let url = BASE_URL;
    if (search) {
        url = `${BASE_URL}/?s=${encodeURIComponent(search)}`;
    } else if (id === 'ao_popular') {
        url = BASE_URL;
    } else if (id === 'ao_recent') {
        url = `${BASE_URL}/`; // A home já mostra lançamentos
    } else if (id === 'ao_dubbed') {
        url = `${BASE_URL}/?s=dublado`;
    }

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const results = [];

        // O site usa classes como 'ts-post-image' dentro de links na home e busca
        $('article, .bs').each((i, el) => {
            const linkEl = $(el).find('a').first();
            const title = linkEl.attr('title') || $(el).find('h2').text().trim() || $(el).find('.entry-title').text().trim();
            const link = linkEl.attr('href');
            const poster = $(el).find('img').attr('src');
            
            if (link && title) {
                const slug = link.replace(BASE_URL, '').replace(/\//g, '');
                if (slug) {
                    results.push({
                        id: `ao:${slug}`,
                        type: title.toLowerCase().includes('filme') ? 'movie' : 'series',
                        name: title,
                        poster: poster,
                        description: title
                    });
                }
            }
        });

        return results;
    } catch (e) {
        console.error("Catalog Error:", e.message);
        return [];
    }
}

async function getMeta(id) {
    const slug = id.replace('ao:', '');
    // Tenta primeiro como anime (série)
    let url = `${BASE_URL}/anime/${slug}/`;
    
    try {
        let response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        let $ = cheerio.load(response.data);
        
        // Se não encontrar o título, pode ser que o slug seja direto (episódio ou filme)
        if (!$('.entry-title').text()) {
            url = `${BASE_URL}/${slug}/`;
            response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            $ = cheerio.load(response.data);
        }

        const title = $('.entry-title').text().trim();
        const poster = $('.thumb img').attr('src') || $('meta[property="og:image"]').attr('content');
        const description = $('.entry-content p').text().trim() || $('.sinopse').text().trim();
        
        const videos = [];
        // No site, os episódios aparecem em listas na página do anime
        $('.list-episodios li, .eplister li, .episodios-lista a').each((i, el) => {
            const epLink = $(el).attr('href') || $(el).find('a').attr('href');
            const epTitle = $(el).text().trim();
            const epNumMatch = epTitle.match(/(\d+)/);
            const epNum = epNumMatch ? parseInt(epNumMatch[1]) : (i + 1);

            if (epLink) {
                const epSlug = epLink.replace(BASE_URL, '').replace(/\//g, '');
                videos.push({
                    id: `ao:${slug}:${epSlug}`,
                    title: epTitle || `Episódio ${epNum}`,
                    season: 1,
                    number: epNum,
                    released: new Date().toISOString()
                });
            }
        });

        // Se for um filme ou não tiver episódios listados, trata como item único
        if (videos.length === 0) {
            videos.push({
                id: `ao:${slug}:${slug}`,
                title: title,
                season: 1,
                number: 1
            });
        }

        return {
            id: id,
            type: title.toLowerCase().includes('filme') ? 'movie' : 'series',
            name: title,
            poster: poster,
            description: description,
            videos: videos.sort((a, b) => a.number - b.number)
        };
    } catch (e) {
        console.error("Meta Error:", e.message);
        return null;
    }
}

async function getStreams(id) {
    const parts = id.split(':');
    const epSlug = parts[parts.length - 1];
    const url = `${BASE_URL}/${epSlug}/`;

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        
        const streams = [];
        
        // Busca por iframes de players
        $('iframe').each((i, el) => {
            let src = $(el).attr('src') || $(el).attr('data-src');
            if (src && !src.includes('google') && !src.includes('facebook')) {
                streams.push({
                    title: `Player ${i + 1}`,
                    url: src.startsWith('//') ? `https:${src}` : src
                });
            }
        });

        // Busca por links externos de stream em botões
        $('.player-option, .embed-codes').each((i, el) => {
            const embed = $(el).attr('data-embed') || $(el).find('iframe').attr('src');
            if (embed) {
                streams.push({
                    title: `Opção ${i + 1}`,
                    url: embed.startsWith('//') ? `https:${embed}` : embed
                });
            }
        });

        return streams;
    } catch (e) {
        console.error("Stream Error:", e.message);
        return [];
    }
}

module.exports = { getCatalog, getMeta, getStreams };
